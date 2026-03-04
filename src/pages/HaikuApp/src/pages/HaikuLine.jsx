// HaikuLine.jsx
// import { countSyllables } from "./syllableCounter";
import { useState, useEffect } from "react";
import { useWordData } from "./WordFind";
import "./HaikuLine.css";
import { getWordFromCache } from "../../../../utils/wordCache";
import { countSyllables } from "./syllableCounter";

function HaikuLine({
  lineNumber,
  targetSyllables,
  value,
  onChange,
  onSyllableChange,
}) {
  const [currentWord, setCurrentWord] = useState(null);
  // const [syllableCount, setSyllableCount] = useState(0);

  const { wordData } = useWordData(currentWord);

  const words = value.split(" ").filter((w) => w.length > 0);

  console.log("words array", words);
  const currentSyllables = words.reduce((total, word) => {
    const cached = getWordFromCache(word);
    console.log(`cache for "${word}":`, cached);
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

  console.log("total syllables:", currentSyllables);

  // Determine status for styling
  let status = "under";
  if (currentSyllables < targetSyllables) {
    status = "under";
  } else if (currentSyllables === targetSyllables) {
    status = "correct";
  } else if (currentSyllables > targetSyllables) {
    status = "over";
  }

  // Calculate progress percentage
  const progressPercentage = Math.min(
    (currentSyllables / targetSyllables) * 100,
    100,
  );

  return (
    <div className="line-group">
      <div className="line-header">
        <span className="line-label">Line {lineNumber}</span>
        <span
          data-testid="syllable-counter"
          data-confidence={confidence}
          className={`syllable-count ${confidence}`}
          aria-live="polite"
          aria-atomic="true"
          aria-label={`${currentSyllables} of ${targetSyllables} syllables`}
        >
          {currentSyllables}/{targetSyllables}
        </span>
      </div>

      <textarea
        className={`line-input ${status}`}
        rows="1"
        aria-label={`Line ${lineNumber}, ${targetSyllables} syllables`}
        placeholder={`Line ${lineNumber} (${targetSyllables} syllables)`}
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

      <div className="progress-bar">
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

export default HaikuLine;
