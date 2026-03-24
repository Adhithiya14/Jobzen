from backend.app.core.config import settings
import google.generativeai as genai
from starlette.concurrency import run_in_threadpool
from typing import List

class ChatService:
    def _generate_mock_response(self, message: str) -> str:
        msg = message.lower()
        if "resume" in msg:
            return "To provide you with personalized career insights, please upload your resume in the **Resume** tab. I'll analyze it to help you identify strengths and target the best roles!"
        elif "interview" in msg or "mock" in msg:
            return "Ready to practice? Navigate to the **Mock Interview** tab where I can conduct a professional technical or HR interview session with you."
        elif "job" in msg or "work" in msg:
            return "You can discover tailored job opportunities on your **Dashboard**. These recommendations are specifically curated based on your unique skill set!"
        elif any(greeting in msg for greeting in ["hello", "hi", "hey"]):
            return "Greetings! I'm JobZen, your AI career companion. While I'm currently in a high-traffic mode, I'm fully equipped to help you navigate your career journey. How can I assist you today?"
        else:
            return "I'm currently streamlining my services due to high demand. For the best experience, I recommend using the **Resume Analysis** or **Mock Interview** features directly from the sidebar. What else can I help you find?"

    async def generate_response_stream(self, message: str, history: List[dict] = []):
        from backend.app.services.resume import resume_service
        from backend.app.core.prompts import CHAT_PROMPT_TEMPLATE, FALLBACK_PROMPT, SYSTEM_PROMPT, RESUME_AWARE_CONTEXT_TEMPLATE

        if not settings.cleaned_gemini_api_key or settings.cleaned_gemini_api_key == "YOUR_GEMINI_API_KEY":
            yield self._generate_mock_response(message)
            return

        try:
            genai.configure(api_key=settings.cleaned_gemini_api_key)
            model = genai.GenerativeModel('gemini-2.5-flash')
            
            # Check for resume context
            resume_text = resume_service.get_current_resume_text()
            
            if resume_text:
                # Resume-Aware Mode
                resume_context_str = RESUME_AWARE_CONTEXT_TEMPLATE.format(resume_text=resume_text[:20000]) # Reasonable context window
                prompt = CHAT_PROMPT_TEMPLATE.format(
                    system_prompt=SYSTEM_PROMPT,
                    resume_context=resume_context_str,
                    message=message
                )
            else:
                # Fallback / General Mode
                prompt = FALLBACK_PROMPT.format(message=message) 
            
            gemini_history = []
            for msg in history:
                role = "user" if msg["role"] == "user" else "model"
                gemini_history.append({"role": role, "parts": [{"text": msg["text"]}]})
            
            chat = model.start_chat(history=gemini_history)
            
            # Using synchronous stream generator and wrapping it
            response = chat.send_message(prompt, stream=True)
            for chunk in response:
                if chunk.text:
                    yield chunk.text
                    
        except Exception as e:
            print(f"Streaming Error: {str(e)}")
            yield "I'm currently experiencing high traffic. Please try the direct analysis features in the sidebar!"

    async def generate_response(self, message: str, history: list = []) -> str:
        from backend.app.services.resume import resume_service
        from backend.app.core.prompts import CHAT_PROMPT_TEMPLATE, FALLBACK_PROMPT, SYSTEM_PROMPT, RESUME_AWARE_CONTEXT_TEMPLATE
        
        if not settings.cleaned_gemini_api_key or "your_gemini_api_key" in settings.cleaned_gemini_api_key:
             return self._generate_mock_response(message)

        try:
            genai.configure(api_key=settings.cleaned_gemini_api_key)
            model = genai.GenerativeModel('gemini-2.5-flash')
            
            # Check for resume context
            resume_text = resume_service.get_current_resume_text()
            
            if resume_text:
                # Resume-Aware Mode
                resume_context_str = RESUME_AWARE_CONTEXT_TEMPLATE.format(resume_text=resume_text[:20000]) # Reasonable context window
                prompt = CHAT_PROMPT_TEMPLATE.format(
                    system_prompt=SYSTEM_PROMPT,
                    resume_context=resume_context_str,
                    message=message
                )
            else:
                # Fallback / General Mode
                prompt = FALLBACK_PROMPT.format(message=message) 
            
            # Simple stateless chat for now as per main.py, but we can wrap prompt with history 
            # if history is passed from main.py
            
            gemini_history = []
            for msg in history:
                role = "user" if msg["role"] == "user" else "model"
                gemini_history.append({"role": role, "parts": [{"text": msg["text"]}]})
            
            chat = model.start_chat(history=gemini_history)
            response = await run_in_threadpool(chat.send_message, prompt)
            return response.text
        except Exception as e:
            # Silently fallback instead of showing error
            return self._generate_mock_response(message)
            
chat_service = ChatService()
