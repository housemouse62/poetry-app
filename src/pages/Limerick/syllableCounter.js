export function countSyllables(text) {
  if (!text.trim() || !text) return 0;

  text = text.toLowerCase().replace(/[^a-z\s]/g, "");
  const words = text.split(/\s+/).filter((word) => word.length > 0);

  let totalSyllables = 0;

  words.forEach((word) => {
    let syllables = 0;

    // Special handling for -ing words FIRST
    if (word.endsWith("ing") && word.length > 3) {
      const root = word.slice(0, -3);
      const rootVowels = root.match(/[aeiouy]+/g);
      syllables = rootVowels ? rootVowels.length : 0;

      syllables += 1;

      if (
        root.endsWith("e") &&
        !root.endsWith("ee") &&
        syllables > 1 &&
        root.length > 2
      ) {
        syllables--;
      }
    }
    // Special handling for -ed words
    else if (word.endsWith("ed") && word.length > 2) {
      const root = word.slice(0, -2);
      const rootVowels = root.match(/[aeiouy]+/g);
      syllables = rootVowels ? rootVowels.length : 0;

      // Check if root ends in 'l' or 'r' - if so, -ed is silent
      if (root.endsWith("l") || root.endsWith("r")) {
        // -ed is silent, don't add anything
      }
      // Check if root ends in 't' or 'd' - -ed adds a syllable
      else if (root.endsWith("t") || root.endsWith("d")) {
        syllables += 1;
      }
      // For other endings, -ed is usually silent

      // Handle silent 'e' in root if present
      if (root.endsWith("e") && syllables > 1) {
        syllables--;
      }
    } else {
      // Normal syllable counting for non-ing, non-ed words
      const vowelGroups = word.match(/[aeiouy]+/g);
      if (vowelGroups) {
        syllables = vowelGroups.length;
      }
      if (word.endsWith("some") && syllables > 1) {
        syllables--;
      }
      if (word.endsWith("e") && syllables > 1) {
        syllables--;
      }

      if (
        word.endsWith("le") &&
        word.length > 2 &&
        !/[aeiouy]/.test(word[word.length - 3])
      ) {
        syllables++;
      }
    }

    if (syllables === 0) {
      syllables = 1;
    }

    totalSyllables += syllables;
  });

  return totalSyllables;
}
