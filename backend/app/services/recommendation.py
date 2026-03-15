from pydantic import BaseModel, Field
from typing import List

class Job(BaseModel):
    id: int
    title: str
    company: str
    location: str
    salary: str
    match_score: int
    required_skills: List[str] = Field(default_factory=list)
    missing_skills: List[str] = Field(default_factory=list)
    learn_more_links: List[dict] = Field(default_factory=list) #List of {skill: str, url: str}

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

    async def _generate_skill_based_jobs(self, user_skills: List[str], experience: int = 0) -> List[Job]:
        # Strictly generate roles based on explicit skills only.
        if not user_skills:
            return []

        titles_suffix = ["Engineer", "Developer", "Specialist", "Analyst", "Consultant"]
        companies = ["TechFlow", "GlobalCorp", "StartUpZ", "DataSystems", "CreativeWorks", "NebulaTech"]
        locations = ["Remote", "Hybrid", "Onsite"]

        normalized = [s.strip() for s in user_skills if s.strip()]
        unique_skills = []
        for s in normalized:
            if s.lower() not in [u.lower() for u in unique_skills]:
                unique_skills.append(s)

        jobs = []
        for i, skill in enumerate(unique_skills[:6]):
            role_suffix = titles_suffix[i % len(titles_suffix)]
            job_title = f"{skill.title()} {role_suffix}"

            # Missing skills are only from a fixed, relevant list and never include user skills
            potential_missing = ["AWS", "Docker", "Kubernetes", "GraphQL", "System Design", "CI/CD"]
            missing = [m for m in potential_missing if m.lower() not in [s.lower() for s in unique_skills]][:2]
            links = [{"skill": m, "url": self.SKILL_RESOURCES.get(m.lower(), f"https://www.udemy.com/courses/search/?q={m}")} for m in missing]

            base_score = 90
            if experience >= 3:
                base_score += 3
            if experience >= 6:
                base_score += 2

            jobs.append(Job(
                id=i + 1,
                title=job_title,
                company=companies[i % len(companies)],
                location=locations[i % len(locations)],
                salary="Competitive",
                match_score=min(99, base_score),
                required_skills=[skill] + missing,
                missing_skills=missing,
                learn_more_links=links
            ))

        return jobs

    async def get_jobs(self, role: str, user_skills: List[str] = None, experience: int = 0) -> List[Job]:
        # 1. Skill-based generation (always strict to provided skills)
        return await self._generate_skill_based_jobs(user_skills or [], experience)

    def get_courses(self, role: str) -> List[Course]:
        # Mock Data
        return [
            Course(id=1, title="Advanced FastAPI & Python", platform="Udemy", duration="12 hours", level="Advanced"),
            Course(id=2, title="React - The Complete Guide", platform="Coursera", duration="40 hours", level="Intermediate"),
            Course(id=3, title="System Design Interview", platform="YouTube", duration="5 hours", level="All Levels"),
        ]

recommendation_service = RecommendationService()
