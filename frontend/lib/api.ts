const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

// Search by keyword (used by the search bar)
export async function searchRedditPosts(keyword: string, limit = 100) {
  const params = new URLSearchParams({ keyword, limit: String(limit) });
  const res = await fetch(
    `${API_BASE_URL}/supabase/reddit_posts/search?${params.toString()}`
  );

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json(); // { keyword, results: [...] }
}

// Get latest posts without keyword (if you need it)
export async function getRedditPosts(limit = 100) {
  const params = new URLSearchParams({ limit: String(limit) });
  const res = await fetch(
    `${API_BASE_URL}/supabase/reddit_posts?${params.toString()}`
  );
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}
