"use client";

import React, { useState } from "react";
import {
  searchRedditPosts,
  searchTwitter,
  searchInstagram,
  searchFacebook,
  generateReplySuggestion,
} from "../lib/api";

type RedditPost = {
  id: string;
  title: string;
  selftext: string;
  subreddit: string;
  created_utc?: string;
  score?: number;
  num_comments?: number;
};

type TwitterPost = {
  id: string;
  author?: string;
  text?: string;
  likes?: number;
  url?: string;
  created_at?: string;
};

type InstagramPost = {
  id: string;
  username?: string;
  caption?: string;
  likes?: number;
  url?: string;
  created_at?: string;
};

type FacebookPost = {
  id: string;
  page?: string;
  message?: string;
  reactions?: number;
  url?: string;
  created_at?: string;
};

function getSocialText(post: any): string {
  return post.text || post.caption || post.message || "";
}

export default function HomePage() {
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);

  const [redditResults, setRedditResults] = useState<RedditPost[]>([]);
  const [twitterResults, setTwitterResults] = useState<TwitterPost[]>([]);
  const [instagramResults, setInstagramResults] = useState<InstagramPost[]>([]);
  const [facebookResults, setFacebookResults] = useState<FacebookPost[]>([]);

  const [error, setError] = useState<string | null>(null);

  // reply drafts + submitted state for Reddit
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [submittedReplies, setSubmittedReplies] = useState<
    Record<string, boolean>
  >({});

  // per-post AI loading state for the "Generate suggestion" button
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});

  // ------------------------------------------------------------
  // Search across all 4 platforms
  // ------------------------------------------------------------
  async function handleSearch(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const k = keyword.trim();
    if (!k) return;

    setLoading(true);
    setError(null);

    try {
      const [reddit, twitter, instagram, facebook] = await Promise.all([
        searchRedditPosts(k, 100),
        searchTwitter(k, 50),
        searchInstagram(k, 50),
        searchFacebook(k, 50),
      ]);

      setRedditResults((reddit.results || reddit || []) as RedditPost[]);
      setTwitterResults((twitter.results || []) as TwitterPost[]);
      setInstagramResults((instagram.results || []) as InstagramPost[]);
      setFacebookResults((facebook.results || []) as FacebookPost[]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  // ------------------------------------------------------------
  // Reply helpers
  // ------------------------------------------------------------
  function handleChangeReply(postId: string, value: string) {
    setReplyDrafts((prev) => ({ ...prev, [postId]: value }));
  }

  // 🔥 NEW: use backend AI endpoint to generate suggestion
  async function handleGenerateSuggestion(post: RedditPost) {
    // don’t overwrite if user already typed something
    if (replyDrafts[post.id]) return;

    setError(null);
    setAiLoading((prev) => ({ ...prev, [post.id]: true }));

    try {
      const res = await generateReplySuggestion({
        title: post.title,
        selftext: post.selftext,
        subreddit: post.subreddit,
        platform: "reddit",
      });

      const suggestion =
        (res && (res.suggestion || res.data?.suggestion)) || "";

      if (!suggestion) {
        setError("AI did not return a suggestion. Please try again.");
        return;
      }

      setReplyDrafts((prev) => ({
        ...prev,
        [post.id]: suggestion,
      }));
    } catch (err: any) {
      console.error("AI suggestion error", err);
      setError("Could not generate suggestion. Please try again.");
    } finally {
      setAiLoading((prev) => {
        const copy = { ...prev };
        delete copy[post.id];
        return copy;
      });
    }
  }

  function handleSubmitReply(post: RedditPost) {
    const draft = replyDrafts[post.id]?.trim();
    if (!draft) return;

    // For now: just mark as submitted + log to console (no external posting)
    console.log("Submitted reply for Reddit post", {
      postId: post.id,
      subreddit: post.subreddit,
      title: post.title,
      reply: draft,
    });

    setSubmittedReplies((prev) => ({ ...prev, [post.id]: true }));
  }

  // ------------------------------------------------------------
  // UI
  // ------------------------------------------------------------
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "1rem" }}>
        MCRDSE – Social Listening & Reply Helper
      </h1>

      <p style={{ marginBottom: "1rem" }}>
        Enter a keyword like <strong>“microdosing”</strong>,{" "}
        <strong>“psilocybin”</strong>, or <strong>“magic mushrooms”</strong> to
        search Reddit (and demo Twitter / Instagram / Facebook), then draft
        replies directly in this dashboard.
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

      {/* Reddit results + reply helper */}
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
            {redditResults.map((post) => {
              const redditPostUrl = `https://www.reddit.com/r/${post.subreddit}/comments/${post.id}`;
              const draft = replyDrafts[post.id] || "";
              const isAILoading = !!aiLoading[post.id];

              return (
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
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <a
                      href={`https://www.reddit.com/r/${post.subreddit}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ textDecoration: "underline" }}
                    >
                      r/{post.subreddit}
                    </a>
                    <a
                      href={redditPostUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        fontSize: "0.75rem",
                        textDecoration: "underline",
                      }}
                    >
                      View on Reddit
                    </a>
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
                        whiteSpace: "pre-wrap",
                        marginBottom: "0.5rem",
                      }}
                    >
                      {post.selftext}
                    </p>
                  )}

                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "#6b7280",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {typeof post.score === "number" && (
                      <span style={{ marginRight: "0.75rem" }}>
                        🔼 {post.score} score
                      </span>
                    )}
                    {typeof post.num_comments === "number" && (
                      <span>💬 {post.num_comments} comments</span>
                    )}
                  </div>

                  {/* Reply helper */}
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.9rem",
                          fontWeight: 500,
                        }}
                      >
                        Suggested reply
                      </span>
                      <button
                        type="button"
                        onClick={() => handleGenerateSuggestion(post)}
                        disabled={isAILoading}
                        style={{
                          fontSize: "0.75rem",
                          padding: "0.25rem 0.5rem",
                          borderRadius: 4,
                          border: "1px solid #e5e7eb",
                          background: isAILoading ? "#e5e7eb" : "#f9fafb",
                          cursor: isAILoading ? "default" : "pointer",
                        }}
                      >
                        {isAILoading ? "Generating…" : "Generate suggestion"}
                      </button>
                    </div>

                    <textarea
                      value={draft}
                      onChange={(e) =>
                        handleChangeReply(post.id, e.target.value)
                      }
                      placeholder="Type or generate a reply that you can copy & paste into Reddit…"
                      style={{
                        width: "100%",
                        minHeight: 80,
                        fontSize: "0.85rem",
                        padding: "0.5rem",
                        borderRadius: 6,
                        border: "1px solid #d1d5db",
                        marginBottom: 4,
                        resize: "vertical",
                      }}
                    />

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleSubmitReply(post)}
                        style={{
                          fontSize: "0.85rem",
                          padding: "0.35rem 0.85rem",
                          borderRadius: 4,
                          border: "none",
                          background: "#0f766e",
                          color: "white",
                          cursor: "pointer",
                        }}
                      >
                        Submit reply (save in dashboard)
                      </button>

                      {submittedReplies[post.id] && (
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "#16a34a",
                          }}
                        >
                          ✅ Reply saved – copy & paste into Reddit
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Twitter */}
      <section style={{ marginBottom: "1.5rem" }}>
        <h3
          style={{
            fontSize: "1rem",
            fontWeight: 600,
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 6,
          }}
        >
          <span>Twitter</span>
          <span style={{ color: "#2563eb" }}>
            {twitterResults.length} results
          </span>
        </h3>

        {twitterResults.length === 0 ? (
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
            No Twitter posts fetched for this keyword yet.
          </p>
        ) : (
          <div style={{ display: "grid", gap: "0.5rem" }}>
            {twitterResults.map((tw) => (
              <article
                key={tw.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: "0.5rem 0.75rem",
                  background: "white",
                }}
              >
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "#6b7280",
                    marginBottom: 4,
                  }}
                >
                  {tw.author || "@unknown"}
                  {tw.created_at &&
                    ` · ${new Date(tw.created_at).toLocaleString()}`}
                </div>
                <p
                  style={{
                    fontSize: "0.875rem",
                    marginBottom: 4,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {getSocialText(tw)}
                </p>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#6b7280",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>
                    {typeof tw.likes === "number" ? `❤️ ${tw.likes}` : ""}
                  </span>
                  {tw.url && (
                    <a
                      href={tw.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ textDecoration: "underline" }}
                    >
                      View on X/Twitter
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Instagram */}
      <section style={{ marginBottom: "1.5rem" }}>
        <h3
          style={{
            fontSize: "1rem",
            fontWeight: 600,
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 6,
          }}
        >
          <span>Instagram</span>
          <span style={{ color: "#dc2626" }}>
            {instagramResults.length} results
          </span>
        </h3>

        {instagramResults.length === 0 ? (
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
            No Instagram posts fetched for this keyword yet.
          </p>
        ) : (
          <div style={{ display: "grid", gap: "0.5rem" }}>
            {instagramResults.map((ig) => (
              <article
                key={ig.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: "0.5rem 0.75rem",
                  background: "white",
                }}
              >
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "#6b7280",
                    marginBottom: 4,
                  }}
                >
                  {ig.username || "@unknown"}
                  {ig.created_at &&
                    ` · ${new Date(ig.created_at).toLocaleString()}`}
                </div>
                <p
                  style={{
                    fontSize: "0.875rem",
                    marginBottom: 4,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {getSocialText(ig)}
                </p>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#6b7280",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>
                    {typeof ig.likes === "number" ? `❤️ ${ig.likes}` : ""}
                  </span>
                  {ig.url && (
                    <a
                      href={ig.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ textDecoration: "underline" }}
                    >
                      View on Instagram
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Facebook */}
      <section style={{ marginBottom: "1.5rem" }}>
        <h3
          style={{
            fontSize: "1rem",
            fontWeight: 600,
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 6,
          }}
        >
          <span>Facebook</span>
          <span style={{ color: "#2563eb" }}>
            {facebookResults.length} results
          </span>
        </h3>

        {facebookResults.length === 0 ? (
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
            No Facebook posts fetched for this keyword yet.
          </p>
        ) : (
          <div style={{ display: "grid", gap: "0.5rem" }}>
            {facebookResults.map((fb) => (
              <article
                key={fb.id}
                style={{
                  border: "1px solid "#e5e7eb",
                  borderRadius: 8,
                  padding: "0.5rem 0.75rem",
                  background: "white",
                }}
              >
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "#6b7280",
                    marginBottom: 4,
                  }}
                >
                  {fb.page || "FB Page"}
                  {fb.created_at &&
                    ` · ${new Date(fb.created_at).toLocaleString()}`}
                </div>
                <p
                  style={{
                    fontSize: "0.875rem",
                    marginBottom: 4,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {getSocialText(fb)}
                </p>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#6b7280",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>
                    {typeof fb.reactions === "number"
                      ? `👍 ${fb.reactions} reactions`
                      : ""}
                  </span>
                  {fb.url && (
                    <a
                      href={fb.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ textDecoration: "underline" }}
                    >
                      View on Facebook
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
