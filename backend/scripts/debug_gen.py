import os
import sys
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

model = genai.GenerativeModel("gemini-1.5-flash")
prompt = """
Create 5 multiple choice questions about Arithmetic Aptitude.
Output JSON only. Array of objects with question, option_a, option_b, option_c, option_d, correct_option, explanation.
"""
try:
    response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
    print("RESPONSE:")
    print(response.text)
except Exception as e:
    print("ERROR:")
    print(e)
