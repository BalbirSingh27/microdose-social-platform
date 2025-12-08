import requests
from datetime import datetime, timezone
from ..supabase_client import supabase

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

    resp = requests.get(REDDIT_SEARCH_URL, params=params, headers=HEADERS, timeout=10)
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
                "title": post.get("title"),
                "selftext": post.get("selftext"),
                "subreddit": post.get("subreddit"),
                "score": post.get("score", 0),
                "num_comments": post.get("num_comments", 0),
                "created_utc": post.get("created_utc"),
            }
        )

    return posts


def store_posts_in_supabase(posts):
    """
    Upsert posts into Supabase table 'reddit_posts'.
    """
    if not posts:
        return {"inserted": 0}

    # upsert on id so we don't duplicate
    response = (
        supabase.table("reddit_posts")
        .upsert(posts, on_conflict="id")
        .execute()
    )

    inserted_count = len(response.data) if response.data else 0
    return {"inserted": inserted_count}
