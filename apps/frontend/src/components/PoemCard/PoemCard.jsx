import { useState, useRef } from "react";
import { useFocusTrap } from "../../utils/useFocusTrap";
import html2canvas from "html2canvas";
import formatDate from "../../utils/formatDate";
import "./PoemCard.css";
import { useAuth } from "../../context/AuthContext";
import CommentCard from "../CommentCard/CommentCard";

function PoemCard({ poem, poemType }) {
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const dialogRef = useRef(null);
  const [likePoemState, setLikePoemState] = useState(
    poem.haikuLikes?.length > 0 || poem.limerickLikes?.length > 0,
  );
  const [favoritePoemState, setFavoritePoemState] = useState(poem.isFavorited);
  const [error, setError] = useState(null);
  const { token } = useAuth();
  const [likeCount, setLikeCount] = useState(
    poemType === "haiku" ? poem._count.haikuLikes : poem._count.limerickLikes,
  );
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);

  useFocusTrap(dialogRef, showDownloadModal, () => setShowDownloadModal(false));

  const handleLike = async (poemType, poemID) => {
    const url = `${import.meta.env.VITE_API_URL}/${poemType}/${poemID}/like`;
    const method = likePoemState ? "DELETE" : "POST";
    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      await response.json();

      if (response.ok) {
        setLikePoemState(!likePoemState);
        setLikeCount(likePoemState ? likeCount - 1 : likeCount + 1);
      } else setError("Cannot like. Please try again.");
    } catch (error) {
      if (import.meta.env.DEV) console.error(error);
      setError("Something went wrong. Please try again.");
    }
  };

  const handleFavorite = async (poemType, poemID) => {
    const url = `${import.meta.env.VITE_API_URL}/favorite/${poemType}/${poemID}`;
    const method = favoritePoemState ? "DELETE" : "POST";
    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      await response.json();

      if (response.ok) {
        setFavoritePoemState(!favoritePoemState);
      } else setError("Cannot favorite. Please try again.");
    } catch (error) {
      if (import.meta.env.DEV) console.error(error);
      setError("Something went wrong, please try again");
    }
  };

  const getComments = async (poemType, poemID) => {
    const commentUrl = `${import.meta.env.VITE_API_URL}/${poemType}comment/${poemID}`;
    try {
      const response = await fetch(commentUrl, {
        method: "GET",
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const nextresponse = await response.json();
      console.log(nextresponse);
      if (response.ok) {
        setComments(nextresponse);
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error(error);
      setError("Something went wrong, please try again");
    }
  };
  return (
    <>
      <div>
        <article className="poetry-card" data-poem-id={poem.id}>
          <div className="poetry-card-top">
            <div className="poetry-card-top-left">
              <p className="poetry-title">{poem.title}</p>
              <p className="poetry-line">{poem.lineOne}</p>
              <p className="poetry-line">{poem.lineTwo}</p>
              <p className="poetry-line">{poem.lineThree}</p>
              {poem.lineFour && <p className="poetry-line">{poem.lineFour}</p>}
              {poem.lineFive && <p className="poetry-line">{poem.lineFive}</p>}
              <p className="poetry-user">{poem.screenname}</p>
              <p className="poetry-date">{formatDate(poem.createdAt)}</p>
              {likeCount > 0 && (
                <span>
                  {likeCount} {likeCount === 1 ? "like" : "likes"}
                </span>
              )}
              {poem._count.comments > 0 && (
                <button
                  className="comment-count"
                  onClick={() => {
                    !showComments && getComments(poem.poemType, poem.id);
                    {
                      setShowComments(!showComments);
                    }
                  }}
                >
                  {poem._count.comments}{" "}
                  {poem._count.comments === 1 ? "comment" : "comments"}
                </button>
              )}
            </div>
            <div className="card-top-right">
              <button
                className="favorite-button"
                aria-pressed={favoritePoemState}
                aria-label={
                  favoritePoemState
                    ? `Remove ${poem.title} from favorites`
                    : `Add ${poem.title} to favorites`
                }
                onClick={() => {
                  handleFavorite(poemType, poem.id);
                }}
              >
                {favoritePoemState ? "⭐" : "☆"}
              </button>
            </div>
          </div>
          <div className="haiku-card-buttons">
            <button
              aria-pressed={likePoemState}
              aria-label={
                likePoemState
                  ? `Unlike haiku: ${poem.title}`
                  : `Like haiku: ${poem.title}`
              }
              className="like-haiku-button"
              onClick={() => {
                handleLike(poem.poemType, poem.id);
              }}
            >
              {likePoemState ? "❤️" : "♡"}
            </button>
          </div>
        </article>
        {showComments ? (
          <div className="comments-area">
            {comments.map((c) => (
              <CommentCard comment={c} poemType={poem.poemType} key={c.id} />
            ))}
          </div>
        ) : (
          ""
        )}
        <div className="horiz-line-bottom">
          <hr />
        </div>
      </div>
    </>
  );
}

export default PoemCard;
