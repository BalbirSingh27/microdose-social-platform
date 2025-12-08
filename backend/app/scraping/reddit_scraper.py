import requests
from datetime import datetime, timezone

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
                # reddit id is a short string like "1phpsnq"
                # table column "id" is TEXT, so this is fine
                "id": post.get("id"),

                # store as ISO string, Supabase will also set created_at default now()
                "created_at": datetime.fromtimestamp(
                    post.get("created_utc", 0), tz=timezone.utc
                ).isoformat(),

                "title": post.get("title") or "",
                "selftext": post.get("selftext") or "",
                "subreddit": post.get("subreddit") or "",
                "score": post.get("score", 0),
                "num_comments": post.get("num_comments", 0),

                # optional extra column if you want it
                "created_utc": datetime.fromtimestamp(
                    post.get("created_utc", 0), tz=timezone.utc
                ).isoformat(),
            }
        )

    return posts


def store_posts_in_supabase(posts):
    """
    Insert a list of posts into the reddit_posts table in Supabase.
    (No ON CONFLICT de-duping for now – simplest version.)
    """
    if not posts:
        return {"inserted": 0}

    result = (
        supabase
        .table("reddit_posts")
        .insert(posts)   # <- INSERT only, no upsert / conflict
        .execute()
    )

    inserted_count = len(result.data) if result.data else 0
    return {"inserted": inserted_count}
