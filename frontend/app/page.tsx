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

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? 'http://127.0.0.1:8000';
  
export default function Home() {
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await fetch(`${API_BASE}/supabase/reddit_posts?limit=20`, {
          // Don't cache in dev
          cache: 'no-store',
        });

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

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">
        Reddit posts from Supabase
      </h1>

      {posts.length === 0 && <p>No posts found.</p>}

      <ul className="space-y-4">
        {posts.map((p) => (
          <li key={p.id} className="border rounded p-4">
            <h2 className="font-semibold">{p.title}</h2>
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
    </main>
  );
}
