import { Router } from "express";
import { prisma } from "../db/prismaClient.js";
import verifyToken from "../middleware/verifyToken.js";

const haikuRouter = Router();

// create a haiku
haikuRouter.post("/", verifyToken, async (req, res, next) => {
  try {
    const newHaiku = await prisma.haiku.create({
      data: {
        title: req.body.title,
        lineOne: req.body.lineOne,
        lineTwo: req.body.lineTwo,
        lineThree: req.body.lineThree,
        lineOneSyllables: req.body.lineOneSyllables,
        lineTwoSyllables: req.body.lineTwoSyllables,
        lineThreeSyllables: req.body.lineThreeSyllables,
        published: req.body.published,
        authorID: req.user.id,
        screenname: req.user.screenname,
      },
    });
    res.status(201).json(newHaiku);
  } catch (error) {
    next(error);
  }
});

// get all published haikus
haikuRouter.get("/", verifyToken, async (req, res, next) => {
  try {
    const allHaikus = await prisma.haiku.findMany({
      where: { published: true },
      include: {
        _count: {
          select: { comments: true, haikuLikes: true },
        },
      },
    });
    res.json(allHaikus);
  } catch (error) {
    next(error);
  }
});

// get all haikus belonging to the logged-in user
haikuRouter.get("/mine", verifyToken, async (req, res, next) => {
  try {
    const myHaikus = await prisma.haiku.findMany({
      where: { authorID: req.user.id },
      include: {
        _count: {
          select: { comments: true, haikuLikes: true },
        },
      },
    });
    res.json(myHaikus);
  } catch (error) {
    next(error);
  }
});

// get a specific haiku by id
haikuRouter.get("/:id", verifyToken, async (req, res, next) => {
  try {
    const haiku = await prisma.haiku.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        _count: { select: { comments: true, haikuLikes: true } },
      },
    });
    if (!haiku) {
      return res.status(404).json({ error: "Haiku doesn't exist in database" });
    }
    if (haiku.authorID !== req.user.id && !haiku.published) {
      return res
        .status(403)
        .json({ error: "You are not authorized to see this poem" });
    }
    res.json(haiku);
  } catch (error) {
    next(error);
  }
});

// get all published haikus belonging to a specific user
haikuRouter.get("/user/:userID", verifyToken, async (req, res, next) => {
  try {
    const userHaikus = await prisma.haiku.findMany({
      where: { authorID: parseInt(req.params.userID), published: true },
      include: {
        _count: { select: { comments: true, haikuLikes: true } },
      },
    });
    res.json(userHaikus);
  } catch (error) {
    next(error);
  }
});

// edit a specific haiku
haikuRouter.patch("/:id", verifyToken, async (req, res, next) => {
  try {
    const haikuID = parseInt(req.params.id);
    if (isNaN(haikuID))
      return res.status(404).json({ error: "Invalid haiku ID" });

    const findHaiku = await prisma.haiku.findUnique({ where: { id: haikuID } });

    if (!findHaiku) {
      return res.status(404).json({ error: "Haiku not found" });
    }
    if (findHaiku.authorID !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized User" });
    }

    const haiku = await prisma.haiku.update({
      where: { id: haikuID },
      data: {
        title: req.body.title,
        lineOne: req.body.lineOne,
        lineTwo: req.body.lineTwo,
        lineThree: req.body.lineThree,
        lineOneSyllables: req.body.lineOneSyllables,
        lineTwoSyllables: req.body.lineTwoSyllables,
        lineThreeSyllables: req.body.lineThreeSyllables,
      },
    });
    return res.status(200).json(haiku);
  } catch (error) {
    next(error);
  }
});

// delete a specific haiku
haikuRouter.delete("/:id", verifyToken, async (req, res, next) => {
  try {
    const haikuID = parseInt(req.params.id);
    if (isNaN(haikuID))
      return res.status(404).json({ error: "Invalid Haiku ID" });

    const findHaiku = await prisma.haiku.findUnique({
      where: { id: haikuID },
    });
    if (!findHaiku) {
      return res.status(404).json({ error: "Haiku Not Found" });
    }
    if (req.user.id === findHaiku.authorID || req.user.usertype === "admin") {
      const haiku = await prisma.haiku.delete({
        where: { id: haikuID },
      });
      return res.status(200).json(haiku);
    } else {
      return res.status(403).json({ error: "Unauthorized Credentials" });
    }
  } catch (error) {
    next(error);
  }
});

// user can like a haiku
haikuRouter.post("/:id/like", verifyToken, async (req, res, next) => {
  try {
    const haikuID = parseInt(req.params.id);
    if (isNaN(haikuID))
      return res.status(400).json({ error: "Invalid Haiku ID" });

    const haiku = await prisma.haiku.findUnique({
      where: { id: haikuID },
    });
    if (!haiku) return res.status(404).json({ error: "Haiku Not Found" });

    const like = await prisma.haikuLike.create({
      data: {
        userID: req.user.id,
        haikuID: haikuID,
      },
    });
    return res.status(201).json(like);
  } catch (error) {
    next(error);
  }
});

//user can delete their like (unlike)
haikuRouter.delete("/:id/like", verifyToken, async (req, res, next) => {
  try {
    const haikuID = parseInt(req.params.id);
    if (isNaN(haikuID))
      return res.status(400).json({ error: "Invalid Haiku ID" });

    const haiku = await prisma.haiku.findUnique({
      where: { id: haikuID },
    });
    if (!haiku) return res.status(404).json({ error: "Haiku Not Found" });

    const like = await prisma.haikuLike.delete({
      where: {
        userID_haikuID: {
          haikuID: haikuID,
          userID: req.user.id,
        },
      },
    });
    return res.status(200).json(like);
  } catch (error) {
    next(error);
  }
});

export default haikuRouter;
