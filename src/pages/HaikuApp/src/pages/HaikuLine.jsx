// HaikuLine.jsx
// import { countSyllables } from "./syllableCounter";
import { useState } from "react";
import { useWordData } from "./WordFind";
import "./HaikuLine.css";

function HaikuLine({ lineNumber, targetSyllables, value, onChange }) {
  const [currentWord, setCurrentWord] = useState(null);

  useWordData(currentWord);

  const currentSyllables = 0;

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
        <span className={`syllable-count ${status}`}>
          {currentSyllables}/{targetSyllables}
        </span>
      </div>

      <textarea
        className={`line-input ${status}`}
        rows="1"
        placeholder={`Line ${lineNumber} (${targetSyllables} syllables)`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === " ") {
            const words = value.split(" ").filter((word) => word.length > 0);
            const lastWord = words[words.length - 1];
            const cleanWord = lastWord.trim();
            setCurrentWord(cleanWord);
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
