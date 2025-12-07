from .reddit_scraper import fetch_reddit_posts, store_posts_in_supabase
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

# Allow frontend (localhost:3000 + any others) to call the API
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
    Frontend will call this to support keyword search.
    """
    try:
        pattern = f"%{keyword}%"

        response = (
            supabase
            .table("reddit_posts")
            .select("*")
            # Search in both title and selftext columns
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
# Scraping
# ------------------------------------------------------------

def _scrape_and_store(q: str, limit: int):
    posts = fetch_reddit_posts(q, limit)
    result = store_posts_in_supabase(posts)
    return {
        "status": "ok",
        "query": q,
        "limit": limit,
        "inserted": result["inserted"],
    }

@app.post("/scrape/reddit", tags=["scraper"])
def scrape_reddit_post(q: str = "ai automation", limit: int = 20):
    """
    Trigger Reddit scraping + store into Supabase via POST.
    """
    return _scrape_and_store(q, limit)


@app.get("/scrape/reddit", tags=["scraper"])
def scrape_reddit_get(q: str = "ai automation", limit: int = 20):
    """
    Same as POST, but allows triggering from browser address bar.
    NOTE: only use manually / admin use, not public UI.
    """
    return _scrape_and_store(q, limit)
