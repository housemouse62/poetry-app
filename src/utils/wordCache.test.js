import { saveWordToCache, getWordFromCache } from "./wordCache";
import { describe, it, expect } from "vitest";

describe("wordCache", () => {
  it("saves word data to localStorage", () => {
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

    const stored = localStorage.getItem("wordCache");
    const parsed = JSON.parse(stored);
    console.log(parsed);
    expect(parsed.hello).toEqual({
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

  it("gets data for stored word from local storage", () => {
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

    const hello = getWordFromCache("hello");
    console.log("hello", hello);

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

  it("stores two words and gets data for both words", () => {
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

    saveWordToCache("flippant", {
      word: "flippant",
      results: [
        {
          definition: "showing inappropriate levity",
          partOfSpeech: "adjective",
          synonyms: ["light-minded"],
          similarTo: ["frivolous"],
          derivation: ["flippancy"],
        },
      ],
      syllables: {
        count: 2,
        list: ["flip", "pant"],
      },
      pronunciation: {
        all: "'flɪpənt",
      },
      frequency: 2.33,
    });

    const hello = getWordFromCache("hello");
    const flippant = getWordFromCache("flippant");
    console.log("hello", hello);

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
    expect(flippant).toEqual({
      word: "flippant",
      results: [
        {
          definition: "showing inappropriate levity",
          partOfSpeech: "adjective",
          synonyms: ["light-minded"],
          similarTo: ["frivolous"],
          derivation: ["flippancy"],
        },
      ],
      syllables: {
        count: 2,
        list: ["flip", "pant"],
      },
      pronunciation: {
        all: "'flɪpənt",
      },
      frequency: 2.33,
    });
  });
});
