import { describe, it, expect, vi, beforeEach } from "vitest";
import { useWordData } from "./useWordData";
import { saveWordToCache, getWordFromCache } from "./wordCache";
import { renderHook, waitFor } from "@testing-library/react";

describe("WordFind hook", () => {
  const mockApiResponse = {
    word: "hello",
    results: [
      {
        definition: "an expression of greeting",
        partOfSpeech: "noun",
        synonyms: ["hi", "how-do-you-do", "howdy", "hullo"],
        typeOf: ["greeting", "salutation"],
        examples: ["every morning they exchanged polite hellos"],
      },
    ],
    syllables: {
      count: 2,
      list: ["hel", "lo"],
    },
    pronunciation: {
      all: "hɛ'loʊ",
    },
    frequency: 5.83,
  };

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });
  it("returns cached word data without calling API", () => {
    // Save "hello" data to cache
    saveWordToCache("hello", {
      word: "hello",
      results: [
        {
          definition: "an expression of greeting",
          partOfSpeech: "noun",
          synonyms: ["hi", "how-do-you-do", "howdy", "hullo"],
          typeOf: ["greeting", "salutation"],
          examples: ["every morning they exchanged polite hellos"],
        },
      ],
      syllables: {
        count: 2,
        list: ["hel", "lo"],
      },
      pronunciation: {
        all: "hɛ'loʊ",
      },
      frequency: 5.83,
    });

    // Mock fetch to track if it gets called
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    // Use the hook
    const { result } = renderHook(() => useWordData("hello"));

    // Should have data from cache
    expect(result.current.wordData).toEqual({
      word: "hello",
      results: [
        {
          definition: "an expression of greeting",
          partOfSpeech: "noun",
          synonyms: ["hi", "how-do-you-do", "howdy", "hullo"],
          typeOf: ["greeting", "salutation"],
          examples: ["every morning they exchanged polite hellos"],
        },
      ],
      syllables: {
        count: 2,
        list: ["hel", "lo"],
      },
      pronunciation: {
        all: "hɛ'loʊ",
      },
      frequency: 5.83,
    });

    // Should NOT have called fetch
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("calls API when cache doesn't have the word", async () => {
    // Mock fetch to return successful API response
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockApiResponse),
    });

    // Use the hook
    const { result } = renderHook(() => useWordData("hello"));

    // Wait for loading to finish
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.wordData).toEqual({
      word: "hello",
      results: [
        {
          definition: "an expression of greeting",
          partOfSpeech: "noun",
          synonyms: ["hi", "how-do-you-do", "howdy", "hullo"],
          typeOf: ["greeting", "salutation"],
          examples: ["every morning they exchanged polite hellos"],
        },
      ],
      syllables: {
        count: 2,
        list: ["hel", "lo"],
      },
      pronunciation: {
        all: "hɛ'loʊ",
      },
      frequency: 5.83,
    });
    expect(fetchSpy).toHaveBeenCalled();
  });

  it("caches successful API fetch results", async () => {
    // Mock fetch to return successful API response
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockApiResponse),
    });

    // Use the hook
    const { result } = renderHook(() => useWordData("hello"));

    // Wait for loading to finish
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.wordData).toEqual({
      word: "hello",
      results: [
        {
          definition: "an expression of greeting",
          partOfSpeech: "noun",
          synonyms: ["hi", "how-do-you-do", "howdy", "hullo"],
          typeOf: ["greeting", "salutation"],
          examples: ["every morning they exchanged polite hellos"],
        },
      ],
      syllables: {
        count: 2,
        list: ["hel", "lo"],
      },
      pronunciation: {
        all: "hɛ'loʊ",
      },
      frequency: 5.83,
    });

    const hello = getWordFromCache("hello");

    expect(hello).toEqual({
      word: "hello",
      results: [
        {
          definition: "an expression of greeting",
          partOfSpeech: "noun",
          synonyms: ["hi", "how-do-you-do", "howdy", "hullo"],
          typeOf: ["greeting", "salutation"],
          examples: ["every morning they exchanged polite hellos"],
        },
      ],
      syllables: {
        count: 2,
        list: ["hel", "lo"],
      },
      pronunciation: {
        all: "hɛ'loʊ",
      },
      frequency: 5.83,
    });
  });
  it("hook returns confidence level", async () => {
    // Save "hello" data to cache
    saveWordToCache("hello", {
      word: "hello",
      results: [
        {
          definition: "an expression of greeting",
          partOfSpeech: "noun",
          synonyms: ["hi", "how-do-you-do", "howdy", "hullo"],
          typeOf: ["greeting", "salutation"],
          examples: ["every morning they exchanged polite hellos"],
        },
      ],
      syllables: {
        count: 2,
        list: ["hel", "lo"],
      },
      pronunciation: {
        all: "hɛ'loʊ",
      },
      frequency: 5.83,
    });

    // Use the hook
    const { result } = renderHook(() => useWordData("hello"));

    // Wait for loading to finish
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.confidence).toBe("verified");
  });

  it("uses countSyllables when word is not in API and returns 'estimated' confidence level", async () => {
    // Mock fetch fail
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));

    // Use the hook
    const { result } = renderHook(() => useWordData("hello"));

    // Wait for loading to finish
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.confidence).toBe("estimated");

    expect(result.current.wordData).toEqual({
      word: "hello",
      syllables: { count: 2 }, // from countSyllables
      source: "fallback",
    });
  });

  
});
