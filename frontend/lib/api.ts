
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL is not set");
}

// ---- Reddit ----
export async function searchRedditPosts(keyword: string, limit = 100) {
  const params = new URLSearchParams({ keyword, limit: String(limit) });

  const res = await fetch(
    `${API_BASE_URL}/supabase/reddit_posts/search?${params.toString()}`
  );

  if (!res.ok) {
    throw new Error(`Reddit API error: ${res.status}`);
  }

  // backend returns: { keyword, results: [...] }
  return res.json();
}

// ---- Twitter ----
export async function searchTwitter(keyword: string, limit = 50) {
  const params = new URLSearchParams({ keyword, limit: String(limit) });

  const res = await fetch(`${API_BASE_URL}/twitter/search?${params.toString()}`);

  if (!res.ok) {
    throw new Error(`Twitter API error: ${res.status}`);
  }

  return res.json(); // { platform, keyword, results: [...] }
}

// ---- Instagram ----
export async function searchInstagram(keyword: string, limit = 50) {
  const params = new URLSearchParams({ keyword, limit: String(limit) });

  const res = await fetch(
    `${API_BASE_URL}/instagram/search?${params.toString()}`
  );

  if (!res.ok) {
    throw new Error(`Instagram API error: ${res.status}`);
  }

  return res.json();
}

// ---- Facebook ----
export async function searchFacebook(keyword: string, limit = 50) {
  const params = new URLSearchParams({ keyword, limit: String(limit) });

  const res = await fetch(
    `${API_BASE_URL}/facebook/search?${params.toString()}`
  );

  if (!res.ok) {
    throw new Error(`Facebook API error: ${res.status}`);
  }

  return res.json();
}
