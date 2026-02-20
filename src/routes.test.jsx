import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import userEvent from "@testing-library/user-event";
import routes from "./routes";

describe("Poetry-App", () => {
  it("the home route (/) renders the dashboard component with an <h2>hello world. we do poetry.</h2>", () => {
    // Create a test router starting at "/"
    const router = createMemoryRouter(routes, { initialEntries: ["/"] });

    render(<RouterProvider router={router} />);

    const helloWorld = screen.getByRole("heading", {
      name: /hello world. we do poetry/i,
      level: 2,
    });
    expect(helloWorld).toBeVisible();
  });

  it("the haiku route (/haiku) renders", () => {
    // Create a test router starting at "/haiku"
    const router = createMemoryRouter(routes, { initialEntries: ["/haiku"] });

    render(<RouterProvider router={router} />);

    const doyou = screen.getByText("🌸 Do You Do Haiku? 🪷");
    expect(doyou).toBeVisible();
  });

  it("when user click haiku link, the haiku route (/haiku) renders", async () => {
    // Create a test router starting at "/"
    const router = createMemoryRouter(routes, { initialEntries: ["/"] });
    const user = userEvent.setup();
    render(<RouterProvider router={router} />);

    const haikuLink = screen.getByRole("link", { name: "haiku" });
    await user.click(haikuLink);

    const doyou = screen.getByText("🌸 Do You Do Haiku? 🪷");
    expect(doyou).toBeVisible();
  });

  it("when directed to non-existing page, error page renders", () => {
    // Create a test router starting at non-existant page "/noPage"
    const router = createMemoryRouter(routes, { initialEntries: ["/noPage"] });
    render(<RouterProvider router={router} />);

    const errorPage = screen.getByText("Oops!");
    expect(errorPage).toBeVisible();
  });

  it("returns to the dashboard page when user clicks dashboard", async () => {
    // Create a test router starting at root page ("/")
    const router = createMemoryRouter(routes, { initialEntries: ["/"] });
    const user = userEvent.setup();
    render(<RouterProvider router={router} />);

    const haikuLink = screen.getByRole("link", { name: "haiku" });
    await user.click(haikuLink);

    const backButton = screen.getByRole("button", { name: /dashboard/i });
    await user.click(backButton);

    const helloWorld = screen.getByRole("heading", {
      name: /hello world. we do poetry/i,
      level: 2,
    });
    expect(helloWorld).toBeVisible();
  });
});
