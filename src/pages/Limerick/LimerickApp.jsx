// LimerickApp.jsx
import { useState } from "react";
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

  const targetSyllables = [7, 7, 5, 5, 7];

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
    const buttons = cardElement.querySelector(".card-buttons");
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
    <div className="app">
      <div className="container">
        <aside>
          <button
            className="back"
            onClick={() => {
              navigate(-1);
            }}
          >
            dashboard
          </button>
        </aside>
        <header>
          <h1>🎭 Let's Limerick! 🍀</h1>
          <p className="subtitle">
            Lines 1, 2 & 5 have 7 - 10 syllables and rhyme together.
            <br />
            Lines 3 & 4 have 5 - 7 syllables and rhyme together.
          </p>
        </header>
        <LimerickLine
          lineNumber={1}
          targetSyllables={targetSyllables[0]}
          value={lines.line1}
          onChange={(value) => updateLine("line1", value)}
        />
        <LimerickLine
          lineNumber={2}
          targetSyllables={targetSyllables[1]}
          value={lines.line2}
          onChange={(value) => updateLine("line2", value)}
        />
        <LimerickLine
          lineNumber={3}
          targetSyllables={targetSyllables[2]}
          value={lines.line3}
          onChange={(value) => updateLine("line3", value)}
        />
        <LimerickLine
          lineNumber={4}
          targetSyllables={targetSyllables[3]}
          value={lines.line4}
          onChange={(value) => updateLine("line4", value)}
        />
        <LimerickLine
          lineNumber={5}
          targetSyllables={targetSyllables[4]}
          value={lines.line5}
          onChange={(value) => updateLine("line5", value)}
        />
        {(isComplete || saved) && (
          <div className={`complete-message ${isFading ? "fade-out" : ""}`}>
            {saved ? "✨ Saved! ✨" : "✨ You do limerick! ✨"}
          </div>
        )}

        {/* button row */}
        <div className="button-row">
          {/* Save Button */}
          <button
            disabled={!isComplete || saved}
            className="save-btn"
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
            onClick={() => {
              if (showLimericks) {
                setShowLimericks(false);
              } else {
                const newSavedLimericks = getAllLimericks();
                setSavedLimericks(newSavedLimericks);
                setShowLimericks(true);
              }
            }}
          >
            {showLimericks ? "Hide Saved Limericks" : "View Saved Limericks"}
          </button>

          {/* clear the fields button*/}
          <button
            disabled={fieldsEmpty}
            className="clear-btn"
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
        {/* Example Limerickss Area */}
        {!showLimericks ? (
          <div className="example" key={`view-${showLimericks}`}>
            <div className="example-title">Example:</div>
            <div className="example-text">
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
        ) : (
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

                  <div className="card-buttons">
                    <button
                      aria-label={`Download limerick: ${h.line1}`}
                      className="download-btn"
                      onClick={() => {
                        setShowDownloadModal(true);
                        setDownloadID(h.id);
                      }}
                    >
                      Download
                    </button>
                    <button
                      aria-label={`Delete limerick: ${h.line1}`}
                      className="delete-btn"
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
        )}
      </div>
      {showDownloadModal && (
        <div className="dialog-container">
          <div className="dialog" role="dialog" aria-labelledby="dialogTitle">
            <h2 id="dialogTitle">Confirm Download</h2>
            <div className="modal-button-row">
              <button
                className="confirm-button"
                onClick={() => {
                  shareAsImage(downloadID);
                  setShowDownloadModal(false);
                  setDownloadID("");
                }}
              >
                Confirm
              </button>
              <button
                className="cancel-button"
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
