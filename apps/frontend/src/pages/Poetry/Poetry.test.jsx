import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import { render } from "../../../tests/test-utils";
import Poetry from "./Poetry";
import { MemoryRouter } from "react-router";

const response = (body, ok = true) =>
  Promise.resolve({ ok, json: () => Promise.resolve(body) });

describe("Poetry feed", () => {
  const renderPoetry = () =>
    render(
      <MemoryRouter>
        <Poetry />
      </MemoryRouter>,
    );

  test("renders loading and empty states", async () => {
    fetch.mockReturnValueOnce(
      response({ paginated: [], totalPages: 0, totalPoems: 0 }),
    );
    renderPoetry();

    expect(screen.getByRole("link", { name: "dashboard" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(screen.getByRole("link", { name: /favorites/ })).toHaveAttribute(
      "href",
      "/favorites",
    );
    expect(screen.getByText("Loading poems…")).toBeInTheDocument();
    expect(
      await screen.findByText("No published poems match these filters."),
    ).toBeInTheDocument();
  });

  test("uses the page query and moves to the next page", async () => {
    const user = userEvent.setup();
    fetch
      .mockReturnValueOnce(
        response({ paginated: [], totalPages: 2, totalPoems: 21 }),
      )
      .mockReturnValueOnce(
        response({ paginated: [], totalPages: 2, totalPoems: 21 }),
      );
    renderPoetry();

    await user.click(await screen.findByRole("button", { name: "Next" }));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(fetch.mock.calls[1][0]).toContain("page=2");
    expect(fetch.mock.calls[1][0]).not.toContain("pages=");
  });

  test("labels filters and resets pagination when a filter changes", async () => {
    const user = userEvent.setup();
    fetch
      .mockReturnValueOnce(
        response({ paginated: [], totalPages: 2, totalPoems: 21 }),
      )
      .mockReturnValueOnce(
        response({ paginated: [], totalPages: 2, totalPoems: 21 }),
      )
      .mockReturnValueOnce(
        response({ paginated: [], totalPages: 1, totalPoems: 0 }),
      );
    renderPoetry();

    await user.click(await screen.findByRole("button", { name: "Next" }));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    await user.selectOptions(screen.getByLabelText("Type"), "haiku");
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3));
    expect(fetch.mock.calls[2][0]).toContain("page=1");
    expect(fetch.mock.calls[2][0]).toContain("type=haiku");
  });

  test("shows a request error without stale poems", async () => {
    fetch.mockReturnValueOnce(response({ error: "failed" }, false));
    renderPoetry();
    expect(
      await screen.findByRole("alert", { name: "" }),
    ).toHaveTextContent("Cannot show poems. Please try again.");
  });

  test("retries a failed feed request", async () => {
    const user = userEvent.setup();
    fetch
      .mockReturnValueOnce(response({ error: "failed" }, false))
      .mockReturnValueOnce(
        response({ paginated: [], totalPages: 0, totalPoems: 0 }),
      );
    renderPoetry();

    await user.click(await screen.findByRole("button", { name: "Try again" }));
    expect(
      await screen.findByText("No published poems match these filters."),
    ).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
