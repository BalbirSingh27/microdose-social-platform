
def fetch_facebook_posts(keyword: str, limit: int = 50):
    """
    Demo Facebook data.
    """
    posts = []
    for i in range(min(limit, 10)):
        posts.append(
            {
                "id": f"fb_{i}",
                "page": f"Demo FB Page {i}",
                "message": f"Demo Facebook post about {keyword} #{i}",
                "reactions": 5 + i,
                "url": f"https://facebook.com/demo_page_{i}/posts/{2000 + i}",
            }
        )
    return posts
