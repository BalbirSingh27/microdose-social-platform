# backend/app/scraping/instagram_scraper.py
from datetime import datetime, timezone

def fetch_instagram_posts(keyword: str, limit: int = 50):
    now = datetime.now(timezone.utc).isoformat()

    return [
        {
            "id": f"ig_{i}",
            "created_at": now,
            "username": f"insta_creator_{i}",
            "caption": f"Demo Instagram post about {keyword} #{i}",
            "likes": 25 + i,
        }
        for i in range(min(limit, 10))
    ]
