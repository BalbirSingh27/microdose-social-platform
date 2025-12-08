import requests
from datetime import datetime, timezone

# NOTE: supabase_client is in backend/supabase_client.py
# scraping package path = backend.app.scraping
# so we go 2 levels up (backend) using "..."
from ...supabase_client import supabase

REDDIT_SEARCH_URL = "https://www.reddit.com/search.json"
HEADERS = {"User-Agent": "microdose-mcrdse-scraper/0.1 by balbir"}


def fetch_reddit_posts(query: str = "ai automation", limit: int = 20):
    """
    Fetch posts from Reddit search API.
    """
    params = {
        "q": query,
        "sort": "new",
        "limit": limit,
        "t": "day",
    }

    resp = requests.get(
        REDDIT_SEARCH_URL,
        params=params,
        headers=HEADERS,
        timeout=10,
    )
    resp.raise_for_status()

    data = resp.json()
    posts = []

    for item in data.get("data", {}).get("children", []):
        post = item.get("data", {})
        posts.append(
            {
                "id": post.get("id"),
                "created_at": datetime.fromtimestamp(
                    post.get("created_utc", 0), tz=timezone.utc
                ).isoformat(),
                "title": post.get("title") or "",
                "selftext": post.get("selftext") or "",
                "subreddit": post.get("subreddit") or "",
                "score": post.get("score", 0),
                "num_comments": post.get("num_comments", 0),
            }
        )

    return posts


def store_posts_in_supabase(posts):
    """
    Insert a list of posts into the reddit_posts table in Supabase.
    (No ON CONFLICT de-duping for now.)
    """
    if not posts:
        return {"inserted": 0}

    try:
        result = (
            supabase
            .table("reddit_posts")
            .insert(posts)   # <-- simple insert, avoids ON CONFLICT error
            .execute()
        )

        inserted_count = len(result.data) if result.data else 0

        return {"inserted": inserted_count}

    except Exception as e:
        return {"error": str(e), "inserted": 0}

