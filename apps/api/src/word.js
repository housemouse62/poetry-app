import { Router } from "express";
import { prisma } from "../db/prismaClient.js";
import { body } from "express-validator";
import verifyAdmin from "../middleware/verifyAdmin.js";
import verifyToken from "../middleware/verifyToken.js";
import { createLimiter } from "../middleware/limiters.js";
import { fetchWordFromAPI } from "./utils/wordsAPI.js";
import { countSyllables } from "./utils/syllableCounter.js";

const wordRouter = Router();

wordRouter.post("/", verifyToken, createLimiter, async (req, res, next) => {
  try {
    const word = req.body.word;

    const dbWord = await prisma.word.findUnique({
      where: { word: word },
    });
    if (dbWord) {
      return res.status(200).json(dbWord);
    }
    const fetchedWord = await fetchWordFromAPI(word);

    let countedSyllables = 0;
    if (!fetchedWord || !fetchedWord.syllables) {
      countedSyllables = countSyllables(word);
    }

    const newWord = await prisma.word.create({
      data: {
        word: word,
        source: fetchedWord?.syllables?.count ? "api" : "algorithm",
        syllableCount: fetchedWord?.syllables?.count || countedSyllables,
        data: fetchedWord ?? {},
      },
    });

    return res.status(201).json(newWord);
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(400).json({ error: "Word already in database" });
    }
    next(err);
  }
});

wordRouter.get("/:word", verifyToken, async (req, res, next) => {
  try {
    const word = await prisma.word.findUnique({
      where: { word: req.params.word },
    });
    if (!word) {
      return res.status(404).json({ error: "Word doesn't exist in database" });
    }
    return res.status(200).json(word);
  } catch (err) {
    next(err);
  }
});

wordRouter.patch(
  "/:word/flag",
  verifyToken,
  createLimiter,
  async (req, res, next) => {
    try {
      const word = await prisma.word.findUnique({
        where: { word: req.params.word },
      });
      if (!word) {
        return res
          .status(404)
          .json({ error: "Word doesn't exist in database" });
      }
      const newWord = await prisma.word.update({
        where: { word: req.params.word },
        data: { flagged: !word.flagged },
      });

      return res.status(200).json(newWord);
    } catch (err) {
      if (err.code === "P2025") {
        return res
          .status(404)
          .json({ error: "Word doesn't exist in database" });
      }
      {
        next(err);
      }
    }
  },
);

export default wordRouter;
