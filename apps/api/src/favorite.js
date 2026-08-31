import { Router } from "express";
import { prisma } from "../db/prismaClient.js";
import verifyToken from "../middleware/verifyToken.js";
import { createLimiter } from "../middleware/limiters.js";

const favoriteRouter = Router();

// user can see their own favorites
favoriteRouter.get("/mine", verifyToken, async (req, res, next) => {
  try {
    const myFavorites = await prisma.favorite.findMany({
      where: { userID: req.user.id },
    });
    res.status(200).json(myFavorites);
  } catch (error) {
    next(error);
  }
});

// user can see someone elses public favorites
favoriteRouter.get("/:userID", verifyToken, async (req, res, next) => {
  try {
    const userID = parseInt(req.params.userID);
    if (isNaN(userID))
      return res.status(400).json({ error: "Invalid User ID" });

    const userFavorites = await prisma.favorite.findMany({
      where: { userID: userID, privacy: "public" },
    });
    res.status(200).json(userFavorites);
  } catch (error) {
    next(error);
  }
});

// user can add a favorite to their list
favoriteRouter.post(
  "/:poemType/:poemID",
  verifyToken,
  createLimiter,
  async (req, res, next) => {
    try {
      const poemID = Number(req.params.poemID);
      const poemType = req.params.poemType;
      const privacy = req.body?.privacy ?? "private";

      if (!Number.isInteger(poemID) || poemID < 1) {
        return res.status(400).json({ error: "Invalid Poem ID" });
      }
      if (poemType !== "haiku" && poemType !== "limerick") {
        return res.status(400).json({ error: "Invalid Poem Type" });
      }
      if (privacy !== "private" && privacy !== "public") {
        return res.status(400).json({ error: "Invalid Privacy" });
      }

      const poem =
        poemType === "haiku"
          ? await prisma.haiku.findUnique({ where: { id: poemID } })
          : await prisma.limerick.findUnique({ where: { id: poemID } });
      if (!poem) return res.status(404).json({ error: "Poem Not Found" });
      if (!poem.published && poem.authorID !== req.user.id) {
        return res.status(403).json({ error: "Unauthorized Credentials" });
      }

      const newFavorite = await prisma.favorite.create({
        data: {
          userID: req.user.id,
          poemID,
          poemType,
          privacy,
        },
      });
      res.status(201).json(newFavorite);
    } catch (error) {
      next(error);
    }
  },
);

// user can update the privacy of a favorite
favoriteRouter.patch(
  "/:poemType/:poemID",
  verifyToken,
  async (req, res, next) => {
    try {
      const updatedFavorite = await prisma.favorite.update({
        where: {
          userID_poemID_poemType: {
            userID: req.user.id,
            poemID: parseInt(req.params.poemID),
            poemType: req.params.poemType,
          },
        },
        data: { privacy: req.body.privacy },
      });
      return res.status(200).json(updatedFavorite);
    } catch (error) {
      if (error.code === "P2025") {
        return res.status(404).json({ error: "Favorite not found" });
      }
      next(error);
    }
  },
);

// user can delete a favorite from their list
favoriteRouter.delete(
  "/:poemType/:poemID",
  verifyToken,
  async (req, res, next) => {
    try {
      const deleteFavorite = await prisma.favorite.delete({
        where: {
          userID_poemID_poemType: {
            userID: req.user.id,
            poemID: parseInt(req.params.poemID),
            poemType: req.params.poemType,
          },
        },
      });
      res.status(200).json(deleteFavorite);
    } catch (error) {
      next(error);
    }
  },
);
export default favoriteRouter;
