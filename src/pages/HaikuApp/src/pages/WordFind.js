import { useEffect, useState } from "react";
const apiKey = import.meta.env.VITE_WORDS_API_KEY;

const WordFind = (wordToFetch) => {
  const [wordData, setWordData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWordData = async () => {
      try {
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
        if (!apiKey) {
          throw new Error("apiKey missing");
        }
        if (!response.ok) {
          throw new Error(`HTTP error: Status ${response.status}`);
        }
        let wordData = await response.json();
        setWordData(wordData);
        setError(null);
      } catch (error) {
        console.log(error);
        setError(error.message);
        setWordData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchWordData();
  }, [wordToFetch]);

  return { wordData, loading, error };
};

export const useWordData = WordFind;
