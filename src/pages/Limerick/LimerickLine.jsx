// LimerickLine.jsx
import { countSyllables } from "./syllableCounter";
import "./LimerickLine.css";

function LimerickLine({ lineNumber, targetSyllables, value, onChange }) {
  const currentSyllables = countSyllables(value);

  // Determine status for styling
  let status = "under";
  if (currentSyllables < targetSyllables) {
    status = "under";
  } else if (currentSyllables >= targetSyllables) {
    status = "correct";
  }

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
        />
        <span className={`limerick-syllable-count ${status}`}>
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
