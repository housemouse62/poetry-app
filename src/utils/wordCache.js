const CACHE_KEY = "wordCache";

export function saveWordToCache(word, wordData) {
  // get localData from local storage
  const stored = localStorage.getItem(CACHE_KEY);
  let cache = stored ? JSON.parse(stored) : {};

  if (cache[word]) {
    return;
  } else {
    cache[word] = wordData;
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  }
}

export function getWordFromCache(word) {
  const stored = localStorage.getItem(CACHE_KEY);
  const cache = stored ? JSON.parse(stored) : {};
  return cache[word] || {};
}
