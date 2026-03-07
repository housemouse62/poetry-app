// HaikuApp.jsx
import { useState, useRef, useEffect } from "react";
import HaikuLine from "./HaikuLine";
import { countSyllables } from "../../utils/syllableCounter";
import "./HaikuApp.css";
import { saveHaiku, getAllHaikus, deleteHaiku } from "./haikuStorage";
import html2canvas from "html2canvas";
import { useNavigate } from "react-router";

function HaikuApp() {
  const navigate = useNavigate();

  const [lines, setLines] = useState({
    line1: "",
    line2: "",
    line3: "",
  });

  const [saved, setSaved] = useState(false);
  const [showHaikus, setShowHaikus] = useState(false);
  const [savedHaikus, setSavedHaikus] = useState("");
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadID, setDownloadID] = useState("");
  const [isFading, setIsFading] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const [syllableCounts, setSyllableCounts] = useState({
    line1: 0,
    line2: 0,
    line3: 0,
  });
  const targetSyllables = [5, 7, 5];
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!showDownloadModal) return;
    const dialog = dialogRef.current;
    const focusable = dialog
      ? Array.from(
          dialog.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          ),
        )
      : [];
    if (focusable.length) focusable[0].focus();
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowDownloadModal(false);
        return;
      }
      if (e.key === "Tab" && focusable.length) {
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showDownloadModal]);

  // Check if haiku is complete
  const isComplete =
    countSyllables(lines.line1) === 5 &&
    countSyllables(lines.line2) === 7 &&
    countSyllables(lines.line3) === 5;

  const fieldsEmpty =
    lines.line1 === "" && lines.line2 === "" && lines.line3 === "";

  const updateLine = (lineKey, value) => {
    setLines((prev) => ({
      ...prev,
      [lineKey]: value,
    }));
  };

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
    <div className="haiku-app">
      <main className="haiku-container">
        <aside>
          <button
            className="haiku-back"
            onClick={() => {
              navigate(-1);
            }}
          >
            dashboard
          </button>
        </aside>
        <header>
          <h1 className="haiku-h1">
            <span aria-hidden="true">🌸</span> Do You Do Haiku?{" "}
            <span aria-hidden="true">🪷</span>
          </h1>
          <p className="haiku-subtitle">
            Write a haiku following the 5-7-5 syllable pattern
          </p>
        </header>
        <HaikuLine
          lineNumber={1}
          targetSyllables={targetSyllables[0]}
          value={lines.line1}
          onChange={(value) => updateLine("line1", value)}
          onSyllableChange={(count) =>
            setSyllableCounts((prev) => ({ ...prev, line1: count }))
          }
        />
        <HaikuLine
          lineNumber={2}
          targetSyllables={targetSyllables[1]}
          value={lines.line2}
          onChange={(value) => updateLine("line2", value)}
          onSyllableChange={(count) =>
            setSyllableCounts((prev) => ({ ...prev, line2: count }))
          }
        />
        <HaikuLine
          lineNumber={3}
          targetSyllables={targetSyllables[2]}
          value={lines.line3}
          onChange={(value) => updateLine("line3", value)}
          onSyllableChange={(count) =>
            setSyllableCounts((prev) => ({ ...prev, line3: count }))
          }
        />
        {(isComplete || saved) && (
          <div
            className={`haiku-complete-message ${isFading ? "fade-out" : ""}`}
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {saved ? (
              <>
                <span aria-hidden="true">✨</span> Saved!{" "}
                <span aria-hidden="true">✨</span>
              </>
            ) : (
              <>
                <span aria-hidden="true">✨</span> You do haiku!{" "}
                <span aria-hidden="true">✨</span>
              </>
            )}
          </div>
        )}

        {/* button row */}
        <div className="haiku-button-row">
          {/* Save Button */}
          {!isComplete && !saved && (
            <span id="save-haiku-help" className="sr-only">
              Complete all three lines with correct syllable counts to save
            </span>
          )}
          <button
            disabled={!isComplete || saved}
            className="save-haikus-btn"
            aria-describedby={
              !isComplete && !saved ? "save-haiku-help" : undefined
            }
            onClick={() => {
              saveHaiku(lines);
              setSaved(true);
              setLines({
                line1: "",
                line2: "",
                line3: "",
              });
              setTimeout(() => {
                setIsFading(true); //Start Fade Out
                setTimeout(() => {
                  setSaved(false); //Actually remove it
                  setIsFading(false);
                }, 500);
              }, 2000);
              const newSavedHaikus = getAllHaikus();
              setSavedHaikus(newSavedHaikus);
            }}
          >
            Save
          </button>

          {/* View Haikus/Hide Haikus button */}
          <button
            className="view-haikus-btn"
            aria-expanded={showHaikus}
            onClick={() => {
              if (showHaikus) {
                setShowHaikus(false);
              } else {
                const newSavedHaikus = getAllHaikus();
                setSavedHaikus(newSavedHaikus);
                setShowHaikus(true);
                setShowExample(false);
              }
            }}
          >
            {showHaikus ? "Hide Saved Haikus" : "View Saved Haikus"}
          </button>

          {/* clear the fields button*/}
          <button
            disabled={fieldsEmpty}
            className="clear-haikus-btn"
            onClick={() => {
              setLines({
                line1: "",
                line2: "",
                line3: "",
              });
            }}
          >
            Clear
          </button>
        </div>
        <div className="show-haiku-example-div">
          <button
            className="show-haiku-example-button"
            aria-expanded={showExample}
            onClick={() => {
              if (showExample) {
                setShowExample(false);
              } else {
                setShowExample(true);
                setShowHaikus(false);
              }
            }}
          >
            {showExample ? "hide example" : "show example"}
          </button>
        </div>
        {/* Example Haikus Area */}
        {!showHaikus && showExample ? (
          <div className="example-haiku" key={`view-${showHaikus}`}>
            <div className="example-haiku-title">Example Haiku:</div>
            <div className="example-haiku-text">
              Do you do haiku (5)
              <br />
              Yes I do I do haiku (7)
              <br />I haiku for you (5)
            </div>
          </div>
        ) : showHaikus ? (
          <div className="savedHaikus" key={`view-${showHaikus}`}>
            <h2 className="savedHaikus-title">Saved Haikus</h2>
            {savedHaikus.length <= 0 ? (
              <p>No saved haikus, waiting for words of wisdom</p>
            ) : (
              savedHaikus.map((h) => (
                <article key={h.id} className="haiku-card" data-haiku-id={h.id}>
                  <p className="haiku-line">{h.line1}</p>
                  <p className="haiku-line">{h.line2}</p>
                  <p className="haiku-line">{h.line3}</p>

                  <div className="haiku-card-buttons">
                    <button
                      aria-label={`Download haiku: ${h.line1}`}
                      className="download-haiku-btn"
                      onClick={() => {
                        setShowDownloadModal(true);
                        setDownloadID(h.id);
                      }}
                    >
                      Download
                    </button>
                    <button
                      aria-label={`Delete haiku: ${h.line1}`}
                      className="delete-haiku-btn"
                      onClick={() => {
                        deleteHaiku(h.id);
                        const newSavedHaikus = getAllHaikus();
                        setSavedHaikus(newSavedHaikus);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        ) : null}
      </main>
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
                }}
              >
                Confirm
              </button>
              <button
                className="cancel-haiku-button"
                onClick={() => {
                  setShowDownloadModal(false);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HaikuApp;
