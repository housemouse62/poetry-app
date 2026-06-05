import { useEffect, useState } from "react";
import { getWordFromCache, saveWordToCache } from "./wordCache";
import { countSyllables } from "./syllableCounter";
import { useAuth } from "../context/AuthContext";

export const useWordData = (wordToFetch) => {
  const [wordData, setWordData] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    if (!wordToFetch) return;

    const fetchWordData = async () => {
      setLoading(true);
      setError(null);
      const url = `${import.meta.env.VITE_API_URL}/word/`;

      // Check Cache for word
      const cached = getWordFromCache(wordToFetch);
      if (Object.keys(cached).length > 0) {
        setWordData(cached);
        setConfidence("verified");
        setLoading(false);
        return;
      }

      // Not cached? Fetch from API
      try {
        console.log("Fetching word:", wordToFetch);
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            word: wordToFetch,
          }),
        });

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
        saveWordToCache(wordToFetch, fallbackData);
        setConfidence("estimated");
      } finally {
        setLoading(false);
      }
    };
    fetchWordData();
  }, [wordToFetch]);

  return { wordData, confidence, loading, error };
};
