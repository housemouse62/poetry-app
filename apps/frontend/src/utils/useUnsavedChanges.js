import { useCallback, useEffect, useState } from "react";
import { useBlocker } from "react-router";

export function useUnsavedChanges(snapshot) {
  const [savedSnapshot, setSavedSnapshot] = useState(snapshot);
  const isDirty = snapshot !== savedSnapshot;
  const blocker = useBlocker(isDirty);

  useEffect(() => {
    if (blocker.state !== "blocked") return;
    if (window.confirm("You have unsaved poem changes. Leave without saving?")) {
      blocker.proceed();
    } else {
      blocker.reset();
    }
  }, [blocker]);

  useEffect(() => {
    const warn = (event) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  const markSaved = useCallback((nextSnapshot) => {
    setSavedSnapshot(nextSnapshot);
  }, []);

  return { isDirty, markSaved };
}
