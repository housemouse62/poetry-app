import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/useAuth";
import formatDate from "../../utils/formatDate";
import "./CommentCard.css";

function InteractionItem({
  item,
  kind,
  poemType,
  onUpdated,
  onDeleted,
  deleteFallbackRef,
}) {
  const { token, user } = useAuth();
  const bodyField = kind === "comment" ? "commentbody" : "replybody";
  const likesField = kind === "comment" ? "commentLikes" : "replyLikes";
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item[bodyField]);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [editPending, setEditPending] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [likePending, setLikePending] = useState(false);
  const [liked, setLiked] = useState(item[likesField]?.length > 0);
  const [likeCount, setLikeCount] = useState(item._count?.[likesField] ?? 0);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("");
  const [previousDraftItem, setPreviousDraftItem] = useState(item);
  const [previousLikeItem, setPreviousLikeItem] = useState(item);
  const editButtonRef = useRef(null);
  const editInputRef = useRef(null);
  const deleteButtonRef = useRef(null);
  const deleteCancelRef = useRef(null);
  const likeButtonRef = useRef(null);
  const restoreEditFocusRef = useRef(false);
  const restoreDeleteFocusRef = useRef(false);
  const restoreLikeFocusRef = useRef(false);
  const latestItemRef = useRef(item);
  const resource = `${poemType}${kind}`;
  const authorName = item.author.screenname;
  const isAuthor = item.authorID === user?.id;
  const itemLiked = item[likesField]?.length > 0;
  const itemLikeCount = item._count?.[likesField] ?? 0;

  useEffect(() => {
    latestItemRef.current = item;
  }, [item]);

  if (!editing && item !== previousDraftItem) {
    setPreviousDraftItem(item);
    setDraft(item[bodyField]);
  }

  if (!likePending && item !== previousLikeItem) {
    setPreviousLikeItem(item);
    setLiked(itemLiked);
    setLikeCount(itemLikeCount);
  }

  useEffect(() => {
    if (editing) {
      editInputRef.current?.focus();
    } else if (restoreEditFocusRef.current) {
      restoreEditFocusRef.current = false;
      editButtonRef.current?.focus();
    }
  }, [editing]);

  useEffect(() => {
    if (confirmingDelete) {
      deleteCancelRef.current?.focus();
    } else if (restoreDeleteFocusRef.current) {
      restoreDeleteFocusRef.current = false;
      deleteButtonRef.current?.focus();
    }
  }, [confirmingDelete]);

  useEffect(() => {
    if (!likePending && restoreLikeFocusRef.current) {
      restoreLikeFocusRef.current = false;
      likeButtonRef.current?.focus();
    }
  }, [likePending]);

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

  const saveEdit = async (event) => {
    event.preventDefault();
    const trimmedDraft = draft.trim();
    if (!trimmedDraft || trimmedDraft === item[bodyField] || editPending) return;
    setEditPending(true);
    setError(null);
    setStatus("");
    try {
      const updated = await request(
        `${import.meta.env.VITE_API_URL}/${resource}/${item.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ [bodyField]: trimmedDraft }),
        },
      );
      onUpdated({ ...latestItemRef.current, ...updated });
      setDraft(updated[bodyField]);
      restoreEditFocusRef.current = true;
      setEditing(false);
      setStatus(`${kind === "comment" ? "Comment" : "Reply"} updated.`);
    } catch (requestError) {
      if (import.meta.env.DEV) console.error(requestError);
      setError(`Cannot update this ${kind}. Please try again.`);
    } finally {
      setEditPending(false);
    }
  };

  const cancelEdit = () => {
    setDraft(item[bodyField]);
    restoreEditFocusRef.current = true;
    setEditing(false);
    setError(null);
  };

  const deleteItem = async () => {
    if (deletePending) return;
    setDeletePending(true);
    setError(null);
    setStatus("");
    try {
      await request(`${import.meta.env.VITE_API_URL}/${resource}/${item.id}`, {
        method: "DELETE",
      });
      onDeleted(item.id);
      deleteFallbackRef.current?.focus();
    } catch (requestError) {
      if (import.meta.env.DEV) console.error(requestError);
      setError(`Cannot delete this ${kind}. Please try again.`);
      setDeletePending(false);
    }
  };

  const toggleLike = async () => {
    if (likePending) return;
    restoreLikeFocusRef.current = document.activeElement === likeButtonRef.current;
    setLikePending(true);
    setError(null);
    setStatus("");
    try {
      const result = await request(
        `${import.meta.env.VITE_API_URL}/${resource}/${item.id}/like`,
        { method: liked ? "DELETE" : "POST" },
      );
      const nextLiked = !liked;
      const latestItem = latestItemRef.current;
      const latestLiked = latestItem[likesField]?.length > 0;
      const latestLikeCount = latestItem._count?.[likesField] ?? 0;
      const nextLikeCount =
        latestLikeCount +
        (latestLiked === nextLiked ? 0 : nextLiked ? 1 : -1);
      setLiked(nextLiked);
      setLikeCount(nextLikeCount);
      onUpdated({
        ...latestItem,
        [likesField]: nextLiked ? [{ id: result.id }] : [],
        _count: { ...latestItem._count, [likesField]: nextLikeCount },
      });
    } catch (requestError) {
      if (import.meta.env.DEV) console.error(requestError);
      setError(`Cannot update this ${kind} like. Please try again.`);
    } finally {
      setLikePending(false);
    }
  };

  const label = `${kind} by ${authorName}`;

  return (
    <div className={kind === "comment" ? "comment-content" : "reply-card"}>
      {editing ? (
        <form className="interaction-edit-form" onSubmit={saveEdit}>
          <label htmlFor={`edit-${resource}-${item.id}`}>Edit {label}</label>
          <textarea
            id={`edit-${resource}-${item.id}`}
            ref={editInputRef}
            value={draft}
            maxLength={600}
            disabled={editPending}
            onChange={(event) => setDraft(event.target.value)}
          />
          <button
            type="submit"
            disabled={
              !draft.trim() || draft.trim() === item[bodyField] || editPending
            }
          >
            {editPending ? "Saving…" : "Save"}
          </button>
          <button type="button" disabled={editPending} onClick={cancelEdit}>
            Cancel
          </button>
        </form>
      ) : (
        <p>{item[bodyField]}</p>
      )}
      <p className="comment-meta">
        ~ {authorName} · {formatDate(item.createdAt)}
      </p>
      <div className="comment-actions">
        <button
          type="button"
          ref={likeButtonRef}
          aria-pressed={liked}
          aria-label={`${liked ? "Unlike" : "Like"} ${label}`}
          disabled={likePending || deletePending}
          onClick={toggleLike}
        >
          {liked ? "Unlike" : "Like"}
        </button>
        <span aria-live="polite">
          {likeCount} {likeCount === 1 ? "like" : "likes"}
        </span>
        {isAuthor && (
          <>
            <button
              type="button"
              ref={editButtonRef}
              aria-label={`Edit ${label}`}
              disabled={editing || confirmingDelete || deletePending}
              onClick={() => {
                setError(null);
                setEditing(true);
              }}
            >
              Edit
            </button>
            <button
              type="button"
              ref={deleteButtonRef}
              aria-label={`Delete ${label}`}
              aria-expanded={confirmingDelete}
              disabled={editing || confirmingDelete || deletePending}
              onClick={() => {
                setError(null);
                setConfirmingDelete(true);
              }}
            >
              Delete
            </button>
          </>
        )}
      </div>
      {confirmingDelete && (
        <div
          className="delete-confirmation"
          role="group"
          aria-label={`Confirm deletion of ${label}`}
        >
          <p>Delete this {kind}?</p>
          <button
            type="button"
            disabled={deletePending}
            onClick={deleteItem}
          >
            {deletePending ? "Deleting…" : "Confirm delete"}
          </button>
          <button
            type="button"
            ref={deleteCancelRef}
            disabled={deletePending}
            onClick={() => {
              restoreDeleteFocusRef.current = true;
              setConfirmingDelete(false);
            }}
          >
            Cancel delete
          </button>
        </div>
      )}
      {error && (
        <p className="interaction-error" role="alert">
          {error}
        </p>
      )}
      <p className="sr-only" role="status">
        {status}
      </p>
    </div>
  );
}

function CommentCard({
  comment,
  poemType,
  onCommentUpdated,
  onCommentDeleted,
  commentInputRef,
}) {
  const { token } = useAuth();
  const [replies, setReplies] = useState([]);
  const [replyCount, setReplyCount] = useState(comment._count.reply);
  const [showReplies, setShowReplies] = useState(false);
  const [repliesLoaded, setRepliesLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("");
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
      <InteractionItem
        item={comment}
        kind="comment"
        poemType={poemType}
        onUpdated={onCommentUpdated}
        onDeleted={onCommentDeleted}
        deleteFallbackRef={commentInputRef}
      />
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
              <InteractionItem
                item={reply}
                kind="reply"
                poemType={poemType}
                key={reply.id}
                onUpdated={(updatedReply) =>
                  setReplies((current) =>
                    current.map((item) =>
                      item.id === updatedReply.id ? updatedReply : item,
                    ),
                  )
                }
                onDeleted={(replyID) => {
                  setReplies((current) =>
                    current.filter((item) => item.id !== replyID),
                  );
                  setReplyCount((current) => Math.max(0, current - 1));
                  setStatus("Reply deleted.");
                }}
                deleteFallbackRef={replyInputRef}
              />
            ))}
          <p className="sr-only" role="status">
            {status}
          </p>
        </div>
      )}
    </div>
  );
}

export default CommentCard;
