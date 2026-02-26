export function saveWordToCache(word, wordData) {
  // get localData from local storage
  const stored = localStorage.getItem("wordCache");
  let cache = stored ? JSON.parse(stored) : {};

  if (cache[word]) {
    return;
  } else {
    cache[word] = wordData;
    localStorage.setItem("wordCache", JSON.stringify(cache));
  }
}

export function getWordFromCache(word) {
  const stored = localStorage.getItem("wordCache");
  const cache = stored ? JSON.parse(stored) : {};
  return cache[word] || {};
}
