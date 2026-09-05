import { MemoryRouter } from "react-router";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import { render } from "../../../tests/test-utils";
import Register from "./Register";

const response = (body, ok = true, status = ok ? 200 : 400) =>
  Promise.resolve({ ok, status, json: () => Promise.resolve(body) });

describe("Register", () => {
  test("shows the password policy after both password fields", () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
      { auth: null },
    );

    const password = screen.getByLabelText("Password");
    const confirmation = screen.getByLabelText("Confirm Password");
    const requirements = screen.getByText(/Use at least 8 characters/);

    expect(screen.getByRole("heading", { name: "register" })).toBeVisible();
    expect(screen.queryByLabelText("Confirm Email")).not.toBeInTheDocument();
    expect(password).toHaveAccessibleDescription(requirements.textContent);
    expect(
      confirmation.compareDocumentPosition(requirements) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  test("keeps the API contract while removing the confirmation-email field", async () => {
    const user = userEvent.setup();
    fetch.mockReturnValueOnce(
      response({ error: "Email already in use" }, false),
    );
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
      { auth: null },
    );

    await user.type(screen.getByLabelText("Name"), "Test User");
    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "Testing4fun!");
    await user.type(
      screen.getByLabelText("Confirm Password"),
      "Testing4fun!",
    );
    await user.click(screen.getByRole("button", { name: "Register" }));

    const payload = JSON.parse(fetch.mock.calls[0][1].body);
    expect(payload.confirmEmail).toBe(payload.email);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Email already in use",
    );
  });

  test("announces password mismatch without submitting", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
      { auth: null },
    );

    await user.type(screen.getByLabelText("Name"), "Test User");
    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "Testing4fun!");
    await user.type(screen.getByLabelText("Confirm Password"), "Testing5fun!");
    await user.click(screen.getByRole("button", { name: "Register" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Passwords do not match.",
    );
    expect(fetch).not.toHaveBeenCalled();
  });
});
