import { Router } from "express";
import { prisma } from "../db/prismaClient.js";
import verifyToken from "../middleware/verifyToken.js";
import { createLimiter } from "../middleware/limiters.js";
import { body, validationResult } from "express-validator";

const limerickRouter = Router();

// create a limerick
limerickRouter.post(
  "/",
  verifyToken,
  createLimiter,
  body("title")
    .notEmpty()
    .withMessage("Title cannot be empty")
    .isLength({ max: 100 }),
  body(["lineOne", "lineTwo", "lineThree", "lineFour", "lineFive"])
    .notEmpty()
    .withMessage("Line cannot be empty")
    .isLength({ max: 100 })
    .withMessage("Line cannot exceed 100 characters"),
  body([
    "lineOneSyllables",
    "lineTwoSyllables",
    "lineThreeSyllables",
    "lineFourSyllables",
    "lineFiveSyllables",
  ])
    .notEmpty()
    .withMessage("Syllables cannot be empty")
    .isInt({ min: 0, max: 9 })
    .withMessage("Syllable count must be a number between 0 and 9"),
  async (req, res, next) => {
    const formErrors = validationResult(req);
    if (!formErrors.isEmpty()) {
      return res.status(400).json(formErrors);
    }
    try {
      const newlimerick = await prisma.limerick.create({
        data: {
          title: req.body.title,
          lineOne: req.body.lineOne,
          lineTwo: req.body.lineTwo,
          lineThree: req.body.lineThree,
          lineFour: req.body.lineFour,
          lineFive: req.body.lineFive,
          lineOneSyllables: parseInt(req.body.lineOneSyllables),
          lineTwoSyllables: parseInt(req.body.lineTwoSyllables),
          lineThreeSyllables: parseInt(req.body.lineThreeSyllables),
          lineFourSyllables: parseInt(req.body.lineFourSyllables),
          lineFiveSyllables: parseInt(req.body.lineFiveSyllables),
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
  },
);

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
    const myLimericks = await prisma.limerick.findMany({
      where: { authorID: req.user.id },
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
    const limericksWithFavorites = myLimericks.map((limerick) => ({
      ...limerick,
      isFavorited: myFavorites.some((f) => f.poemID === limerick.id),
    }));
    res.status(200).json(limericksWithFavorites);
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
limerickRouter.patch(
  "/:id",
  verifyToken,
  createLimiter,
  body("title")
    .optional()
    .notEmpty()
    .withMessage("Title cannot be empty")
    .isLength({ max: 100 }),
  body(["lineOne", "lineTwo", "lineThree", "lineFour", "lineFive"])
    .optional()
    .notEmpty()
    .withMessage("Line cannot be empty")
    .isLength({ max: 100 })
    .withMessage("Line cannot exceed 100 characters"),
  body([
    "lineOneSyllables",
    "lineTwoSyllables",
    "lineThreeSyllables",
    "lineFourSyllables",
    "lineFiveSyllables",
  ])
    .optional()
    .notEmpty()
    .withMessage("Syllables cannot be empty")
    .isInt({ min: 0, max: 9 })
    .withMessage("Syllable count must be a number between 0 and 9"),
  async (req, res, next) => {
    const formErrors = validationResult(req);
    if (!formErrors.isEmpty()) {
      return res.status(400).json(formErrors);
    }
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

      const updateData = {};
      if (req.body.title !== undefined) updateData.title = req.body.title;
      if (req.body.lineOne !== undefined) updateData.lineOne = req.body.lineOne;
      if (req.body.lineTwo !== undefined) updateData.lineTwo = req.body.lineTwo;
      if (req.body.lineThree !== undefined)
        updateData.lineThree = req.body.lineThree;
      if (req.body.lineFour !== undefined)
        updateData.lineFour = req.body.lineFour;
      if (req.body.lineFive !== undefined)
        updateData.lineFive = req.body.lineFive;
      if (req.body.lineOneSyllables !== undefined)
        updateData.lineOneSyllables = parseInt(req.body.lineOneSyllables);
      if (req.body.lineTwoSyllables !== undefined)
        updateData.lineTwoSyllables = parseInt(req.body.lineTwoSyllables);
      if (req.body.lineThreeSyllables !== undefined)
        updateData.lineThreeSyllables = parseInt(req.body.lineThreeSyllables);
      if (req.body.lineFourSyllables !== undefined)
        updateData.lineFourSyllables = parseInt(req.body.lineFourSyllables);
      if (req.body.lineFiveSyllables !== undefined)
        updateData.lineFiveSyllables = parseInt(req.body.lineFiveSyllables);
      if (req.body.rhymeA !== undefined) updateData.rhymeA = req.body.rhymeA;
      if (req.body.rhymeB !== undefined) updateData.rhymeB = req.body.rhymeB;
      if (req.body.rhymeAVerified !== undefined)
        updateData.rhymeAVerified = req.body.rhymeAVerified;
      if (req.body.rhymeBVerified !== undefined)
        updateData.rhymeBVerified = req.body.rhymeBVerified;
      if (req.body.published !== undefined)
        updateData.published = req.body.published;

      const limerick = await prisma.limerick.update({
        where: { id: limerickID },
        data: updateData,
      });
      return res.status(200).json(limerick);
    } catch (error) {
      next(error);
    }
  },
);

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
    if (error.code === "P2002") {
      return res.status(409).json({ error: "Already liked" });
    }
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
