import { Router } from "express";
import { prisma } from "../db/prismaClient.js";
import { body } from "express-validator";
import verifyAdmin from "../middleware/verifyAdmin.js";
import verifyToken from "../middleware/verifyToken.js";

const wordRouter = Router();

wordRouter.post("/", verifyToken, async (req, res, next) => {
  try {
    const word = await prisma.word.findUnique({
      where: { word: req.body.word },
    });
    if (word) {
      return res.status(200).json(word);
    }
    const newWord = await prisma.word.create({
      data: {
        word: req.body.word,
        source: req.body.source,
        syllableCount: req.body.syllableCount,
        data: req.body.data,
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

export default wordRouter;
