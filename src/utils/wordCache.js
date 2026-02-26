export function saveWordToCache(cache, wordData) {
  localStorage.setItem(cache, JSON.stringify(wordData));
}
