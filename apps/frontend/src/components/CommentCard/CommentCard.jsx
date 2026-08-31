import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/useAuth";
import formatDate from "../../utils/formatDate";
import "./CommentCard.css";

function CommentCard({ comment, poemType }) {
  const { token } = useAuth();
  const [replies, setReplies] = useState([]);
  const [replyCount, setReplyCount] = useState(comment._count.reply);
  const [showReplies, setShowReplies] = useState(false);
  const [repliesLoaded, setRepliesLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [error, setError] = useState(null);
  const replyInputRef = useRef(null);
  const repliesRequestRef = useRef({ id: 0, controller: null });
  const mountedRef = useRef(true);
  const repliesID = `replies-${poemType}-${comment.id}`;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      repliesRequestRef.current.id += 1;
      repliesRequestRef.current.controller?.abort();
    };
  }, []);

  const request = async (url, options = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Request failed");
    return result;
  };

  const loadReplies = async () => {
    repliesRequestRef.current.controller?.abort();
    const controller = new AbortController();
    const requestID = repliesRequestRef.current.id + 1;
    repliesRequestRef.current = { id: requestID, controller };
    setLoading(true);
    setError(null);
    try {
      const result = await request(
        `${import.meta.env.VITE_API_URL}/${poemType}reply/${comment.id}`,
        { signal: controller.signal },
      );
      if (repliesRequestRef.current.id !== requestID) return false;
      setReplies(result);
      setReplyCount(result.length);
      setRepliesLoaded(true);
      return true;
    } catch (requestError) {
      if (requestError.name === "AbortError") return false;
      if (repliesRequestRef.current.id !== requestID) return false;
      if (import.meta.env.DEV) console.error(requestError);
      setError("Cannot load replies. Please try again.");
      return false;
    } finally {
      if (repliesRequestRef.current.id === requestID) {
        repliesRequestRef.current.controller = null;
        setLoading(false);
      }
    }
  };

  const toggleReplies = () => {
    const opening = !showReplies;
    setShowReplies(opening);
    if (opening && !repliesLoaded) {
      loadReplies();
    } else if (!opening && loading) {
      repliesRequestRef.current.id += 1;
      repliesRequestRef.current.controller?.abort();
      repliesRequestRef.current.controller = null;
      setLoading(false);
    }
  };

  const createReply = async (event) => {
    event.preventDefault();
    const trimmedReply = replyBody.trim();
    if (!trimmedReply || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      await request(
        `${import.meta.env.VITE_API_URL}/${poemType}reply/${comment.id}/replies`,
        {
          method: "POST",
          body: JSON.stringify({ replybody: trimmedReply }),
        },
      );
      if (!mountedRef.current) return;
      setReplyBody("");
      await loadReplies();
      if (!mountedRef.current) return;
      replyInputRef.current?.focus();
    } catch (requestError) {
      if (!mountedRef.current) return;
      if (import.meta.env.DEV) console.error(requestError);
      setError("Cannot add your reply. Please try again.");
    } finally {
      if (mountedRef.current) setSubmitting(false);
    }
  };

  return (
    <div className="comment-card">
      <p>{comment.commentbody}</p>
      <p className="comment-meta">
        ~ {comment.author.screenname} · {formatDate(comment.createdAt)}
      </p>
      <button
        type="button"
        className="reply-count-button"
        aria-expanded={showReplies}
        aria-controls={repliesID}
        onClick={toggleReplies}
      >
        {showReplies ? "Hide" : "Show"} {replyCount}{" "}
        {replyCount === 1 ? "reply" : "replies"}
      </button>

      {error && (
        <p className="interaction-error" role="alert">
          {error}
        </p>
      )}

      {showReplies && (
        <div className="replies" id={repliesID}>
          <form className="reply-form" onSubmit={createReply}>
            <label htmlFor={`reply-input-${poemType}-${comment.id}`}>
              Add a reply
            </label>
            <textarea
              id={`reply-input-${poemType}-${comment.id}`}
              ref={replyInputRef}
              value={replyBody}
              maxLength={600}
              onChange={(event) => setReplyBody(event.target.value)}
            />
            <button type="submit" disabled={!replyBody.trim() || submitting}>
              {submitting ? "Posting…" : "Post reply"}
            </button>
          </form>

          {loading && <p role="status">Loading replies…</p>}
          {!loading && repliesLoaded && replies.length === 0 && (
            <p>No replies yet.</p>
          )}
          {!loading &&
            replies.map((reply) => (
              <div className="reply-card" key={reply.id}>
                <p>{reply.replybody}</p>
                <p className="comment-meta">
                  ~ {reply.author.screenname} · {formatDate(reply.createdAt)}
                </p>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

export default CommentCard;
