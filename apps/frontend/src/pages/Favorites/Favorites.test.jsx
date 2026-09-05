import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import { MemoryRouter } from "react-router";
import { render } from "../../../tests/test-utils";
import Favorites from "./Favorites";

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

const entry = (id, poemType, privacy = "private") => ({
  favorite: { id, privacy, createdAt: `2026-01-0${id}T00:00:00.000Z` },
  poem: {
    id,
    poemType,
    title: poemType === "haiku" ? "Still Water" : "A Bright Fellow",
    lineOne: "First line",
    lineTwo: "Second line",
    lineThree: "Third line",
    ...(poemType === "limerick"
      ? { lineFour: "Fourth line", lineFive: "Fifth line" }
      : {}),
    screenname: "poet",
    createdAt: "2026-01-01T00:00:00.000Z",
    isFavorited: true,
    haikuLikes: [],
    limerickLikes: [],
    _count: { comments: 0, haikuLikes: 0, limerickLikes: 0 },
  },
});

describe("Favorites", () => {
  const renderFavorites = () =>
    render(
      <MemoryRouter>
        <Favorites />
      </MemoryRouter>,
    );

  test("shows loading and a mixed collection with visible privacy", async () => {
    const pending = deferredResponse();
    fetch.mockReturnValueOnce(pending.promise);
    renderFavorites();
    expect(screen.getByText("Loading favorites…")).toBeInTheDocument();
    await act(() => pending.resolve([entry(2, "limerick", "public"), entry(1, "haiku")]));
    expect(await screen.findByText("Still Water")).toBeInTheDocument();
    expect(screen.getByText("A Bright Fellow")).toBeInTheDocument();
    expect(screen.getByLabelText("Visibility for A Bright Fellow")).toHaveValue("public");
    expect(screen.getAllByText("Private").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Public").length).toBeGreaterThan(0);
  });

  test("shows an empty state with a feed link", async () => {
    fetch.mockReturnValueOnce(response([]));
    renderFavorites();
    expect(await screen.findByText("You have no favorites yet.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse the public poems feed" })).toHaveAttribute("href", "/poems");
  });

  test("shows a failure and retries", async () => {
    const user = userEvent.setup();
    fetch
      .mockReturnValueOnce(response({ error: "failed" }, false))
      .mockReturnValueOnce(response([]));
    renderFavorites();
    expect(await screen.findByRole("alert")).toHaveTextContent("Cannot load your favorites");
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("You have no favorites yet.")).toBeInTheDocument();
  });

  test("updates privacy in place and disables only that control while pending", async () => {
    const user = userEvent.setup();
    const pending = deferredResponse();
    fetch.mockReturnValueOnce(response([entry(1, "haiku"), entry(2, "limerick")])).mockReturnValueOnce(pending.promise);
    renderFavorites();
    const first = await screen.findByLabelText("Visibility for Still Water");
    const second = screen.getByLabelText("Visibility for A Bright Fellow");
    await user.selectOptions(first, "public");
    expect(first).toBeDisabled();
    expect(second).not.toBeDisabled();
    await act(() => pending.resolve({ privacy: "public" }));
    expect(first).toHaveValue("public");
    expect(first).toHaveFocus();
    expect(await screen.findByText("Still Water is now public.")).toBeInTheDocument();
  });

  test("preserves privacy and focus after an update failure", async () => {
    const user = userEvent.setup();
    fetch.mockReturnValueOnce(response([entry(1, "haiku")])).mockReturnValueOnce(response({ error: "failed" }, false));
    renderFavorites();
    const control = await screen.findByLabelText("Visibility for Still Water");
    await user.selectOptions(control, "public");
    expect(await screen.findByRole("alert")).toHaveTextContent("Cannot change visibility for Still Water");
    expect(control).toHaveValue("private");
    expect(control).toHaveFocus();
  });

  test("focuses the next favorite after removal", async () => {
    const user = userEvent.setup();
    fetch.mockReturnValueOnce(response([entry(1, "haiku"), entry(2, "limerick")])).mockReturnValue(response({ id: 1 }));
    renderFavorites();
    await user.click(await screen.findByRole("button", { name: "Remove from favorites: Still Water" }));
    const remaining = await screen.findByRole("button", { name: "Remove from favorites: A Bright Fellow" });
    expect(remaining).toHaveFocus();
  });

  test("focuses the previous favorite when the last item is removed", async () => {
    const user = userEvent.setup();
    fetch.mockReturnValueOnce(response([entry(1, "haiku"), entry(2, "limerick")])).mockReturnValue(response({ id: 2 }));
    renderFavorites();
    await user.click(await screen.findByRole("button", { name: "Remove from favorites: A Bright Fellow" }));
    const remaining = await screen.findByRole("button", { name: "Remove from favorites: Still Water" });
    expect(remaining).toHaveFocus();
  });

  test("focuses the heading and provides the empty destination after the last removal", async () => {
    const user = userEvent.setup();
    fetch.mockReturnValueOnce(response([entry(1, "haiku")])).mockReturnValueOnce(response({ id: 1 }));
    renderFavorites();
    await user.click(await screen.findByRole("button", { name: "Remove from favorites: Still Water" }));
    expect(await screen.findByText("You have no favorites yet.")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("heading", { name: "Your favorites" })).toHaveFocus());
  });
});
