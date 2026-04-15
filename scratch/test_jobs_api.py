import asyncio
from backend.app.services.recommendation import recommendation_service

async def test():
    print("Fetching jobs...")
    jobs = await recommendation_service.get_jobs(role="Software Engineer", user_skills=["Python", "FastAPI"])
    if not jobs:
        print("No jobs found.")
        return
    
    print(f"Found {len(jobs)} jobs.")
    for job in jobs[:2]:
        print(f"Job: {job.title} at {job.company}")
        print(f"  Apply Link: {job.apply_link}")
        print(f"  Company URL: {job.company_url}")
        if not job.company_url:
            print("  ERROR: company_url is missing!")
        else:
            print("  SUCCESS: company_url is present.")

if __name__ == "__main__":
    asyncio.run(test())
