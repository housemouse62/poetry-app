import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { saveWordToCache, getWordFromCache } from "../../../../utils/wordCache";
import userEvent from "@testing-library/user-event";
import * as WordFind from "./WordFind";
import HaikuLine from "./HaikuLine";
import HaikuApp from "./HaikuApp";
import { useWordData } from "./WordFind";
import { createMemoryRouter, RouterProvider } from "react-router";

const renderWithRouter = (component) => {
  const router = createMemoryRouter([{ path: "/", element: component }]);
  return render(<RouterProvider router={router} />);
};

describe("Haiku Line Word Validation", () => {
  beforeEach(() => {
    //Clear localStorage before each test
    localStorage.clear();
  });

  beforeEach(() => {
    // Clear any spies/mocks
    vi.clearAllMocks();
  });

  it("extracts word when user types word + space bar", async () => {
    // Spy on useWordData
    renderWithRouter(<HaikuApp />);

    const useWordDataSpy = vi.spyOn(WordFind, "useWordData");

    const user = userEvent.setup();

    // User types cherry and then a space
    const line1 = screen.getByPlaceholderText(/line 1/i);
    await user.type(line1, "cherry ");

    expect(useWordDataSpy).toHaveBeenCalledWith("cherry");
  });

  it("doesn't check the word when space bar not pressed", async () => {
    // Spy on useWordData
    const useWordDataSpy = vi.spyOn(WordFind, "useWordData");

    const user = userEvent.setup();
    renderWithRouter(<HaikuApp />);

    // User types cherry and then a space
    const line1 = screen.getByPlaceholderText(/line 1/i);
    await user.type(line1, "cherry");

    expect(useWordDataSpy).not.toHaveBeenCalledWith("cherry");
  });

  it("extracts multiple words correctly on space bar keydown", async () => {
    // Spy on useWordData
    renderWithRouter(<HaikuApp />);

    const useWordDataSpy = vi.spyOn(WordFind, "useWordData");

    const user = userEvent.setup();

    // User types cherry and then a space
    const line1 = screen.getByPlaceholderText(/line 1/i);
    await user.type(line1, "cherry ");

    expect(useWordDataSpy).toHaveBeenCalledWith("cherry");

    await user.type(line1, "blossom ");
    expect(useWordDataSpy).toHaveBeenCalledWith("blossom");
  });
});
