@echo off
echo Starting JobZen Backend...
call .\.venv\Scripts\activate
uvicorn backend.app.main:app --host 0.0.0.0 --port 8001 --reload
pause
