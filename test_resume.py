import asyncio
from backend.app.services.resume import resume_service

async def test():
    text = "
Alice Software Engineer
Skills: Python, Java, JavaScript, C++, C#, React, Next.js, Django, SQL, PostgreSQL, AWS, Docker
Experience:
- Developed scalable REST API using Python and Django. Improved performance by 30%.
- Designed database schema in PostgreSQL.
Education:
- Bachelor of Science in Computer Science, University of Technology
Projects:
- Built a machine learning model using Python.
"
    analysis = await resume_service.analyze_resume(text)
    print("Skills:", analysis.skills)
    print("Score:", analysis.score)
    print("Score Criteria:", analysis.score_criteria)

asyncio.run(test())