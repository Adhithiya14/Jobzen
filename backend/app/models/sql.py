from typing import Optional
from sqlmodel import Field, SQLModel
from datetime import datetime

class InterviewSession(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    role: str
    question: str
    user_answer: str
    score: int
    feedback: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

# In a real app, we would have a User table, but for this prototype, 
# we'll just track sessions anonymously or assume single user.
