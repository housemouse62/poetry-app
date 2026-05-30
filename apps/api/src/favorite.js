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
      const newFavorite = await prisma.favorite.create({
        data: {
          userID: req.user.id,
          poemID: parseInt(req.params.poemID),
          poemType: req.params.poemType,
          privacy: req.body.privacy,
        },
      });
      res.status(201).json(newFavorite);
    } catch (error) {
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
