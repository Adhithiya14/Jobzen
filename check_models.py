import google.generativeai as genai
from backend.app.core.config import settings
import sys

try:
    genai.configure(api_key=settings.GEMINI_API_KEY)
    with open("models.txt", "w") as f:
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                f.write(f"{m.name}\n")
    print("DONE")
except Exception as e:
    with open("models.txt", "w") as f:
        f.write(f"Error: {e}")
    print("ERROR")
