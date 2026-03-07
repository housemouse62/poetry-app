exports.handler = async (event) => {
  const word = event.queryStringParameters.word;

  if (!word) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Word parameter required" }),
    };
  }

  const apiKey = process.env.VITE_WORDS_API_KEY;

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

    return {
      statusCode: response.status,
      body: JSON.stringify(data),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
