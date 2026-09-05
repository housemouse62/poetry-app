import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithRouter } from "../tests/test-utils";
import { createMemoryRouter } from "react-router";
import userEvent from "@testing-library/user-event";
import routes from "./routes";

describe("Poetry-App", () => {
  it("the home route (/) renders an accessible loading state, then the home page", async () => {
    // Create a test router starting at "/"
    const router = createMemoryRouter(routes, { initialEntries: ["/"] });

    renderWithRouter(router);

    expect(screen.getByRole("status")).toHaveTextContent("Loading page…");
    const helloWorld = await screen.findByRole("heading", {
      name: /make poetry./i,
      level: 1,
    });
    expect(helloWorld).toBeVisible();
  });

  it("shows login and registration actions to signed-out visitors", async () => {
    const router = createMemoryRouter(routes, { initialEntries: ["/"] });
    renderWithRouter(router, { auth: null });

    expect(await screen.findByRole("button", { name: "log in" })).toBeVisible();
    expect(screen.getByRole("button", { name: "register" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "profile" })).not.toBeInTheDocument();
  });

  it("shows profile and working logout actions to signed-in visitors", async () => {
    const user = userEvent.setup();
    const router = createMemoryRouter(routes, { initialEntries: ["/"] });
    renderWithRouter(router);

    expect(await screen.findByRole("button", { name: "Profile" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "log out" }));
    expect(await screen.findByRole("button", { name: "log in" })).toBeVisible();
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("opens the public About page from the labelled help control", async () => {
    const user = userEvent.setup();
    const router = createMemoryRouter(routes, { initialEntries: ["/"] });
    renderWithRouter(router, { auth: null });

    await user.click(
      await screen.findByRole("link", { name: "About make poetry" }),
    );
    expect(
      await screen.findByRole("heading", { name: "about make poetry." }),
    ).toBeVisible();
    expect(screen.getByText(/future roadmap work/)).toBeVisible();
  });

  it("the haiku route (/haiku) renders", async () => {
    // Create a test router starting at "/haiku"
    const router = createMemoryRouter(routes, { initialEntries: ["/haiku"] });

    renderWithRouter(router);

    const doyou = await screen.findByRole("heading", {
      name: /Do You Do Haiku/i,
      level: 1,
    });
    expect(doyou).toBeVisible();
  });

  it("the limerick route (/limerick) renders", async () => {
    // Create a test router starting at "/haiku"
    const router = createMemoryRouter(routes, {
      initialEntries: ["/limerick"],
    });

    renderWithRouter(router);

    const limerick = await screen.findByRole("heading", {
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

    const makePoetryButton = await screen.findByText("make poetry", {
      selector: "button",
    });
    await user.click(makePoetryButton);

    const haikuLink = await screen.findByRole("link", {
      name: /open haiku editor/i,
    });
    await user.click(haikuLink);

    const doyou = await screen.findByRole("heading", {
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

    const makePoetryButton = await screen.findByText("make poetry", {
      selector: "button",
    });
    await user.click(makePoetryButton);

    const limerickLink = await screen.findByRole("link", {
      name: /open limerick editor/i,
    });
    await user.click(limerickLink);

    const doyou = await screen.findByRole("heading", {
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

    const makePoetryButton = await screen.findByText("make poetry", {
      selector: "button",
    });
    await user.click(makePoetryButton);

    const haikuLink = await screen.findByRole("link", {
      name: /open haiku editor/i,
    });
    await user.click(haikuLink);

    const backButton = await screen.findByRole("button", {
      name: /dashboard/i,
    });
    await user.click(backButton);

    const helloWorld = await screen.findByRole("heading", {
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

    await user.click(
      await screen.findByRole("link", { name: /favorites/i }),
    );
    expect(
      await screen.findByRole("heading", { name: "Your favorites" }),
    ).toBeVisible();
  });

  it("uses the requested three-item dashboard navigation", async () => {
    const router = createMemoryRouter(routes, { initialEntries: ["/dashboard"] });
    renderWithRouter(router);

    const navigation = await screen.findByRole("navigation", {
      name: "Page navigation",
    });
    expect(navigation).toHaveTextContent("profile");
    expect(navigation).toHaveTextContent("read poetry");
    expect(navigation).toHaveTextContent("favorites");
    expect(screen.queryByRole("button", { name: /logout/i })).not.toBeInTheDocument();
  });

  it("keeps logout available from the Profile page", async () => {
    const user = userEvent.setup();
    const router = createMemoryRouter(routes, { initialEntries: ["/profile"] });
    renderWithRouter(router);

    await user.click(await screen.findByRole("button", { name: "log out" }));
    expect(
      await screen.findByRole("heading", { name: "user login" }),
    ).toBeVisible();
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("redirects signed-out users away from favorites", async () => {
    const router = createMemoryRouter(routes, { initialEntries: ["/favorites"] });
    renderWithRouter(router, { auth: null });
    expect(
      await screen.findByRole("heading", { name: /user login/i }),
    ).toBeVisible();
  });
});
