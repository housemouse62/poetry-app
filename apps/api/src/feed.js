import { Router } from "express";
import { prisma } from "../db/prismaClient.js";
import verifyToken from "../middleware/verifyToken.js";
import { createLimiter } from "../middleware/limiters.js";
import { body, validationResult } from "express-validator";

const feedRouter = Router();

// view feed

feedRouter.get("/", verifyToken, async (req, res, next) => {
  const {
    pageSize = "20",
    page = "1",
    type = "all",
    date = "all",
    sort = "all",
  } = req.query;

  let dateQuery = null;
  if (date === "24hours") dateQuery = new Date(Date.now() - 86400000);
  if (date === "3days") dateQuery = new Date(Date.now() - 86400000 * 3);
  if (date === "7days") dateQuery = new Date(Date.now() - 86400000 * 7);
  const dateFilter = dateQuery ? { createdAt: { gte: dateQuery } } : {};

  const parsedPage = parseInt(page);
  const parsedPageSize = parseInt(pageSize);

  try {
    let limericks = [];
    let haikus = [];

    if (type === "all" || type === "haiku") {
      haikus = await prisma.haiku.findMany({
        where: { published: true, ...dateFilter },
        include: {
          _count: {
            select: { comments: true, haikuLikes: true },
          },
        },
      });
    }
    if (type === "all" || type === "limerick") {
      limericks = await prisma.limerick.findMany({
        where: { published: true, ...dateFilter },
        include: {
          _count: {
            select: { comments: true, limerickLikes: true },
          },
        },
      });
    }
  } catch (error) {
    next(error);
  }
});
