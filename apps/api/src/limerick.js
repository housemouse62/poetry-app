import { Router } from "express";
import { prisma } from "../db/prismaClient.js";
import verifyToken from "../middleware/verifyToken.js";

const limerickRouter = Router();

// create a limerick
limerickRouter.post("/", verifyToken, async (req, res, next) => {
  try {
    const newlimerick = await prisma.limerick.create({
      data: {
        title: req.body.title,
        lineOne: req.body.lineOne,
        lineTwo: req.body.lineTwo,
        lineThree: req.body.lineThree,
        lineFour: req.body.lineFour,
        lineFive: req.body.lineFive,
        lineOneSyllables: req.body.lineOneSyllables,
        lineTwoSyllables: req.body.lineTwoSyllables,
        lineThreeSyllables: req.body.lineThreeSyllables,
        lineFourSyllables: req.body.lineFourSyllables,
        lineFiveSyllables: req.body.lineFiveSyllables,
        rhymeA: req.body.rhymeA,
        rhymeB: req.body.rhymeB,
        rhymeAVerified: req.body.rhymeAVerified,
        rhymeBVerified: req.body.rhymeBVerified,
        published: req.body.published,
        authorID: req.user.id,
        screenname: req.user.screenname,
      },
    });
    res.status(201).json(newlimerick);
  } catch (error) {
    next(error);
  }
});

// get all published limericks
limerickRouter.get("/", verifyToken, async (req, res, next) => {
  try {
    const alllimericks = await prisma.limerick.findMany({
      where: { published: true },
      include: {
        _count: {
          select: { comments: true, limerickLikes: true },
        },
      },
    });
    res.json(alllimericks);
  } catch (error) {
    next(error);
  }
});

// get all limericks belonging to the logged-in user
limerickRouter.get("/mine", verifyToken, async (req, res, next) => {
  try {
    const mylimericks = await prisma.limerick.findMany({
      where: { authorID: req.user.id },
      include: {
        _count: {
          select: { comments: true, limerickLikes: true },
        },
      },
    });
    res.json(mylimericks);
  } catch (error) {
    next(error);
  }
});

// get a specific limerick by id
limerickRouter.get("/:id", verifyToken, async (req, res, next) => {
  try {
    const limerick = await prisma.limerick.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        _count: { select: { comments: true, limerickLikes: true } },
      },
    });
    if (!limerick) {
      return res
        .status(404)
        .json({ error: "limerick doesn't exist in database" });
    }
    if (limerick.authorID !== req.user.id && !limerick.published) {
      return res
        .status(403)
        .json({ error: "You are not authorized to see this poem" });
    }
    res.json(limerick);
  } catch (error) {
    next(error);
  }
});

// get all published limericks belonging to a specific user
limerickRouter.get("/user/:userID", verifyToken, async (req, res, next) => {
  try {
    const userlimericks = await prisma.limerick.findMany({
      where: { authorID: parseInt(req.params.userID), published: true },
      include: {
        _count: { select: { comments: true, limerickLikes: true } },
      },
    });
    res.json(userlimericks);
  } catch (error) {
    next(error);
  }
});

// edit a specific limerick
limerickRouter.patch("/:id", verifyToken, async (req, res, next) => {
  try {
    const limerickID = parseInt(req.params.id);
    if (isNaN(limerickID))
      return res.status(404).json({ error: "Invalid limerick ID" });

    const findlimerick = await prisma.limerick.findUnique({
      where: { id: limerickID },
    });

    if (!findlimerick) {
      return res.status(404).json({ error: "Limerick not found" });
    }
    if (findlimerick.authorID !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized User" });
    }

    const limerick = await prisma.limerick.update({
      where: { id: limerickID },
      data: {
        title: req.body.title,
        lineOne: req.body.lineOne,
        lineTwo: req.body.lineTwo,
        lineThree: req.body.lineThree,
        lineFour: req.body.lineFour,
        lineFive: req.body.lineFive,
        lineOneSyllables: req.body.lineOneSyllables,
        lineTwoSyllables: req.body.lineTwoSyllables,
        lineThreeSyllables: req.body.lineThreeSyllables,
        lineFourSyllables: req.body.lineFourSyllables,
        lineFiveSyllables: req.body.lineFiveSyllables,
        rhymeA: req.body.rhymeA,
        rhymeB: req.body.rhymeB,
        rhymeAVerified: req.body.rhymeAVerified,
        rhymeBVerified: req.body.rhymeBVerified,
      },
    });
    return res.status(200).json(limerick);
  } catch (error) {
    next(error);
  }
});

// delete a specific limerick
limerickRouter.delete("/:id", verifyToken, async (req, res, next) => {
  try {
    const limerickID = parseInt(req.params.id);
    if (isNaN(limerickID))
      return res.status(404).json({ error: "Invalid limerick ID" });

    const findlimerick = await prisma.limerick.findUnique({
      where: { id: limerickID },
    });
    if (!findlimerick) {
      return res.status(404).json({ error: "Limerick Not Found" });
    }
    if (
      req.user.id === findlimerick.authorID ||
      req.user.usertype === "admin"
    ) {
      const limerick = await prisma.limerick.delete({
        where: { id: limerickID },
      });
      return res.status(200).json(limerick);
    } else {
      return res.status(403).json({ error: "Unauthorized Credentials" });
    }
  } catch (error) {
    next(error);
  }
});

// user can like a limerick
limerickRouter.post("/:id/like", verifyToken, async (req, res, next) => {
  try {
    const limerickID = parseInt(req.params.id);
    if (isNaN(limerickID))
      return res.status(400).json({ error: "Invalid Limerick ID" });

    const limerick = await prisma.limerick.findUnique({
      where: { id: limerickID },
    });
    if (!limerick) return res.status(404).json({ error: "Limerick Not Found" });

    const like = await prisma.limerickLike.create({
      data: {
        userID: req.user.id,
        limerickID: limerickID,
      },
    });
    return res.status(201).json(like);
  } catch (error) {
    next(error);
  }
});

//user can delete their like (unlike)
limerickRouter.delete("/:id/like", verifyToken, async (req, res, next) => {
  try {
    const limerickID = parseInt(req.params.id);
    if (isNaN(limerickID))
      return res.status(400).json({ error: "Invalid Limerick ID" });

    const limerick = await prisma.limerick.findUnique({
      where: { id: limerickID },
    });
    if (!limerick) return res.status(404).json({ error: "Limerick Not Found" });

    const like = await prisma.limerickLike.delete({
      where: {
        userID_limerickID: {
          limerickID: limerickID,
          userID: req.user.id,
        },
      },
    });
    return res.status(200).json(like);
  } catch (error) {
    next(error);
  }
});

export default limerickRouter;
