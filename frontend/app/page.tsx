'use client';

import { useEffect, useState } from 'react';

type RedditPost = {
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
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

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
