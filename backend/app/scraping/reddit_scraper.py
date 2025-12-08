
import requests
from datetime import datetime, timezone
from ...supabase_client import supabase

REDDIT_SEARCH_URL = "https://www.reddit.com/search.json"
HEADERS = {"User-Agent": "microdose-mcrdse-scraper/0.1 by balbir"}

def fetch_reddit_posts(query: str = "ai automation", limit: int = 20):
    params = {
        "q": query,
        "sort": "new",
        "limit": limit,
        "t": "day",
    }
    resp = requests.get(REDDIT_SEARCH_URL, params=params, headers=HEADERS, timeout=10)
    resp.raise_for_status()
    data = resp.json()

    posts = []
    for child in data.get("data", {}).get("children", []):
        d = child["data"]
        posts.append(
            {
                "title": d.get("title", ""),
                "selftext": d.get("selftext") or "",
                "subreddit": d.get("subreddit", ""),
                "score": d.get("score", 0),
                "num_comments": d.get("num_comments", 0),
                "created_utc": datetime.fromtimestamp(
                    d.get("created_utc", 0), tz=timezone.utc
                ).isoformat(),
            }
        )

    return posts

def store_posts_in_supabase(posts):
    if not posts:
        return {"inserted": 0}

    # assumes your table is called "reddit_posts"
    res = supabase.table("reddit_posts").insert(posts).execute()
    return {"inserted": len(posts), "supabase_result": str(res)}
