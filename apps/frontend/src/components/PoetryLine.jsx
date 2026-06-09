import { useState, useEffect, useRef } from "react";
import { useWordData } from "../utils/useWordData";
import { getWordFromCache } from "../utils/wordCache";
import { countSyllables } from "../utils/syllableCounter";
import { useAuth } from "../context/AuthContext";
import "./PoetryLine.css";
import { useFocusTrap } from "../utils/useFocusTrap";

function PoetryLine({
  lineNumber,
  targetSyllables,
  value,
  onChange,
  onSyllableChange,
  placeholderText,
  borderColor,
  showTarget,
  rhymeInfo,
}) {
  const [currentWord, setCurrentWord] = useState(null);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flaggedWord, setFlaggedWord] = useState(null);
  const [flaggedSyllables, setFlaggedSyllables] = useState(null);
  const [showWordModal, setShowWordModal] = useState(false);
  const [showFlagConfirmModal, setShowFlagConfirmModal] = useState(false);
  const { token } = useAuth();
  const [error, setError] = useState(null);
  const flagModalRef = useRef(null);
  const wordModalRef = useRef(null);
  const confirmModalRef = useRef(null);
  const flagButtonRef = useRef(null);

  useFocusTrap(flagModalRef, showFlagModal, () => setShowFlagModal(false));
  useFocusTrap(wordModalRef, showWordModal, () => setShowWordModal(false));
  useFocusTrap(confirmModalRef, showFlagConfirmModal, () =>
    setShowFlagConfirmModal(false),
  );

  useWordData(currentWord);

  const words = value.split(" ").filter((w) => w.length > 0);
  const currentSyllables = words.reduce((total, word) => {
    const cached = getWordFromCache(word);
    return total + (cached?.syllables?.count || countSyllables(word));
  }, 0);

  let confidence = "neutral";

  if (words.length <= 0) {
    confidence = "neutral";
  } else
    for (const word of words) {
      const cached = getWordFromCache(word);
      if (cached?.source === "fallback") {
        confidence = "estimated";
        break;
      } else if (cached?.syllables) {
        confidence = "verified";
      }
    }
  useEffect(() => {
    onSyllableChange?.(currentSyllables);
  }, [currentSyllables, onSyllableChange]);

  // Parse targetSyllables — accepts a number or a range string like "7 - 10" or "5-8"
  const parseTarget = (t) => {
    if (typeof t === "number") return { min: t, max: t };
    const parts = String(t)
      .split(/\s*-\s*/)
      .map(Number);
    return parts.length === 2
      ? { min: parts[0], max: parts[1] }
      : { min: parts[0], max: parts[0] };
  };
  const { min: minSyllables, max: maxSyllables } = parseTarget(targetSyllables);

  // Determine status for styling
  let status = "under";
  if (currentSyllables < minSyllables) {
    status = "under";
  } else if (currentSyllables <= maxSyllables) {
    status = "correct";
  } else {
    status = "over";
  }

  // Calculate progress percentage — fills to 100% at minSyllables
  const progressPercentage = Math.min(
    (currentSyllables / minSyllables) * 100,
    100,
  );

  const syllableCounter = (
    <span
      data-testid="syllable-counter"
      data-confidence={confidence}
      className={`syllable-count ${confidence}`}
      aria-live="polite"
      aria-atomic="true"
      aria-label={
        showTarget
          ? `${currentSyllables} of ${targetSyllables} syllables`
          : `${currentSyllables} syllables`
      }
    >
      {showTarget ? currentSyllables + "/" + targetSyllables : currentSyllables}
    </span>
  );

  const textarea = (
    <textarea
      className={`line-input ${status}`}
      rows="1"
      aria-label={rhymeInfo}
      placeholder={placeholderText}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === " ") {
          const words = value.split(" ").filter((word) => word.length > 0);
          const lastWord = words[words.length - 1];

          if (lastWord) {
            const cleanWord = lastWord.trim();
            setCurrentWord(cleanWord);
          }
        }
      }}
    />
  );
  const flagButton = (
    <button
      ref={flagButtonRef}
      aria-label="Flag a word in this line"
      className="flag-btn"
      onClick={() => {
        setShowFlagModal(true);
      }}
    >
      🚩
    </button>
  );

  const handleWordClick = async (word, syllables) => {
    setFlaggedWord(word);
    setFlaggedSyllables(syllables);
    setShowWordModal(true);
  };

  const handleFlaggedWord = async (word) => {
    const url = `${import.meta.env.VITE_API_URL}/word/${word}/flag`;
    try {
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      await response.json();

      if (response.ok) {
        setFlaggedSyllables(null);
        setFlaggedWord(null);
        setShowFlagConfirmModal(true);
        setError(null);
      } else setError("Cannot delete. Please try again.");
    } catch (error) {
      if (import.meta.env.DEV) console.error(error);
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <>
      <div className="line-group">
        {!borderColor && (
          <div className="line-header">
            {syllableCounter}
            {flagButton}
          </div>
        )}

        {borderColor ? (
          <div className={`input-row ${borderColor}`}>
            {textarea}
            {syllableCounter}
            {flagButton}
          </div>
        ) : (
          textarea
        )}

        <div className="progress-bar" aria-hidden="true">
          <div
            className="progress-fill"
            style={{
              width: `${progressPercentage}%`,
              backgroundColor:
                status === "correct"
                  ? "#10b981"
                  : status === "over"
                    ? "#ef4444"
                    : "#fbbf24",
            }}
          />
        </div>
      </div>
      {showFlagModal && (
        <div
          className="flag-dialog-container"
          onClick={() => {
            setShowFlagModal(false);
          }}
        >
          <div
            className="flag-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialogTitle"
            ref={flagModalRef}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flag-modal-top-row">
              <h2 id="dialogTitle">Flag Word</h2>{" "}
              <button
                aria-label="Close flag dialog"
                className="cancel-flag-button"
                onClick={() => {
                  setShowFlagModal(false);
                  flagButtonRef.current?.focus();
                }}
              >
                X
              </button>
            </div>
            <p>
              Click on the word our syllable counter is counting incorrectly
            </p>
            <article className="haiku-card">
              <p className="haiku-title">{value.title}</p>
              <div className="clickable-line">
                <span className="flag-line-labels">
                  <span>syllables:</span>
                  <span>words:</span>
                </span>
                {words.map((word, index) => {
                  const cached = getWordFromCache(word);
                  const syllableCount =
                    cached?.syllables?.count || countSyllables(word);
                  return (
                    <div key={index} className="individual-word">
                      <button
                        className="clickable-word"
                        onClick={() => handleWordClick(word, syllableCount)}
                      >
                        <span className="word-syllables">{syllableCount}</span>
                        <span className="word-text">{word}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </article>
          </div>
        </div>
      )}
      {showWordModal && (
        <div
          className="word-dialog-container"
          onClick={() => {
            setShowWordModal(false);
          }}
        >
          <div
            className="word-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialogTitle"
            ref={wordModalRef}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="word-modal-top-row">
              <h2 id="dialogTitle">Confirm Flag</h2>{" "}
              <button
                aria-label="Close confirm dialog"
                className="cancel-flag-button"
                onClick={() => {
                  setShowWordModal(false);
                }}
              >
                X
              </button>
            </div>
            <article
              key={value.id}
              className="word-card"
              data-haiku-id={value.id}
            >
              <div className="flag-confirm">
                <p>Does</p>
                <p className="flagged-word">
                  <b>{flaggedWord}</b>
                </p>
                <p>have</p>
                <p className="flagged-word">{flaggedSyllables}</p>
                <p>{flaggedSyllables > 1 ? "syllables?" : "syllable"}</p>
              </div>
              <div className="yes-no-buttons">
                <button
                  className="yes-syllable"
                  onClick={() => {
                    setFlaggedSyllables(null);
                    setFlaggedWord(null);
                    setShowWordModal(false);
                    flagModalRef.current?.querySelector("button")?.focus();
                  }}
                >
                  Yes
                </button>
                <button
                  className="no-syllable"
                  onClick={() => {
                    handleFlaggedWord(flaggedWord);
                  }}
                >
                  No
                </button>
              </div>
            </article>
          </div>
        </div>
      )}
      {showFlagConfirmModal && (
        <div
          className="flagConfirm-dialog-container"
          onClick={() => setShowFlagConfirmModal(false)}
        >
          <div
            className="word-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialogTitle"
            ref={confirmModalRef}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="word-modal-top-row">
              <h4 id="dialogTitle">Word Flagged. Thank you!</h4>{" "}
              <button
                className="close-flag"
                onClick={() => {
                  setShowFlagConfirmModal(false);
                  setShowWordModal(false);
                }}
              >
                Thumbs Up!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default PoetryLine;
