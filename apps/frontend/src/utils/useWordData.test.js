import { describe, expect, it, vi } from "vitest";
import { waitFor } from "@testing-library/react";
import { renderHook } from "../../tests/test-utils";
import { useWordData } from "./useWordData";
import { getWordFromCache, saveWordToCache } from "./wordCache";

const response = (body, ok = true) =>
  Promise.resolve({ ok, status: ok ? 200 : 503, json: () => Promise.resolve(body) });
const apiWord = {
  word: "hello",
  source: "api",
  flagged: false,
  syllables: { count: 2, list: ["hel", "lo"] },
  pronunciation: { all: "hɛ'loʊ" },
  data: { syllables: { count: 2, list: ["hel", "lo"] } },
};

describe("useWordData", () => {
  it("uses a fresh API cache entry without requesting and reports verified", async () => {
    saveWordToCache("hello", apiWord);
    const { result } = renderHook(() => useWordData(" HELLO "));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.wordData).toEqual(apiWord);
    expect(result.current.confidence).toBe("verified");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("refreshes an expired entry and overwrites stale data", async () => {
    saveWordToCache("hello", { ...apiWord, syllables: { count: 3 } }, 0);
    fetch.mockReturnValueOnce(response(apiWord));
    const { result } = renderHook(() => useWordData("Hello"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/word/"),
      expect.objectContaining({ body: JSON.stringify({ word: "hello" }) }),
    );
    expect(getWordFromCache("hello")).toEqual(apiWord);
    expect(result.current.confidence).toBe("verified");
  });

  it("reports a normalized server algorithm response as estimated", async () => {
    const algorithmWord = { ...apiWord, source: "algorithm" };
    fetch.mockReturnValueOnce(response(algorithmWord));
    const { result } = renderHook(() => useWordData("hello"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.wordData).toEqual(algorithmWord);
    expect(result.current.confidence).toBe("estimated");
    expect(getWordFromCache("hello")).toEqual(algorithmWord);
  });

  it("uses but does not persist a frontend network fallback", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));
    const { result } = renderHook(() => useWordData("hello"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.wordData).toEqual({
      word: "hello",
      syllables: { count: 2 },
      source: "fallback",
    });
    expect(result.current.confidence).toBe("estimated");
    expect(getWordFromCache("hello")).toEqual({});
  });
});
