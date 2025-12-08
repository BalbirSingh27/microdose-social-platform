from .scraping import fetch_reddit_posts, store_posts_in_supabase
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from ..supabase_client import supabase
from dotenv import load_dotenv
import os
import requests

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
# Supabase test (REST API)
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
# Main Supabase Reddit endpoints
# ------------------------------------------------------------


@app.get("/supabase/reddit_posts", tags=["supabase"])
async def get_reddit_posts(limit: int = 100):
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
    limit: int = 100,
):
    """
    Search reddit_posts by keyword in title or selftext.
    Called by the frontend search bar.
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
# Scraping (GET + POST)
# ------------------------------------------------------------


@app.api_route("/scrape/reddit", methods=["GET", "POST"], tags=["scraper"])
def scrape_reddit(
    q: str = Query("ai automation", description="Search query keyword"),
    limit: int = Query(20, ge=1, le=200, description="Number of posts to fetch"),
):
    """
    Trigger Reddit scraping + store into Supabase.

    Examples:
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
