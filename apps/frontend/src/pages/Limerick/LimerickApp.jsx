// LimerickApp.jsx
import { useRef, useState } from "react";
import { countSyllables } from "../../utils/syllableCounter";
import "./LimerickApp.css";
import { useNavigate } from "react-router";
import PoetryLine from "../../components/PoetryLine";
import { useAuth } from "../../context/useAuth";
import LimerickCard from "../../components/LimerickCard/LimerickCard";
import DiscardDraftDialog from "../../components/DiscardDraftDialog.jsx";
import { useUnsavedChanges } from "../../utils/useUnsavedChanges.js";

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
  const [saved, setSaved] = useState(false);
  const [showLimericks, setShowLimericks] = useState(false);
  const [savedLimericks, setSavedLimericks] = useState("");
  const [showExample, setShowExample] = useState(false);
  const [syllableCounts, setSyllablesCounts] = useState({
    line1: 0,
    line2: 0,
    line3: 0,
    line4: 0,
    line5: 0,
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
  const targetSyllables = ["7 - 10", "7 - 10", "5-8", "5-8", "7 - 10"];
  const snapshot = JSON.stringify({ title, lines });
  const { markSaved } = useUnsavedChanges(snapshot);
  const hasContent = [title, ...Object.values(lines)].some((value) => value.trim());

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

  const poemPayload = (shouldPublish) => ({
    title, lineOne: lines.line1, lineTwo: lines.line2, lineThree: lines.line3,
    lineFour: lines.line4, lineFive: lines.line5,
    lineOneSyllables: syllableCounts.line1, lineTwoSyllables: syllableCounts.line2,
    lineThreeSyllables: syllableCounts.line3, lineFourSyllables: syllableCounts.line4,
    lineFiveSyllables: syllableCounts.line5,
    rhymeA: null, rhymeB: null, rhymeAVerified: false, rhymeBVerified: false,
    published: shouldPublish,
  });

  const saveLimerick = async (shouldPublish) => {
    if (mutationPendingRef.current || (!shouldPublish && !hasContent) || (shouldPublish && !isComplete)) return;
    mutationPendingRef.current = true;
    const action = shouldPublish ? "publish" : "save";
    const wasEditingPublished = editingPublished;
    const buttonRef = shouldPublish ? publishButtonRef : saveButtonRef;
    const url = `${import.meta.env.VITE_API_URL}/limerick${activeDraftID ? `/${activeDraftID}` : ""}`;
    setPendingAction(action); setError(null); setStatus("");
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
        const emptyLines = { line1: "", line2: "", line3: "", line4: "", line5: "" };
        setTitle(""); setLines(emptyLines); setActiveDraftID(null);
        setEditingPublished(false);
        markSaved(JSON.stringify({ title: "", lines: emptyLines }));
        setStatus(wasEditingPublished ? "Published limerick updated. View it in Published poems." : "Limerick published. View it in Published poems.");
      } else {
        setActiveDraftID(nextresponse.id); markSaved(snapshot); setStatus("Draft saved.");
      }
      setSaved(true);
    } catch (error) {
      if (import.meta.env.DEV) console.error(error);
      setError(shouldPublish ? "Failed to publish limerick. Please try again." : "Failed to save draft. Please try again.");
    } finally {
      mutationPendingRef.current = false;
      setPendingAction(null);
      setTimeout(() => {
        if (shouldPublish && !titleRef.current?.value) editorHeadingRef.current?.focus();
        else buttonRef.current?.focus();
      }, 0);
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

      if (response.ok) {
        setSavedLimericks(nextresponse);
        setShowLimericks(true);
        setShowExample(false);
        setError(null);
      } else setError("Cannot show Limericks. Please try again.");
    } catch (error) {
      if (import.meta.env.DEV) console.error(error);
      setError("Something went wrong. Please try again.");
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

      await response.json();

      if (response.ok) {
        setSavedLimericks((current) => current.filter((limerick) => limerick.id !== id));
        setShowLimericks(true);
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

  const openLimerickForEditing = (limerick, isPublished = false) => {
    const nextLines = { line1: limerick.lineOne, line2: limerick.lineTwo, line3: limerick.lineThree, line4: limerick.lineFour, line5: limerick.lineFive };
    setShowLimericks(false); setActiveDraftID(limerick.id); setEditingPublished(isPublished);
    setLines(nextLines); setTitle(limerick.title);
    markSaved(JSON.stringify({ title: limerick.title, lines: nextLines })); setStatus("Draft resumed.");
    setTimeout(() => {
      if (!limerick.title.trim()) titleRef.current?.focus();
      else {
        const values = [limerick.lineOne, limerick.lineTwo, limerick.lineThree, limerick.lineFour, limerick.lineFive];
        const firstIncomplete = values.findIndex((line) => !line.trim());
        if (firstIncomplete >= 0) document.querySelectorAll(".LimerickForm .line-input")[firstIncomplete]?.focus();
        else editorHeadingRef.current?.focus();
      }
    }, 0);
  };

  const confirmDiscard = async () => {
    const draft = discardDraft;
    const drafts = savedLimericks.filter((poem) => !poem.published);
    const index = drafts.findIndex((poem) => poem.id === draft.id);
    const deleted = await deleteLimerick(draft.id);
    if (!deleted) return;
    setDiscardDraft(null);
    const remaining = drafts.filter((poem) => poem.id !== draft.id);
    setTimeout(() => {
      const targetIndex = Math.min(index, remaining.length - 1);
      if (targetIndex >= 0) document.querySelector(`[data-limerick-draft-index="${targetIndex}"] button`)?.focus();
      else document.getElementById("limerick-drafts-heading")?.focus();
    }, 0);
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
            <div className="mobile-limerick-h2">
              <span aria-hidden="true" className="limerick-h2 icon">
                🎭
              </span>{" "}
              <h2 className="limerick-h2">
                <span>Let's Limerick!</span>{" "}
              </h2>
              <span aria-hidden="true" className="limerick-h2 icon">
                🍀
              </span>
            </div>
          )}
        </nav>
        {showLimericks && (
          <div className="savedLimericks" key={`view-${showLimericks}`}>
            <h2 className="savedLimericks-title">Saved Limericks</h2>
            {savedLimericks.length <= 0 ? (
              <p>No saved limericks, waiting for words of wisdom</p>
            ) : (
              <>
                <section aria-labelledby="limerick-drafts-heading">
                  <h3 id="limerick-drafts-heading" tabIndex="-1">Drafts</h3>
                  {savedLimericks.filter((l) => !l.published).length === 0 ? <p>No drafts.</p> : savedLimericks.filter((l) => !l.published).map((l, index) => (
                    <article key={l.id} data-limerick-draft-index={index} className="limerick-card">
                      <h4>{l.title.trim() || "Untitled draft"}</h4><p>Draft</p>
                      <button type="button" onClick={() => openLimerickForEditing(l)}>Resume draft</button>
                      <button type="button" onClick={(event) => { discardTriggerRef.current = event.currentTarget; setDiscardDraft(l); }}>Discard draft</button>
                    </article>
                  ))}
                </section>
                <section aria-labelledby="published-limericks-heading">
                  <h3 id="published-limericks-heading">Published poems</h3>
                  {savedLimericks.filter((l) => l.published).length === 0 ? <p>No published poems.</p> : savedLimericks.filter((l) => l.published).map((l) => (
                    <LimerickCard key={l.id} limerick={l} onEdit={() => openLimerickForEditing(l, true)} onDelete={() => deleteLimerick(l.id)} />
                  ))}
                </section>
              </>
            )}
          </div>
        )}
        {!showLimericks && (
          <div className="LimerickForm">
            <header>
              <h1 className="limerick-h1" ref={editorHeadingRef} tabIndex="-1">
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
                ref={titleRef}
                readOnly={pendingAction === "publish"}
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
              readOnly={pendingAction === "publish"}
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
              readOnly={pendingAction === "publish"}
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
              readOnly={pendingAction === "publish"}
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
              readOnly={pendingAction === "publish"}
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
              readOnly={pendingAction === "publish"}
            />
            {(isComplete || saved) && (
              <div
                className="limerick-complete-message"
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
        {status && <p role="status" aria-live="polite">{status}</p>}
        {showLimericks && error && <p className="error-message" role="alert">{error}</p>}
        <div className="limerick-button-row">
          {/* Save Button */}
          {!hasContent && (
            <span id="save-limerick-help" className="sr-only">
              Enter a title or at least one line to save a draft
            </span>
          )}
          {!showLimericks && (
            <>
            {!editingPublished && <button
              ref={saveButtonRef}
              disabled={!hasContent || Boolean(pendingAction)}
              className="save-limerick-btn"
              aria-describedby={!hasContent ? "save-limerick-help" : undefined}
              onClick={() => saveLimerick(false)}
            >
              {pendingAction === "save" ? "Saving draft…" : "Save draft"}
            </button>}
            <button ref={publishButtonRef} type="button" disabled={!isComplete || Boolean(pendingAction)} aria-describedby={!isComplete ? "publish-limerick-help" : undefined} onClick={() => saveLimerick(true)}>
              {pendingAction === "publish" ? (editingPublished ? "Updating…" : "Publishing…") : (editingPublished ? "Update published poem" : "Publish")}
            </button>
            {!isComplete && <span id="publish-limerick-help" className="sr-only">Complete all five lines with valid syllable counts to publish</span>}
            </>
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
      <DiscardDraftDialog draft={discardDraft} poemType="limerick" onCancel={() => { setDiscardDraft(null); setTimeout(() => discardTriggerRef.current?.focus(), 0); }} onConfirm={confirmDiscard} />
    </div>
  );
}

export default LimerickApp;
