<div align="center">
  <img src="https://i.ibb.co/3s6K2bP/jobzen-logo.png" alt="JobZen Logo" width="150" style="border-radius: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.3);" />
  <br />
  <br />
  
  <h1>🌟 JobZen AI</h1>
  <h3>Your Intelligent Career Preparation Companion</h3>
  <br/>

   ![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
   ![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
   ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
   ![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
   ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
   ![Google Gemini](https://img.shields.io/badge/Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white)

  <p>A full-stack, AI-powered platform tailored to help students and professionals excel in interviews, refine resumes, and secure their dream jobs.</p>
</div>

---

## 🚀 Key Features

### 📄 AI Resume Analyzer
Upload your resume in PDF format and let our AI engine analyze it. Get comprehensive feedback on your **Education**, **Experience**, and **Skills**, along with intelligent suggestions to optimize it for Applicant Tracking Systems (ATS).

### 🎙️ Interactive Mock Interviews
Simulate real-world technical and HR interviews with our AI interviewer. Get real-time grades out of 10 and detailed feedback on your answers based on industry standards.
*   **Categories:** Technical, HR, Behavioral.

### 🧠 Aptitude Training Module
Practice quantitative and logical reasoning with our built-in aptitude assessment platform. Track your scores to measure your growth over time.

### 💬 Career Coaching Chatbot
Need quick advice? Chat with our interactive AI assistant specialized in career guidance, interview prep, and tech-stack recommendations.

### 💼 Smart Job Aggregator & Matcher
JobZen doesn't just prepare you; it connects you. Get live, real-time job listings populated based on your precise skillset and preferred roles.

---

## 🛠️ Architecture & Tech Stack

| Domain | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS | Lightning-fast UI, modern glassmorphism aesthetic, responsive. |
| **Backend** | Python 3.9+, FastAPI | High-performance async API with integrated routing. |
| **Database** | SQLite, SQLModel | Elegant ORM-based relational data management. |
| **AI Engine** | Google Gemini `1.5-flash` | Generative AI for chat, mock interviews, and resume parsing. |

---

## ⚙️ How to Setup & Run

Follow these steps to run JobZen AI seamlessly on your local machine.

### 1. Prerequisites
Ensure you have the following downloaded and installed:
*   [Node.js](https://nodejs.org/en) (v18+)
*   [Python](https://www.python.org/downloads/) (3.9+)
*   [Git](https://git-scm.com/)

### 2. Clone the Repository
```bash
git clone https://github.com/Adhithiya14/Jobzen.git
cd Jobzen
```

### 3. Setup the AI Engine (Backend)
JobZen requires a Google Gemini API Key. Get one for free from Google AI Studio.

1.  Navigate into the backend directory:
    ```bash
    cd backend
    ```
2.  Install all Python dependencies:
    ```bash
    pip install -r requirements.txt
    ```
3.  Copy the example environment file and insert your API key:
    ```bash
    cp .env.example .env
    ```
    *Open `.env` and replace `YOUR_GEMINI_API_KEY` with your actual key.*
4.  Run the API Server:
    ```bash
    uvicorn app.main:app --reload
    ```
    ✅ *Backend is fully operational at `http://localhost:8000`*

### 4. Setup the Interactive UI (Frontend)
Open a **new, entirely separate terminal window**, making sure you are back at the root `Jobzen` folder.

1.  Navigate to the frontend folder:
    ```bash
    cd frontend
    ```
2.  Install Node dependencies:
    ```bash
    npm install
    # Wait for completion, then start the VITE server:
    npm run dev
    ```
    ✅ *Frontend is live at `http://localhost:5173`*

---

<div align="center">
  <p>Built as a state-of-the-art academic/industry endeavor by <b>Adhithiya14</b>.</p>
</div>
