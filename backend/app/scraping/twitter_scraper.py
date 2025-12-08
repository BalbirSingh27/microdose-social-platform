import requests
from bs4 import BeautifulSoup

def fetch_twitter_posts(keyword: str, limit: int = 50):
    """
    Scrapes Twitter using Nitter public instances (no API key needed).
    """
    base_url = "https://nitter.net/search?f=tweets&q="
    url = f"{base_url}{keyword}"

    try:
        response = requests.get(url, timeout=10)
        soup = BeautifulSoup(response.text, "html.parser")

        tweets = []
        for tweet in soup.select(".timeline-item")[:limit]:
            content = tweet.select_one(".tweet-content")
            date = tweet.select_one(".tweet-date a")
            stats = tweet.select_one(".tweet-stats")

            tweets.append({
                "text": content.get_text(strip=True) if content else "",
                "date": date.get("title") if date else "",
                "likes": stats.select_one(".icon-heart + span").get_text(strip=True) if stats else "0",
                "retweets": stats.select_one(".icon-retweet + span").get_text(strip=True) if stats else "0",
                "replies": stats.select_one(".icon-comment + span").get_text(strip=True) if stats else "0",
            })

        return tweets

    except Exception as e:
        return [{"error": str(e)}]
