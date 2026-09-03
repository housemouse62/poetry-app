import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import { render } from "../../tests/test-utils";
import HaikuCard from "./HaikuCard/HaikuCard";
import LimerickCard from "./LimerickCard/LimerickCard";

const response = (body, ok = true) =>
  Promise.resolve({ ok, json: () => Promise.resolve(body) });

const deferredResponse = () => {
  let resolve;
  const promise = new Promise((next) => {
    resolve = (body, ok = true) =>
      next({ ok, json: () => Promise.resolve(body) });
  });
  return { promise, resolve };
};

const cards = [
  {
    name: "HaikuCard",
    title: "Still Water",
    renderCard: () =>
      render(
        <HaikuCard
          haiku={{
            id: 1,
            title: "Still Water",
            lineOne: "One",
            lineTwo: "Two",
            lineThree: "Three",
            createdAt: "2026-01-01T00:00:00.000Z",
            haikuLikes: [],
            isFavorited: false,
          }}
          onEdit={() => {}}
          onDelete={() => {}}
        />,
      ),
  },
  {
    name: "LimerickCard",
    title: "A Bright Fellow",
    renderCard: () =>
      render(
        <LimerickCard
          limerick={{
            id: 2,
            title: "A Bright Fellow",
            lineOne: "One",
            lineTwo: "Two",
            lineThree: "Three",
            lineFour: "Four",
            lineFive: "Five",
            createdAt: "2026-01-01T00:00:00.000Z",
            limerickLikes: [],
            isFavorited: false,
          }}
          onEdit={() => {}}
          onDelete={() => {}}
        />,
      ),
  },
];

describe.each(cards)("$name favorite control", ({ title, renderCard }) => {
  test("uses accessible state and prevents duplicate requests while pending", async () => {
    const user = userEvent.setup();
    const pending = deferredResponse();
    fetch
      .mockReturnValueOnce(pending.promise)
      .mockReturnValueOnce(response({ id: 1 }));
    renderCard();

    const button = screen.getByRole("button", {
      name: `Add ${title} to favorites`,
    });
    expect(button).toHaveAttribute("aria-pressed", "false");
    button.focus();
    await user.keyboard("{Enter}");
    expect(button).toBeDisabled();
    await user.keyboard("{Enter}");
    expect(fetch).toHaveBeenCalledTimes(1);
    await act(() => pending.resolve({ id: 1, privacy: "private" }));
    const removeButton = screen.getByRole("button", {
      name: `Remove ${title} from favorites`,
    });
    expect(removeButton).toHaveAttribute("aria-pressed", "true");
    expect(removeButton).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(fetch).toHaveBeenCalledTimes(2);
    const addButton = await screen.findByRole("button", {
      name: `Add ${title} to favorites`,
    });
    expect(addButton).toHaveAttribute("aria-pressed", "false");
    expect(addButton).toHaveFocus();
  });

  test("preserves state and focus and announces a failed request", async () => {
    const user = userEvent.setup();
    fetch.mockReturnValueOnce(response({ error: "failed" }, false));
    renderCard();
    const button = screen.getByRole("button", {
      name: `Add ${title} to favorites`,
    });
    button.focus();
    await user.click(button);
    expect(await screen.findByRole("alert")).toBeVisible();
    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(button).not.toBeDisabled();
    expect(button).toHaveFocus();
  });
});
