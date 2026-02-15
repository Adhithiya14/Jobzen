from fastapi import FastAPI, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import List, Optional
from sqlmodel import Session, select
from pydantic import BaseModel

from backend.app.core.db import create_db_and_tables, get_session
from backend.app.services.aptitude import aptitude_service
from backend.app.services.chat import chat_service
from backend.app.services.resume import resume_service
from backend.app.services.interview import interview_service, QuestionResponse, GradeResponse
from backend.app.models.sql import InterviewSession
from backend.app.models.aptitude import AptitudeQuestion
from backend.app.services.recommendation import recommendation_service, Job, Course

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    aptitude_service.seed_questions()
    yield

app = FastAPI(title="JobZen API", description="AI-Powered Career Prep Platform", lifespan=lifespan)

# CORS setup for frontend communication
origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to JobZen API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    response = await chat_service.generate_response(request.message)
    return {"response": response}

@app.post("/resume/analyze")
async def analyze_resume(file: UploadFile = File(...)):
    content = await file.read()
    text = await resume_service.parse_pdf(content)
    analysis = await resume_service.analyze_resume(text)
    return analysis

class InterviewRequest(BaseModel):
    role: str
    type: str = "Technical" # Technical, Aptitude, GK
    history: List[str] = []
    previous_question: Optional[str] = None
    user_answer: Optional[str] = None
    previous_score: Optional[int] = 0
    current_level: Optional[str] = "Beginner"

class AnswerRequest(BaseModel):
    question: str
    answer: str
    role: str

@app.post("/interview/question", response_model=QuestionResponse)
async def get_question(req: InterviewRequest):
    return await interview_service.generate_question(
        req.role, 
        req.type, 
        req.history,
        req.previous_question,
        req.user_answer,
        req.previous_score,
        req.current_level
    )

@app.post("/interview/answer", response_model=GradeResponse)
async def grade_answer(req: AnswerRequest, session: Session = Depends(get_session)):
    grade = await interview_service.grade_answer(req.question, req.answer, req.role)
    
    # Save to DB
    db_session = InterviewSession(
        role=req.role,
        question=req.question,
        user_answer=req.answer,
        score=grade.score,
        feedback=grade.feedback
    )
    session.add(db_session)
    session.commit()
    session.refresh(db_session)
    
    return grade

@app.get("/interview/history", response_model=List[InterviewSession])
async def get_interview_history(session: Session = Depends(get_session)):
    return session.exec(select(InterviewSession).order_by(InterviewSession.created_at.desc())).all()

class RecommendationRequest(BaseModel):
    role: str
    skills: List[str] = []
    experience: int = 0

@app.post("/recommend/jobs", response_model=List[Job])
async def get_jobs_recommendation(req: RecommendationRequest):
    return await recommendation_service.get_jobs(req.role, req.skills, req.experience)

@app.get("/recommend/courses", response_model=List[Course])
async def get_courses(role: str = "Software Engineer"):
    return recommendation_service.get_courses(role)

@app.get("/aptitude/categories", response_model=List[str])
async def get_aptitude_categories():
    return aptitude_service.get_categories()

@app.get("/aptitude/questions/{category}", response_model=List[AptitudeQuestion])
async def get_aptitude_questions(category: str):
    return aptitude_service.get_questions(category)
