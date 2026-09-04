// HaikuApp.jsx
import { useRef, useState } from "react";
import { countSyllables } from "../../utils/syllableCounter";
import "./HaikuApp.css";
import { useNavigate } from "react-router";
import PoetryLine from "../../components/PoetryLine.jsx";
import { useAuth } from "../../context/useAuth";
import HaikuCard from "../../components/HaikuCard/HaikuCard.jsx";
import DiscardDraftDialog from "../../components/DiscardDraftDialog.jsx";
import { useUnsavedChanges } from "../../utils/useUnsavedChanges.js";

function HaikuApp() {
  const navigate = useNavigate();

  const [lines, setLines] = useState({
    line1: "",
    line2: "",
    line3: "",
  });

  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [showHaikus, setShowHaikus] = useState(false);
  const [savedHaikus, setSavedHaikus] = useState("");
  const [showExample, setShowExample] = useState(false);
  const [syllableCounts, setSyllableCounts] = useState({
    line1: 0,
    line2: 0,
    line3: 0,
  });
  const [title, setTitle] = useState("");
  const [activeDraftID, setActiveDraftID] = useState(null);
  const [editingPublished, setEditingPublished] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [status, setStatus] = useState("");
  const [discardDraft, setDiscardDraft] = useState(null);
  const discardTriggerRef = useRef(null);
  const titleRef = useRef(null);
  const editorHeadingRef = useRef(null);
  const saveButtonRef = useRef(null);
  const publishButtonRef = useRef(null);
  const mutationPendingRef = useRef(false);

  const { token } = useAuth();
  const targetSyllables = [5, 7, 5];
  const snapshot = JSON.stringify({ title, lines });
  const { markSaved } = useUnsavedChanges(snapshot);
  const hasContent = [title, ...Object.values(lines)].some(
    (value) => value.trim().length > 0,
  );

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

  const poemPayload = (shouldPublish) => ({
    title,
    lineOne: lines.line1,
    lineTwo: lines.line2,
    lineThree: lines.line3,
    lineOneSyllables: syllableCounts.line1,
    lineTwoSyllables: syllableCounts.line2,
    lineThreeSyllables: syllableCounts.line3,
    published: shouldPublish,
  });

  const saveHaiku = async (shouldPublish) => {
    if (mutationPendingRef.current || (!shouldPublish && !hasContent) || (shouldPublish && !isComplete)) return;
    mutationPendingRef.current = true;
    const action = shouldPublish ? "publish" : "save";
    const wasEditingPublished = editingPublished;
    const buttonRef = shouldPublish ? publishButtonRef : saveButtonRef;
    const url = `${import.meta.env.VITE_API_URL}/haiku${activeDraftID ? `/${activeDraftID}` : ""}`;
    setPendingAction(action);
    setError(null);
    setStatus("");
    try {
      const response = await fetch(url, {
        method: activeDraftID ? "PATCH" : "POST",
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(poemPayload(shouldPublish)),
      });
      const nextresponse = await response.json();

      if (!response.ok || !nextresponse.id) throw new Error("request failed");
      if (shouldPublish) {
        const emptySnapshot = JSON.stringify({ title: "", lines: { line1: "", line2: "", line3: "" } });
        setTitle("");
        setLines({ line1: "", line2: "", line3: "" });
        setActiveDraftID(null);
        setEditingPublished(false);
        markSaved(emptySnapshot);
        setStatus(wasEditingPublished ? "Published haiku updated. View it in Published poems." : "Haiku published. View it in Published poems.");
      } else {
        setActiveDraftID(nextresponse.id);
        markSaved(snapshot);
        setStatus("Draft saved.");
      }
      setSaved(true);
    } catch (error) {
      if (import.meta.env.DEV) console.error(error);
      setError(shouldPublish ? "Failed to publish haiku. Please try again." : "Failed to save draft. Please try again.");
    } finally {
      mutationPendingRef.current = false;
      setPendingAction(null);
      setTimeout(() => {
        if (shouldPublish && !titleRef.current?.value) editorHeadingRef.current?.focus();
        else buttonRef.current?.focus();
      }, 0);
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
      if (response.ok) {
        setSavedHaikus(nextresponse);
        setShowHaikus(true);
        setShowExample(false);
        setError(null);
      } else setError("Cannot show Haikus. Please try again.");
    } catch (error) {
      if (import.meta.env.DEV) console.error(error);
      setError("Something went wrong. Please try again.");
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
      await response.json();

      if (response.ok) {
        setSavedHaikus((current) => current.filter((haiku) => haiku.id !== id));
        setShowHaikus(true);
        setShowExample(false);
        setError(null);
        return true;
      } else setError("Cannot delete. Please try again.");
    } catch (error) {
      if (import.meta.env.DEV) console.error(error);
      setError("Something went wrong. Please try again.");
    }
    return false;
  };

  const openHaikuForEditing = (haiku, isPublished = false) => {
    const nextLines = { line1: haiku.lineOne, line2: haiku.lineTwo, line3: haiku.lineThree };
    setShowHaikus(false);
    setActiveDraftID(haiku.id);
    setEditingPublished(isPublished);
    setLines(nextLines);
    setTitle(haiku.title);
    markSaved(JSON.stringify({ title: haiku.title, lines: nextLines }));
    setStatus("Draft resumed.");
    setTimeout(() => {
      if (!haiku.title.trim()) titleRef.current?.focus();
      else {
        const firstIncomplete = [haiku.lineOne, haiku.lineTwo, haiku.lineThree].findIndex((line) => !line.trim());
        if (firstIncomplete >= 0) document.querySelectorAll(".haikuForm .line-input")[firstIncomplete]?.focus();
        else editorHeadingRef.current?.focus();
      }
    }, 0);
  };

  const confirmDiscard = async () => {
    const draft = discardDraft;
    const drafts = savedHaikus.filter((poem) => !poem.published);
    const index = drafts.findIndex((poem) => poem.id === draft.id);
    const deleted = await deleteHaiku(draft.id);
    if (!deleted) return;
    setDiscardDraft(null);
    const remaining = drafts.filter((poem) => poem.id !== draft.id);
    setTimeout(() => {
      const targetIndex = Math.min(index, remaining.length - 1);
      if (targetIndex >= 0) document.querySelector(`[data-haiku-draft-index="${targetIndex}"] button`)?.focus();
      else document.getElementById("haiku-drafts-heading")?.focus();
    }, 0);
  };

  return (
    <div className="haiku-app">
      <main className="haiku-container">
        <nav aria-label="Page navigation" className={showHaikus ? "haiku-nav" : undefined}>
          <button
            className="haiku-back"
            aria-label="Back to dashboard"
            onClick={() => {
              navigate(-1);
            }}
          >
            dashboard
          </button>
          {showHaikus && (
            <div className="mobile-haiku-h2">
              <span aria-hidden="true" className="haiku-h2 icon">
                🌸
              </span>
              <h2 className="haiku-h2">
                <span>Do You Do Haiku?</span>
              </h2>
              <span aria-hidden="true" className="haiku-h2 icon">
                🪷
              </span>
            </div>
          )}
        </nav>
        {showHaikus && (
          <div className="savedHaikus" key={`view-${showHaikus}`}>
            <h3 className="savedHaikus-title">Saved Haikus</h3>
            {savedHaikus.length <= 0 ? (
              <p>No saved haikus, waiting for words of wisdom</p>
            ) : (
              <>
                <section aria-labelledby="haiku-drafts-heading">
                  <h4 id="haiku-drafts-heading" tabIndex="-1">Drafts</h4>
                  {savedHaikus.filter((h) => !h.published).length === 0 ? <p>No drafts.</p> : savedHaikus.filter((h) => !h.published).map((h, index) => (
                    <article key={h.id} data-haiku-draft-index={index} className="haiku-card">
                      <h5>{h.title.trim() || "Untitled draft"}</h5><p>Draft</p>
                      <button type="button" onClick={() => openHaikuForEditing(h)}>Resume draft</button>
                      <button type="button" onClick={(event) => { discardTriggerRef.current = event.currentTarget; setDiscardDraft(h); }}>Discard draft</button>
                    </article>
                  ))}
                </section>
                <section aria-labelledby="published-haikus-heading">
                  <h4 id="published-haikus-heading">Published poems</h4>
                  {savedHaikus.filter((h) => h.published).length === 0 ? <p>No published poems.</p> : savedHaikus.filter((h) => h.published).map((h) => (
                    <HaikuCard key={h.id} haiku={h} onEdit={() => openHaikuForEditing(h, true)} onDelete={() => deleteHaiku(h.id)} />
                  ))}
                </section>
              </>
            )}
          </div>
        )}
        {!showHaikus && (
          <div className="haikuForm">
            <header>
              <h1 className="haiku-h1" ref={editorHeadingRef} tabIndex="-1">
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
                aria-label="Haiku title"
                ref={titleRef}
                readOnly={pendingAction === "publish"}
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
              readOnly={pendingAction === "publish"}
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
              readOnly={pendingAction === "publish"}
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
              readOnly={pendingAction === "publish"}
            />
            {(isComplete || saved) && (
              <div
                className="haiku-complete-message"
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
          </div>
        )}
        {status && <p role="status" aria-live="polite">{status}</p>}
        {showHaikus && error && <p className="error-message" role="alert">{error}</p>}
        <div className="haiku-button-row">
          {/* Save Button */}
          {!hasContent && (
            <span id="save-haiku-help" className="sr-only">
              Enter a title or at least one line to save a draft
            </span>
          )}
          {!showHaikus && (
            <>
            {!editingPublished && <button
              ref={saveButtonRef}
              disabled={!hasContent || Boolean(pendingAction)}
              className="save-haikus-btn"
              aria-describedby={!hasContent ? "save-haiku-help" : undefined}
              onClick={() => saveHaiku(false)}
            >
              {pendingAction === "save" ? "Saving draft…" : "Save draft"}
            </button>}
            <button ref={publishButtonRef} type="button" disabled={!isComplete || Boolean(pendingAction)} aria-describedby={!isComplete ? "publish-haiku-help" : undefined} onClick={() => saveHaiku(true)}>
              {pendingAction === "publish" ? (editingPublished ? "Updating…" : "Publishing…") : (editingPublished ? "Update published poem" : "Publish")}
            </button>
            {!isComplete && <span id="publish-haiku-help" className="sr-only">Complete all three lines with correct syllable counts to publish</span>}
            </>
          )}
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
          {!showHaikus && (
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
          )}
        </div>
        {!showHaikus && (
          <div className="show-haiku-example-div">
            <button
              className="show-haiku-example-button"
              aria-expanded={showExample}
              onClick={() => {
                if (showExample) {
                  setShowExample(false);
                } else {
                  setShowExample(true);
                }
              }}
            >
              {showExample ? "hide example" : "show example"}
            </button>
          </div>
        )}
        {/* Example Haikus Area */}
        {showExample && (
          <div className="example-haiku" key={`view-${showHaikus}`}>
            <div className="example-haiku-title">Example Haiku:</div>
            <div className="example-haiku-text">
              Do you do haiku (5)
              <br />
              Yes I do I do haiku (7)
              <br />I haiku for you (5)
            </div>
          </div>
        )}
      </main>
      <DiscardDraftDialog draft={discardDraft} poemType="haiku" onCancel={() => { setDiscardDraft(null); setTimeout(() => discardTriggerRef.current?.focus(), 0); }} onConfirm={confirmDiscard} />
    </div>
  );
}

export default HaikuApp;
