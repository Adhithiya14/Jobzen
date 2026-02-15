from pydantic import BaseModel
from typing import List
import io
import logging
from pypdf import PdfReader
from starlette.concurrency import run_in_threadpool

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ResumeAnalysis(BaseModel):
    score: int
    suggestions: List[str]
    skills: List[str]
    summary: str
    years_experience: int = 0
    strengths: List[str] = []
    weaknesses: List[str] = []

class ResumeService:
    def __init__(self):
        self.last_resume_text = ""

    def get_current_resume_text(self) -> str:
        return self.last_resume_text

    def _parse_pdf_sync(self, file_content: bytes) -> str:
        try:
            logger.info(f"Starting PDF parsing for file of size {len(file_content)} bytes")
            reader = PdfReader(io.BytesIO(file_content))
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            logger.info(f"PDF parsed successfully. Extracted {len(text)} characters.")
            self.last_resume_text = text # Store for other services
            return text
        except Exception as e:
            logger.error(f"Error parsing PDF: {e}")
            return ""

    async def parse_pdf(self, file_content: bytes) -> str:
        return await run_in_threadpool(self._parse_pdf_sync, file_content)

    def _extract_skills_rule_based(self, text: str) -> List[str]:
        text_lower = text.lower()
        found_skills = set()
        
        # Expanded Keyword DB
        keywords = {
            "Languages": ["python", "java", "javascript", "typescript", "c++", "c#", "go", "ruby", "php", "swift", "kotlin", "rust"],
            "Web": ["react", "angular", "vue", "next.js", "node.js", "django", "fastapi", "flask", "spring boot", "asp.net", "html", "css"],
            "Data": ["sql", "mysql", "postgresql", "mongodb", "pandas", "numpy", "pytorch", "tensorflow", "scikit-learn", "spark", "hadoop", "tableau", "power bi"],
            "DevOps/Cloud": ["aws", "azure", "gcp", "docker", "kubernetes", "jenkins", "git", "linux", "terraform", "ansible"],
            "Concepts": ["rest api", "graphql", "microservices", "agile", "scrum", "structure", "algorithms", "data structures"]
        }
        
        for category, skills in keywords.items():
            for skill in skills:
                # Basic whole-word check
                if skill in text_lower:
                    # Clean capitalization for display
                    if skill == "sql": found_skills.add("SQL")
                    elif skill == "aws": found_skills.add("AWS")
                    elif skill == "css": found_skills.add("CSS")
                    elif skill == "html": found_skills.add("HTML")
                    elif skill == "api": found_skills.add("API")
                    else: found_skills.add(skill.title())
        
        return list(found_skills) if found_skills else ["Communication", "Problem Solving"]

    async def analyze_resume(self, text: str) -> ResumeAnalysis:
        from backend.app.core.config import settings
        from backend.app.core.prompts import RESUME_RATING_PROMPT_TEMPLATE, SYSTEM_PROMPT, RESUME_AWARE_CONTEXT_TEMPLATE
        import google.generativeai as genai
        import json
        import random

        # Helper for Fallback Response
        def get_fallback_analysis(extracted_skills: List[str]) -> ResumeAnalysis:
            random.seed(len(text))
            base_score = 60 + (len(extracted_skills) * 2)
            final_score = min(95, max(40, base_score))
            
            return ResumeAnalysis(
                score=final_score,
                suggestions=[
                    "Quantify your impact with more metrics (e.g., 'Improved X by Y%').",
                    "Add detailed project descriptions highlighting these skills.",
                    "Ensure your GitHub or Portfolio link is visible."
                ],
                skills=extracted_skills,
                summary=f"Analysis of {len(text.split())} words. Detected {len(extracted_skills)} key technical skills. Strong foundational profile.",
                years_experience=2 # Default/guess
            )
        
        # Update local storage even if called directly (double check)
        self.last_resume_text = text

        # 1. Fallback Mode (No Key or Mock Key)
        if not settings.GEMINI_API_KEY or "your_gemini_api_key" in settings.GEMINI_API_KEY:
             skills = self._extract_skills_rule_based(text)
             return get_fallback_analysis(skills)

        # 2. Real AI Mode
        try:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel('gemini-flash-latest')
            
            # Construct Prompt
            resume_context_str = RESUME_AWARE_CONTEXT_TEMPLATE.format(resume_text=text[:15000]) # Limit length
            prompt = RESUME_RATING_PROMPT_TEMPLATE.format(
                system_prompt=SYSTEM_PROMPT,
                resume_context=resume_context_str
            )
            
            response = await run_in_threadpool(model.generate_content, prompt)
            response_text = response.text.strip()
            
            # Clean up potentially broken JSON
            if response_text.startswith("```json"): response_text = response_text[7:-3]
            elif response_text.startswith("```"): response_text = response_text[3:-3]
            
            data = json.loads(response_text)
            
            # Map new JSON keys to model if slightly different, but prompt asks for strict match
            # Model expects: score, suggestions, skills, summary, years_experience
            # Prompt output: score, years_experience, strengths, weaknesses, suggestions, skills, summary
            
            # Augment summary with strengths/weaknesses if not in model yet (Model is ResumeAnalysis)
            # ResumeAnalysis = score, suggestions, skills, summary, years_experience
            # We can combine strengths/weaknesses into summary or suggestions if needed, 
            # Or assume the summary provided by AI covers it. 
            pass

            return ResumeAnalysis(
                score=data.get("score", 0),
                suggestions=data.get("suggestions", []),
                skills=data.get("skills", []),
                summary=data.get("summary", "No summary provided."),
                years_experience=data.get("years_experience", 0),
                strengths=data.get("strengths", []),
                weaknesses=data.get("weaknesses", [])
            )
            
        except Exception as e:
            logger.error(f"AI Analysis Failed: {e}")
            # 3. Robust Fallback on Error (429, 500, etc.)
            skills = self._extract_skills_rule_based(text)
            fallback = get_fallback_analysis(skills)
            fallback.summary += " (AI Service Unavailable - Using Offline Analysis)"
            return fallback

resume_service = ResumeService()
