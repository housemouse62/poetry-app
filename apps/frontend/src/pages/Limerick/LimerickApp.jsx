// LimerickApp.jsx
import { useState, useRef, useEffect } from "react";
import { countSyllables } from "../../utils/syllableCounter";
import "./LimerickApp.css";
import html2canvas from "html2canvas";
import { useNavigate } from "react-router";
import PoetryLine from "../../components/PoetryLine";
import { useAuth } from "../../context/AuthContext";
import LimerickCard from "../../components/LimerickCard/LimerickCard";

function LimerickApp() {
  const navigate = useNavigate();

  const [lines, setLines] = useState({
    line1: "",
    line2: "",
    line3: "",
    line4: "",
    line5: "",
  });

  const [error, setError] = useState(null);
  const [editingLimerick, setEditingLimerick] = useState(null);
  const [editID, setEditID] = useState(null);
  const [saved, setSaved] = useState(false);
  const [showLimericks, setShowLimericks] = useState(false);
  const [savedLimericks, setSavedLimericks] = useState("");
  const [isFading, setIsFading] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const [syllableCounts, setSyllablesCounts] = useState({
    line1: 0,
    line2: 0,
    line3: 0,
    line4: 0,
    line5: 0,
  });
  const [title, setTitle] = useState("");
  const [published, setPublished] = useState(false);

  const { user, token } = useAuth();
  const targetSyllables = ["7 - 10", "7 - 10", "5-8", "5-8", "7 - 10"];

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

  const saveLimerick = async () => {
    const url = `${import.meta.env.VITE_API_URL}/limerick`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title,
          lineOne: lines.line1,
          lineTwo: lines.line2,
          lineThree: lines.line3,
          lineFour: lines.line4,
          lineFive: lines.line5,
          lineOneSyllables: syllableCounts.line1,
          lineTwoSyllables: syllableCounts.line2,
          lineThreeSyllables: syllableCounts.line3,
          lineFourSyllables: syllableCounts.line4,
          lineFiveSyllables: syllableCounts.line5,
          rhymeA: null, // change this once word api is wired up
          rhymeB: null, // change this once word api is wired up
          rhymeAVerified: false, // change this once word api is wired up
          rhymeBVerified: false, // change this once word api is wired up
          published: published,
          authorID: user.id,
          screenname: user.screenname,
        }),
      });
      const nextresponse = await response.json();
      console.log(nextresponse);
      if (nextresponse.id) {
        setSaved(true);
        setTitle("");
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
        setError(null);
      } else setError("Failed to save limerick. Please try again.");
    } catch (error) {
      console.error(error);
    }
  };

  const fetchMyLimericks = async () => {
    const url = `${import.meta.env.VITE_API_URL}/limerick/mine`;
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const nextresponse = await response.json();
      console.log("next response", nextresponse);
      if (response.ok) {
        setSavedLimericks(nextresponse);
        setShowLimericks(true);
        setShowExample(false);
        setError(null);
      } else setError("Cannot show Limericks. Please try again.");
    } catch (error) {
      console.error(error);
    }
  };

  const deleteLimerick = async (id) => {
    const url = `${import.meta.env.VITE_API_URL}/limerick/${id}`;
    try {
      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const nextresponse = await response.json();
      console.log(nextresponse);

      if (response.ok) {
        fetchMyLimericks();
        setShowLimericks(true);
        setShowExample(false);
        setError(null);
      } else setError("Cannot delete. Please try again.");
    } catch (error) {
      console.error(error);
    }
  };

  const editLimerick = async (id) => {
    const url = `${import.meta.env.VITE_API_URL}/limerick/${id}`;
    try {
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title,
          lineOne: lines.line1,
          lineTwo: lines.line2,
          lineThree: lines.line3,
          lineFour: lines.line4,
          lineFive: lines.line5,
          lineOneSyllables: syllableCounts.line1,
          lineTwoSyllables: syllableCounts.line2,
          lineThreeSyllables: syllableCounts.line3,
          lineFourSyllables: syllableCounts.line4,
          lineFiveSyllables: syllableCounts.line5,
          rhymeA: null, // change this once word api is wired up
          rhymeB: null, // change this once word api is wired up
          rhymeAVerified: false, // change this once word api is wired up
          rhymeBVerified: false, // change this once word api is wired up
          published: published,
        }),
      });
      const nextresponse = await response.json();
      console.log(nextresponse);
      if (nextresponse.id) {
        fetchMyLimericks();
        setShowLimericks(true);
        setShowExample(false);
        setTitle("");
        setLines({
          line1: "",
          line2: "",
          line3: "",
          line4: "",
          line5: "",
        });
        setEditID(null);
        setEditingLimerick(null);
        setError(null);
      } else setError("Cannot update. Please try again.");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="limerick-app">
      <main className="limerick-container">
        <nav aria-label="Page navigation" className="limerick-nav">
          <button
            className="limerick-back"
            aria-label="Back to dashboard"
            onClick={() => {
              navigate(-1);
            }}
          >
            dashboard
          </button>
          {showLimericks && (
            <h2 className="limerick-h2">
              <span aria-hidden="true">🎭</span> Let's Limerick!{" "}
              <span aria-hidden="true">🍀</span>
            </h2>
          )}
        </nav>
        {showLimericks && (
          <div className="savedLimericks" key={`view-${showLimericks}`}>
            <h2 className="savedLimericks-title">Saved Limericks</h2>
            {savedLimericks.length <= 0 ? (
              <p>No saved limericks, waiting for words of wisdom</p>
            ) : (
              savedLimericks.map((l) => (
                <LimerickCard
                  key={l.id}
                  limerick={l}
                  onEdit={() => {
                    setShowLimericks(false);
                    setEditingLimerick(true);
                    setEditID(l.id);
                    setLines({
                      line1: `${l.lineOne}`,
                      line2: `${l.lineTwo}`,
                      line3: `${l.lineThree}`,
                      line4: `${l.lineFour}`,
                      line5: `${l.lineFive}`,
                    });
                    setTitle(l.title);
                    setPublished(l.published);
                  }}
                  onDelete={() => deleteLimerick(l.id)}
                />
              ))
            )}
          </div>
        )}
        {!showLimericks && (
          <div className="LimerickForm">
            <header>
              <h1 className="limerick-h1">
                <span aria-hidden="true">🎭</span> Let's Limerick!{" "}
                <span aria-hidden="true">🍀</span>
              </h1>
              <p className="limerick-subtitle">
                Lines with matching borders rhyme together.
              </p>
              <p className="sr-only">
                This limerick has an AABBA rhyme scheme. Lines 1, 2, and 5 rhyme
                together (shown with green borders). Lines 3 and 4 rhyme
                together (shown with orange borders).
              </p>
            </header>
            <div className="title-div">
              <textarea
                className="title-input"
                rows="1"
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                aria-label="Limerick title"
              />
            </div>
            <PoetryLine
              rhymeInfo="Line 1, rhymes with lines 2 and 5"
              lineNumber={1}
              targetSyllables={targetSyllables[0]}
              value={lines.line1}
              onChange={(value) => updateLine("line1", value)}
              onSyllableChange={(count) =>
                setSyllablesCounts((prev) => ({ ...prev, line1: count }))
              }
              borderColor={"A"}
              showTarget={false}
              placeholderText={`Line 1 (${targetSyllables[0]} syllables)`}
            />
            <PoetryLine
              rhymeInfo="Line 2, rhymes with lines 1 and 5"
              lineNumber={2}
              targetSyllables={targetSyllables[1]}
              value={lines.line2}
              onChange={(value) => updateLine("line2", value)}
              onSyllableChange={(count) =>
                setSyllablesCounts((prev) => ({ ...prev, line2: count }))
              }
              borderColor={"A"}
              showTarget={false}
              placeholderText={`Line 2 (${targetSyllables[1]} syllables)`}
            />
            <PoetryLine
              rhymeInfo="Line 3, rhymes with line 4"
              lineNumber={3}
              targetSyllables={targetSyllables[2]}
              value={lines.line3}
              onChange={(value) => updateLine("line3", value)}
              onSyllableChange={(count) =>
                setSyllablesCounts((prev) => ({ ...prev, line3: count }))
              }
              borderColor={"B"}
              showTarget={false}
              placeholderText={`Line 3 (${targetSyllables[2]} syllables)`}
            />
            <PoetryLine
              rhymeInfo="Line 4, rhymes with line 3"
              lineNumber={4}
              targetSyllables={targetSyllables[3]}
              value={lines.line4}
              onChange={(value) => updateLine("line4", value)}
              onSyllableChange={(count) =>
                setSyllablesCounts((prev) => ({ ...prev, line4: count }))
              }
              borderColor={"B"}
              showTarget={false}
              placeholderText={`Line 4 (${targetSyllables[3]} syllables)`}
            />
            <PoetryLine
              rhymeInfo="Line 5, rhymes with lines 1 and 2"
              lineNumber={5}
              targetSyllables={targetSyllables[4]}
              value={lines.line5}
              onChange={(value) => updateLine("line5", value)}
              onSyllableChange={(count) =>
                setSyllablesCounts((prev) => ({ ...prev, line5: count }))
              }
              borderColor={"A"}
              showTarget={false}
              placeholderText={`Line 5 (${targetSyllables[4]} syllables)`}
            />
            {(isComplete || saved) && (
              <div
                className={`limerick-complete-message ${isFading ? "fade-out" : ""}`}
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
                    <h3 className="limerick-h3">
                      <span aria-hidden="true">✨</span> You do limerick!{" "}
                      <span aria-hidden="true">✨</span>
                    </h3>
                  </>
                )}
              </div>
            )}
            {error && (
              <p className="error-message" role="alert">
                {error}
              </p>
            )}
            {/* button row */}
          </div>
        )}
        {!showLimericks && (
          <div className="published-checkbox">
            <input
              id="published"
              type="checkbox"
              name="published"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
            />
            <label htmlFor="published" className="check-box" />
            <span>Publish</span>
          </div>
        )}
        <div className="limerick-button-row">
          {/* Save Button */}
          {!isComplete && !saved && (
            <span id="save-limerick-help" className="sr-only">
              Complete all five lines with correct syllable counts to save
            </span>
          )}
          {!showLimericks && (
            <button
              disabled={!isComplete || saved}
              className="save-limerick-btn"
              aria-describedby={
                !isComplete && !saved ? "save-limerick-help" : undefined
              }
              onClick={() => {
                editingLimerick ? editLimerick(editID) : saveLimerick();
              }}
            >
              {editingLimerick ? "Update" : "Save"}
            </button>
          )}
          {/* View Limericks/Hide Limericks button */}
          <button
            className="view-limericks-btn"
            aria-expanded={showLimericks}
            onClick={() => {
              if (showLimericks) {
                setShowLimericks(false);
              } else {
                fetchMyLimericks();
              }
            }}
          >
            {showLimericks ? "Hide Saved Limericks" : "View Saved Limericks"}
          </button>

          {/* clear the fields button*/}
          {!showLimericks && (
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
          )}
        </div>
        {!showLimericks && (
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
        )}
        {/* Example Limericks Area */}
        {showExample && (
          <div className="example-limerick" key={`view-${showLimericks}`}>
            <div className="example-limerick-title">Example:</div>
            <div className="example-limerick-text">
              There was an Old Man in a tree, (8)
              <br />
              Who was horribly bored by a bee. (9)
              <br />
              When they said, "Does it buzz?" (6)
              <br />
              He replied, "Yes, it does! (6)
              <br />
              It's a regular brute of a bee!" (9)
              <br />- Edward Lear
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default LimerickApp;
