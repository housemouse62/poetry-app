import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

function CommentCard({ comment, poemType }) {
  const [replies, setReplies] = useState([]);
  const [showReplies, setShowReplies] = useState(false);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  const getReplies = async (commentID) => {
    const repliesUrl = `${import.meta.env.VITE_API_URL}/${poemType}reply/${commentID}`;
    try {
      const replyResponse = await fetch(repliesUrl, {
        method: "GET",
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const nextReplyResponse = await replyResponse.json();
      console.log(nextReplyResponse);
      if (replyResponse.ok) {
        setReplies(nextReplyResponse);
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error(error);
      setError("Something went wrong, please try again");
    }
  };
  return (
    <>
      <p>{comment.commentbody}</p>
      <p>{comment.author.screenname}</p>
      {comment._count.reply > 0 && (
        <>
          <button
            className="comment-count"
            onClick={() => {
              !showReplies && getReplies(comment.id);
              {
                setShowReplies(!showReplies);
              }
            }}
          >
            {comment._count.reply}{" "}
            {comment._count.reply === 1 ? "reply" : "replies"}
          </button>
          <div className="replies">
            {replies.map((r) => (
              <div key={r.id}>
                <p>{r.replybody}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

export default CommentCard;
