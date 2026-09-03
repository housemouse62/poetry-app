import { Router } from "express";
import { prisma } from "../db/prismaClient.js";
import verifyToken from "../middleware/verifyToken.js";
import { createLimiter } from "../middleware/limiters.js";
import { fetchWordFromAPI } from "./utils/wordsAPI.js";
import { countSyllables } from "./utils/syllableCounter.js";

const wordRouter = Router();
const API_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const ALGORITHM_TTL_MS = 24 * 60 * 60 * 1000;

const canonicalizeWord = (word) => String(word ?? "").trim().toLowerCase();
const hasUsableSyllableCount = (data) =>
  Number.isInteger(data?.syllables?.count) && data.syllables.count > 0;

const normalizeWord = (word) => {
  const list = Array.isArray(word.data?.syllables?.list)
    ? word.data.syllables.list
    : undefined;
  return {
    word: word.word,
    source: word.source,
    flagged: word.flagged,
    syllables: { count: word.syllableCount, ...(list ? { list } : {}) },
    ...(word.data?.pronunciation
      ? { pronunciation: word.data.pronunciation }
      : {}),
    data: word.data,
  };
};

const isFresh = (word, now = Date.now()) => {
  const ttl = word.source === "api" ? API_TTL_MS : ALGORITHM_TTL_MS;
  return now - new Date(word.refreshedAt).getTime() < ttl;
};

const findCachedWord = async (word) => {
  const exactWord = await prisma.word.findUnique({ where: { word } });
  if (exactWord) return exactWord;

  const legacyRows = await prisma.$queryRaw`
    SELECT * FROM "Word"
    WHERE lower(btrim("word")) = ${word}
    ORDER BY "refreshedAt" DESC, "id" DESC
    LIMIT 1
  `;
  const legacyWord = legacyRows[0];
  if (!legacyWord) return null;

  try {
    return await prisma.word.update({
      where: { id: legacyWord.id },
      data: { word },
    });
  } catch (error) {
    if (error.code !== "P2002") throw error;
    return prisma.word.findUnique({ where: { word } });
  }
};

const estimatorResponse = (word) => ({
  word,
  source: "fallback",
  flagged: false,
  syllables: { count: countSyllables(word) },
  data: {},
});

const refreshWord = async (word, existingWord) => {
  const upstream = await fetchWordFromAPI(word);
  if (!upstream.ok) {
    return existingWord?.source === "api"
      ? normalizeWord(existingWord)
      : estimatorResponse(word);
  }

  const authoritative = hasUsableSyllableCount(upstream.data);
  const cacheData = {
    source: authoritative ? "api" : "algorithm",
    syllableCount: authoritative
      ? upstream.data.syllables.count
      : countSyllables(word),
    data: upstream.data,
    refreshedAt: new Date(),
  };

  try {
    const cachedWord = existingWord
      ? await prisma.word.update({
          where: { id: existingWord.id },
          data: cacheData,
        })
      : await prisma.word.create({ data: { word, ...cacheData } });
    return normalizeWord(cachedWord);
  } catch (error) {
    if (error.code !== "P2002") throw error;
    const racedWord = await prisma.word.findUnique({ where: { word } });
    if (!racedWord) throw error;
    return normalizeWord(racedWord);
  }
};

wordRouter.post("/", verifyToken, createLimiter, async (req, res, next) => {
  try {
    const word = canonicalizeWord(req.body.word);
    if (!word) return res.status(400).json({ error: "Word is required" });
    const dbWord = await findCachedWord(word);
    if (dbWord && isFresh(dbWord)) {
      return res.status(200).json(normalizeWord(dbWord));
    }
    const result = await refreshWord(word, dbWord);
    return res.status(dbWord || result.source === "fallback" ? 200 : 201).json(result);
  } catch (error) {
    next(error);
  }
});

wordRouter.get("/:word", verifyToken, async (req, res, next) => {
  try {
    const word = canonicalizeWord(req.params.word);
    const dbWord = await findCachedWord(word);
    if (!dbWord) {
      return res.status(404).json({ error: "Word doesn't exist in database" });
    }
    const result = isFresh(dbWord)
      ? normalizeWord(dbWord)
      : await refreshWord(word, dbWord);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

wordRouter.patch(
  "/:word/flag",
  verifyToken,
  createLimiter,
  async (req, res, next) => {
    try {
      const wordValue = canonicalizeWord(req.params.word);
      const word = await findCachedWord(wordValue);
      if (!word) {
        return res
          .status(404)
          .json({ error: "Word doesn't exist in database" });
      }
      const updatedWord = await prisma.word.update({
        where: { word: wordValue },
        data: { flagged: !word.flagged },
      });
      return res.status(200).json(normalizeWord(updatedWord));
    } catch (error) {
      if (error.code === "P2025") {
        return res
          .status(404)
          .json({ error: "Word doesn't exist in database" });
      }
      next(error);
    }
  },
);

export default wordRouter;
