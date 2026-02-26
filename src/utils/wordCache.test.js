import { saveWordToCache, getWordFromCache } from "./wordCache";
import { describe, it, expect } from "vitest";

describe("wordCache", () => {
  it("saves word data to localStorage", () => {
    saveWordToCache("hello", {
      syllables: { count: 2, list: ["hel", "lo"] },
      rhymes: { all: ["fellow", "yellow"] },
      pronunciation: "hɛ'loʊ",
      confidence: "verified",
    });

    const stored = localStorage.getItem("wordCache");
    const parsed = JSON.parse(stored);
    console.log(parsed);
    expect(parsed.hello).toEqual({
      syllables: { count: 2, list: ["hel", "lo"] },
      rhymes: { all: ["fellow", "yellow"] },
      pronunciation: "hɛ'loʊ",
      confidence: "verified",
    });
  });

  it("gets data for stored word from local storage", () => {
    saveWordToCache("hello", {
      syllables: { count: 2, list: ["hel", "lo"] },
      rhymes: { all: ["fellow", "yellow"] },
      pronunciation: "hɛ'loʊ",
      confidence: "verified",
    });

    const hello = getWordFromCache("hello");
    console.log("hello", hello);

    expect(hello).toEqual({
      syllables: { count: 2, list: ["hel", "lo"] },
      rhymes: { all: ["fellow", "yellow"] },
      pronunciation: "hɛ'loʊ",
      confidence: "verified",
    });
  });
});
