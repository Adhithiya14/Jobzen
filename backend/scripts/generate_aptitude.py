import os
import sys
import json
import time

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

import google.generativeai as genai
from sqlmodel import Session, select
from dotenv import load_dotenv

from backend.app.models.aptitude import AptitudeQuestion
from backend.app.core.db import engine

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("Error: GEMINI_API_KEY not found in .env")
    sys.exit(1)

genai.configure(api_key=api_key)

CATEGORIES = [
    "General Aptitude", "Arithmetic Aptitude", "Data Interpretation",
    "Verbal Ability", "Logical Reasoning", "Verbal Reasoning", "Non Verbal Reasoning",
    "Current Affairs", "Basic General Knowledge", "General Science",
    "Placement Papers", "Group Discussion", "HR Interview",
    "Mechanical Engineering", "Civil Engineering", "ECE, EEE, CSE", "Chemical Engineering",
    "C Programming", "C++ Programming", "C# Programming", "Java Programming",
    "Networking Questions", "Database Questions", "Basic Electronics", "Digital Electronics",
    "Software Testing", "The C Language Basics", "SQL Server", 
    "Microbiology", "Biochemistry", "Biotechnology", "Biochemical Engineering",
    "Sudoku", "Number puzzles", "Missing letters puzzles", "Logical puzzles", "Clock puzzles"
]

def generate_questions_for_category(category: str, num_questions=10):
    model = genai.GenerativeModel("gemini-1.5-flash")
    prompt = f"""
    You are an expert question setter for competitive exams.
    Generate EXACTLY {num_questions} multiple-choice questions for the category '{category}', following the style and difficulty of Indiabix.com.

    Rules:
    - 4 options per question (A, B, C, D)
    - 1 correct option (must be just the letter: A, B, C, or D)
    - Provide a short explanation for why the answer is correct.

    Output pure JSON matching the following schema. Return a list of objects under the key 'questions'.
    
    {{
        "questions": [
            {{
                "question": "The question text",
                "option_a": "Option A text",
                "option_b": "Option B text",
                "option_c": "Option C text",
                "option_d": "Option D text",
                "correct_option": "A",
                "explanation": "Explanation text"
            }}
        ]
    }}
    """
    
    generation_config = genai.GenerationConfig(
        response_mime_type="application/json"
    )

    try:
        response = model.generate_content(prompt, generation_config=generation_config)
        content = response.text
        data = json.loads(content)
        return data.get("questions", [])
    except Exception as e:
        print(f"Failed to generate for {category}: {e}")
        try:
            print(f"Raw response: {response.text[:500]}...")
        except:
            pass
        return []

def main():
    with Session(engine) as session:
        for category in CATEGORIES:
            # Check how many we already have
            count = session.exec(
                select(AptitudeQuestion).where(AptitudeQuestion.category == category)
            ).all()
            
            if len(count) >= 50:
                print(f"Skipping '{category}', already has {len(count)} questions.")
                continue

            needed = 50 - len(count)
            print(f"Generating {needed} questions for '{category}'...")
            
            # Generate in batches of 10
            while needed > 0:
                batch_size = min(10, needed)
                print(f"  -> Batch of {batch_size}")
                questions_data = generate_questions_for_category(category, batch_size)
                
                if not questions_data:
                    print(f"  -> No questions generated in this batch, skipping.")
                    time.sleep(2)
                    break

                added_count = 0
                for q_data in questions_data:
                    if not q_data.get('question'):
                        continue
                    # Check duplicate
                    exists = session.exec(select(AptitudeQuestion).where(AptitudeQuestion.question == q_data['question'])).first()
                    if not exists:
                        q = AptitudeQuestion(
                            category=category,
                            question=str(q_data.get('question', '')),
                            option_a=str(q_data.get('option_a', '')),
                            option_b=str(q_data.get('option_b', '')),
                            option_c=str(q_data.get('option_c', '')),
                            option_d=str(q_data.get('option_d', '')),
                            correct_option=str(q_data.get('correct_option', 'A')).upper(),
                            explanation=str(q_data.get('explanation', ''))
                        )
                        session.add(q)
                        added_count += 1
                
                session.commit()
                needed -= added_count
                print(f"  -> Successfully added {added_count} questions for '{category}'. Remaining: {max(0, needed)}")
                
                time.sleep(2)

if __name__ == "__main__":
    main()
