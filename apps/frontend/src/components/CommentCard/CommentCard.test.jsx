import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import { render } from "../../../tests/test-utils";
import CommentCard from "./CommentCard";

const comment = {
  id: 3,
  commentbody: "A comment",
  createdAt: "2026-01-01T00:00:00.000Z",
  author: { screenname: "reader" },
  _count: { reply: 1 },
};

const reply = {
  id: 9,
  replybody: "A reply",
  createdAt: "2026-01-02T00:00:00.000Z",
  author: { screenname: "poet" },
};

const response = (body) =>
  Promise.resolve({ ok: true, json: () => Promise.resolve(body) });

const deferredResponse = () => {
  let resolve;
  const promise = new Promise((next) => {
    resolve = (body) => next({ ok: true, json: () => Promise.resolve(body) });
  });
  return { promise, resolve };
};

describe("CommentCard", () => {
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
});
