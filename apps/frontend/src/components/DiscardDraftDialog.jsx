import { useEffect, useRef } from "react";
import { useFocusTrap } from "../utils/useFocusTrap";

export default function DiscardDraftDialog({ draft, poemType, onCancel, onConfirm }) {
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);
  useFocusTrap(dialogRef, Boolean(draft), onCancel);

  useEffect(() => {
    if (draft) cancelRef.current?.focus();
  }, [draft]);

  if (!draft) return null;
  const name = draft.title.trim() || "Untitled draft";

  return (
    <div className={`${poemType}-dialog-container`} onClick={onCancel}>
      <div
        ref={dialogRef}
        className={`${poemType}-dialog`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`discard-${poemType}-title`}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={`discard-${poemType}-title`}>Discard draft?</h2>
        <p>Discard “{name}”? This cannot be undone.</p>
        <div className={`${poemType}-modal-button-row`}>
          <button ref={cancelRef} type="button" onClick={onCancel}>Cancel</button>
          <button type="button" onClick={onConfirm}>Discard draft</button>
        </div>
      </div>
    </div>
  );
}
