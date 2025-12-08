from datetime import datetime, timezone

def fetch_twitter_posts(keyword: str, limit: int = 50):
    now = datetime.now(timezone.utc).isoformat()

    return [
        {
            "id": f"tw_{i}",
            "created_at": now,
            "author": f"demo_user_{i}",
            "text": f"Demo tweet about {keyword} #{i}",
            "likes": 10 + i,
            "retweets": 3 + i,
        }
        for i in range(min(limit, 10))
    ]
