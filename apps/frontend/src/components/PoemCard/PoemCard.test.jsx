import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import { render } from "../../../tests/test-utils";
import PoemCard from "./PoemCard";

const poem = {
  id: 7,
  poemType: "haiku",
  title: "Still Water",
  lineOne: "An old silent pond",
  lineTwo: "A frog jumps into the pond",
  lineThree: "Splash! Silence again",
  screenname: "poet",
  createdAt: "2026-01-01T00:00:00.000Z",
  isFavorited: false,
  haikuLikes: [],
  _count: { haikuLikes: 0, comments: 0 },
};

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

describe("PoemCard", () => {
  test("allows comments to open when the poem has no comments", async () => {
    const user = userEvent.setup();
    fetch.mockReturnValueOnce(response([]));
    render(<PoemCard poem={poem} poemType="haiku" />);

    const toggle = screen.getByRole("button", { name: "Show 0 comments" });
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(await screen.findByLabelText("Add a comment")).toBeInTheDocument();
    expect(screen.getByText("No comments yet. Start the conversation.")).toBeInTheDocument();
  });

  test("creates a comment and refreshes the displayed comments", async () => {
    const user = userEvent.setup();
    const createdComment = {
      id: 12,
      commentbody: "Lovely poem",
      createdAt: "2026-01-02T00:00:00.000Z",
      author: { screenname: "reader" },
      _count: { reply: 0 },
    };
    fetch
      .mockReturnValueOnce(response([]))
      .mockReturnValueOnce(response({ id: 12 }, true))
      .mockReturnValueOnce(response([createdComment]));
    render(<PoemCard poem={poem} poemType="haiku" />);

    await user.click(screen.getByRole("button", { name: "Show 0 comments" }));
    await screen.findByText("No comments yet. Start the conversation.");
    await user.type(screen.getByLabelText("Add a comment"), "Lovely poem");
    await user.click(screen.getByRole("button", { name: "Post comment" }));

    expect(await screen.findByText("Lovely poem")).toBeInTheDocument();
    expect(fetch.mock.calls[1][1]).toMatchObject({
      method: "POST",
      body: JSON.stringify({ commentbody: "Lovely poem" }),
    });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Hide 1 comment" })).toBeInTheDocument(),
    );
  });

  test("adds and removes a private favorite with accessible state", async () => {
    const user = userEvent.setup();
    fetch
      .mockReturnValueOnce(response({ id: 1, privacy: "private" }))
      .mockReturnValueOnce(response({ id: 1 }));
    render(<PoemCard poem={poem} poemType="haiku" />);

    const addButton = screen.getByRole("button", {
      name: "Add Still Water to favorites",
    });
    expect(addButton).toHaveAttribute("aria-pressed", "false");
    await user.click(addButton);
    expect(fetch.mock.calls[0][1]).toMatchObject({
      method: "POST",
      body: JSON.stringify({ privacy: "private" }),
    });

    const removeButton = await screen.findByRole("button", {
      name: "Remove Still Water from favorites",
    });
    expect(removeButton).toHaveAttribute("aria-pressed", "true");
    await user.click(removeButton);
    expect(fetch.mock.calls[1][1].method).toBe("DELETE");
    expect(
      await screen.findByRole("button", {
        name: "Add Still Water to favorites",
      }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  test("prevents duplicate favorite requests while one is pending", async () => {
    const user = userEvent.setup();
    const pending = deferredResponse();
    fetch.mockReturnValueOnce(pending.promise);
    render(<PoemCard poem={poem} poemType="haiku" />);

    const button = screen.getByRole("button", {
      name: "Add Still Water to favorites",
    });
    await user.click(button);
    expect(button).toBeDisabled();
    await user.click(button);
    expect(fetch).toHaveBeenCalledTimes(1);
    await act(() => pending.resolve({ id: 1, privacy: "private" }));
  });

  test("keeps favorite state and shows an error when favorite creation fails", async () => {
    const user = userEvent.setup();
    fetch.mockReturnValueOnce(response({ error: "failed" }, false));
    render(<PoemCard poem={poem} poemType="haiku" />);

    const button = screen.getByRole("button", {
      name: "Add Still Water to favorites",
    });
    await user.click(button);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Cannot update this favorite. Please try again.",
    );
    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(button).not.toBeDisabled();
  });

  test("keeps focus for successive keyboard like and unlike actions", async () => {
    const user = userEvent.setup();
    const pending = deferredResponse();
    fetch
      .mockReturnValueOnce(pending.promise)
      .mockReturnValueOnce(response({ id: 1 }));
    render(<PoemCard poem={poem} poemType="haiku" />);

    const likeButton = screen.getByRole("button", {
      name: "Like poem: Still Water",
    });
    likeButton.focus();
    await user.keyboard("{Enter}");
    expect(likeButton).toBeDisabled();
    await user.keyboard("{Enter}");
    expect(fetch).toHaveBeenCalledTimes(1);

    await act(() => pending.resolve({ id: 1 }));
    const unlikeButton = screen.getByRole("button", {
      name: "Unlike poem: Still Water",
    });
    expect(unlikeButton).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("1 like")).toBeInTheDocument();
    expect(unlikeButton).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(fetch).toHaveBeenCalledTimes(2);
    const restoredLikeButton = await screen.findByRole("button", {
      name: "Like poem: Still Water",
    });
    expect(restoredLikeButton).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("0 likes")).toBeInTheDocument();
    expect(restoredLikeButton).toHaveFocus();
  });

  test("restores like-button focus and state after a failed request", async () => {
    const user = userEvent.setup();
    fetch.mockReturnValueOnce(response({ error: "failed" }, false));
    render(<PoemCard poem={poem} poemType="haiku" />);

    const button = screen.getByRole("button", {
      name: "Like poem: Still Water",
    });
    button.focus();
    await user.keyboard("{Enter}");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Cannot update this like. Please try again.",
    );
    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(button).not.toBeDisabled();
    expect(button).toHaveFocus();
    expect(screen.getByText("0 likes")).toBeInTheDocument();
  });

  test("ignores an older comment load after close and reopen", async () => {
    const user = userEvent.setup();
    const older = deferredResponse();
    const newer = deferredResponse();
    fetch
      .mockReturnValueOnce(older.promise)
      .mockReturnValueOnce(newer.promise);
    render(<PoemCard poem={poem} poemType="haiku" />);

    await user.click(screen.getByRole("button", { name: "Show 0 comments" }));
    await user.click(screen.getByRole("button", { name: "Hide 0 comments" }));
    await user.click(screen.getByRole("button", { name: "Show 0 comments" }));
    await act(() => newer.resolve([]));
    expect(await screen.findByText("No comments yet. Start the conversation.")).toBeInTheDocument();
    await act(() => older.resolve([{ id: 99, commentbody: "Stale" }]));
    expect(screen.queryByText("Stale")).not.toBeInTheDocument();
  });

  test("keeps loading until the post-submission comment refresh finishes", async () => {
    const user = userEvent.setup();
    const initial = deferredResponse();
    const refresh = deferredResponse();
    const createdComment = {
      id: 12,
      commentbody: "Newest comment",
      createdAt: "2026-01-02T00:00:00.000Z",
      author: { screenname: "reader" },
      _count: { reply: 0 },
    };
    fetch
      .mockReturnValueOnce(initial.promise)
      .mockReturnValueOnce(response({ id: 12 }))
      .mockReturnValueOnce(refresh.promise);
    render(<PoemCard poem={poem} poemType="haiku" />);

    await user.click(screen.getByRole("button", { name: "Show 0 comments" }));
    await user.type(screen.getByLabelText("Add a comment"), "Newest comment");
    await user.click(screen.getByRole("button", { name: "Post comment" }));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3));
    await act(() => initial.resolve([]));
    expect(screen.getByText("Loading comments…")).toBeInTheDocument();
    await act(() => refresh.resolve([createdComment]));
    expect(await screen.findByText("Newest comment")).toBeInTheDocument();
  });

  test("cancels then confirms comment deletion, updates the count, and focuses the comment input", async () => {
    const user = userEvent.setup();
    const ownedComment = {
      id: 12,
      commentbody: "Delete this comment",
      createdAt: "2026-01-02T00:00:00.000Z",
      authorID: 1,
      author: { screenname: "testuser" },
      commentLikes: [],
      _count: { reply: 0, commentLikes: 0 },
    };
    fetch
      .mockReturnValueOnce(response([ownedComment]))
      .mockReturnValueOnce(response(ownedComment));
    render(
      <PoemCard
        poem={{ ...poem, _count: { ...poem._count, comments: 1 } }}
        poemType="haiku"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Show 1 comment" }));
    await screen.findByText("Delete this comment");
    const deleteButton = screen.getByRole("button", {
      name: "Delete comment by testuser",
    });
    await user.click(deleteButton);
    const cancel = screen.getByRole("button", { name: "Cancel delete" });
    expect(cancel).toHaveFocus();
    await user.click(cancel);
    expect(deleteButton).toHaveFocus();

    await user.click(deleteButton);
    await user.click(screen.getByRole("button", { name: "Confirm delete" }));

    expect(screen.queryByText("Delete this comment")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hide 0 comments" })).toBeVisible();
    expect(screen.getByLabelText("Add a comment")).toHaveFocus();
    expect(screen.getByRole("status")).toHaveTextContent("Comment deleted.");
  });
});
