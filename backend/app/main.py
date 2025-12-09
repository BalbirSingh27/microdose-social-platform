from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .scraping import fetch_reddit_posts, store_posts_in_supabase
from .scraping.twitter_scraper import fetch_twitter_posts
from .scraping.instagram_scraper import fetch_instagram_posts
from .scraping.facebook_scraper import fetch_facebook_posts
from ..supabase_client import supabase

import os
import requests
from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv()

app = FastAPI(
    title="MCRDSE Social Listening API",
    version="0.3.0",
)

# ------------------------------------------------------------
# CORS
# ------------------------------------------------------------

origins = [
    "http://localhost:3000",
    "https://microdose-social-platform.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------
# Health + demo
# ------------------------------------------------------------


@app.get("/", tags=["health"])
async def health_check():
    return {
        "status": "ok",
        "message": "MCRDSE backend is running on Render 🚀",
    }


@app.get("/hello", tags=["demo"])
async def hello(name: str = "world"):
    return {"message": f"Hello, {name}!"}


# ------------------------------------------------------------
# Supabase test
# ------------------------------------------------------------


@app.get("/supabase-test", tags=["supabase"])
async def supabase_test():
    """
    Simple connectivity test with Supabase REST API.
    """
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")

    if not supabase_url or not supabase_key:
        return {
            "status": "error",
            "message": "Missing Supabase environment variables",
        }

    table_name = "reddit_posts"
    endpoint = f"{supabase_url}/rest/v1/{table_name}"

    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
    }

    params = {
        "select": "*",
        "limit": 5,
    }

    try:
        resp = requests.get(endpoint, headers=headers, params=params, timeout=10)
        return {
            "status": "ok" if resp.status_code == 200 else "error",
            "code": resp.status_code,
            "data": resp.json() if resp.content else None,
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


# ------------------------------------------------------------
# Supabase Reddit endpoints
# ------------------------------------------------------------


@app.get("/supabase/reddit_posts", tags=["supabase"])
async def get_reddit_posts(limit: int = Query(100, ge=1, le=500)):
    """
    Fetch Reddit posts from Supabase using supabase-py client.
    """
    try:
        response = (
            supabase
            .table("reddit_posts")
            .select("*")
            .limit(limit)
            .execute()
        )
        return response.data

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/supabase/reddit_posts/search", tags=["supabase"])
async def search_reddit_posts(
    keyword: str = Query(..., min_length=1),
    limit: int = Query(100, ge=1, le=500),
):
    """
    Search reddit_posts by keyword in title or selftext.
    Frontend will call this to support keyword search.
    """
    try:
        pattern = f"%{keyword}%"

        response = (
            supabase
            .table("reddit_posts")
            .select("*")
            .or_(f"title.ilike.{pattern},selftext.ilike.{pattern}")
            .limit(limit)
            .execute()
        )

        return {
            "keyword": keyword,
            "results": response.data,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ------------------------------------------------------------
# Scraping (GET + POST) – Reddit → Supabase
# ------------------------------------------------------------


@app.api_route("/scrape/reddit", methods=["GET", "POST"], tags=["scraper"])
def scrape_reddit(
    q: str = Query("ai automation", description="Search query keyword"),
    limit: int = Query(20, ge=1, le=200, description="Number of posts to fetch"),
):
    """
    Trigger Reddit scraping + store into Supabase.

    Example:
      GET https://mcrdse-api.onrender.com/scrape/reddit?q=microdosing&limit=50
    """
    try:
        posts = fetch_reddit_posts(q, limit)
        result = store_posts_in_supabase(posts)
        return {
            "status": "ok",
            "query": q,
            "limit": limit,
            "inserted": result["inserted"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ------------------------------------------------------------
# Twitter / Instagram / Facebook keyword search
# ------------------------------------------------------------


@app.get("/twitter/search", tags=["twitter"])
def search_twitter(keyword: str, limit: int = 50):
    try:
        posts = fetch_twitter_posts(keyword, limit)
        return {
            "platform": "twitter",
            "keyword": keyword,
            "results": posts,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/instagram/search", tags=["instagram"])
def search_instagram(keyword: str, limit: int = 50):
    try:
        posts = fetch_instagram_posts(keyword, limit)
        return {
            "platform": "instagram",
            "keyword": keyword,
            "results": posts,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/facebook/search", tags=["facebook"])
def search_facebook(keyword: str, limit: int = 50):
    try:
        posts = fetch_facebook_posts(keyword, limit)
        return {
            "platform": "facebook",
            "keyword": keyword,
            "results": posts,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ------------------------------------------------------------
# AI-ish reply suggestion endpoint (no external provider)
# ------------------------------------------------------------


class ReplySuggestionRequest(BaseModel):
    title: str
    selftext: str | None = None
    subreddit: str | None = None
    platform: str | None = "reddit"


def build_local_reply(payload: ReplySuggestionRequest) -> str:
    """
    Simple rule-based reply generator.
    No external API, just templates so it always works.
    """

    community = f"r/{payload.subreddit}" if payload.subreddit else "this community"

    body = (payload.selftext or "").strip()
    if len(body) > 500:
        body = body[:500] + "..."

    intro = f"Hey, thanks for sharing this in {community}."
    title_line = f' I read your post titled "{payload.title}".'

    if body:
        body_line = (
            " It sounds like you're putting a lot of thought into what you're experiencing, "
            "and that takes courage."
        )
    else:
        body_line = (
            " I appreciate you opening up about this, even without a long description."
        )

    safety = (
        " I can’t give medical or legal advice, but it may help to talk to a qualified "
        "health professional or someone you trust who understands your situation."
    )

    close = (
        " Whatever you decide, try to prioritise your safety, mental health and well-being. "
        "Sending you good wishes."
    )

    return (intro + title_line + body_line + safety + close).strip()


@app.post("/ai/reply-suggestion", tags=["ai"])
async def ai_reply_suggestion(payload: ReplySuggestionRequest):
    """
    Generate a safe, neutral reply suggestion for a given post
    WITHOUT calling OpenAI or any external provider.
    """
    try:
        suggestion = build_local_reply(payload)
        return {
            "suggestion": suggestion,
            "platform": payload.platform or "reddit",
            "provider": "local-template",
        }
    except Exception as e:
        # In case something weird happens, still avoid 500s in the UI
        raise HTTPException(status_code=500, detail=str(e))
