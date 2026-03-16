from backend.app.core.config import settings
key = settings.GEMINI_API_KEY
print(f"KEY: '{key}'")
print(f"HEX: {key.encode().hex()}")
print(f"LEN: {len(key)}")
