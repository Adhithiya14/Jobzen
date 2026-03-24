from pydantic import BaseModel, Field
from typing import List
import io
import logging
import re
from pypdf import PdfReader
from starlette.concurrency import run_in_threadpool

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ResumeAnalysis(BaseModel):
    score: int
    suggestions: List[str] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)
    summary: str
    years_experience: int = 0
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    score_criteria: List[str] = Field(default_factory=list)

class ResumeService:
    def __init__(self):
        self.last_resume_text = ""

    def get_current_resume_text(self) -> str:
        return self.last_resume_text

    def _parse_pdf_sync(self, file_content: bytes) -> str:
        try:
            logger.info(f"Starting PDF parsing for file of size {len(file_content)} bytes")
            import fitz
            doc = fitz.open(stream=file_content, filetype="pdf")
            text = ""
            for page in doc:
                text += page.get_text() + "\n"
            logger.info(f"PDF parsed successfully with PyMuPDF. Extracted {len(text)} characters.")
            self.last_resume_text = text # Store for other services
            return text
        except Exception as e:
            logger.error(f"Error parsing PDF with PyMuPDF: {e}. Falling back to PyPDF...")
            try:
                from pypdf import PdfReader
                import io
                reader = PdfReader(io.BytesIO(file_content))
                text = ""
                for page in reader.pages:
                    text += page.extract_text() + "\n"
                logger.info(f"PDF parsed successfully with PyPDF fallback. Extracted {len(text)} characters.")
                self.last_resume_text = text
                return text
            except Exception as inner_e:
                logger.error(f"Error parsing PDF with fallback: {inner_e}")
                return ""

    async def parse_pdf(self, file_content: bytes) -> str:
        return await run_in_threadpool(self._parse_pdf_sync, file_content)

    def _extract_skills_rule_based(self, text: str) -> List[str]:
        text_lower = text.lower()
        found_skills = set()

        # Curated keyword DB for exact matching only
        keywords = {
            "Languages": ["python", "java", "javascript", "typescript", "c++", "c#", "go", "ruby", "php", "swift", "kotlin", "rust"],
            "Web": ["react", "angular", "vue", "next.js", "node.js", "django", "fastapi", "flask", "spring boot", "asp.net", "html", "css"],
            "Data": ["sql", "mysql", "postgresql", "mongodb", "pandas", "numpy", "pytorch", "tensorflow", "scikit-learn", "spark", "hadoop", "tableau", "power bi"],
            "DevOps/Cloud": ["aws", "azure", "gcp", "docker", "kubernetes", "jenkins", "git", "linux", "terraform", "ansible"],
            "Concepts": ["rest api", "graphql", "microservices", "agile", "scrum", "algorithms", "data structures"]
        }

        for _, skills in keywords.items():
            for skill in skills:
                pattern = r"(?<![a-z0-9])" + re.escape(skill) + r"(?![a-z0-9])"
                if re.search(pattern, text_lower):
                    if skill == "sql":
                        found_skills.add("SQL")
                    elif skill == "aws":
                        found_skills.add("AWS")
                    elif skill == "css":
                        found_skills.add("CSS")
                    elif skill == "html":
                        found_skills.add("HTML")
                    elif skill == "api":
                        found_skills.add("API")
                    else:
                        found_skills.add(skill.title())

        return sorted(found_skills)

    def _extract_years_experience(self, text: str) -> int:
        text_lower = text.lower()
        matches = re.findall(r"(\d{1,2})\s*\+?\s*(years|yrs)\s*(of)?\s*(experience|exp)", text_lower)
        years = [int(m[0]) for m in matches] if matches else []
        return max(years) if years else 0

    def _compute_ats_score(self, text: str, skills: List[str]) -> int:
        text_lower = text.lower()

        def has_section(section: str) -> bool:
            return section in text_lower

        def has_any(tokens: list[str]) -> bool:
            return any(re.search(r"(?<![a-z0-9])" + re.escape(t) + r"(?![a-z0-9])", text_lower) for t in tokens)

        score = 0
        word_count = len(text.split())
        criteria = []

        # ATS Compatibility (10): clean, parseable text + key sections present
        ats_sections = ["experience", "education", "skills"]
        ats_score = 10 if all(has_section(s) for s in ats_sections) and word_count > 100 else 6 if any(has_section(s) for s in ats_sections) else 2
        score += ats_score
        criteria.append(f"ATS Compatibility ({ats_score}/10): presence of core sections and sufficient readable text.")

        # Structure (10): clear headings and multiple sections
        structure_sections = ["summary", "objective", "experience", "education", "skills", "projects", "certifications"]
        structure_count = sum(1 for s in structure_sections if has_section(s))
        structure_score = 10 if structure_count >= 5 else 7 if structure_count >= 3 else 4 if structure_count >= 1 else 1
        score += structure_score
        criteria.append(f"Structure ({structure_score}/10): clear section headings and organized layout.")

        # Experience Impact (10): action verbs + metrics
        action_verbs = ["led", "built", "designed", "developed", "implemented", "optimized", "improved", "launched", "owned", "delivered"]
        has_metrics = bool(re.search(r"\b\d{1,3}%\b", text_lower) or re.search(r"\b\d{2,}\b", text_lower))
        exp_score = 10 if has_section("experience") and has_any(action_verbs) and has_metrics else 7 if has_section("experience") and (has_any(action_verbs) or has_metrics) else 4 if has_section("experience") else 1
        score += exp_score
        criteria.append(f"Experience Impact ({exp_score}/10): action verbs plus measurable results/metrics.")

        # Skills (10): explicit skills count
        skills_score = 10 if len(skills) >= 12 else 8 if len(skills) >= 8 else 5 if len(skills) >= 4 else 2 if len(skills) >= 1 else 0
        score += skills_score
        criteria.append(f"Skills ({skills_score}/10): count of explicit skills found in the resume.")

        # Keywords (10): presence of domain terms and tool keywords
        keyword_tokens = ["api", "database", "cloud", "backend", "frontend", "microservices", "ci/cd", "etl", "model", "testing"]
        keyword_hits = sum(1 for k in keyword_tokens if k in text_lower)
        keyword_score = 10 if keyword_hits >= 6 else 7 if keyword_hits >= 3 else 4 if keyword_hits >= 1 else 1
        score += keyword_score
        criteria.append(f"Keywords ({keyword_score}/10): presence of role-related keywords and tooling terms.")

        # Achievements (10): quantified achievements vs responsibilities
        ach_score = 10 if has_metrics and has_any(["improved", "increased", "reduced", "optimized", "saved", "grew"]) else 7 if has_metrics else 4 if has_section("experience") else 1
        score += ach_score
        criteria.append(f"Achievements ({ach_score}/10): measurable accomplishments vs. duties.")

        # Language (10): clarity via sentence length and basic grammar proxies
        avg_sentence_len = word_count / max(1, len(re.split(r"[.!?]+", text)))
        lang_score = 10 if 8 <= avg_sentence_len <= 20 else 7 if 5 <= avg_sentence_len <= 30 else 4
        score += lang_score
        criteria.append(f"Language ({lang_score}/10): clarity and professional tone (sentence length heuristics).")

        # Education (10): presence and some detail
        edu_score = 10 if has_section("education") and has_any(["bachelor", "master", "b.tech", "m.tech", "degree", "university", "college"]) else 7 if has_section("education") else 2
        score += edu_score
        criteria.append(f"Education ({edu_score}/10): presence and detail level of education section.")

        # Projects (10): presence and details (tools/results)
        proj_score = 10 if has_section("projects") and has_any(["built", "developed", "implemented", "using", "tech stack", "stack", "api", "database"]) else 7 if has_section("projects") else 2
        score += proj_score
        criteria.append(f"Projects ({proj_score}/10): project section with tools/results/complexity cues.")

        # Market Competitiveness (10): combined signal
        market_score = 10 if score >= 80 else 7 if score >= 65 else 4 if score >= 50 else 2
        score += market_score
        criteria.append(f"Market Competitiveness ({market_score}/10): overall strength relative to typical candidates.")

        return max(0, min(100, score)), criteria

    def _build_rule_based_suggestions(self, text: str, skills: List[str]) -> List[str]:
        text_lower = text.lower()
        suggestions = []

        if "experience" not in text_lower:
            suggestions.append("Add an Experience section with roles, responsibilities, and impact.")
        if "projects" not in text_lower:
            suggestions.append("Include 1–3 projects that demonstrate your core skills.")
        if "skills" not in text_lower:
            suggestions.append("Add a Skills section with clear, scannable keywords.")
        if not re.search(r"\b\d{1,3}%\b", text_lower) and not re.search(r"\b\d{2,}\b", text_lower):
            suggestions.append("Quantify impact with metrics (e.g., % improvements, time saved, scale).")
        if len(skills) < 5:
            suggestions.append("List more relevant technical skills mentioned in the resume.")

        return suggestions[:5] if suggestions else [
            "Ensure consistent formatting and clear section headings for ATS parsing.",
            "Use strong action verbs and measurable results where possible."
        ]

    async def analyze_resume(self, text: str) -> ResumeAnalysis:
        from backend.app.core.config import settings
        from backend.app.core.prompts import RESUME_RATING_PROMPT_TEMPLATE, SYSTEM_PROMPT, RESUME_AWARE_CONTEXT_TEMPLATE
        import google.generativeai as genai
        import json

        # Helper for Fallback Response
        def get_fallback_analysis(extracted_skills: List[str]) -> ResumeAnalysis:
            ats_score, criteria = self._compute_ats_score(text, extracted_skills)
            years = self._extract_years_experience(text)

            return ResumeAnalysis(
                score=ats_score,
                suggestions=self._build_rule_based_suggestions(text, extracted_skills),
                skills=extracted_skills,
                summary=f"ATS analysis based on {len(text.split())} words and {len(extracted_skills)} explicit skills found in the resume.",
                years_experience=years,
                score_criteria=criteria
            )
        
        # Update local storage even if called directly (double check)
        self.last_resume_text = text

        skills = self._extract_skills_rule_based(text)

        # 1. Fallback Mode (No Key or Mock Key)
        if not settings.cleaned_gemini_api_key or "your_gemini_api_key" in settings.cleaned_gemini_api_key:
            return get_fallback_analysis(skills)

        # 2. Real AI Mode
        try:
            genai.configure(api_key=settings.cleaned_gemini_api_key)
            model = genai.GenerativeModel('gemini-2.5-flash')
            
            # Construct Prompt (AI used only for narrative fields)
            resume_context_str = RESUME_AWARE_CONTEXT_TEMPLATE.format(resume_text=text[:15000]) # Limit length
            prompt = RESUME_RATING_PROMPT_TEMPLATE.format(
                system_prompt=SYSTEM_PROMPT,
                resume_context=resume_context_str
            )
            
            response = await model.generate_content_async(prompt)
            response_text = response.text.strip()
            
            # Clean up potentially broken JSON
            if response_text.startswith("```json"): response_text = response_text[7:-3]
            elif response_text.startswith("```"): response_text = response_text[3:-3]
            
            data = json.loads(response_text)
            
            # Map new JSON keys to model if slightly different, but prompt asks for strict match
            # Model expects: score, suggestions, skills, summary, years_experience
            # Prompt output: score, years_experience, strengths, weaknesses, suggestions, skills, summary
            
            # Augment summary with strengths/weaknesses if not in model yet (Model is ResumeAnalysis)
            # ResumeAnalysis = score, suggestions, skills, summary, years_experience
            # We can combine strengths/weaknesses into summary or suggestions if needed, 
            # Or assume the summary provided by AI covers it. 
            pass

            ats_score, criteria = self._compute_ats_score(text, skills)
            return ResumeAnalysis(
                score=ats_score,
                suggestions=data.get("suggestions", []) or self._build_rule_based_suggestions(text, skills),
                skills=skills,
                summary=data.get("summary", "No summary provided."),
                years_experience=self._extract_years_experience(text),
                strengths=data.get("strengths", []),
                weaknesses=data.get("weaknesses", []),
                score_criteria=criteria
            )
            
        except Exception as e:
            logger.error(f"AI Analysis Failed: {e}")
            # 3. Robust Fallback on Error (429, 500, etc.)
            skills = self._extract_skills_rule_based(text)
            fallback = get_fallback_analysis(skills)
            fallback.summary += " (AI Service Unavailable - Using Offline Analysis)"
            return fallback

resume_service = ResumeService()
