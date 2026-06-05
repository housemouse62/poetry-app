// HaikuApp.jsx
import { useState } from "react";
import { countSyllables } from "../../utils/syllableCounter";
import "./HaikuApp.css";
import { useNavigate } from "react-router";
import PoetryLine from "../../components/PoetryLine.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import HaikuCard from "../../components/haikuCard/haikuCard.jsx";

function HaikuApp() {
  const navigate = useNavigate();

  const [lines, setLines] = useState({
    line1: "",
    line2: "",
    line3: "",
  });

  const [error, setError] = useState(null);
  const [editingHaiku, setEditingHaiku] = useState(null);
  const [editID, setEditID] = useState(null);
  const [saved, setSaved] = useState(false);
  const [showHaikus, setShowHaikus] = useState(false);
  const [savedHaikus, setSavedHaikus] = useState("");
  const [isFading, setIsFading] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const [syllableCounts, setSyllableCounts] = useState({
    line1: 0,
    line2: 0,
    line3: 0,
  });
  const [title, setTitle] = useState("");
  const [published, setPublished] = useState(false);

  const { user, token } = useAuth();
  const targetSyllables = [5, 7, 5];

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

  const saveHaiku = async () => {
    const url = `${import.meta.env.VITE_API_URL}/haiku`;
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
          lineOneSyllables: syllableCounts.line1,
          lineTwoSyllables: syllableCounts.line2,
          lineThreeSyllables: syllableCounts.line3,
          published: published,
          authorID: user.id,
          screenname: user.screenname,
        }),
      });
      const nextresponse = await response.json();

      if (nextresponse.id) {
        setSaved(true);
        setTitle("");
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
        setError(null);
      } else setError("Failed to save haiku. Please try again.");
    } catch (error) {
      console.error(error);
    }
  };

  const fetchMyHaikus = async () => {
    const url = `${import.meta.env.VITE_API_URL}/haiku/mine`;
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const nextresponse = await response.json();
      console.log(nextresponse);
      if (response.ok) {
        setSavedHaikus(nextresponse);
        setShowHaikus(true);
        setShowExample(false);
        setError(null);
      } else setError("Cannot show Haikus. Please try again.");
    } catch (error) {
      console.error(error);
    }
  };

  const deleteHaiku = async (id) => {
    const url = `${import.meta.env.VITE_API_URL}/haiku/${id}`;
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
        fetchMyHaikus();
        setShowHaikus(true);
        setShowExample(false);
        setError(null);
      } else setError("Cannot delete. Please try again.");
    } catch (error) {
      console.error(error);
    }
  };

  const editHaiku = async (id) => {
    const url = `${import.meta.env.VITE_API_URL}/haiku/${id}`;
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
          lineOneSyllables: syllableCounts.line1,
          lineTwoSyllables: syllableCounts.line2,
          lineThreeSyllables: syllableCounts.line3,
          published: published,
        }),
      });
      const nextresponse = await response.json();
      console.log(nextresponse);
      if (nextresponse.id) {
        fetchMyHaikus();
        setShowHaikus(true);
        setShowExample(false);
        setTitle("");
        setLines({
          line1: "",
          line2: "",
          line3: "",
        });
        setEditID(null);
        setEditingHaiku(null);
        setError(null);
      } else setError("Cannot update. Please try again.");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="haiku-app">
      <main className="haiku-container">
        <nav aria-label="Page navigation">
          <button
            className="haiku-back"
            aria-label="Back to dashboard"
            onClick={() => {
              navigate(-1);
            }}
          >
            dashboard
          </button>
        </nav>
        <header>
          <h1 className="haiku-h1">
            <span aria-hidden="true">🌸</span> Do You Do Haiku?{" "}
            <span aria-hidden="true">🪷</span>
          </h1>
          <p className="haiku-subtitle">
            Write a haiku following the 5-7-5 syllable pattern
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
          />
        </div>
        <PoetryLine
          lineNumber={1}
          targetSyllables={targetSyllables[0]}
          value={lines.line1}
          onChange={(value) => updateLine("line1", value)}
          onSyllableChange={(count) =>
            setSyllableCounts((prev) => ({ ...prev, line1: count }))
          }
          showTarget={true}
          placeholderText={`Line 1 (${targetSyllables[0]} syllables)`}
        />
        <PoetryLine
          lineNumber={2}
          targetSyllables={targetSyllables[1]}
          value={lines.line2}
          onChange={(value) => updateLine("line2", value)}
          onSyllableChange={(count) =>
            setSyllableCounts((prev) => ({ ...prev, line2: count }))
          }
          showTarget={true}
          placeholderText={`Line 2 (${targetSyllables[1]} syllables)`}
        />
        <PoetryLine
          lineNumber={3}
          targetSyllables={targetSyllables[2]}
          value={lines.line3}
          onChange={(value) => updateLine("line3", value)}
          onSyllableChange={(count) =>
            setSyllableCounts((prev) => ({ ...prev, line3: count }))
          }
          showTarget={true}
          placeholderText={`Line 3 (${targetSyllables[2]} syllables)`}
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
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
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
              editingHaiku ? editHaiku(editID) : saveHaiku();
            }}
          >
            {editingHaiku ? "Update" : "Save"}
          </button>
          {/* View Haikus/Hide Haikus button */}
          <button
            className="view-haikus-btn"
            aria-expanded={showHaikus}
            onClick={() => {
              if (showHaikus) {
                setShowHaikus(false);
              } else {
                fetchMyHaikus();
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
        <div className="published-checkbox">
          <label htmlFor="published">Publish?</label>
          <input
            type="checkbox"
            name="published"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
          />
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
                <HaikuCard
                  key={h.id}
                  haiku={h}
                  onEdit={() => {
                    setEditingHaiku(true);
                    setEditID(h.id);
                    setLines({
                      line1: `${h.lineOne}`,
                      line2: `${h.lineTwo}`,
                      line3: `${h.lineThree}`,
                    });
                    setTitle(h.title);
                    setPublished(h.published);
                  }}
                  onDelete={() => deleteHaiku(h.id)}
                />
              ))
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}

export default HaikuApp;
