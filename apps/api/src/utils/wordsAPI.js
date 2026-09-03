export const fetchWordFromAPI = async (word) => {
  const apiKey = process.env.WORDS_API_KEY;

  if (!apiKey) return { ok: false, kind: "configuration" };

  try {
    const response = await fetch(
      `https://wordsapiv1.p.rapidapi.com/words/${encodeURIComponent(word)}`,
      {
        method: "GET",
        headers: {
          "x-rapidapi-host": "wordsapiv1.p.rapidapi.com",
          "x-rapidapi-key": apiKey,
        },
      },
    );

    if (!response.ok) {
      return { ok: false, kind: "http", status: response.status };
    }
    return { ok: true, data: await response.json() };
  } catch (error) {
    return { ok: false, kind: "network" };
  }
};
