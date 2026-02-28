import { describe, it, expect, vi } from "vitest";
import { useWordData } from "./WordFind";
import { saveWordToCache, getWordFromCache } from "../../../../utils/wordCache";
import { renderHook } from "@testing-library/react";

describe("WordFind hook", () => {
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
});
