export const fetchWordFromAPI = async (word) => {
  const apiKey = process.env.WORDS_API_KEY;

  try {
    const response = await fetch(
      `https://wordsapiv1.p.rapidapi.com/words/${word}`,
      {
        method: "GET",
        headers: {
          "x-rapidapi-host": "wordsapiv1.p.rapidapi.com",
          "x-rapidapi-key": apiKey,
        },
      },
    );

    const data = await response.json();

    return data;
  } catch (error) {
    return null;
  }
};
