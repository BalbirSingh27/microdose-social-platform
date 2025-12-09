
def fetch_instagram_posts(keyword: str, limit: int = 50):
    """
    Demo Instagram data.
    """
    posts = []
    for i in range(min(limit, 10)):
        posts.append(
            {
                "id": f"ig_{i}",
                "author": f"demo_ig_user_{i}",
                "caption": f"Demo Instagram post about {keyword} #{i}",
                "likes": 20 + i,
                "url": f"https://instagram.com/p/DEMO{i}",
            }
        )
    return posts
