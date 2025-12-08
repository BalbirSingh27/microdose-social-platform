from datetime import datetime, timezone

def fetch_facebook_posts(keyword: str, limit: int = 50):
    now = datetime.now(timezone.utc).isoformat()

    return [
        {
            "id": f"fb_{i}",
            "created_at": now,
            "page": f"FB Page {i}",
            "message": f"Demo Facebook post about {keyword} #{i}",
            "reactions": 5 + i,
        }
        for i in range(min(limit, 10))
    ]
