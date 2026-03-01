import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { saveWordToCache, getWordFromCache } from "../../../../utils/wordCache";
import userEvent from "@testing-library/user-event";
import * as WordFind from "./WordFind";
import HaikuLine from "./HaikuLine";
import HaikuApp from "./HaikuApp";
import { useWordData } from "./WordFind";
import { createMemoryRouter, RouterProvider } from "react-router";
import { useState } from "react";

const mockCherryResponse = {
  ok: true,
  json: async () => ({
    word: "cherry",
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
    renderWithRouter(<HaikuApp />);

    // Spy on useWordData
    const useWordDataSpy = vi.spyOn(WordFind, "useWordData");

    const user = userEvent.setup();

    // User types cherry and then a space
    const line1 = screen.getByPlaceholderText(/line 1/i);
    await user.type(line1, "cherry ");

    expect(useWordDataSpy).toHaveBeenCalledWith("cherry");
  });

  it.skip("doesn't check the word when space bar not pressed", async () => {
    // Spy on useWordData
    const useWordDataSpy = vi.spyOn(WordFind, "useWordData");

    const user = userEvent.setup();
    renderWithRouter(<HaikuApp />);

    // User types cherry and then a space
    const line1 = screen.getByPlaceholderText(/line 1/i);
    await user.type(line1, "cherry");

    expect(useWordDataSpy).not.toHaveBeenCalledWith("cherry");
  });

  it.skip("extracts multiple words correctly on space bar keydown", async () => {
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

  it.skip("same word typed twice doesn't refetch", async () => {
    renderWithRouter(<HaikuApp />);

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

  it("single word 'cherry' shows correct syllable count '2' ", async () => {
    //test component to handle state
    function TestWrapper() {
      const [inputValue, setInputValue] = useState("");

      return (
        <HaikuLine
          lineNumber={1}
          targetSyllables={5}
          value={inputValue}
          onChange={setInputValue}
        />
      );
    }

    renderWithRouter(<TestWrapper />);
    const user = userEvent.setup();

    // mock fetch
    vi.spyOn(globalThis, "fetch").mockResolvedValue(mockCherryResponse);

    const initialCount = screen.getByText("0/5");
    expect(initialCount).toBeVisible();

    // User types cherry and then a space
    const line1 = screen.getByPlaceholderText(/line 1/i);
    await user.type(line1, "cherry ");

    await waitFor(() => {
      const newCount = screen.getByText("2/5");
      expect(newCount).toBeVisible();
    });
  });

  it("aggregates syllables for multiple words correctly", async () => {
    //test component to handle state
    function TestWrapper() {
      const [inputValue, setInputValue] = useState("");

      return (
        <HaikuLine
          lineNumber={1}
          targetSyllables={5}
          value={inputValue}
          onChange={setInputValue}
        />
      );
    }

    renderWithRouter(<TestWrapper />);
    const user = userEvent.setup();

    // mock fetch
    vi.spyOn(globalThis, "fetch").mockResolvedValue(mockCherryResponse);

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

  it("aggregates syllables for verified/estimated words correctly", async () => {
    //test component to handle state
    function TestWrapper() {
      const [inputValue, setInputValue] = useState("");
      return (
        <HaikuLine
          lineNumber={1}
          targetSyllables={5}
          value={inputValue}
          onChange={setInputValue}
        />
      );
    }

    renderWithRouter(<TestWrapper />);
    const user = userEvent.setup();

    // mock spy with a pass for cherry and fail for anything else
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
    });
  });

  it("syllable verification indication is blue = no words typed", () => {
    function TestWrapper() {
      const [inputValue, setInputValue] = useState("");
      return (
        <HaikuLine
          lineNumber={1}
          targetSyllables={5}
          value={inputValue}
          onChange={setInputValue}
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
    //test component to handle state
    function TestWrapper() {
      const [inputValue, setInputValue] = useState("");
      return (
        <HaikuLine
          lineNumber={1}
          targetSyllables={5}
          value={inputValue}
          onChange={setInputValue}
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
    //test component to handle state
    function TestWrapper() {
      const [inputValue, setInputValue] = useState("");
      return (
        <HaikuLine
          lineNumber={1}
          targetSyllables={5}
          value={inputValue}
          onChange={setInputValue}
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
});
