import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithRouter } from "../tests/test-utils";
import { createMemoryRouter } from "react-router";
import userEvent from "@testing-library/user-event";
import routes from "./routes";

describe("Poetry-App", () => {
  it("the home route (/) renders the dashboard component with an <h2>hello world. we do poetry.</h2>", () => {
    // Create a test router starting at "/"
    const router = createMemoryRouter(routes, { initialEntries: ["/"] });

    renderWithRouter(router);

    const helloWorld = screen.getByRole("heading", {
      name: /make poetry./i,
      level: 1,
    });
    expect(helloWorld).toBeVisible();
  });

  it("the haiku route (/haiku) renders", () => {
    // Create a test router starting at "/haiku"
    const router = createMemoryRouter(routes, { initialEntries: ["/haiku"] });

    renderWithRouter(router);

    const doyou = screen.getByRole("heading", {
      name: /Do You Do Haiku/i,
      level: 1,
    });
    expect(doyou).toBeVisible();
  });

  it("the limerick route (/limerick) renders", () => {
    // Create a test router starting at "/haiku"
    const router = createMemoryRouter(routes, {
      initialEntries: ["/limerick"],
    });

    renderWithRouter(router);

    const limerick = screen.getByRole("heading", {
      name: /Let's Limerick/i,
      level: 1,
    });
    expect(limerick).toBeVisible();
  });

  it("navigates from home through the dashboard to the haiku editor", async () => {
    // Create a test router starting at "/"
    const router = createMemoryRouter(routes, { initialEntries: ["/"] });
    const user = userEvent.setup();
    renderWithRouter(router);

    const makePoetryButton = screen.getByText("make poetry", {
      selector: "button",
    });
    await user.click(makePoetryButton);

    const haikuLink = screen.getByRole("link", { name: /open haiku editor/i });
    await user.click(haikuLink);

    const doyou = screen.getByRole("heading", {
      name: /Do You Do Haiku/i,
      level: 1,
    });
    expect(doyou).toBeVisible();
  });

  it("navigates from home through the dashboard to the limerick editor", async () => {
    // Create a test router starting at "/"
    const router = createMemoryRouter(routes, { initialEntries: ["/"] });
    const user = userEvent.setup();
    renderWithRouter(router);

    const makePoetryButton = screen.getByText("make poetry", {
      selector: "button",
    });
    await user.click(makePoetryButton);

    const limerickLink = screen.getByRole("link", {
      name: /open limerick editor/i,
    });
    await user.click(limerickLink);

    const doyou = screen.getByRole("heading", {
      name: /Let's Limerick!/i,
      level: 1,
    });
    expect(doyou).toBeVisible();
  });

  it("when directed to non-existing page, error page renders", () => {
    // Create a test router starting at non-existant page "/noPage"
    const router = createMemoryRouter(routes, { initialEntries: ["/noPage"] });
    renderWithRouter(router);

    const errorPage = screen.getByText("Oops!");
    expect(errorPage).toBeVisible();
  });

  it("returns to the dashboard page when user clicks dashboard", async () => {
    // Create a test router starting at root page ("/")
    const router = createMemoryRouter(routes, { initialEntries: ["/"] });
    const user = userEvent.setup();
    renderWithRouter(router);

    const makePoetryButton = screen.getByText("make poetry", {
      selector: "button",
    });
    await user.click(makePoetryButton);

    const haikuLink = screen.getByRole("link", { name: /open haiku editor/i });
    await user.click(haikuLink);

    const backButton = screen.getByRole("button", { name: /dashboard/i });
    await user.click(backButton);

    const helloWorld = screen.getByRole("heading", {
      name: "make poetry.",
      level: 1,
    });
    expect(helloWorld).toBeVisible();
  });

  it("navigates from the dashboard to the protected favorites route", async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => [] });
    const router = createMemoryRouter(routes, { initialEntries: ["/dashboard"] });
    const user = userEvent.setup();
    renderWithRouter(router);

    await user.click(screen.getByRole("link", { name: "Favorites" }));
    expect(
      await screen.findByRole("heading", { name: "Your favorites" }),
    ).toBeVisible();
  });

  it("redirects signed-out users away from favorites", async () => {
    const router = createMemoryRouter(routes, { initialEntries: ["/favorites"] });
    renderWithRouter(router, { auth: null });
    expect(
      await screen.findByRole("heading", { name: /user login/i }),
    ).toBeVisible();
  });
});
