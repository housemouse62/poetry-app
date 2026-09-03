import { describe, expect, it } from "vitest";
import { getWordFromCache, saveWordToCache } from "./wordCache";

const day = 24 * 60 * 60 * 1000;
const apiWord = { word: "hello", source: "api", syllables: { count: 2 } };
const algorithmWord = { word: "hello", source: "algorithm", syllables: { count: 2 } };

describe("wordCache", () => {
  it("uses a versioned cache envelope and canonical key", () => {
    saveWordToCache("  HELLO ", apiWord, 1000);
    expect(JSON.parse(localStorage.getItem("wordCache"))).toEqual({
      version: 2,
      entries: { hello: { cachedAt: 1000, data: apiWord } },
    });
    expect(getWordFromCache("Hello", 2000)).toEqual(apiWord);
  });

  it("invalidates a version mismatch and malformed JSON", () => {
    localStorage.setItem("wordCache", JSON.stringify({ version: 1, entries: { hello: {} } }));
    expect(getWordFromCache("hello")).toEqual({});
    localStorage.setItem("wordCache", "not-json");
    expect(getWordFromCache("hello")).toEqual({});
  });

  it("keeps API entries for seven days and lazily removes expired entries", () => {
    saveWordToCache("hello", apiWord, 1000);
    expect(getWordFromCache("hello", 1000 + 7 * day - 1)).toEqual(apiWord);
    expect(getWordFromCache("hello", 1000 + 7 * day)).toEqual({});
    expect(JSON.parse(localStorage.getItem("wordCache")).entries.hello).toBeUndefined();
  });

  it("expires algorithm entries after one hour", () => {
    saveWordToCache("hello", algorithmWord, 1000);
    expect(getWordFromCache("hello", 1000 + 60 * 60 * 1000 - 1)).toEqual(algorithmWord);
    expect(getWordFromCache("hello", 1000 + 60 * 60 * 1000)).toEqual({});
  });

  it("replaces existing data after a refresh", () => {
    saveWordToCache("hello", apiWord, 1000);
    const refreshed = { ...apiWord, syllables: { count: 3 } };
    saveWordToCache("HELLO", refreshed, 2000);
    expect(getWordFromCache("hello", 2001)).toEqual(refreshed);
  });

  it("does not persist fallback or malformed entries", () => {
    saveWordToCache("hello", { ...apiWord, source: "fallback" });
    saveWordToCache("broken", { source: "api", syllables: { count: 0 } });
    expect(localStorage.getItem("wordCache")).toBeNull();
  });
});
