  async function handleGenerateSuggestion(post: RedditPost) {
    // If there is already a draft, don't overwrite the user text
    if (replyDrafts[post.id]) return;

    // Show temporary "Generating..." text
    setReplyDrafts((prev) => ({
      ...prev,
      [post.id]: "Generating reply suggestion…",
    }));

    try {
      const suggestion = await generateReplySuggestion({
        title: post.title,
        selftext: post.selftext,
        subreddit: post.subreddit,
        platform: "reddit",
      });

      setReplyDrafts((prev) => ({
        ...prev,
        [post.id]: suggestion,
      }));
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate AI suggestion.");
      setReplyDrafts((prev) => ({
        ...prev,
        [post.id]:
          "Sorry, something went wrong while generating a suggestion. Please type your reply manually.",
      }));
    }
  }
