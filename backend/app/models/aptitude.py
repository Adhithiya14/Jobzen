from typing import Optional
from sqlmodel import Field, SQLModel

class AptitudeQuestion(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    category: str  # e.g., "Numbers", "Syllogism"
    question: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_option: str # "A", "B", "C", "D"
    explanation: str
