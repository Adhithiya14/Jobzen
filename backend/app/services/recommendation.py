from pydantic import BaseModel
from typing import List

class Job(BaseModel):
    id: int
    title: str
    company: str
    location: str
    salary: str
    match_score: int
    required_skills: List[str] = []
    missing_skills: List[str] = []
    learn_more_links: List[dict] = [] #List of {skill: str, url: str}

class Course(BaseModel):
    id: int
    title: str
    platform: str
    duration: str
    level: str

class RecommendationService:
    SKILL_RESOURCES = {
        "python": "https://www.learnpython.org/",
        "react": "https://react.dev/learn",
        "javascript": "https://javascript.info/",
        "sql": "https://www.w3schools.com/sql/",
        "fastapi": "https://fastapi.tiangolo.com/tutorial/",
        "django": "https://www.djangoproject.com/start/",
        "node.js": "https://nodejs.org/en/learn",
        "aws": "https://aws.amazon.com/getting-started/",
        "pandas": "https://pandas.pydata.org/docs/getting_started/index.html",
        "machine learning": "https://www.coursera.org/learn/machine-learning",
        "tensorflow": "https://www.tensorflow.org/learn"
    }

    async def _generate_mock_jobs(self, user_skills: List[str]) -> List[Job]:
        import random
        
        # Ensure we have something to work with
        if not user_skills:
            user_skills = ["Python", "JavaScript", "React"]
            
        titles_suffix = ["Developer", "Specialist", "Engineer", "Analyst", "Manager", "Consultant"]
        companies = ["TechFlow", "GlobalCorp", "StartUpZ", "DataSystems", "CreativeWorks", "NebulaTech"]
        
        mock_jobs = []
        # Create a job for each top skill (up to 6)
        # If fewer skills, repeat them with different suffixes
        loop_skills = user_skills * 2
        
        for i, skill in enumerate(loop_skills[:6]):
            role_suffix = titles_suffix[i % len(titles_suffix)]
            job_title = f"{skill.title()} {role_suffix}"
            
            # Dynamic matching score based on index
            score = 95 - (i * 4) + random.randint(-2, 2)
            
            # Missing skills logic
            potential_missing = ["AWS", "Docker", "Kubernetes", "GraphQL", "System Design", "CI/CD"]
            missing = random.sample([m for m in potential_missing if m.lower() not in [s.lower() for s in user_skills]], 2)
            
            links = [{"skill": m, "url": self.SKILL_RESOURCES.get(m.lower(), f"https://www.udemy.com/courses/search/?q={m}")} for m in missing]

            mock_jobs.append(Job(
                id=i+1,
                title=job_title,
                company=companies[i % len(companies)],
                location="Remote" if i % 2 == 0 else "Hybrid",
                salary=f"${random.randint(80, 160)}k",
                match_score=min(99, max(60, score)),
                required_skills=[skill] + ["Communication", "Problem Solving"] + missing,
                missing_skills=missing,
                learn_more_links=links
            ))
        
        return mock_jobs

    async def get_jobs(self, role: str, user_skills: List[str] = None, experience: int = 0) -> List[Job]:
        from backend.app.core.config import settings
        import google.generativeai as genai
        import json
        import logging
        from starlette.concurrency import run_in_threadpool

        logging.basicConfig(level=logging.INFO)
        logger = logging.getLogger(__name__)

        # 1. Fallback / Mock Mode (Explicit)
        if not settings.GEMINI_API_KEY or "your_gemini_api_key" in settings.GEMINI_API_KEY:
             return await self._generate_mock_jobs(user_skills)

        # 2. Real AI Mode
        try:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel('gemini-flash-latest')
            
            skills_str = ", ".join(user_skills) if user_skills else "General Tech Skills"
            logger.info(f"Generating jobs STRICTLY for skills: {skills_str}")
            
            prompt = f"""
            Act as a strict AI Recruiter. Generate 5 realistic job postings that MATCH the candidate's skills.
            
            **Candidate Profile**:
            - Skills: {skills_str}
            - Experience: {experience} years
            
            **STRICT RULES**:
            1. **DIRECT MATCH**: The Job Title and "required_skills" MUST overlap significantly with the candidate's specific skills.
            2. **NO GENERIC ROLES**: If the candidate knows "Python", do NOT suggest "Java Developer". If they know "React", suggest "Frontend" or "Full Stack".
            3. **Gap Analysis**: Identification of MISSING skills is crucial.
            4. **Links**: Valid URLs for learning resources are required.
            
            Return a strictly valid JSON array of objects. format:
            [
                {{
                    "id": <random_int>,
                    "title": "<Job Title>",
                    "company": "<Company>",
                    "location": "<Location>",
                    "salary": "<Salary>",
                    "match_score": <int 85-99>,
                    "required_skills": ["<Skill1>", "..."],
                    "missing_skills": ["<Missing1>", "<Missing2>"],
                    "learn_more_links": [{{ "skill": "<Missing1>", "url": "<URL>" }}]
                }}
            ]
            """
            
            response = await run_in_threadpool(model.generate_content, prompt)
            response_text = response.text.strip()
            
            # Clean generic markdown
            if response_text.startswith("```json"): response_text = response_text[7:-3]
            elif response_text.startswith("```"): response_text = response_text[3:-3]

            data = json.loads(response_text)
            
            jobs = []
            for item in data:
                 missing = item.get('missing_skills', [])
                 links = item.get('learn_more_links', [])
                 if not links and missing:
                     links = [{"skill": m, "url": self.SKILL_RESOURCES.get(m.lower(), f"https://www.udemy.com/courses/search/?q={m}")} for m in missing]

                 job = Job(
                     id=item.get('id', 1),
                     title=item.get('title', 'Unknown Role'),
                     company=item.get('company', 'Unknown Co'),
                     location=item.get('location', 'Remote'),
                     salary=item.get('salary', 'Competitive'),
                     match_score=item.get('match_score', 80),
                     required_skills=item.get('required_skills', []),
                     missing_skills=missing,
                     learn_more_links=links
                 )
                 jobs.append(job)
            
            return jobs

        except Exception as e:
            logger.error(f"Job Gen Failed (Using Fallback): {e}")
            # 3. Robust Fallback on Error (429, 500, etc.)
            return await self._generate_mock_jobs(user_skills)

    def get_courses(self, role: str) -> List[Course]:
        # Mock Data
        return [
            Course(id=1, title="Advanced FastAPI & Python", platform="Udemy", duration="12 hours", level="Advanced"),
            Course(id=2, title="React - The Complete Guide", platform="Coursera", duration="40 hours", level="Intermediate"),
            Course(id=3, title="System Design Interview", platform="YouTube", duration="5 hours", level="All Levels"),
        ]

recommendation_service = RecommendationService()
