import { saveWordToCache, getWordFromCache } from "./wordCache";
import { describe, it, expect } from "vitest";

describe("wordCache", () => {
  it("saves word data to localStorage", () => {
    saveWordToCache("wordCache", {
      hello: {
        syllables: { count: 2, list: ["hel", "lo"] },
        rhymes: { all: ["fellow", "yellow"] },
        pronunciation: "hɛ'loʊ",
        confidence: "verified",
      },
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
});
