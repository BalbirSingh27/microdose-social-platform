"use client";

import { useState } from "react";
import {
  searchRedditPosts,
  searchTwitter,
  searchInstagram,
  searchFacebook,
} from "../lib/api"; // if this path breaks, change to "@/lib/api"

type AnyPost = any;

export default function HomePage() {
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [redditResults, setRedditResults] = useState<AnyPost[]>([]);
  const [twitterResults, setTwitterResults] = useState<AnyPost[]>([]);
  const [instagramResults, setInstagramResults] = useState<AnyPost[]>([]);
  const [facebookResults, setFacebookResults] = useState<AnyPost[]>([]);

  async function handleSearch() {
    const k = keyword.trim();
    if (!k) return;

    setLoading(true);
    setError(null);

    try {
      // 🔥 One keyword → 4 platforms
      const [reddit, twitter, instagram, facebook] = await Promise.all([
        searchRedditPosts(k, 100),
        searchTwitter(k, 50),
        searchInstagram(k, 50),
        searchFacebook(k, 50),
      ]);

      setRedditResults(reddit.results || []);
      setTwitterResults(twitter.results || []);
      setInstagramResults(instagram.results || []);
      setFacebookResults(facebook.results || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      handleSearch();
    }
  }

  return (
    <main style={{ padding: "2rem", maxWidth: 1200, margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 600, marginBottom: "1rem" }}>
        MCRDSE – Reddit Keyword Search
      </h1>
      <p style={{ marginBottom: "1rem", color: "#555" }}>
        Enter a keyword like <strong>“microdosing”</strong>,{" "}
        <strong>“psilocybin”</strong>, or <strong>“magic mushrooms”</strong> to
        search Reddit (and demo Twitter / Instagram / Facebook).
      </p>

      {/* Search bar */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <input
          type="text"
          placeholder="Enter keyword to search posts…"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
            padding: "0.75rem 1rem",
            borderRadius: 6,
            border: "1px solid #ccc",
          }}
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          style={{
            padding: "0.75rem 1.25rem",
            borderRadius: 6,
            border: "none",
            backgroundColor: "#111827",
            color: "white",
            cursor: "pointer",
            fontWeight: 500,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </div>

      {error && (
        <div
          style={{
            marginBottom: "1rem",
            padding: "0.75rem 1rem",
            borderRadius: 6,
            backgroundColor: "#fee2e2",
            color: "#b91c1c",
          }}
        >
          {error}
        </div>
      )}

      {/* Reddit results */}
      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>
          Reddit Results ({redditResults.length})
        </h2>
        {redditResults.length === 0 ? (
          <p style={{ color: "#555" }}>No Reddit posts for this keyword yet.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "1rem",
            }}
          >
            {redditResults.map((post: any) => (
              <article
                key={post.id || post.url}
                style={{
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  padding: "1rem",
                  backgroundColor: "white",
                }}
              >
                <div
                  style={{
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    color: "#6b7280",
                    marginBottom: "0.25rem",
                  }}
                >
                  r/{post.subreddit || "unknown"}
                </div>
                <h3
                  style={{
                    fontSize: "1rem",
                    fontWeight: 600,
                    marginBottom: "0.5rem",
                  }}
                >
                  {post.title || "Untitled post"}
                </h3>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "#4b5563",
                    marginBottom: "0.5rem",
                  }}
                >
                  {(post.selftext || "").slice(0, 160)}
                  {post.selftext && post.selftext.length > 160 ? "…" : ""}
                </p>
                <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                  Score: {post.score ?? 0} · Comments: {post.num_comments ?? 0}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Simple counts for other platforms (demo) */}
      <section style={{ display: "grid", gap: "1rem" }}>
        <PlatformSummary
          name="Twitter"
          count={twitterResults.length}
          color="#1DA1F2"
        />
        <PlatformSummary
          name="Instagram"
          count={instagramResults.length}
          color="#E1306C"
        />
        <PlatformSummary
          name="Facebook"
          count={facebookResults.length}
          color="#1877F2"
        />
      </section>
    </main>
  );
}

function PlatformSummary({
  name,
  count,
  color,
}: {
  name: string;
  count: number;
  color: string;
}) {
  return (
    <div
      style={{
        borderRadius: 8,
        border: "1px solid #e5e7eb",
        padding: "0.75rem 1rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "white",
      }}
    >
      <span style={{ fontWeight: 500 }}>{name}</span>
      <span style={{ color }}>
        {count} {count === 1 ? "result" : "results"}
      </span>
    </div>
  );
}
