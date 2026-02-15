from backend.app.core.config import settings
import google.generativeai as genai
from starlette.concurrency import run_in_threadpool

class ChatService:
    def _generate_mock_response(self, message: str) -> str:
        msg = message.lower()
        if "resume" in msg:
            return "To analyze your resume, please upload it in the 'Resume' tab. I can scan it for skills and give you a score!"
        elif "interview" in msg or "mock" in msg:
            return "You can start a mock interview in the 'Mock Interview' tab. I can act as a Technical or HR interviewer."
        elif "job" in msg or "work" in msg:
            return "Check out the 'Dashboard' to see job recommendations tailored to your skills!"
        elif "hello" in msg or "hi" in msg:
            return "Hello! I'm JobZen. I'm currently in 'Offline Mode' (High Traffic), but I can still guide you through the app. What do you need help with?"
        else:
            return "I'm currently experiencing high traffic (Offline Mode). Please try using the Resume or Interview features directly from the menu!"

    async def generate_response(self, message: str, history: list = []) -> str:
        from backend.app.services.resume import resume_service
        from backend.app.core.prompts import CHAT_PROMPT_TEMPLATE, FALLBACK_PROMPT, SYSTEM_PROMPT, RESUME_AWARE_CONTEXT_TEMPLATE
        
        if not settings.GEMINI_API_KEY or "your_gemini_api_key" in settings.GEMINI_API_KEY:
             return self._generate_mock_response(message)

        try:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel('gemini-flash-latest')
            
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
                prompt = FALLBACK_PROMPT.format(message=message) # Fallback prompt is self-contained or use format
                # Note: FALLBACK_PROMPT in prompts.py has {message} placeholder
            
            # Pass history if needed? For now, we are relying on the prompt to set the behavior.
            # If we want chat history, we'd append previous messages. 
            # But the user prompt says: "The user is chatting with you... If resume data exists... Answer all questions in context"
            # We will use the constructed prompt as the specific instruction for this turn.
            
            response = await run_in_threadpool(model.generate_content, prompt)
            return response.text
        except Exception as e:
            # Silently fallback instead of showing error
            return self._generate_mock_response(message)
            
chat_service = ChatService()
