from typing import List, Optional
from sqlmodel import Session, select
from backend.app.models.aptitude import AptitudeQuestion
from backend.app.core.db import engine

class AptitudeService:
    def get_categories(self) -> List[str]:
        with Session(engine) as session:
            statement = select(AptitudeQuestion.category).distinct()
            results = session.exec(statement).all()
            return list(results)

    def get_questions(self, category: str) -> List[AptitudeQuestion]:
        with Session(engine) as session:
            statement = select(AptitudeQuestion).where(AptitudeQuestion.category == category)
            results = session.exec(statement).all()
            return list(results)

    def seed_questions(self):
        """Seeds the database with initial questions if empty."""
        pass

aptitude_service = AptitudeService()
