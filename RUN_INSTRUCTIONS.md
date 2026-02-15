# Run Instructions

## Terminal 1 (Backend)
```powershell
.\.venv\Scripts\activate
uvicorn backend.app.main:app --host 0.0.0.0 --port 8001 --reload
```

## Terminal 2 (Frontend)
```powershell
cd frontend
npm run dev
```

## Testing
Open http://localhost:5173/aptitude
