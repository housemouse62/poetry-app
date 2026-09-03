import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { render } from "../../tests/test-utils";
import userEvent from "@testing-library/user-event";
import * as WordFind from "../utils/useWordData";
import PoetryLine from "./PoetryLine";
import { createMemoryRouter, RouterProvider } from "react-router";
import { useState } from "react";

const mockCherryResponse = {
  ok: true,
  json: async () => ({
    word: "cherry",
    source: "api",
    results: [
      {
        definition:
          "of a color at the end of the color spectrum (next to orange); resembling the color of blood or cherries or tomatoes or rubies",
        partOfSpeech: "adjective",
        synonyms: [
          "blood-red",
          "carmine",
          "cerise",
          "cherry-red",
          "crimson",
          "red",
          "reddish",
          "ruby",
          "ruby-red",
          "ruddy",
          "scarlet",
        ],
        similarTo: ["chromatic"],
      },
      {
        definition: "a red the color of ripe cherries",
        partOfSpeech: "noun",
        synonyms: ["cerise", "cherry red"],
        typeOf: ["red", "redness"],
      },
      {
        definition:
          "any of numerous trees and shrubs producing a small fleshy round fruit with a single hard stone; many also produce a valuable hardwood",
        partOfSpeech: "noun",
        synonyms: ["cherry tree"],
        typeOf: ["fruit tree"],
        hasTypes: [
          "sour cherry tree",
          "sour cherry",
          "capulin tree",
          "catalina cherry",
          "wild cherry tree",
          "wild cherry",
          "prunus lyonii",
          "chokecherry tree",
          "flowering cherry",
          "capulin",
          "prunus avium",
          "prunus capuli",
          "prunus cerasus",
          "prunus virginiana",
          "sweet cherry",
          "chokecherry",
        ],
        memberOf: ["prunus", "genus prunus"],
      },
      {
        definition: "a red fruit with a single hard stone",
        partOfSpeech: "noun",
        typeOf: ["stone fruit", "drupe", "edible fruit"],
        hasTypes: [
          "black cherry",
          "capulin",
          "mexican black cherry",
          "sour cherry",
          "sweet cherry",
        ],
        partOf: ["cherry tree"],
      },
      {
        definition:
          "wood of any of various cherry trees especially the black cherry",
        partOfSpeech: "noun",
        typeOf: ["wood"],
        substanceOf: ["cherry tree"],
      },
    ],
    syllables: {
      count: 2,
      list: ["cher", "ry"],
    },
    pronunciation: {
      all: "'ʧɛri",
    },
    frequency: 4.09,
  }),
};

const mockBlossomResponse = {
  ok: true,
  json: async () => ({
    word: "blossom",
    source: "api",
    results: [
      {
        definition: "develop or come to a promising stage",
        partOfSpeech: "verb",
        synonyms: ["blossom forth", "blossom out", "unfold"],
        typeOf: ["develop"],
        examples: ["Youth blossomed into maturity"],
      },
      {
        definition: "produce or yield flowers",
        partOfSpeech: "verb",
        synonyms: ["bloom", "flower"],
        typeOf: ["develop"],
        hasTypes: ["effloresce", "burst forth"],
      },
      {
        definition:
          "reproductive organ of angiosperm plants especially one having showy or colorful parts",
        partOfSpeech: "noun",
        synonyms: ["bloom", "flower"],
        typeOf: ["reproductive structure"],
        hasTypes: [
          "ray flower",
          "floweret",
          "chrysanthemum",
          "inflorescence",
          "apetalous flower",
          "bud",
          "floret",
          "ray floret",
        ],
        hasParts: [
          "perianth",
          "carpel",
          "chlamys",
          "floral envelope",
          "floral leaf",
          "ovary",
          "perigone",
          "perigonium",
          "pistil",
          "stamen",
        ],
        partOf: ["flowering plant", "angiosperm"],
      },
      {
        definition: "the period of greatest prosperity or productivity",
        partOfSpeech: "noun",
        synonyms: [
          "bloom",
          "efflorescence",
          "flower",
          "flush",
          "heyday",
          "peak",
          "prime",
        ],
        typeOf: ["time period", "period", "period of time"],
        hasTypes: ["golden age"],
      },
    ],
    syllables: {
      count: 2,
      list: ["blos", "som"],
    },
    pronunciation: {
      all: "'blɑsəm",
    },
    frequency: 3.63,
  }),
};

const renderWithRouter = (component) => {
  const router = createMemoryRouter([{ path: "/", element: component }]);
  return render(<RouterProvider router={router} />);
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("PoetryLine", () => {
  it("syllable counter starts at 0 with no input", () => {
    render(
      <PoetryLine
        lineNumber={1}
        targetSyllables={5}
        value=""
        onChange={() => {}}
        showTarget={false}
      />,
    );

    const counter = screen.getByTestId("syllable-counter");
    expect(counter).toHaveTextContent("0");
  });

  it("Renders the placeholder text passed via prop", () => {
    render(
      <PoetryLine
        lineNumber={1}
        targetSyllables={5}
        value=""
        onChange={() => {}}
        showTarget={true}
        placeholderText={"Line 1 (5 syllables)"}
      />,
    );

    const placeholder = screen.getByPlaceholderText("Line 1 (5 syllables)");
    expect(placeholder).toBeVisible();
  });

  it("Renders count/target format when showTarget is true (e.g. 0/5)", () => {
    render(
      <PoetryLine
        lineNumber={1}
        targetSyllables={5}
        value=""
        onChange={() => {}}
        showTarget={true}
      />,
    );

    const counter = screen.getByTestId("syllable-counter");
    expect(counter).toHaveTextContent("0/5");
    expect(counter.textContent).toContain("/");
  });

  it("Renders just count format when showTarget is false/omitted (e.g. 0)", () => {
    render(
      <PoetryLine
        lineNumber={1}
        targetSyllables={5}
        value=""
        onChange={() => {}}
        showTarget={false}
      />,
    );

    const counter = screen.getByTestId("syllable-counter");
    expect(counter).toHaveTextContent("0");
    expect(counter.textContent).not.toContain("/");
  });

  it("Renders with a custom border color when borderColor is passed", () => {
    render(
      <PoetryLine
        lineNumber={1}
        targetSyllables={5}
        value=""
        onChange={() => {}}
        borderColor={"A"}
        showTarget={false}
      />,
    );

    const colorClass = screen.getByRole("textbox").closest(".input-row");
    expect(colorClass).toHaveClass("A");
  });

  it("extracts word when user types word + space bar", async () => {
    function TestWrapper() {
      const [inputValue, setInputValue] = useState("");

      return (
        <PoetryLine
          lineNumber={1}
          targetSyllables={5}
          value={inputValue}
          onChange={setInputValue}
          showTarget={true}
          placeholderText={"line 1"}
        />
      );
    }

    renderWithRouter(<TestWrapper />);
    // Spy on useWordData
    const useWordDataSpy = vi.spyOn(WordFind, "useWordData");

    const user = userEvent.setup();

    // User types cherry and then a space
    const line1 = screen.getByPlaceholderText(/line 1/i);
    await user.type(line1, "cherry ");

    expect(useWordDataSpy).toHaveBeenCalledWith("cherry");
  });

  it("aggregates syllables for multiple words correctly", async () => {
    //test component to handle state
    function TestWrapper() {
      const [inputValue, setInputValue] = useState("");

      return (
        <PoetryLine
          lineNumber={1}
          targetSyllables={5}
          value={inputValue}
          onChange={setInputValue}
          showTarget={true}
          placeholderText={"line 1"}
        />
      );
    }

    renderWithRouter(<TestWrapper />);
    const user = userEvent.setup();

    // mock fetch

    vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
      if (url.includes("cherry")) return Promise.resolve(mockCherryResponse);
      if (url.includes("blossom")) return Promise.resolve(mockBlossomResponse);
      // fallback
    });

    const initialCount = screen.getByText("0/5");
    expect(initialCount).toBeVisible();

    // User types 'cherry blossom '
    const line1 = screen.getByPlaceholderText(/line 1/i);
    await user.type(line1, "cherry blossom ");

    await waitFor(() => {
      const newCount = screen.getByText("4/5");
      expect(newCount).toBeVisible();
    });
  });

  it("same word typed twice doesn't refetch", async () => {
    function TestWrapper() {
      const [inputValue, setInputValue] = useState("");

      return (
        <PoetryLine
          lineNumber={1}
          targetSyllables={5}
          value={inputValue}
          onChange={setInputValue}
          showTarget={true}
          placeholderText={"line 1"}
        />
      );
    }

    renderWithRouter(<TestWrapper />);

    // const fetchSpy = vi.spyOn(globalThis, "fetch");
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(mockCherryResponse);

    const user = userEvent.setup();

    // User types cherry and then a space
    const line1 = screen.getByPlaceholderText(/line 1/i);
    await user.type(line1, "cherry ");

    await user.type(line1, "cherry ");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("doesn't check the word when space bar not pressed", async () => {
    function TestWrapper() {
      const [inputValue, setInputValue] = useState("");

      return (
        <PoetryLine
          lineNumber={1}
          targetSyllables={5}
          value={inputValue}
          onChange={setInputValue}
          showTarget={true}
          placeholderText={"line 1"}
        />
      );
    }

    renderWithRouter(<TestWrapper />);
    // Spy on useWordData
    const useWordDataSpy = vi.spyOn(WordFind, "useWordData");

    const user = userEvent.setup();

    // User types cherry and then a space
    const line1 = screen.getByPlaceholderText(/line 1/i);
    await user.type(line1, "cherry");

    expect(useWordDataSpy).not.toHaveBeenCalledWith("cherry");
  });

  it("syllable verification indication is blue = no words typed", () => {
    function TestWrapper() {
      const [inputValue, setInputValue] = useState("");

      return (
        <PoetryLine
          lineNumber={1}
          targetSyllables={5}
          value={inputValue}
          onChange={setInputValue}
          showTarget={true}
          placeholderText={"line 1"}
        />
      );
    }

    renderWithRouter(<TestWrapper />);
    const initialCount = screen.getByText("0/5");
    expect(initialCount).toBeVisible();

    const counter = screen.getByTestId("syllable-counter");
    expect(counter).toHaveAttribute("data-confidence", "neutral");
  });

  it("syllable verification indication is yellow = >0 words not from API", async () => {
    function TestWrapper() {
      const [inputValue, setInputValue] = useState("");

      return (
        <PoetryLine
          lineNumber={1}
          targetSyllables={5}
          value={inputValue}
          onChange={setInputValue}
          showTarget={true}
          placeholderText={"line 1"}
        />
      );
    }

    renderWithRouter(<TestWrapper />);
    const user = userEvent.setup();

    // mock fetch fail
    vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
      if (url.includes("cherry")) {
        return Promise.resolve(mockCherryResponse);
      } else {
        return Promise.resolve({ ok: false, status: 404 });
      }
    });

    const initialCount = screen.getByText("0/5");
    expect(initialCount).toBeVisible();

    // User types 'cherry blossom '
    const line1 = screen.getByPlaceholderText(/line 1/i);
    await user.type(line1, "cherry blossom ");

    await waitFor(() => {
      const newCount = screen.getByText("4/5");
      expect(newCount).toBeVisible();

      const counter = screen.getByTestId("syllable-counter");
      expect(counter).toHaveAttribute("data-confidence", "estimated");
    });
  });

  it("syllable verification indication is green = all words from API", async () => {
    function TestWrapper() {
      const [inputValue, setInputValue] = useState("");

      return (
        <PoetryLine
          lineNumber={1}
          targetSyllables={5}
          value={inputValue}
          onChange={setInputValue}
          showTarget={true}
          placeholderText={"line 1"}
        />
      );
    }

    renderWithRouter(<TestWrapper />);
    const user = userEvent.setup();

    // mock fetch
    vi.spyOn(globalThis, "fetch").mockResolvedValue(mockCherryResponse);

    vi.spyOn(globalThis, "fetch").mockResolvedValue(mockBlossomResponse);

    const initialCount = screen.getByText("0/5");
    expect(initialCount).toBeVisible();

    // User types 'cherry blossom '
    const line1 = screen.getByPlaceholderText(/line 1/i);
    await user.type(line1, "cherry blossom ");

    await waitFor(() => {
      const newCount = screen.getByText("4/5");
      expect(newCount).toBeVisible();

      const counter = screen.getByTestId("syllable-counter");
      expect(counter).toHaveAttribute("data-confidence", "verified");
    });
  });

  it("uses the normalized server syllable count instead of the estimator", async () => {
    function TestWrapper() {
      const [inputValue, setInputValue] = useState("");
      return (
        <PoetryLine
          targetSyllables={5}
          value={inputValue}
          onChange={setInputValue}
          showTarget={true}
          placeholderText="line 1"
        />
      );
    }
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        word: "fire",
        source: "api",
        flagged: false,
        syllables: { count: 2, list: ["fi", "re"] },
        data: { syllables: { count: 2, list: ["fi", "re"] } },
      }),
    });
    renderWithRouter(<TestWrapper />);
    await userEvent.setup().type(screen.getByPlaceholderText("line 1"), "fire ");
    await waitFor(() => expect(screen.getByText("2/5")).toBeVisible());
    expect(screen.getByTestId("syllable-counter")).toHaveAttribute(
      "data-confidence",
      "verified",
    );
  });

  it("onSyllableChange is called with the correct count when syllables update", async () => {
    const mockCallback = vi.fn();

    function TestWrapper() {
      const [inputValue, setInputValue] = useState("");

      return (
        <PoetryLine
          lineNumber={1}
          targetSyllables={5}
          value={inputValue}
          onChange={setInputValue}
          onSyllableChange={mockCallback}
          showTarget={true}
          placeholderText={"line 1"}
        />
      );
    }

    renderWithRouter(<TestWrapper />);
    const user = userEvent.setup();

    vi.spyOn(globalThis, "fetch").mockResolvedValue(mockCherryResponse);

    const line1 = screen.getByPlaceholderText(/line 1/i);
    await user.type(line1, "cherry ");

    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalledWith(2);
    });
  });

  it("Escape from Confirm Flag closes only that dialog and restores the selected word", async () => {
    const user = userEvent.setup();
    render(
      <PoetryLine
        targetSyllables={5}
        value="cherry"
        onChange={() => {}}
        showTarget={true}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Flag a word in this line" }),
    );
    const selectedWord = screen.getByRole("button", { name: /cherry/ });
    await user.click(selectedWord);
    await user.keyboard("{Escape}");

    expect(
      screen.queryByRole("dialog", { name: "Confirm Flag" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Flag Word" })).toBeVisible();
    expect(selectedWord).toHaveFocus();
  });

  it("Escape from the thank-you dialog returns focus to No without closing Confirm Flag", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    render(
      <PoetryLine
        targetSyllables={5}
        value="cherry"
        onChange={() => {}}
        showTarget={true}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Flag a word in this line" }),
    );
    await user.click(screen.getByRole("button", { name: /cherry/ }));
    const noButton = screen.getByRole("button", { name: "No" });
    await user.click(noButton);
    expect(
      (await screen.findByText("Word Flagged. Thank you!")).closest(
        '[role="dialog"]',
      ),
    ).toBeVisible();

    await user.keyboard("{Escape}");

    expect(
      screen.queryByText("Word Flagged. Thank you!"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Confirm Flag" }).closest(
        '[role="dialog"]',
      ),
    ).toBeVisible();
    expect(noButton).toHaveFocus();
  });

  it("Thumbs Up closes the nested dialogs and restores the selected word", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    render(
      <PoetryLine
        targetSyllables={5}
        value="cherry"
        onChange={() => {}}
        showTarget={true}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Flag a word in this line" }),
    );
    const selectedWord = screen.getByRole("button", { name: /cherry/ });
    await user.click(selectedWord);
    await user.click(screen.getByRole("button", { name: "No" }));
    await user.click(
      await screen.findByRole("button", { name: "Thumbs Up!" }),
    );

    expect(
      screen.queryByText("Word Flagged. Thank you!"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", { name: "Confirm Flag" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Flag Word" })).toBeVisible();
    expect(selectedWord).toHaveFocus();
  });
});
