'use client';

import { useEffect, useState } from 'react';

type RedditPost = {"use client";

import { useState } from "react";

type RedditPost = {
  id: string;
  title?: string;
  selftext?: string;
  subreddit?: string;
  url?: string;
  created_utc?: string | number;
  score?: number;
  num_comments?: number;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://mcrdse-api.onrender.com";

function formatDate(value: string | number | undefined) {
  if (!value) return "";
  // created_utc might be a unix timestamp or ISO string
  try {
    const d =
      typeof value === "number"
        ? new Date(value * 1000)
        : new Date(value as string);
    return d.toLocaleString();
  } catch {
    return String(value);
  }
}

export default function HomePage() {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<RedditPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = keyword.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const res = await fetch(
        `${API_BASE_URL}/supabase/reddit_posts/search?keyword=${encodeURIComponent(
          trimmed
        )}`
      );

      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }

      const data = await res.json();
      setResults((data && data.results) || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-8 md:px-10 lg:px-20">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Microdose Social Listening – Reddit Keyword Search
        </h1>
        <p className="text-sm text-gray-600 max-w-2xl">
          Type any keyword (e.g. <b>“microdosing”</b>, <b>“psilocybin”</b>,
          <b>“anxiety”</b>) to filter Reddit posts stored in Supabase and see
          only the posts that match.
        </p>
      </header>

      {/* Search bar */}
      <form
        onSubmit={handleSearch}
        className="mb-6 flex flex-col gap-3 md:flex-row md:items-center"
      >
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Enter keyword to search Reddit posts…"
          className="flex-1 rounded-xl border px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={loading || !keyword.trim()}
          className="rounded-xl border px-5 py-2 font-semibold md:w-auto disabled:opacity-60"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-xl border px-4 py-3 text-sm">
          Error: {error}
        </div>
      )}

      {/* No results message */}
      {hasSearched && !loading && results.length === 0 && !error && (
        <p className="text-sm text-gray-500">
          No results found for <span className="font-semibold">{keyword}</span>.
        </p>
      )}

      {/* Results grid */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {results.map((post) => (
          <article key={post.id} className="rounded-2xl border p-4">
            <div className="mb-1 text-xs uppercase tracking-wide text-gray-500">
              {post.subreddit ? `r/${post.subreddit}` : "Reddit"}
            </div>

            <h2 className="mb-2 text-sm font-semibold">
              {post.title || "(No title)"}
            </h2>

            {post.selftext && (
              <p className="mb-2 text-sm line-clamp-4">{post.selftext}</p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
              {post.score !== undefined && <span>⬆ {post.score}</span>}
              {post.num_comments !== undefined && (
                <span>💬 {post.num_comments} comments</span>
              )}
              <span>{formatDate(post.created_utc)}</span>
            </div>

            {post.url && (
              <a
                href={post.url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-xs underline"
              >
                View on Reddit
              </a>
            )}
          </article>
        ))}
      </section>
    </main>
  );
}

  id: string;
  title: string;
  selftext: string | null;
  subreddit: string;
  score: number | null;
  num_comments: number | null;
  created_at?: string;
  created_utc?: string | null;
};

type SubredditInsight = {
  subreddit: string;
  postCount: number;
  totalScore: number;
  totalComments: number;
};

// Base URL for backend API
const API_BASE_URL = "https://mcrdse-api.onrender.com";


/**
 * Aggregate subreddit-level insights from raw posts
 */
function computeSubredditInsights(posts: RedditPost[]): SubredditInsight[] {
  const bySubreddit: Record<string, SubredditInsight> = {};

  for (const p of posts) {
    const key = p.subreddit || 'unknown';

    if (!bySubreddit[key]) {
      bySubreddit[key] = {
        subreddit: key,
        postCount: 0,
        totalScore: 0,
        totalComments: 0,
      };
    }

    bySubreddit[key].postCount += 1;
    bySubreddit[key].totalScore += p.score ?? 0;
    bySubreddit[key].totalComments += p.num_comments ?? 0;
  }

  // Convert to array and sort by totalScore (you can change to postCount or comments)
  return Object.values(bySubreddit)
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 5); // Top 5
}

export default function Home() {
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await fetch(
          `${API_BASE_URL}/supabase/reddit_posts?limit=50`,
          {
            cache: 'no-store', // good for dev
          }
        );

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`API ${res.status}: ${text}`);
        }

        const data = await res.json();
        setPosts(data);
      } catch (err: any) {
        console.error('Error loading posts', err);
        setError(err.message ?? 'Failed to fetch posts');
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, []);

  if (loading) {
    return <main className="p-8">Loading posts…</main>;
  }

  if (error) {
    return (
      <main className="p-8">
        <p className="text-red-600 font-semibold">Error: {error}</p>
      </main>
    );
  }

  const subredditInsights = computeSubredditInsights(posts);
  const queryLabel = 'ai automation'; // optional static label for now

  return (
    <main className="p-8 space-y-8">
      <header>
        <h1 className="text-2xl font-bold mb-1">
          Reddit posts from Supabase
        </h1>
        <p className="text-sm text-gray-600">
          Query: <span className="font-mono">{queryLabel}</span> • Total posts:{' '}
          {posts.length}
        </p>
      </header>

      {/* Influencer Insights Section */}
      <section>
        <h2 className="text-xl font-semibold mb-3">Influencer Insights</h2>
        {subredditInsights.length === 0 ? (
          <p className="text-sm text-gray-600">No insights available yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-3 py-2 text-left">Subreddit</th>
                  <th className="border px-3 py-2 text-right">Posts</th>
                  <th className="border px-3 py-2 text-right">Total Score</th>
                  <th className="border px-3 py-2 text-right">
                    Total Comments
                  </th>
                </tr>
              </thead>
              <tbody>
                {subredditInsights.map((s) => (
                  <tr key={s.subreddit}>
                    <td className="border px-3 py-2">
                      r/{s.subreddit || 'unknown'}
                    </td>
                    <td className="border px-3 py-2 text-right">
                      {s.postCount}
                    </td>
                    <td className="border px-3 py-2 text-right">
                      {s.totalScore}
                    </td>
                    <td className="border px-3 py-2 text-right">
                      {s.totalComments}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Social Feed */}
      <section>
        <h2 className="text-xl font-semibold mb-3">Social Feed</h2>

        {posts.length === 0 && <p>No posts found.</p>}

        <ul className="space-y-4">
          {posts.map((p) => (
            <li key={p.id} className="border rounded p-4">
              <h3 className="font-semibold">{p.title}</h3>
              {p.selftext && (
                <p className="mt-2 text-sm text-gray-700">{p.selftext}</p>
              )}
              <p className="mt-2 text-xs text-gray-500">
                r/{p.subreddit} • score {p.score ?? 0} • comments{' '}
                {p.num_comments ?? 0}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
