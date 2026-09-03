import { useEffect, useEffectEvent } from "react";

export function useFocusTrap(ref, isOpen, onClose) {
  const close = useEffectEvent(() => onClose(false));

  useEffect(() => {
    if (!isOpen) return;
    const returnFocusTarget = document.activeElement;
    const dialog = ref.current;
    const focusable = dialog
      ? Array.from(
          dialog.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          ),
        )
      : [];
    if (focusable.length) focusable[0].focus();
    const handleKeyDown = (e) => {
      if (!dialog?.contains(document.activeElement)) return;

      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key === "Tab" && focusable.length) {
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (
        returnFocusTarget?.isConnected &&
        typeof returnFocusTarget.focus === "function" &&
        !returnFocusTarget.hasAttribute?.("disabled")
      ) {
        returnFocusTarget.focus();
      }
    };
  }, [isOpen, ref]);
}
