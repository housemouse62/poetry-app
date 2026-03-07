// LimerickLine.jsx
import { useState, useEffect } from "react";
import { useWordData } from "../../utils/useWordData";
import "./LimerickLine.css";
import { getWordFromCache } from "../../utils/wordCache";
import { countSyllables } from "../../utils/syllableCounter";

function LimerickLine({
  lineNumber,
  targetSyllables,
  value,
  onChange,
  onSyllableChange,
  ...rest
}) {
  const [currentWord, setCurrentWord] = useState(null);

  useWordData(currentWord);

  const words = value.split(" ").filter((w) => w.length > 0);

  const currentSyllables = words.reduce((total, word) => {
    const cached = getWordFromCache(word);
    return total + (cached?.syllables?.count || countSyllables(word));
  }, 0);

  let confidence = "neutral";

  // Determine confidence of syllables for styling
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

  // Calculate progress percentage
  const progressPercentage = Math.min(
    (currentSyllables / targetSyllables) * 100,
    100,
  );

  // Different Border Colors for lines with less syllables
  const borderColor =
    lineNumber === 3 || lineNumber === 4 ? "#f59e0b" : "#10b981";
  const numSyllables =
    lineNumber === 3 || lineNumber === 4 ? "5 - 7" : "7 - 10";

  return (
    <div className="limerick-line-group">
      <div className="limerick-input-row" style={{ borderColor: borderColor }}>
        <textarea
          className={`limerick-line-input ${status}`}
          rows="1"
          placeholder={`Line ${lineNumber} (${numSyllables} syllables)`}
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
          {...rest}
        />
        <span
          data-testid="limerick-syllable-counter"
          data-confidence={confidence}
          className={`limerick-syllable-count ${confidence}`}
          aria-live="polite"
          aria-atomic="true"
          aria-label={`${currentSyllables} syllables`}
        >
          {currentSyllables}{" "}
        </span>
      </div>
      <div className="limerick-progress-bar">
        <div
          className="limerick-progress-fill"
          style={{
            width: `${progressPercentage}%`,
            backgroundColor: status === "correct" ? "#10b981" : "#fbbf24",
          }}
        />
      </div>
    </div>
  );
}

export default LimerickLine;
