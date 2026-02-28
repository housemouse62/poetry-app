import { useEffect, useState } from "react";
import { getWordFromCache, saveWordToCache } from "../../../../utils/wordCache";
import { countSyllables } from "./syllableCounter";

const apiKey = import.meta.env.VITE_WORDS_API_KEY;

export const useWordData = (wordToFetch) => {
  const [wordData, setWordData] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!wordToFetch) return;

    const fetchWordData = async () => {
      setLoading(true);
      setError(null);

      // Check Cache for word
      const cached = getWordFromCache(wordToFetch);
      console.log(cached);
      if (Object.keys(cached).length > 0) {
        setWordData(cached);
        setConfidence("verified");
        setLoading(false);
        return;
      }

      // Not cached? Fetch from API
      try {
        if (!apiKey) {
          throw new Error("API key missing");
        }

        const response = await fetch(
          `https://wordsapiv1.p.rapidapi.com/words/${wordToFetch}`,
          {
            method: "GET",
            headers: {
              "x-rapidapi-host": "wordsapiv1.p.rapidapi.com",
              "x-rapidapi-key": apiKey,
            },
          },
        );

        if (!response.ok) {
          throw new Error(`HTTP error: Status ${response.status}`);
        }

        const data = await response.json();

        // Save to Cache
        saveWordToCache(wordToFetch, data);
        setWordData(data);
        setConfidence("verified");
      } catch (error) {
        setError(error.message);
        const fallBackSyllables = countSyllables(wordToFetch);
        const fallbackData = {
          word: wordToFetch,
          syllables: { count: fallBackSyllables }, // from countSyllables
          source: "fallback",
        };
        setWordData(fallbackData);
        setConfidence("estimated");
      } finally {
        setLoading(false);
      }
    };
    fetchWordData();
  }, [wordToFetch]);

  return { wordData, confidence, loading, error };
};
