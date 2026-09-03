import { useRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "../../tests/test-utils";
import { useFocusTrap } from "./useFocusTrap";

function DialogHarness({ removeOpenerOnClose = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showOpener, setShowOpener] = useState(true);
  const dialogRef = useRef(null);

  useFocusTrap(dialogRef, isOpen, () => setIsOpen(false));

  return (
    <>
      {showOpener && <button onClick={() => setIsOpen(true)}>Open</button>}
      {isOpen && (
        <div ref={dialogRef} role="dialog" aria-label="Example dialog">
          <button
            onClick={() => {
              setIsOpen(false);
              if (removeOpenerOnClose) setShowOpener(false);
            }}
          >
            Close
          </button>
          <button>Last</button>
        </div>
      )}
    </>
  );
}

function NestedDialogHarness() {
  const [parentOpen, setParentOpen] = useState(false);
  const [childOpen, setChildOpen] = useState(false);
  const parentRef = useRef(null);
  const childRef = useRef(null);
  const closeParent = vi.fn(() => setParentOpen(false));

  useFocusTrap(parentRef, parentOpen, closeParent);
  useFocusTrap(childRef, childOpen, () => setChildOpen(false));

  return (
    <>
      <button onClick={() => setParentOpen(true)}>Open parent</button>
      {parentOpen && (
        <div ref={parentRef} role="dialog" aria-label="Parent dialog">
          <button onClick={() => setChildOpen(true)}>Open child</button>
        </div>
      )}
      {childOpen && (
        <div ref={childRef} role="dialog" aria-label="Child dialog">
          <button>Child close</button>
        </div>
      )}
      <output data-testid="parent-close-count">{closeParent.mock.calls.length}</output>
    </>
  );
}

describe("useFocusTrap", () => {
  it("moves initial focus into the dialog", async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);

    await user.click(screen.getByRole("button", { name: "Open" }));

    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
  });

  it("restores focus after a state-driven close", async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);
    const opener = screen.getByRole("button", { name: "Open" });

    await user.click(opener);
    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(opener).toHaveFocus();
  });

  it("restores focus after Escape closes the dialog", async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);
    const opener = screen.getByRole("button", { name: "Open" });

    await user.click(opener);
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it("does not focus an opener removed during close", async () => {
    const user = userEvent.setup();
    render(<DialogHarness removeOpenerOnClose />);
    const opener = screen.getByRole("button", { name: "Open" });
    const focusSpy = vi.spyOn(opener, "focus");

    await user.click(opener);
    focusSpy.mockClear();
    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(opener).not.toBeInTheDocument();
    expect(focusSpy).not.toHaveBeenCalled();
  });

  it("Escape closes only the active nested dialog and restores its opener", async () => {
    const user = userEvent.setup();
    render(<NestedDialogHarness />);

    await user.click(screen.getByRole("button", { name: "Open parent" }));
    const childOpener = screen.getByRole("button", { name: "Open child" });
    await user.click(childOpener);
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog", { name: "Child dialog" })).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Parent dialog" })).toBeVisible();
    expect(screen.getByTestId("parent-close-count")).toHaveTextContent("0");
    expect(childOpener).toHaveFocus();
  });
});
