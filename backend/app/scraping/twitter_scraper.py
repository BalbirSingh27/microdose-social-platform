
def fetch_twitter_posts(keyword: str, limit: int = 50):
    """
    Demo Twitter data. In a real version, this would call the Twitter API.
    """
    posts = []
    for i in range(min(limit, 10)):
        posts.append(
            {
                "id": f"tw_{i}",
                "author": f"@demo_user_{i}",
                "text": f"Demo tweet about {keyword} #{i}",
                "likes": 10 + i,
                "url": f"https://twitter.com/demo_user_{i}/status/{1000 + i}",
            }
        )
    return posts
