import { useEffect, useState } from "react";
import {
  canonicalizeWord,
  getWordFromCache,
  saveWordToCache,
} from "./wordCache";
import { countSyllables } from "./syllableCounter";
import { useAuth } from "../context/useAuth";

export const useWordData = (wordToFetch) => {
  const [wordData, setWordData] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    if (!wordToFetch) return;
    const canonicalWord = canonicalizeWord(wordToFetch);

    const fetchWordData = async () => {
      setLoading(true);
      setError(null);
      const url = `${import.meta.env.VITE_API_URL}/word/`;

      // Check Cache for word
      const cached = getWordFromCache(canonicalWord);
      if (Object.keys(cached).length > 0) {
        setWordData(cached);
        setConfidence(cached.source === "api" ? "verified" : "estimated");
        setLoading(false);
        return;
      }

      // Not cached? Fetch from API
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            word: canonicalWord,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error: Status ${response.status}`);
        }

        const data = await response.json();
        // Save to Cache
        saveWordToCache(canonicalWord, data);
        setWordData(data);
        setConfidence(data.source === "api" ? "verified" : "estimated");
      } catch (error) {
        setError(error.message);
        const fallBackSyllables = countSyllables(canonicalWord);

        const fallbackData = {
          word: canonicalWord,
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
  }, [wordToFetch, token]);

  return { wordData, confidence, loading, error };
};
