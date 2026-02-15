import sys
import os

# Add project root to path
sys.path.append(os.getcwd())

from backend.app.services.aptitude import aptitude_service
from backend.app.core.db import create_db_and_tables

def test_aptitude():
    print("Initializing DB...")
    create_db_and_tables()
    
    print("Seeding questions...")
    aptitude_service.seed_questions()
    
    print("Fetching categories...")
    categories = aptitude_service.get_categories()
    print(f"Categories found: {categories}")
    
    if not categories:
        print("FAIL: No categories found.")
        return

    first_cat = categories[0]
    print(f"Fetching questions for '{first_cat}'...")
    questions = aptitude_service.get_questions(first_cat)
    print(f"Found {len(questions)} questions.")
    
    if not questions:
        print("FAIL: No questions found.")
        return

    print("Sample Question:", questions[0].question)
    print("Correct Option:", questions[0].correct_option)
    
    print("SUCCESS: Aptitude backend verification passed!")

if __name__ == "__main__":
    test_aptitude()
