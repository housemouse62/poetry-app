import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "../../tests/test-utils";
import HaikuCard from "./HaikuCard/HaikuCard";
import LimerickCard from "./LimerickCard/LimerickCard";

vi.mock("html2canvas", () => ({ default: vi.fn() }));

const commonPoem = {
  id: 1,
  title: "Focus poem",
  createdAt: "2026-01-01T00:00:00.000Z",
  isFavorited: false,
};

const haiku = {
  ...commonPoem,
  lineOne: "one",
  lineTwo: "two",
  lineThree: "three",
  haikuLikes: [],
};

const limerick = {
  ...commonPoem,
  lineOne: "one",
  lineTwo: "two",
  lineThree: "three",
  lineFour: "four",
  lineFive: "five",
  limerickLikes: [],
};

describe("card dialog focus", () => {
  it("restores the Haiku delete opener when Cancel closes the dialog", async () => {
    const user = userEvent.setup();
    render(<HaikuCard haiku={haiku} onEdit={() => {}} onDelete={() => {}} />);
    const opener = screen.getByRole("button", {
      name: "Delete haiku: Focus poem",
    });

    await user.click(opener);
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(opener).toHaveFocus();
  });

  it("traps focus in the Limerick delete dialog and restores it on Escape", async () => {
    const user = userEvent.setup();
    render(
      <LimerickCard
        limerick={limerick}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );
    const opener = screen.getByRole("button", {
      name: "Delete limerick: Focus poem",
    });

    await user.click(opener);
    const confirm = screen.getByRole("button", { name: "Confirm" });
    const cancel = screen.getByRole("button", { name: "Cancel" });
    expect(confirm).toHaveFocus();

    await user.keyboard("{Shift>}{Tab}{/Shift}");
    expect(cancel).toHaveFocus();
    await user.keyboard("{Tab}");
    expect(confirm).toHaveFocus();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it("restores the Limerick download opener when Escape closes the dialog", async () => {
    const user = userEvent.setup();
    render(
      <LimerickCard
        limerick={limerick}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );
    const opener = screen.getByRole("button", {
      name: "Download limerick: Focus poem",
    });

    await user.click(opener);
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });
});
