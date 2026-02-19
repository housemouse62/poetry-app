export function countSyllables(text) {
  if (!text.trim()) return 0;

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

      // Add 1 for the 'ing' suffix
      syllables += 1;

      // NEW: Don't subtract for silent e in -eing words (seeing, being, freeing)
      if (
        root.endsWith("e") &&
        !root.endsWith("ee") &&
        syllables > 1 &&
        root.length > 2
      ) {
        syllables--;
      }
    } else {
      // Normal syllable counting for non-ing words
      const vowelGroups = word.match(/[aeiouy]+/g);
      if (vowelGroups) {
        syllables = vowelGroups.length;
      }

      // Subtract for silent 'e' at the end
      if (word.endsWith("e") && syllables > 1) {
        syllables--;
      }

      // Special case for 'le' endings
      if (
        word.endsWith("le") &&
        word.length > 2 &&
        !/[aeiouy]/.test(word[word.length - 3])
      ) {
        syllables++;
      }
    }

    // Every word has at least 1 syllable
    if (syllables === 0) {
      syllables = 1;
    }

    totalSyllables += syllables;
  });

  return totalSyllables;
}
