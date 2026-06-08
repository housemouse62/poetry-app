import { useState, useRef } from "react";
import { useFocusTrap } from "../../utils/useFocusTrap";
import html2canvas from "html2canvas";
import formatDate from "../../utils/formatDate";
import "./LimerickCard.css";
import { useAuth } from "../../context/AuthContext";

function LimerickCard({ limerick, onEdit, onDelete }) {
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadID, setDownloadID] = useState("");
  const dialogRef = useRef(null);
  const downloadTriggerRef = useRef(null);
  const [likeLimerickState, setLikeLimerickState] = useState(
    limerick.limerickLikes.length > 0,
  );
  const [favoriteLimerickState, setFavoriteLimerickState] = useState(
    limerick.isFavorited,
  );
  const [error, setError] = useState(null);
  const { token } = useAuth();

  useFocusTrap(dialogRef, showDownloadModal, () => setShowDownloadModal(false));

  const shareAsImage = async (limerickId) => {
    // Find the specific card element
    const cardElement = document.querySelector(
      `[data-limerick-id="${limerickId}"]`,
    );
    if (!cardElement) return;

    // hide buttons before screenshot
    const buttons = cardElement.querySelector(".limerick-card-buttons");
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
      link.download = "limerick.png";
      link.href = url;
      link.click();
    });
  };

  const handleLike = async () => {
    const url = `${import.meta.env.VITE_API_URL}/limerick/${limerick.id}/like`;
    const method = likeLimerickState ? "DELETE" : "POST";
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
        setLikeLimerickState(!likeLimerickState);
      } else setError("Cannot like. Please try again.");
    } catch (error) {
      if (import.meta.env.DEV) console.error(error);
      setError("Something went wrong. Please try again.");
    }
  };

  const handleFavorite = async (id) => {
    const url = `${import.meta.env.VITE_API_URL}/favorite/limerick/${id}`;
    const method = favoriteLimerickState ? "DELETE" : "POST";
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
        setFavoriteLimerickState(!favoriteLimerickState);
      } else setError("Cannot favorite. Please try again.");
    } catch (error) {
      if (import.meta.env.DEV) console.error(error);
      setError("Something went wrong. Please try again.");
    }
  };
  return (
    <>
      <article
        key={limerick.id}
        className="limerick-card"
        data-limerick-id={limerick.id}
      >
        <div className="card-top">
          <div className="card-top-left">
            <p className="limerick-title">{limerick.title}</p>
            <p className="limerick-line">{limerick.lineOne}</p>
            <p className="limerick-line">{limerick.lineTwo}</p>
            <p className="limerick-line">{limerick.lineThree}</p>
            <p className="limerick-line">{limerick.lineFour}</p>
            <p className="limerick-line">{limerick.lineFive}</p>
            <p className="limerick-date">{formatDate(limerick.createdAt)}</p>
          </div>
          <div className="card-top-right">
            <button
              className="favorite-button"
              aria-label="Favorite"
              onClick={() => {
                setFavoriteLimerickState(!favoriteLimerickState);
                handleFavorite(limerick.id);
              }}
            >
              {favoriteLimerickState ? "⭐" : "☆"}
            </button>
          </div>
        </div>
        <div className="limerick-card-buttons">
          <button
            aria-label={`Edit limerick: ${limerick.title}`}
            className="edit-limerick-btn"
            onClick={() => onEdit()}
          >
            Edit
          </button>
          <button
            aria-label={`Download limerick: ${limerick.title}`}
            className="download-limerick-btn"
            onClick={(e) => {
              downloadTriggerRef.current = e.currentTarget;
              setShowDownloadModal(true);
              setDownloadID(limerick.id);
            }}
          >
            Download
          </button>
          <button
            aria-label={`Delete limerick: ${limerick.title}`}
            className="delete-limerick-btn"
            onClick={() => {
              onDelete(limerick.id);
            }}
          >
            Delete
          </button>
          <button
            aria-label={`Like limerick: ${limerick.title}`}
            className="like-limerick-button"
            onClick={() => {
              handleLike(limerick.id);
            }}
          >
            {likeLimerickState ? "❤️" : "♡"}
          </button>
        </div>
      </article>
      {showDownloadModal && (
        <div
          className="limerick-dialog-container"
          onClick={() => {
            setShowDownloadModal(false);
            downloadTriggerRef.current?.focus();
          }}
        >
          <div
            className="limerick-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialogTitle"
            ref={dialogRef}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="dialogTitle">Confirm Download</h2>
            <div className="limerick-modal-button-row">
              <button
                className="confirm-limerick-button"
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
                className="cancel-limerick-button"
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
    </>
  );
}

export default LimerickCard;
