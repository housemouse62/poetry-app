const CACHE_KEY = "wordCache";
const CACHE_VERSION = 2;
const API_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const ALGORITHM_TTL_MS = 60 * 60 * 1000;

export const canonicalizeWord = (word) =>
  String(word ?? "").trim().toLowerCase();

const emptyCache = () => ({ version: CACHE_VERSION, entries: {} });

const readCache = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    if (
      parsed?.version !== CACHE_VERSION ||
      !parsed.entries ||
      typeof parsed.entries !== "object" ||
      Array.isArray(parsed.entries)
    ) {
      return emptyCache();
    }
    return parsed;
  } catch {
    return emptyCache();
  }
};

const isValidWordData = (data) =>
  data &&
  (data.source === "api" || data.source === "algorithm") &&
  Number.isInteger(data.syllables?.count) &&
  data.syllables.count > 0;

export function saveWordToCache(word, wordData, now = Date.now()) {
  if (!isValidWordData(wordData)) return;
  const canonicalWord = canonicalizeWord(word);
  const cache = readCache();
  cache.entries[canonicalWord] = { cachedAt: now, data: wordData };
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

export function getWordFromCache(word, now = Date.now()) {
  const canonicalWord = canonicalizeWord(word);
  const cache = readCache();
  const entry = cache.entries[canonicalWord];
  if (!entry || !isValidWordData(entry.data)) return {};

  const ttl = entry.data.source === "api" ? API_TTL_MS : ALGORITHM_TTL_MS;
  if (!Number.isFinite(entry.cachedAt) || now - entry.cachedAt >= ttl) {
    delete cache.entries[canonicalWord];
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    return {};
  }
  return entry.data;
}
