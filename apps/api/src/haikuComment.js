import { Router } from "express";
import { prisma } from "../db/prismaClient.js";
import verifyToken from "../middleware/verifyToken.js";
import { verify } from "jsonwebtoken";

const haikuCommentRouter = Router();

// any user post comment
haikuCommentRouter.post("/", verifyToken, async (req, res, next) => {
  try {
  } catch (error) {
    next(error);
  }
});

// any user get all comments for one post
haikuCommentRouter.get("/:poemID", verifyToken, async (req, res, next) => {
  try {
  } catch (error) {
    next(error);
  }
});

// author edit their own comment. || user can like a comment
haikuCommentRouter.patch("/:commentID", verifyToken, async (req, res, next) => {
  try {
  } catch (error) {
    next(error);
  }
});

// author delete their own comment || admin delete any comment
haikuCommentRouter.delete(
  "/:commentID",
  verifyToken,
  async (req, res, next) => {
    try {
    } catch (error) {
      next(error);
    }
  },
);

export default haikuCommentRouter;
