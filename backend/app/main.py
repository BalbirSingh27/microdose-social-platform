from .scraping.twitter_scraper import fetch_twitter_posts
from .scraping.instagram_scraper import fetch_instagram_posts
from .scraping.facebook_scraper import fetch_facebook_posts
from .scraping import fetch_reddit_posts, store_posts_in_supabase

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from ..supabase_client import supabase

import os
import requests
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="MCRDSE Social Listening API",
    version="0.1.0",
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
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")

    if not supabase_url or not supabase_key:
        return {
            "status": "error",
            "message": "Missing Supabase environment variables",
        }

    endpoint = f"{supabase_url}/rest/v1/reddit_posts"
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
    }

    try:
        resp = requests.get(endpoint, headers=headers, params={"select": "*", "limit": 5})
        return {
            "status": "ok" if resp.status_code == 200 else "error",
            "code": resp.status_code,
            "data": resp.json()
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

# ------------------------------------------------------------
# Reddit endpoints
# ------------------------------------------------------------

@app.get("/supabase/reddit_posts", tags=["supabase"])
async def get_reddit_posts(limit: int = 100):
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
async def search_reddit_posts(keyword: str = Query(..., min_length=1), limit: int = 100):
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
        return {"keyword": keyword, "results": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ------------------------------------------------------------
# Scrape Reddit and store
# ------------------------------------------------------------

@app.api_route("/scrape/reddit", methods=["GET", "POST"], tags=["scraper"])
def scrape_reddit(
    q: str = Query("ai automation"),
    limit: int = Query(20, ge=1, le=200),
):
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
# Twitter / Instagram / Facebook endpoints
# ------------------------------------------------------------

@app.get("/twitter/search", tags=["twitter"])
def search_twitter(keyword: str, limit: int = 50):
    posts = fetch_twitter_posts(keyword, limit)
    return {"platform": "twitter", "keyword": keyword, "results": posts}


@app.get("/instagram/search", tags=["instagram"])
def search_instagram(keyword: str, limit: int = 50):
    posts = fetch_instagram_posts(keyword, limit)
    return {"platform": "instagram", "keyword": keyword, "results": posts}


@app.get("/facebook/search", tags=["facebook"])
def search_facebook(keyword: str, limit: int = 50):
    posts = fetch_facebook_posts(keyword, limit)
    return {"platform": "facebook", "keyword": keyword, "results": posts}
