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

/**
 * Local “AI-like” suggestion generator.
 * No OpenAI, no external API call, no env keys needed.
 */
export async function generateReplySuggestion(post: {
  title: string;
  selftext?: string;
  subreddit?: string;
}): Promise<{ suggestion: string }> {
  const cleanBody = (post.selftext || "").replace(/\s+/g, " ").trim();
  const snippet =
    cleanBody.length > 220 ? cleanBody.slice(0, 220).trim() + "…" : cleanBody;

  const subredditPart = post.subreddit
    ? ` in r/${post.subreddit}`
    : "";

  const bodyPart = snippet
    ? ` From what you shared — “${snippet}” — it sounds like you’re being thoughtful about your experience and how it affects your day-to-day life.`
    : "";

  const suggestion = [
    `Hey, thanks for opening up about "${post.title}"${subredditPart}.`,
    bodyPart,
    ` I’m not able to give medical or legal advice, but it could really help to keep tracking how you feel over time and, if you can, speak with a qualified professional who understands mental health and/or psychedelic use.`,
    ` Either way, you’re not alone in exploring this and it’s great that you’re seeking more information.`
  ]
    .join(" ")
    .trim();

  return { suggestion };
}
