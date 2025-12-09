{redditResults.map((post) => {
  const redditUrl = `https://www.reddit.com/r/${post.subreddit}/comments/${post.id}`;

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
        }}
      >
        r/{post.subreddit}
      </div>

      {/* 🔗 Clickable title that opens the Reddit post */}
      <h3
        style={{
          fontSize: "1rem",
          fontWeight: 600,
          marginBottom: 4,
        }}
      >
        <a
          href={redditUrl}
          target="_blank"
          rel="noreferrer"
          style={{ textDecoration: "underline", color: "#1d4ed8" }}
        >
          {post.title}
        </a>
      </h3>

      {/* Full selftext, not truncated */}
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
    </article>
  );
})}
