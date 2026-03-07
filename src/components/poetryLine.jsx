import { useState, useEffect } from "react";
import { useWordData } from "../utils/useWordData";
import { getWordFromCache } from "../utils/wordCache";
import { countSyllables } from "../utils/syllableCounter";
import "./PoetryLine.css";

function PoetryLine({
  lineNumber,
  targetSyllables,
  value,
  onChange,
  onSyllableChange,
  placeholderText,
  borderColor,
  showTarget,
}) {
  const [currentWord, setCurrentWord] = useState(null);

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
  }, [currentSyllables]);

  // Parse targetSyllables — accepts a number or a range string like "7 - 10" or "5-8"
  const parseTarget = (t) => {
    if (typeof t === "number") return { min: t, max: t };
    const parts = String(t).split(/\s*-\s*/).map(Number);
    return parts.length === 2 ? { min: parts[0], max: parts[1] } : { min: parts[0], max: parts[0] };
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
      {showTarget
        ? currentSyllables + "/" + targetSyllables
        : currentSyllables}
    </span>
  );

  const textarea = (
    <textarea
      className={`line-input ${status}`}
      rows="1"
      aria-label={`Line ${lineNumber}, ${targetSyllables} syllables`}
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

  return (
    <div className="line-group">
      {!borderColor && (
        <div className="line-header">
          {syllableCounter}
        </div>
      )}

      {borderColor ? (
        <div className={`input-row ${borderColor}`}>
          {textarea}
          {syllableCounter}
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
  );
}

export default PoetryLine;
