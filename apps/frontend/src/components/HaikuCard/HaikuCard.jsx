import { useState, useRef } from "react";
import { useFocusTrap } from "../../utils/useFocusTrap";
import html2canvas from "html2canvas";

function HaikuCard({ haiku, onEdit, onDelete }) {
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadID, setDownloadID] = useState("");
  const dialogRef = useRef(null);
  const downloadTriggerRef = useRef(null);

  useFocusTrap(dialogRef, showDownloadModal, () => setShowDownloadModal(false));

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

  return (
    <>
      <article key={haiku.id} className="haiku-card" data-haiku-id={haiku.id}>
        <p className="haiku-title">{haiku.title}</p>
        <p className="haiku-line">{haiku.lineOne}</p>
        <p className="haiku-line">{haiku.lineTwo}</p>
        <p className="haiku-line">{haiku.lineThree}</p>
        <p className="haiku-date">{haiku.createdAt}</p>

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
              onDelete(haiku.id);
            }}
          >
            Delete
          </button>
        </div>
      </article>
      {showDownloadModal && (
        <div className="haiku-dialog-container">
          <div
            className="haiku-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialogTitle"
            ref={dialogRef}
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
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default HaikuCard;
