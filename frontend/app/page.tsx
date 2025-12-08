"use client";

import { useState } from "react";
import {
  searchRedditPosts,
  searchTwitter,
  searchInstagram,
  searchFacebook,
} from "../lib/api";

type RedditPost = {
  id: string;
  title: string;
  selftext: string;
  subreddit: string;
  created_utc?: string;
};

export default function HomePage() {
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);

  const [redditResults, setRedditResults] = useState<RedditPost[]>([]);
  const [twitterResults, setTwitterResults] = useState<any[]>([]);
  const [instagramResults, setInstagramResults] = useState<any[]>([]);
  const [facebookResults, setFacebookResults] = useState<any[]>([]);

  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const k = keyword.trim();
    if (!k) return;

    setLoading(true);
    setError(null);

    try {
      // 🔥 Call all 4 backends with the SAME keyword
      const [reddit, twitter, instagram, facebook] = await Promise.all([
        searchRedditPosts(k, 100),
        searchTwitter(k, 50),
        searchInstagram(k, 50),
        searchFacebook(k, 50),
      ]);

      setRedditResults(reddit.results || reddit || []);
      setTwitterResults(twitter.results || []);
      setInstagramResults(instagram.results || []);
      setFacebookResults(facebook.results || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "1rem" }}>
        MCRDSE – Reddit Keyword Search
      </h1>

      <p style={{ marginBottom: "1rem" }}>
        Enter a keyword like <strong>“microdosing”</strong>,{" "}
        <strong>“psilocybin”</strong>, or <strong>“magic mushrooms”</strong> to
        search Reddit (and demo Twitter / Instagram / Facebook).
      </p>

      <form
        onSubmit={handleSearch}
        style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}
      >
        <input
          type="text"
          placeholder="Enter keyword to search posts…"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={{
            flex: 1,
            padding: "0.75rem 1rem",
            borderRadius: 6,
            border: "1px solid #ccc",
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "0.75rem 1.5rem",
            borderRadius: 6,
            border: "none",
            background: "#020617",
            color: "white",
            cursor: "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {error && (
        <div
          style={{
            marginBottom: "1rem",
            padding: "0.75rem 1rem",
            borderRadius: 6,
            background: "#fee2e2",
            color: "#b91c1c",
          }}
        >
          {error}
        </div>
      )}

      {/* Reddit results */}
      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: 8 }}>
          Reddit Results ({redditResults.length})
        </h2>

        {redditResults.length === 0 ? (
          <p style={{ color: "#6b7280" }}>
            No Reddit posts for this keyword yet.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "0.75rem",
              gridTemplateColumns: "1fr",
            }}
          >
            {redditResults.map((post) => (
              <article
                key={post.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: "0.75rem 1rem",
                  background: "white",
                }}
              >
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#6b7280",
                    marginBottom: 4,
                  }}
                >
                  r/{post.subreddit}
                </div>
                <h3
                  style={{
                    fontSize: "1rem",
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  {post.title}
                </h3>
                {post.selftext && (
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "#4b5563",
                      maxHeight: "4.5rem",
                      overflow: "hidden",
                    }}
                  >
                    {post.selftext}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Simple headers for the other platforms (demo data for now) */}
      <section style={{ marginBottom: "1rem" }}>
        <h3
          style={{
            fontSize: "1rem",
            fontWeight: 600,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>Twitter</span>
          <span style={{ color: "#2563eb" }}>
            {twitterResults.length} results
          </span>
        </h3>
      </section>

      <section style={{ marginBottom: "1rem" }}>
        <h3
          style={{
            fontSize: "1rem",
            fontWeight: 600,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>Instagram</span>
          <span style={{ color: "#dc2626" }}>
            {instagramResults.length} results
          </span>
        </h3>
      </section>

      <section style={{ marginBottom: "1rem" }}>
        <h3
          style={{
            fontSize: "1rem",
            fontWeight: 600,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>Facebook</span>
          <span style={{ color: "#2563eb" }}>
            {facebookResults.length} results
          </span>
        </h3>
      </section>
    </main>
  );
}
