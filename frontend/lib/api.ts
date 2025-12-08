const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

async function doGet(path: string) {
  const res = await fetch(`${API_BASE_URL}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function searchRedditPosts(keyword: string, limit = 100) {
  const params = new URLSearchParams({ keyword, limit: String(limit) });
  return doGet(`/supabase/reddit_posts/search?${params.toString()}`);
}

export async function searchTwitter(keyword: string, limit = 50) {
  const params = new URLSearchParams({ keyword, limit: String(limit) });
  return doGet(`/twitter/search?${params.toString()}`);
}

export async function searchInstagram(keyword: string, limit = 50) {
  const params = new URLSearchParams({ keyword, limit: String(limit) });
  return doGet(`/instagram/search?${params.toString()}`);
}

export async function searchFacebook(keyword: string, limit = 50) {
  const params = new URLSearchParams({ keyword, limit: String(limit) });
  return doGet(`/facebook/search?${params.toString()}`);
}
