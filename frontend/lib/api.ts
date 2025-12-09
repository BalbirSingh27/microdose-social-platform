// frontend/lib/api.ts

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

async function getJson(path: string) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Request failed: ${res.status} ${text}`);
  }
  return res.json();
}

async function postJson(path: string, body: unknown) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Request failed: ${res.status} ${text}`);
  }
  return res.json();
}

export async function searchRedditPosts(keyword: string, limit = 100) {
  const q = encodeURIComponent(keyword);
  return getJson(`/supabase/reddit_posts/search?keyword=${q}&limit=${limit}`);
}

export async function searchTwitter(keyword: string, limit = 50) {
  const q = encodeURIComponent(keyword);
  return getJson(`/twitter/search?keyword=${q}&limit=${limit}`);
}

export async function searchInstagram(keyword: string, limit = 50) {
  const q = encodeURIComponent(keyword);
  return getJson(`/instagram/search?keyword=${q}&limit=${limit}`);
}

export async function searchFacebook(keyword: string, limit = 50) {
  const q = encodeURIComponent(keyword);
  return getJson(`/facebook/search?keyword=${q}&limit=${limit}`);
}

// 🔥 NEW: call the backend AI endpoint for reply suggestions
export async function generateReplySuggestion(post: {
  title: string;
  selftext?: string;
  subreddit?: string;
}) {
  return postJson(`/ai/reply-suggestion`, {
    title: post.title,
    selftext: post.selftext ?? "",
    subreddit: post.subreddit ?? null,
    platform: "reddit",
  });
}
