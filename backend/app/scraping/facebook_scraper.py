import requests
from bs4 import BeautifulSoup

def fetch_facebook_posts(keyword: str, limit: int = 50):
    """
    PUBLIC Facebook search scraper using Bing indexing.
    """
    search_url = f"https://www.bing.com/search?q=site:facebook.com+{keyword}"

    try:
        response = requests.get(search_url, timeout=10)
        soup = BeautifulSoup(response.text, "html.parser")

        posts = []
        for result in soup.select("li.b_algo")[:limit]:
            title = result.select_one("h2").get_text(strip=True)
            link = result.select_one("a")["href"]

            posts.append({
                "title": title,
                "url": link,
            })

        return posts
    except Exception as e:
        return [{"error": str(e)}]
