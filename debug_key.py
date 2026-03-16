from backend.app.core.config import settings
print(f"DEBUG: GEMINI_API_KEY = '{settings.GEMINI_API_KEY}'")
print(f"DEBUG: Length = {len(settings.GEMINI_API_KEY)}")
if settings.GEMINI_API_KEY.startswith(" "):
    print("DEBUG: Leading space detected!")
