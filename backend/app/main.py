from openai import OpenAI
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .scraping import fetch_reddit_posts, store_posts_in_supabase
from .scraping.twitter_scraper import fetch_twitter_posts
from .scraping.instagram_scraper import fetch_instagram_posts
from .scraping.facebook_scraper import fetch_facebook_posts
from ..supabase_client import supabase

import os
import requests
from dotenv import load_dotenv

load_dotenv()

# ------------------------------------------------------------
# FASTAPI INIT
# ------------------------------------------------------------

app = FastAPI(
    title="MCRDSE Social Listening API",
    version="0.3.0",
)

# ------------------------------------------------------------
# OPENAI CLIENT
# ------------------------------------------------------------

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=OPENAI_API_KEY)

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
# HEALTH ENDPOINTS
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
# SUPABASE TEST
# ------------------------------------------------------------

@app.get("/supabase-test", tags=["supabase"])
async def supabase_test():
    """
    Test connectivity with Supabase REST API.
    """
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")

    if not supabase_url or not supabase_key:
        return {"status": "error", "message": "Missing Supabase variables"}

    table = "reddit_posts"
    url = f"{supabase_url}/rest/v1/{table}"

    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
    }

    try:
        resp = requests.get(url, headers=headers, timeout=10)
        return {"status": "ok", "code": resp.status_code, "data": resp.json()}
    except Exception as e:
        return {"status": "error", "message": str(e)}


# ------------------------------------------------------------
# SUPABASE REDDIT ENDPOINTS
# ------------------------------------------------------------

@app.get("/supabase/reddit_posts", tags=["supabase"])
async def get_reddit_posts(limit: int = Query(100, ge=1, le=500)):
    try:
        response = supabase.table("reddit_posts").select("*").limit(limit).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/supabase/reddit_posts/search", tags=["supabase"])
async def search_reddit_posts(
    keyword: str = Query(...),
    limit: int = Query(100, ge=1, le=500),
):
    try:
        pattern = f"%{keyword}%"
        response = (
            supabase.table("reddit_posts")
            .select("*")
            .or_(f"title.ilike.{pattern},selftext.ilike.{pattern}")
            .limit(limit)
            .execute()
        )
        return {"keyword": keyword, "results": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ------------------------------------------------------------
# SCRAPER → REDDIT TO SUPABASE
# ------------------------------------------------------------

@app.api_route("/scrape/reddit", methods=["GET", "POST"], tags=["scraper"])
def scrape_reddit(
    q: str = Query("ai automation"),
    limit: int = Query(20, ge=1, le=200),
):
    try:
        posts = fetch_reddit_posts(q, limit)
        result = store_posts_in_supabase(posts)
        return {"status": "ok", "query": q, "inserted": result["inserted"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ------------------------------------------------------------
# TWITTER / INSTAGRAM / FACEBOOK DUMMY SEARCH
# ------------------------------------------------------------

@app.get("/twitter/search", tags=["twitter"])
def search_twitter(keyword: str, limit: int = 50):
    try:
        return {
            "platform": "twitter",
            "keyword": keyword,
            "results": fetch_twitter_posts(keyword, limit),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/instagram/search", tags=["instagram"])
def search_instagram(keyword: str, limit: int = 50):
    try:
        return {
            "platform": "instagram",
            "keyword": keyword,
            "results": fetch_instagram_posts(keyword, limit),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/facebook/search", tags=["facebook"])
def search_facebook(keyword: str, limit: int = 50):
    try:
        return {
            "platform": "facebook",
            "keyword": keyword,
            "results": fetch_facebook_posts(keyword, limit),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ------------------------------------------------------------
# AI REPLY SUGGESTION ENDPOINT
# ------------------------------------------------------------

class ReplySuggestionRequest(BaseModel):
    title: str
    selftext: str | None = None
    subreddit: str | None = None
    platform: str | None = "reddit"


@app.post("/ai/reply-suggestion", tags=["ai"])
async def ai_reply_suggestion(payload: ReplySuggestionRequest):
    """
    Generate a short, safe, friendly reply suggestion using OpenAI.
    """
    if not OPENAI_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="OPENAI_API_KEY missing on server.",
        )

    body = (payload.selftext or "").strip()
    if len(body) > 800:
        body = body[:800] + "..."

    prompt = f"""
Write a short 2–4 sentence reply to an online post.

Rules:
- Be empathetic and supportive.
- DO NOT give medical advice.
- DO NOT encourage illegal substance use.
- Keep it friendly, neutral, and safe.
- Reply as a helpful human — not like an AI.

Platform: {payload.platform}
Subreddit: {payload.subreddit}

Post Title:
{payload.title}

Post Body:
{body}

Your Reply:
""".strip()

    try:
        response = client.responses.create(
            model="gpt-4.1-mini",
            input=prompt,
        )

        reply_text = response.output[0].content[0].text

        return {
            "suggestion": reply_text,
            "platform": payload.platform,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
