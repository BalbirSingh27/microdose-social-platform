const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

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

// Optional: helpers for Week 2
export async function searchTwitter(keyword: string, limit = 50) {
  const params = new URLSearchParams({ keyword, limit: String(limit) });
  const res = await fetch(
    `${API_BASE_URL}/twitter/search?${params.toString()}`
  );
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function searchInstagram(keyword: string, limit = 50) {
  const params = new URLSearchParams({ keyword, limit: String(limit) });
  const res = await fetch(
    `${API_BASE_URL}/instagram/search?${params.toString()}`
  );
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function searchFacebook(keyword: string, limit = 50) {
  const params = new URLSearchParams({ keyword, limit: String(limit) });
  const res = await fetch(
    `${API_BASE_URL}/facebook/search?${params.toString()}`
  );
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
