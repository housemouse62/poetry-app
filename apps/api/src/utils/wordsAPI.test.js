import { afterEach, describe, expect, test, vi } from "vitest";
import { fetchWordFromAPI } from "./wordsAPI";

const originalKey = process.env.WORDS_API_KEY;

afterEach(() => {
  process.env.WORDS_API_KEY = originalKey;
  vi.restoreAllMocks();
});

describe("fetchWordFromAPI", () => {
  test("classifies missing configuration without making a request", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    delete process.env.WORDS_API_KEY;
    expect(await fetchWordFromAPI("hello")).toEqual({
      ok: false,
      kind: "configuration",
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test("returns successful JSON data", async () => {
    process.env.WORDS_API_KEY = "test-key";
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ word: "hello", syllables: { count: 2 } }),
    });
    expect(await fetchWordFromAPI("hello")).toEqual({
      ok: true,
      data: { word: "hello", syllables: { count: 2 } },
    });
  });

  test("URL-encodes a word without changing its canonical characters", async () => {
    process.env.WORDS_API_KEY = "test-key";
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ word: "rock & roll" }),
    });
    await fetchWordFromAPI("rock & roll");
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://wordsapiv1.p.rapidapi.com/words/rock%20%26%20roll",
      expect.any(Object),
    );
  });

  test("classifies non-2xx and network failures without using error JSON", async () => {
    process.env.WORDS_API_KEY = "test-key";
    const json = vi.fn();
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({ ok: false, status: 429, json });
    expect(await fetchWordFromAPI("hello")).toEqual({
      ok: false,
      kind: "http",
      status: 429,
    });
    expect(json).not.toHaveBeenCalled();

    fetchSpy.mockRejectedValueOnce(new Error("offline"));
    expect(await fetchWordFromAPI("hello")).toEqual({
      ok: false,
      kind: "network",
    });
  });
});
