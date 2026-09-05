import { MemoryRouter } from "react-router";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import { render } from "../../../tests/test-utils";
import Login from "./Login";

describe("Login", () => {
  test("uses lowercase presentation and places an announced error before submit", async () => {
    const user = userEvent.setup();
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Invalid Credentials" }),
    });
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
      { auth: null },
    );

    expect(screen.getByRole("heading", { name: "user login" })).toBeVisible();
    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong password");
    await user.click(screen.getByRole("button", { name: "Log In" }));

    const alert = await screen.findByRole("alert");
    const submit = screen.getByRole("button", { name: "Log In" });
    expect(alert).toHaveTextContent("Check your login credentials");
    expect(
      alert.compareDocumentPosition(submit) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
