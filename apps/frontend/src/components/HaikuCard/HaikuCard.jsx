import { useState, useRef } from "react";
import { useFocusTrap } from "../../utils/useFocusTrap";
import html2canvas from "html2canvas";
import formatDate from "../../utils/formatDate";
import "./HaikuCard.css";
import { useAuth } from "../../context/AuthContext";

function HaikuCard({ haiku, onEdit, onDelete }) {
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [downloadID, setDownloadID] = useState("");
  const [deleteID, setDeleteID] = useState("");
  const dialogRef = useRef(null);
  const deleteDialogRef = useRef(null);
  const downloadTriggerRef = useRef(null);
  const [likeHaikuState, setLikeHaikuState] = useState(
    haiku.haikuLikes.length > 0,
  );
  const [favoriteHaikuState, setFavoriteHaikuState] = useState(
    haiku.isFavorited,
  );
  const [error, setError] = useState(null);
  const { token } = useAuth();

  useFocusTrap(dialogRef, showDownloadModal, () => setShowDownloadModal(false));
  useFocusTrap(deleteDialogRef, showDeleteModal, () =>
    setShowDeleteModal(false),
  );

  const shareAsImage = async (haikuId) => {
    // Find the specific card element
    const cardElement = document.querySelector(`[data-haiku-id="${haikuId}"]`);
    if (!cardElement) return;

    // hide buttons before screenshot
    const buttons = cardElement.querySelector(".haiku-card-buttons");
    const originalDisplay = buttons.style.display;
    buttons.style.display = "none";

    // save and remove background
    cardElement.style.backgroundColor = "rgb(212, 222, 231)";

    //convert to canvas - take screenshot w/ transparent background;
    const canvas = await html2canvas(cardElement, { backgroundColor: null });

    // show buttons & background again
    buttons.style.display = originalDisplay;

    //convert canvas to blob - download
    canvas.toBlob((blob) => {
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = "haiku.png";
      link.href = url;
      link.click();
    });
  };

  const handleLike = async () => {
    const url = `${import.meta.env.VITE_API_URL}/haiku/${haiku.id}/like`;
    const method = likeHaikuState ? "DELETE" : "POST";
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
        setLikeHaikuState(!likeHaikuState);
      } else setError("Cannot like. Please try again.");
    } catch (error) {
      if (import.meta.env.DEV) console.error(error);
      setError("Something went wrong. Please try again.");
    }
  };

  const handleFavorite = async (id) => {
    const url = `${import.meta.env.VITE_API_URL}/favorite/haiku/${id}`;
    const method = favoriteHaikuState ? "DELETE" : "POST";
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
        setFavoriteHaikuState(!favoriteHaikuState);
      } else setError("Cannot favorite. Please try again.");
    } catch (error) {
      if (import.meta.env.DEV) console.error(error);
      setError("Something went wrong, please try again");
    }
  };
  return (
    <>
      <article key={haiku.id} className="haiku-card" data-haiku-id={haiku.id}>
        <div className="card-top">
          <div className="card-top-left">
            <p className="haiku-title">{haiku.title}</p>
            <p className="haiku-line">{haiku.lineOne}</p>
            <p className="haiku-line">{haiku.lineTwo}</p>
            <p className="haiku-line">{haiku.lineThree}</p>
            <p className="haiku-date">{formatDate(haiku.createdAt)}</p>
          </div>
          <div className="card-top-right">
            <button
              className="favorite-button"
              aria-pressed={favoriteHaikuState}
              aria-label={
                favoriteHaikuState
                  ? `Removie ${haiku.title} from favorites`
                  : `Add ${haiku.title} to favorites`
              }
              onClick={() => {
                setFavoriteHaikuState(!favoriteHaikuState);
                handleFavorite(haiku.id);
              }}
            >
              {favoriteHaikuState ? "⭐" : "☆"}
            </button>
          </div>
        </div>
        <div className="haiku-card-buttons">
          <button
            aria-label={`Edit haiku: ${haiku.title}`}
            className="edit-haiku-btn"
            onClick={() => onEdit()}
          >
            Edit
          </button>
          <button
            aria-label={`Download haiku: ${haiku.title}`}
            className="download-haiku-btn"
            onClick={(e) => {
              downloadTriggerRef.current = e.currentTarget;
              setShowDownloadModal(true);
              setDownloadID(haiku.id);
            }}
          >
            Download
          </button>
          <button
            aria-label={`Delete haiku: ${haiku.title}`}
            className="delete-haiku-btn"
            onClick={() => {
              setShowDeleteModal(true);
              setDeleteID(haiku.id);
            }}
          >
            Delete
          </button>
          <button
            aria-pressed={likeHaikuState}
            aria-label={
              likeHaikuState
                ? `Unlike haiku: ${haiku.title}`
                : `Like haiku: ${haiku.title}`
            }
            className="like-haiku-button"
            onClick={() => {
              handleLike(haiku.id);
            }}
          >
            {likeHaikuState ? "❤️" : "♡"}
          </button>
        </div>
      </article>
      {showDownloadModal && (
        <div
          className="haiku-dialog-container"
          onClick={() => {
            setShowDownloadModal(false);
            downloadTriggerRef.current?.focus();
          }}
        >
          <div
            className="haiku-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialogTitle"
            ref={dialogRef}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="dialogTitle">Confirm Download</h2>
            <div className="haiku-modal-button-row">
              <button
                className="confirm-haiku-button"
                onClick={() => {
                  shareAsImage(downloadID);
                  setShowDownloadModal(false);
                  setDownloadID("");
                  downloadTriggerRef.current?.focus();
                }}
              >
                Confirm
              </button>
              <button
                className="cancel-haiku-button"
                onClick={() => {
                  setShowDownloadModal(false);
                  downloadTriggerRef.current?.focus();
                }}
              >
                Cancel
              </button>
              {error && (
                <p className="error-message" role="alert">
                  {error}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      {showDeleteModal && (
        <div
          className="haiku-dialog-container"
          onClick={() => {
            setShowDeleteModal(false);
          }}
        >
          <div
            className="haiku-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialogTitle"
            ref={deleteDialogRef}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="dialogTitle">Confirm Delete</h2>
            <div className="haiku-modal-button-row">
              <button
                className="confirm-haiku-button"
                onClick={() => {
                  setShowDeleteModal(false);
                  onDelete(deleteID);
                  setDeleteID("");
                }}
              >
                Confirm
              </button>
              <button
                className="cancel-haiku-button"
                onClick={() => {
                  setShowDeleteModal(false);
                }}
              >
                Cancel
              </button>
              {error && (
                <p className="error-message" role="alert">
                  {error}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default HaikuCard;
