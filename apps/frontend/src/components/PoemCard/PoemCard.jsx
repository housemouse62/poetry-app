import { useEffect, useRef, useState } from "react";
import formatDate from "../../utils/formatDate";
import "./PoemCard.css";
import { useAuth } from "../../context/useAuth";
import CommentCard from "../CommentCard/CommentCard";
import { authenticatedJsonRequest } from "../../utils/authenticatedJsonRequest";

function PoemCard({ poem, poemType, favoriteButtonRef, onFavoriteChange }) {
  const { token } = useAuth();
  const [liked, setLiked] = useState(
    poem.haikuLikes?.length > 0 || poem.limerickLikes?.length > 0,
  );
  const [favorited, setFavorited] = useState(Boolean(poem.isFavorited));
  const [likeCount, setLikeCount] = useState(
    poemType === "haiku" ? poem._count.haikuLikes : poem._count.limerickLikes,
  );
  const [commentCount, setCommentCount] = useState(poem._count.comments);
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [likePending, setLikePending] = useState(false);
  const [favoritePending, setFavoritePending] = useState(false);
  const [error, setError] = useState(null);
  const [commentStatus, setCommentStatus] = useState("");
  const commentInputRef = useRef(null);
  const likeButtonRef = useRef(null);
  const likeRequestStartedRef = useRef(false);
  const commentsRequestRef = useRef({ id: 0, controller: null });
  const mountedRef = useRef(true);
  const commentsID = `comments-${poemType}-${poem.id}`;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      commentsRequestRef.current.id += 1;
      commentsRequestRef.current.controller?.abort();
    };
  }, []);

  useEffect(() => {
    if (!likePending && likeRequestStartedRef.current) {
      likeRequestStartedRef.current = false;
      likeButtonRef.current?.focus();
    }
  }, [likePending]);

  const request = async (url, options = {}) => {
    return authenticatedJsonRequest(url, token, options);
  };

  const handleLike = async () => {
    if (likePending) return;
    likeRequestStartedRef.current = true;
    setLikePending(true);
    setError(null);
    try {
      await request(
        `${import.meta.env.VITE_API_URL}/${poemType}/${poem.id}/like`,
        { method: liked ? "DELETE" : "POST" },
      );
      if (!mountedRef.current) return;
      setLiked((current) => !current);
      setLikeCount((current) => current + (liked ? -1 : 1));
    } catch (requestError) {
      if (!mountedRef.current) return;
      if (import.meta.env.DEV) console.error(requestError);
      setError("Cannot update this like. Please try again.");
    } finally {
      if (mountedRef.current) setLikePending(false);
    }
  };

  const handleFavorite = async () => {
    if (favoritePending) return;
    const nextFavorited = !favorited;
    setFavoritePending(true);
    setError(null);
    try {
      await request(
        `${import.meta.env.VITE_API_URL}/favorite/${poemType}/${poem.id}`,
        {
          method: favorited ? "DELETE" : "POST",
          ...(favorited
            ? {}
            : { body: JSON.stringify({ privacy: "private" }) }),
        },
      );
      if (!mountedRef.current) return;
      setFavorited(nextFavorited);
      onFavoriteChange?.(nextFavorited);
    } catch (requestError) {
      if (!mountedRef.current) return;
      if (import.meta.env.DEV) console.error(requestError);
      setError("Cannot update this favorite. Please try again.");
    } finally {
      if (mountedRef.current) setFavoritePending(false);
    }
  };

  const loadComments = async () => {
    commentsRequestRef.current.controller?.abort();
    const controller = new AbortController();
    const requestID = commentsRequestRef.current.id + 1;
    commentsRequestRef.current = { id: requestID, controller };
    setCommentsLoading(true);
    setError(null);
    try {
      const result = await request(
        `${import.meta.env.VITE_API_URL}/${poemType}comment/${poem.id}`,
        { signal: controller.signal },
      );
      if (commentsRequestRef.current.id !== requestID) return false;
      setComments(result);
      setCommentCount(result.length);
      setCommentsLoaded(true);
      return true;
    } catch (requestError) {
      if (requestError.name === "AbortError") return false;
      if (commentsRequestRef.current.id !== requestID) return false;
      if (import.meta.env.DEV) console.error(requestError);
      setError("Cannot load comments. Please try again.");
      return false;
    } finally {
      if (commentsRequestRef.current.id === requestID) {
        commentsRequestRef.current.controller = null;
        setCommentsLoading(false);
      }
    }
  };

  const toggleComments = () => {
    const opening = !showComments;
    setShowComments(opening);
    if (opening && !commentsLoaded) {
      loadComments();
    } else if (!opening && commentsLoading) {
      commentsRequestRef.current.id += 1;
      commentsRequestRef.current.controller?.abort();
      commentsRequestRef.current.controller = null;
      setCommentsLoading(false);
    }
  };

  const createComment = async (event) => {
    event.preventDefault();
    const trimmedComment = commentBody.trim();
    if (!trimmedComment || commentSubmitting) return;

    setCommentSubmitting(true);
    setError(null);
    try {
      await request(
        `${import.meta.env.VITE_API_URL}/${poemType}comment/${poem.id}`,
        {
          method: "POST",
          body: JSON.stringify({ commentbody: trimmedComment }),
        },
      );
      if (!mountedRef.current) return;
      setCommentBody("");
      await loadComments();
      if (!mountedRef.current) return;
      commentInputRef.current?.focus();
    } catch (requestError) {
      if (!mountedRef.current) return;
      if (import.meta.env.DEV) console.error(requestError);
      setError("Cannot add your comment. Please try again.");
    } finally {
      if (mountedRef.current) setCommentSubmitting(false);
    }
  };

  return (
    <div className="poem-feed-item">
      <article
        className="poetry-card"
        data-poem-id={poem.id}
        aria-labelledby={`poem-title-${poemType}-${poem.id}`}
      >
        <div className="poetry-card-top">
          <div className="poetry-card-top-left">
            <h2
              className="poetry-title"
              id={`poem-title-${poemType}-${poem.id}`}
            >
              {poem.title}
            </h2>
            <p className="poetry-line">{poem.lineOne}</p>
            <p className="poetry-line">{poem.lineTwo}</p>
            <p className="poetry-line">{poem.lineThree}</p>
            {poem.lineFour && <p className="poetry-line">{poem.lineFour}</p>}
            {poem.lineFive && <p className="poetry-line">{poem.lineFive}</p>}
            <p className="poetry-user">~ {poem.screenname}</p>
            <p className="poetry-date">{formatDate(poem.createdAt)}</p>
          </div>
          <div className="poetry-card-top-right">
            <button
              ref={favoriteButtonRef}
              type="button"
              className="favorite-button"
              aria-pressed={favorited}
              aria-label={
                favorited
                  ? `Remove ${poem.title} from favorites`
                  : `Add ${poem.title} to favorites`
              }
              disabled={favoritePending}
              onClick={handleFavorite}
            >
              {favorited ? "⭐" : "☆"}
            </button>
          </div>
        </div>

        <div className="poetry-card-buttons">
          <button
            ref={likeButtonRef}
            type="button"
            aria-pressed={liked}
            aria-label={liked ? `Unlike poem: ${poem.title}` : `Like poem: ${poem.title}`}
            className="like-poetry-button"
            disabled={likePending}
            onClick={handleLike}
          >
            {liked ? "❤️" : "♡"}
          </button>
          <span aria-live="polite">
            {likeCount} {likeCount === 1 ? "like" : "likes"}
          </span>
          <button
            type="button"
            className="comment-count-button"
            aria-expanded={showComments}
            aria-controls={commentsID}
            onClick={toggleComments}
          >
            {showComments ? "Hide" : "Show"} {commentCount}{" "}
            {commentCount === 1 ? "comment" : "comments"}
          </button>
        </div>

        {error && (
          <p className="interaction-error" role="alert">
            {error}
          </p>
        )}
      </article>

      {showComments && (
        <section
          className="comments-area"
          id={commentsID}
          aria-label={`Comments on ${poem.title}`}
        >
          <form className="comment-form" onSubmit={createComment}>
            <label htmlFor={`comment-input-${poemType}-${poem.id}`}>
              Add a comment
            </label>
            <textarea
              id={`comment-input-${poemType}-${poem.id}`}
              ref={commentInputRef}
              value={commentBody}
              maxLength={600}
              onChange={(event) => setCommentBody(event.target.value)}
            />
            <button
              type="submit"
              disabled={!commentBody.trim() || commentSubmitting}
            >
              {commentSubmitting ? "Posting…" : "Post comment"}
            </button>
          </form>

          {commentsLoading && <p role="status">Loading comments…</p>}
          {!commentsLoading && commentsLoaded && comments.length === 0 && (
            <p>No comments yet. Start the conversation.</p>
          )}
          {!commentsLoading &&
            comments.map((comment) => (
              <CommentCard
                comment={comment}
                poemType={poemType}
                key={comment.id}
                commentInputRef={commentInputRef}
                onCommentUpdated={(updatedComment) =>
                  setComments((current) =>
                    current.map((item) =>
                      item.id === updatedComment.id ? updatedComment : item,
                    ),
                  )
                }
                onCommentDeleted={(commentID) => {
                  setComments((current) =>
                    current.filter((item) => item.id !== commentID),
                  );
                  setCommentCount((current) => Math.max(0, current - 1));
                  setCommentStatus("Comment deleted.");
                }}
              />
            ))}
          <p className="sr-only" role="status">
            {commentStatus}
          </p>
        </section>
      )}

      <hr className="poetry-divider" />
    </div>
  );
}

export default PoemCard;
