from openai import OpenAI
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
    version="0.2.0",
)

# OpenAI client (for AI reply suggestions)
client = OpenAI()

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
# (right now these just call your scraper helpers)
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
# AI reply suggestion endpoint (Week 2, Step 1)
# ------------------------------------------------------------

class ReplySuggestionRequest(BaseModel):
    title: str
    selftext: str | None = None
    subreddit: str | None = None
    platform: str | None = "reddit"


@app.post("/ai/reply-suggestion", tags=["ai"])
async def ai_reply_suggestion(payload: ReplySuggestionRequest):
    """
    Generate a safe, neutral reply suggestion for a given post
    using the OpenAI API. This does NOT post to Reddit/Twitter;
    it only returns text for the dashboard.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="OPENAI_API_KEY is not set on the server.",
        )

    body_snippet = (payload.selftext or "").strip()
    if len(body_snippet) > 800:
        body_snippet = body_snippet[:800] + "..."

    prompt = f"""
You are helping a marketing / community manager craft a short, safe reply
to an online post about microdosing, psychedelics, wellness, or mental health.

Platform: {payload.platform or "reddit"}
Subreddit or community: {payload.subreddit or "(not specified)"}

Post title:
{payload.title}

Post body:
{body_snippet if body_snippet else "(no body text provided)"}

Write a 2–4 sentence reply that:
- Is empathetic and non-judgmental.
- Does NOT give medical advice or tell people to use illegal substances.
- Encourages responsible behavior and, where relevant, consulting qualified health professionals.
- Sounds like a human, not a robot, and is easy to paste as a reply.

Return ONLY the reply text, nothing else.
""".strip()

    try:
        resp = client.responses.create(
            model="gpt-4.1-mini",
            input=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt}
                    ],
                }
            ],
        )

        suggestion = resp.output[0].content[0].text

        return {
            "suggestion": suggestion,
            "platform": payload.platform or "reddit",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
