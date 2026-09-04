import { useState } from "react";
import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { render } from "../../../tests/test-utils";
import CommentCard from "./CommentCard";

const comment = {
  id: 3,
  commentbody: "A comment",
  createdAt: "2026-01-01T00:00:00.000Z",
  authorID: 1,
  author: { screenname: "reader" },
  _count: { reply: 1, commentLikes: 0 },
  commentLikes: [],
};

const reply = {
  id: 9,
  replybody: "A reply",
  createdAt: "2026-01-02T00:00:00.000Z",
  authorID: 1,
  author: { screenname: "poet" },
  _count: { replyLikes: 0 },
  replyLikes: [],
};

const response = (body) =>
  Promise.resolve({ ok: true, json: () => Promise.resolve(body) });

const deferredResponse = () => {
  let resolve;
  const promise = new Promise((next) => {
    resolve = (body, ok = true) =>
      next({ ok, json: () => Promise.resolve(body) });
  });
  return { promise, resolve };
};

describe("CommentCard", () => {
  test("synchronizes editable text and like state when a mounted item is refreshed", async () => {
    const user = userEvent.setup();

    function RefreshHarness() {
      const [currentComment, setCurrentComment] = useState(comment);
      return (
        <>
          <button
            type="button"
            onClick={() =>
              setCurrentComment({
                ...comment,
                commentbody: "Refreshed comment",
                commentLikes: [{ id: 21 }],
                _count: { ...comment._count, commentLikes: 2 },
              })
            }
          >
            Refresh item
          </button>
          <CommentCard
            comment={currentComment}
            poemType="haiku"
            onCommentUpdated={setCurrentComment}
            onCommentDeleted={() => {}}
            commentInputRef={{ current: null }}
          />
        </>
      );
    }

    render(<RefreshHarness />);
    await user.click(screen.getByRole("button", { name: "Refresh item" }));

    expect(screen.getByText("Refreshed comment")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Unlike comment by reader" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("2 likes")).toBeVisible();

    await user.click(
      screen.getByRole("button", { name: "Edit comment by reader" }),
    );
    expect(
      screen.getByRole("textbox", { name: "Edit comment by reader" }),
    ).toHaveValue("Refreshed comment");
  });

  test("applies like state from a refresh that arrives during a failed like request", async () => {
    const user = userEvent.setup();
    const pending = deferredResponse();
    fetch.mockReturnValueOnce(pending.promise);

    function PendingRefreshHarness() {
      const [currentComment, setCurrentComment] = useState(comment);
      return (
        <>
          <button
            type="button"
            onClick={() =>
              setCurrentComment({
                ...comment,
                commentbody: "Newer server comment",
                commentLikes: [{ id: 22 }],
                _count: { ...comment._count, commentLikes: 3 },
              })
            }
          >
            Refresh while pending
          </button>
          <CommentCard
            comment={currentComment}
            poemType="haiku"
            onCommentUpdated={setCurrentComment}
            onCommentDeleted={() => {}}
            commentInputRef={{ current: null }}
          />
        </>
      );
    }

    render(<PendingRefreshHarness />);
    await user.click(
      screen.getByRole("button", { name: "Like comment by reader" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Refresh while pending" }),
    );
    await act(() => pending.resolve({ error: "failed" }, false));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Cannot update this comment like. Please try again.",
    );
    expect(screen.getByText("Newer server comment")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Unlike comment by reader" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("3 likes")).toBeVisible();
  });

  test("merges a successful like into the newest item received while pending", async () => {
    const user = userEvent.setup();
    const pending = deferredResponse();
    fetch.mockReturnValueOnce(pending.promise);

    function PendingSuccessHarness() {
      const [currentComment, setCurrentComment] = useState(comment);
      return (
        <>
          <button
            type="button"
            onClick={() =>
              setCurrentComment({
                ...comment,
                commentbody: "Newest comment body",
                _count: { ...comment._count, commentLikes: 4 },
              })
            }
          >
            Refresh count
          </button>
          <CommentCard
            comment={currentComment}
            poemType="haiku"
            onCommentUpdated={setCurrentComment}
            onCommentDeleted={() => {}}
            commentInputRef={{ current: null }}
          />
        </>
      );
    }

    render(<PendingSuccessHarness />);
    await user.click(
      screen.getByRole("button", { name: "Like comment by reader" }),
    );
    await user.click(screen.getByRole("button", { name: "Refresh count" }));
    await act(() => pending.resolve({ id: 23 }));

    expect(screen.getByText("Newest comment body")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Unlike comment by reader" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("5 likes")).toBeVisible();
  });

  test("shows author controls only to the author", () => {
    render(
      <CommentCard
        comment={{ ...comment, authorID: 2 }}
        poemType="haiku"
        onCommentUpdated={() => {}}
        onCommentDeleted={() => {}}
        commentInputRef={{ current: null }}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Edit comment by reader" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete comment by reader" }),
    ).not.toBeInTheDocument();
  });

  test("edits a comment and restores focus to Edit", async () => {
    const user = userEvent.setup();
    const onCommentUpdated = vi.fn();
    fetch.mockReturnValueOnce(
      response({ ...comment, commentbody: "An edited comment" }),
    );
    render(
      <CommentCard
        comment={comment}
        poemType="haiku"
        onCommentUpdated={onCommentUpdated}
        onCommentDeleted={() => {}}
        commentInputRef={{ current: null }}
      />,
    );
    const editButton = screen.getByRole("button", {
      name: "Edit comment by reader",
    });

    await user.click(editButton);
    const input = screen.getByRole("textbox", {
      name: "Edit comment by reader",
    });
    expect(input).toHaveFocus();
    expect(input).toHaveValue("A comment");
    expect(input).toHaveAttribute("maxlength", "600");
    await user.clear(input);
    await user.type(input, "An edited comment");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/haikucomment/3"),
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ commentbody: "An edited comment" }),
      }),
    );
    expect(onCommentUpdated).toHaveBeenCalled();
    await waitFor(() => expect(editButton).toHaveFocus());
  });

  test("merges a successful edit into the newest item received while pending", async () => {
    const user = userEvent.setup();
    const pending = deferredResponse();
    fetch.mockReturnValueOnce(pending.promise);

    function PendingEditHarness() {
      const [currentComment, setCurrentComment] = useState(comment);
      return (
        <>
          <button
            type="button"
            onClick={() =>
              setCurrentComment({
                ...comment,
                commentbody: "Newer server comment",
                commentLikes: [{ id: 24 }],
                _count: { ...comment._count, commentLikes: 3 },
              })
            }
          >
            Refresh while editing
          </button>
          <CommentCard
            comment={currentComment}
            poemType="haiku"
            onCommentUpdated={setCurrentComment}
            onCommentDeleted={() => {}}
            commentInputRef={{ current: null }}
          />
        </>
      );
    }

    render(<PendingEditHarness />);
    await user.click(
      screen.getByRole("button", { name: "Edit comment by reader" }),
    );
    const input = screen.getByRole("textbox", {
      name: "Edit comment by reader",
    });
    await user.clear(input);
    await user.type(input, "Edited comment");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await user.click(
      screen.getByRole("button", { name: "Refresh while editing" }),
    );
    await act(() =>
      pending.resolve({
        id: comment.id,
        commentbody: "Edited comment",
        authorID: comment.authorID,
        poemID: 7,
        createdAt: comment.createdAt,
        updatedAt: "2026-01-03T00:00:00.000Z",
      }),
    );

    expect(await screen.findByText("Edited comment")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Unlike comment by reader" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("3 likes")).toBeVisible();
  });

  test("cancels an edit without changing the comment", async () => {
    const user = userEvent.setup();
    render(
      <CommentCard
        comment={comment}
        poemType="haiku"
        onCommentUpdated={() => {}}
        onCommentDeleted={() => {}}
        commentInputRef={{ current: null }}
      />,
    );
    const editButton = screen.getByRole("button", {
      name: "Edit comment by reader",
    });

    await user.click(editButton);
    await user.type(
      screen.getByRole("textbox", { name: "Edit comment by reader" }),
      " changed",
    );
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByText("A comment")).toBeVisible();
    expect(editButton).toHaveFocus();
    expect(fetch).not.toHaveBeenCalled();
  });

  test("preserves an edit draft and disables controls while saving", async () => {
    const user = userEvent.setup();
    const pending = deferredResponse();
    fetch.mockReturnValueOnce(pending.promise);
    render(
      <CommentCard
        comment={comment}
        poemType="haiku"
        onCommentUpdated={() => {}}
        onCommentDeleted={() => {}}
        commentInputRef={{ current: null }}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Edit comment by reader" }),
    );
    const input = screen.getByRole("textbox", {
      name: "Edit comment by reader",
    });
    await user.clear(input);
    await user.type(input, "Draft comment");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    expect(input).toBeDisabled();
    expect(fetch).toHaveBeenCalledTimes(1);

    await act(() => pending.resolve({ error: "failed" }, false));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Cannot update this comment. Please try again.",
    );
    expect(input).toHaveValue("Draft comment");
    expect(input).not.toBeDisabled();
  });

  test("hydrates, likes, and unlikes a comment with accessible state", async () => {
    const user = userEvent.setup();
    fetch
      .mockReturnValueOnce(response({ id: 20 }))
      .mockReturnValueOnce(response({ id: 20 }));
    render(
      <CommentCard
        comment={{
          ...comment,
          commentLikes: [{ id: 20 }],
          _count: { ...comment._count, commentLikes: 1 },
        }}
        poemType="haiku"
        onCommentUpdated={() => {}}
        onCommentDeleted={() => {}}
        commentInputRef={{ current: null }}
      />,
    );

    const unlike = screen.getByRole("button", {
      name: "Unlike comment by reader",
    });
    expect(unlike).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("1 like")).toBeVisible();
    await user.click(unlike);
    expect(fetch.mock.calls[0][1].method).toBe("DELETE");

    const like = await screen.findByRole("button", {
      name: "Like comment by reader",
    });
    expect(like).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("0 likes")).toBeVisible();
    await user.click(like);
    expect(fetch.mock.calls[1][1].method).toBe("POST");
  });

  test("keeps keyboard focus on the comment like control across repeated toggles", async () => {
    const user = userEvent.setup();
    fetch
      .mockReturnValueOnce(response({ id: 20 }))
      .mockReturnValueOnce(response({ id: 20 }));
    render(
      <CommentCard
        comment={comment}
        poemType="haiku"
        onCommentUpdated={() => {}}
        onCommentDeleted={() => {}}
        commentInputRef={{ current: null }}
      />,
    );

    await user.tab();
    const like = screen.getByRole("button", {
      name: "Like comment by reader",
    });
    expect(like).toHaveFocus();
    await user.keyboard("{Enter}");

    const unlike = await screen.findByRole("button", {
      name: "Unlike comment by reader",
    });
    await waitFor(() => expect(unlike).not.toBeDisabled());
    expect(unlike).toHaveFocus();
    await user.keyboard("{Enter}");

    const restoredLike = await screen.findByRole("button", {
      name: "Like comment by reader",
    });
    await waitFor(() => expect(restoredLike).not.toBeDisabled());
    expect(restoredLike).toHaveFocus();
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  test("prevents duplicate likes and preserves state after a failure", async () => {
    const user = userEvent.setup();
    const pending = deferredResponse();
    fetch.mockReturnValueOnce(pending.promise);
    render(
      <CommentCard
        comment={comment}
        poemType="haiku"
        onCommentUpdated={() => {}}
        onCommentDeleted={() => {}}
        commentInputRef={{ current: null }}
      />,
    );
    const like = screen.getByRole("button", { name: "Like comment by reader" });

    await user.click(like);
    expect(like).toBeDisabled();
    await user.click(like);
    expect(fetch).toHaveBeenCalledTimes(1);
    await act(() => pending.resolve({ error: "failed" }, false));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Cannot update this comment like. Please try again.",
    );
    expect(like).toHaveAttribute("aria-pressed", "false");
    expect(like).not.toBeDisabled();
  });

  test("prevents duplicate deletion and preserves the comment after failure", async () => {
    const user = userEvent.setup();
    const pending = deferredResponse();
    fetch.mockReturnValueOnce(pending.promise);
    render(
      <CommentCard
        comment={comment}
        poemType="haiku"
        onCommentUpdated={() => {}}
        onCommentDeleted={() => {}}
        commentInputRef={{ current: null }}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Delete comment by reader" }),
    );
    const confirm = screen.getByRole("button", { name: "Confirm delete" });
    await user.click(confirm);
    expect(screen.getByRole("button", { name: "Deleting…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel delete" })).toBeDisabled();
    await user.click(confirm);
    expect(fetch).toHaveBeenCalledTimes(1);

    await act(() => pending.resolve({ error: "failed" }, false));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Cannot delete this comment. Please try again.",
    );
    expect(screen.getByText("A comment")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Confirm delete" }),
    ).not.toBeDisabled();
  });

  test("loads, collapses, and reopens replies without refetching", async () => {
    const user = userEvent.setup();
    fetch.mockReturnValueOnce(response([reply]));
    render(<CommentCard comment={comment} poemType="haiku" />);

    await user.click(screen.getByRole("button", { name: "Show 1 reply" }));
    expect(await screen.findByText("A reply")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Hide 1 reply" }));
    expect(screen.queryByText("A reply")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Show 1 reply" }));
    expect(screen.getByText("A reply")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test("creates a reply and refreshes the reply list", async () => {
    const user = userEvent.setup();
    fetch
      .mockReturnValueOnce(response([]))
      .mockReturnValueOnce(response({ id: 9 }))
      .mockReturnValueOnce(response([reply]));
    render(
      <CommentCard
        comment={{ ...comment, _count: { reply: 0 } }}
        poemType="haiku"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Show 0 replies" }));
    await user.type(screen.getByLabelText("Add a reply"), "A reply");
    await user.click(screen.getByRole("button", { name: "Post reply" }));

    expect(await screen.findByText("A reply")).toBeInTheDocument();
    expect(fetch.mock.calls[1][1]).toMatchObject({
      method: "POST",
      body: JSON.stringify({ replybody: "A reply" }),
    });
  });

  test("ignores an older reply load after close and reopen", async () => {
    const user = userEvent.setup();
    const older = deferredResponse();
    const newer = deferredResponse();
    fetch
      .mockReturnValueOnce(older.promise)
      .mockReturnValueOnce(newer.promise);
    render(<CommentCard comment={comment} poemType="haiku" />);

    await user.click(screen.getByRole("button", { name: "Show 1 reply" }));
    await user.click(screen.getByRole("button", { name: "Hide 1 reply" }));
    await user.click(screen.getByRole("button", { name: "Show 1 reply" }));
    await act(() => newer.resolve([reply]));
    expect(await screen.findByText("A reply")).toBeInTheDocument();
    await act(() =>
      older.resolve([{ ...reply, id: 99, replybody: "Stale reply" }]),
    );
    expect(screen.queryByText("Stale reply")).not.toBeInTheDocument();
  });

  test("keeps loading until the post-submission reply refresh finishes", async () => {
    const user = userEvent.setup();
    const initial = deferredResponse();
    const refresh = deferredResponse();
    fetch
      .mockReturnValueOnce(initial.promise)
      .mockReturnValueOnce(response({ id: 9 }))
      .mockReturnValueOnce(refresh.promise);
    render(<CommentCard comment={comment} poemType="haiku" />);

    await user.click(screen.getByRole("button", { name: "Show 1 reply" }));
    await user.type(screen.getByLabelText("Add a reply"), "A reply");
    await user.click(screen.getByRole("button", { name: "Post reply" }));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3));
    await act(() => initial.resolve([]));
    expect(screen.getByText("Loading replies…")).toBeInTheDocument();
    await act(() => refresh.resolve([reply]));
    expect(await screen.findByText("A reply")).toBeInTheDocument();
  });

  test("edits a limerick reply using the reply route and body field", async () => {
    const user = userEvent.setup();
    fetch
      .mockReturnValueOnce(response([reply]))
      .mockReturnValueOnce(
        response({ ...reply, replybody: "Edited limerick reply" }),
      );
    render(
      <CommentCard
        comment={comment}
        poemType="limerick"
        onCommentUpdated={() => {}}
        onCommentDeleted={() => {}}
        commentInputRef={{ current: null }}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Show 1 reply" }));
    await screen.findByText("A reply");
    await user.click(screen.getByRole("button", { name: "Edit reply by poet" }));
    const input = screen.getByRole("textbox", { name: "Edit reply by poet" });
    await user.clear(input);
    await user.type(input, "Edited limerick reply");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(fetch.mock.calls[1][0]).toContain("/limerickreply/9");
    expect(fetch.mock.calls[1][1]).toMatchObject({
      method: "PATCH",
      body: JSON.stringify({ replybody: "Edited limerick reply" }),
    });
    expect(await screen.findByText("Edited limerick reply")).toBeVisible();
  });

  test("cancels then confirms reply deletion and focuses the reply input", async () => {
    const user = userEvent.setup();
    fetch
      .mockReturnValueOnce(response([reply]))
      .mockReturnValueOnce(response(reply));
    render(
      <CommentCard
        comment={comment}
        poemType="haiku"
        onCommentUpdated={() => {}}
        onCommentDeleted={() => {}}
        commentInputRef={{ current: null }}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Show 1 reply" }));
    await screen.findByText("A reply");
    const deleteButton = screen.getByRole("button", {
      name: "Delete reply by poet",
    });
    await user.click(deleteButton);
    const cancel = screen.getByRole("button", { name: "Cancel delete" });
    expect(cancel).toHaveFocus();
    await user.click(cancel);
    expect(deleteButton).toHaveFocus();

    await user.click(deleteButton);
    await user.click(screen.getByRole("button", { name: "Confirm delete" }));

    expect(await screen.findByText("No replies yet.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Hide 0 replies" })).toBeVisible();
    expect(screen.getByLabelText("Add a reply")).toHaveFocus();
  });
});
