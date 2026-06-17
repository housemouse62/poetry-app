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
  let allHaikus = [];
  let allLimericks = [];
  let dateQuery = null;
  let result = null;

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
          haikuLikes: {
            where: { userID: req.user.id },
          },
        },
      });
      const myFavorites = await prisma.favorite.findMany({
        where: { userID: req.user.id, poemType: "haiku" },
      });
      const haikusWithFavorites = haikus.map((haiku) => ({
        ...haiku,
        isFavorited: myFavorites.some((f) => f.poemID === haiku.id),
      }));
      allHaikus = haikusWithFavorites.map((haiku) => ({
        ...haiku,
        poemType: "haiku",
      }));
    }

    if (type === "all" || type === "limerick") {
      limericks = await prisma.limerick.findMany({
        where: { published: true, ...dateFilter },
        include: {
          _count: {
            select: { comments: true, limerickLikes: true },
          },
          limerickLikes: {
            where: { userID: req.user.id },
          },
        },
      });
      const myFavorites = await prisma.favorite.findMany({
        where: { userID: req.user.id, poemType: "limerick" },
      });
      const limericksWithFavorites = limericks.map((limerick) => ({
        ...limerick,
        isFavorited: myFavorites.some((f) => f.poemID === limerick.id),
      }));
      allLimericks = limericksWithFavorites.map((limerick) => ({
        ...limerick,
        poemType: "limerick",
      }));
    }

    const allPoems = [...allHaikus, ...allLimericks];

    if (sort === "likes") {
      allPoems.sort((a, b) => {
        const likeA = a._count.haikuLikes || a._count.limerickLikes;
        const likeB = b._count.haikuLikes || b._count.limerickLikes;
        if (likeA < likeB) {
          return 1;
        }
        if (likeA > likeB) {
          return -1;
        }

        return 0;
      });
    } else {
      allPoems.sort((a, b) => {
        const aSort = a.createdAt;
        const bSort = b.createdAt;
        if (aSort < bSort) {
          return 1;
        }
        if (aSort > bSort) {
          return -1;
        }

        return 0;
      });
    }

    const paginated = allPoems.slice(
      (parsedPage - 1) * parsedPageSize,
      parsedPage * parsedPageSize,
    );

    const totalPoems = allPoems.length;

    const totalPages = Math.ceil(totalPoems / parsedPageSize);
    return res.status(200).json({ totalPages, totalPoems, paginated });
  } catch (error) {
    next(error);
  }
});

export default feedRouter;
