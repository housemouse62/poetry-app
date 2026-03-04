// LimerickApp.jsx
import { useState, useRef, useEffect } from "react";
import LimerickLine from "./LimerickLine";
import { countSyllables } from "./syllableCounter";
import "./LimerickApp.css";
import {
  saveLimerick,
  getAllLimericks,
  deleteLimerick,
} from "./limericksStorage";
import html2canvas from "html2canvas";
import { useNavigate } from "react-router";

function LimerickApp() {
  const navigate = useNavigate();

  const [lines, setLines] = useState({
    line1: "",
    line2: "",
    line3: "",
    line4: "",
    line5: "",
  });

  const [saved, setSaved] = useState(false);
  const [showLimericks, setShowLimericks] = useState(false);
  const [savedLimericks, setSavedLimericks] = useState("");
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadID, setDownloadID] = useState("");
  const [isFading, setIsFading] = useState(false);
  const [showExample, setShowExample] = useState(false);

  const targetSyllables = [7, 7, 5, 5, 7];
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

  // Check if Limericks is complete
  const isComplete =
    countSyllables(lines.line1) > 6 &&
    countSyllables(lines.line2) > 6 &&
    countSyllables(lines.line3) > 4 &&
    countSyllables(lines.line4) > 4 &&
    countSyllables(lines.line5) > 6;

  const fieldsEmpty =
    lines.line1 === "" &&
    lines.line2 === "" &&
    lines.line3 === "" &&
    lines.line4 === "" &&
    lines.line5 === "";

  const updateLine = (lineKey, value) => {
    setLines((prev) => ({
      ...prev,
      [lineKey]: value,
    }));
  };

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
      link.download = "Limericks.png";
      link.href = url;
      link.click();
    });
  };

  return (
    <div className="limerick-app">
      <main className="limerick-container">
        <aside>
          <button
            className="limerick-back"
            onClick={() => {
              navigate(-1);
            }}
          >
            dashboard
          </button>
        </aside>
        <header>
          <h1 className="limerick-h1"><span aria-hidden="true">🎭</span> Let's Limerick! <span aria-hidden="true">🍀</span></h1>
          <p className="limerick-subtitle">
            Lines with matching borders rhyme together.
          </p>
          <p className="sr-only">
            This limerick has an AABBA rhyme scheme. Lines 1, 2, and 5 rhyme
            together (shown with green borders). Lines 3 and 4 rhyme together
            (shown with orange borders).
          </p>
        </header>
        <LimerickLine
          aria-label="Line 1, rhymes with lines 2 and 5"
          lineNumber={1}
          targetSyllables={targetSyllables[0]}
          value={lines.line1}
          onChange={(value) => updateLine("line1", value)}
        />
        <LimerickLine
          aria-label="Line 2, rhymes with lines 1 and 5"
          lineNumber={2}
          targetSyllables={targetSyllables[1]}
          value={lines.line2}
          onChange={(value) => updateLine("line2", value)}
        />
        <LimerickLine
          aria-label="Line 3, rhymes with line 4"
          lineNumber={3}
          targetSyllables={targetSyllables[2]}
          value={lines.line3}
          onChange={(value) => updateLine("line3", value)}
        />
        <LimerickLine
          aria-label="Line 4, rhymes with line 5"
          lineNumber={4}
          targetSyllables={targetSyllables[3]}
          value={lines.line4}
          onChange={(value) => updateLine("line4", value)}
        />
        <LimerickLine
          aria-label="Line 5, rhymes with lines 1 and 2"
          lineNumber={5}
          targetSyllables={targetSyllables[4]}
          value={lines.line5}
          onChange={(value) => updateLine("line5", value)}
        />
        {(isComplete || saved) && (
          <div
            className={`limerick-complete-message ${isFading ? "fade-out" : ""}`}
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {saved ? (
              <><span aria-hidden="true">✨</span> Saved! <span aria-hidden="true">✨</span></>
            ) : (
              <><span aria-hidden="true">✨</span> You do limerick! <span aria-hidden="true">✨</span></>
            )}
          </div>
        )}

        {/* button row */}
        <div className="limerick-button-row">
          {/* Save Button */}
          {!isComplete && !saved && (
            <span id="save-limerick-help" className="sr-only">
              Complete all five lines with correct syllable counts to save
            </span>
          )}
          <button
            disabled={!isComplete || saved}
            className="save-limerick-btn"
            aria-describedby={!isComplete && !saved ? "save-limerick-help" : undefined}
            onClick={() => {
              saveLimerick(lines);
              setSaved(true);
              setLines({
                line1: "",
                line2: "",
                line3: "",
                line4: "",
                line5: "",
              });
              setTimeout(() => {
                setIsFading(true); //Start Fade Out
                setTimeout(() => {
                  setSaved(false); //Actually remove it
                  setIsFading(false);
                }, 500);
              }, 2000);
              const newSavedLimericks = getAllLimericks();
              setSavedLimericks(newSavedLimericks);
            }}
          >
            Save
          </button>

          {/* View Limericks/Hide Limericks button */}
          <button
            className="view-limericks-btn"
            aria-expanded={showLimericks}
            onClick={() => {
              if (showLimericks) {
                setShowLimericks(false);
              } else {
                const newSavedLimericks = getAllLimericks();
                setSavedLimericks(newSavedLimericks);
                setShowLimericks(true);
                setShowExample(false);
              }
            }}
          >
            {showLimericks ? "Hide Saved Limericks" : "View Saved Limericks"}
          </button>

          {/* clear the fields button*/}
          <button
            disabled={fieldsEmpty}
            className="clear-limerick-btn"
            onClick={() => {
              setLines({
                line1: "",
                line2: "",
                line3: "",
                line4: "",
                line5: "",
              });
            }}
          >
            Clear
          </button>
        </div>
        <div className="show-limerick-example-div">
          <button
            className="show-limerick-example-button"
            aria-expanded={showExample}
            onClick={() => {
              if (showExample) {
                setShowExample(false);
              } else {
                setShowLimericks(false);
                setShowExample(true);
              }
            }}
          >
            {showExample ? "hide example" : "show example"}
          </button>
        </div>
        {/* Example Limericks & Saved Limericks Area */}
        {!showLimericks && showExample ? (
          <div className="example-limerick" key={`view-${showLimericks}`}>
            <div className="example-limerick-title">Example:</div>
            <div className="example-limerick-text">
              There was an Old Man in a tree, (8)
              <br />
              Who was horribly bored by a bee. (8)
              <br />
              When they said, "Does it buzz?" (5)
              <br />
              He replied, "Yes, it does! (5)
              <br />
              It's a regular brute of a bee!" (8)
              <br />- Edward Lear
            </div>
          </div>
        ) : showLimericks ? (
          <div className="savedLimericks" key={`view-${showLimericks}`}>
            <h2 className="savedLimericks-title">Saved Limericks</h2>
            {savedLimericks.length <= 0 ? (
              <p>No saved limericks, waiting for words of wisdom</p>
            ) : (
              savedLimericks.map((h) => (
                <article
                  key={h.id}
                  className="limerick-card"
                  data-limerick-id={h.id}
                >
                  <p className="limerick-line">{h.line1}</p>
                  <p className="limerick-line">{h.line2}</p>
                  <p className="limerick-line">{h.line3}</p>
                  <p className="limerick-line">{h.line4}</p>
                  <p className="limerick-line">{h.line5}</p>

                  <div className="limerick-card-buttons">
                    <button
                      aria-label={`Download limerick: ${h.line1}`}
                      className="download-limerick-btn"
                      onClick={() => {
                        setShowDownloadModal(true);
                        setDownloadID(h.id);
                      }}
                    >
                      Download
                    </button>
                    <button
                      aria-label={`Delete limerick: ${h.line1}`}
                      className="delete-limerick-btn"
                      onClick={() => {
                        console.log(h.id);
                        deleteLimerick(h.id);
                        const newSavedLimericks = getAllLimericks();
                        setSavedLimericks(newSavedLimericks);
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
        <div className="limerick-dialog-container">
          <div
            className="limerick-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialogTitle"
            ref={dialogRef}
          >
            <h2 id="dialogTitle">Confirm Download</h2>
            <div className="limerick-modal-button-row">
              <button
                className="confirm-limerick-button"
                onClick={() => {
                  shareAsImage(downloadID);
                  setShowDownloadModal(false);
                  setDownloadID("");
                }}
              >
                Confirm
              </button>
              <button
                className="cancel-limerick-button"
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

export default LimerickApp;
