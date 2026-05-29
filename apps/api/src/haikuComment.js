import { Router } from "express";
import { prisma } from "../db/prismaClient.js";
import verifyToken from "../middleware/verifyToken.js";

const haikuCommentRouter = Router();

// any user post comment
haikuCommentRouter.post("/:poemID", verifyToken, async (req, res, next) => {
  try {
    const poemID = parseInt(req.params.poemID);
    if (isNaN(poemID))
      return res.status(400).json({ error: "Invalid Comment ID" });

    const poem = await prisma.haiku.findUnique({
      where: { id: poemID },
    });
    if (!poem) return res.status(404).json({ error: "Haiku Not Found" });
    const newComment = await prisma.haikuComment.create({
      data: {
        commentbody: req.body.commentbody,
        authorID: req.user.id,
        poemID: poemID,
      },
    });
    res.status(201).json(newComment);
  } catch (error) {
    next(error);
  }
});

// any user get all comments for one post
haikuCommentRouter.get("/:poemID", verifyToken, async (req, res, next) => {
  try {
    const poemID = parseInt(req.params.poemID);
    if (isNaN(poemID))
      return res.status(400).json({ error: "Invalid Comment ID" });
    const poem = await prisma.haiku.findUnique({
      where: { id: poemID },
    });
    if (!poem) return res.status(404).json({ error: "Haiku Not Found" });

    const poemComments = await prisma.haikuComment.findMany({
      where: { poemID: poemID },
      include: {
        _count: { select: { reply: true, commentLikes: true } },
        author: { select: { screenname: true } },
      },
    });
    res.status(200).json(poemComments);
  } catch (error) {
    next(error);
  }
});

// author edit their own comment.
haikuCommentRouter.patch("/:commentID", verifyToken, async (req, res, next) => {
  try {
    const commentID = parseInt(req.params.commentID);
    if (isNaN(commentID))
      return res.status(400).json({ error: "Invalid Comment ID" });

    const comment = await prisma.haikuComment.findUnique({
      where: { id: commentID },
    });
    if (!comment) return res.status(404).json({ error: "Comment Not Found" });
    if (req.user.id === comment.authorID) {
      const comment = await prisma.haikuComment.update({
        where: { id: commentID },
        data: {
          commentbody: req.body.commentbody,
        },
      });
      return res.status(200).json(comment);
    } else {
      return res.status(403).json({ error: "Unauthorized Credentials" });
    }
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
      const commentID = parseInt(req.params.commentID);
      if (isNaN(commentID))
        return res.status(400).json({ error: "Invalid Comment ID" });

      const comment = await prisma.haikuComment.findUnique({
        where: { id: commentID },
      });
      if (!comment) return res.status(404).json({ error: "Comment Not Found" });

      if (req.user.id === comment.authorID || req.user.usertype === "admin") {
        const deleteComment = await prisma.haikuComment.delete({
          where: { id: commentID },
        });
        return res.status(200).json(deleteComment);
      } else {
        return res.status(403).json({ error: "Unauthorized Credentials" });
      }
    } catch (error) {
      next(error);
    }
  },
);

// user can like a comment
haikuCommentRouter.post(
  "/:commentID/like",
  verifyToken,
  async (req, res, next) => {
    try {
      const commentID = parseInt(req.params.commentID);
      if (isNaN(commentID))
        return res.status(400).json({ error: "Invalid Comment ID" });

      const comment = await prisma.haikuComment.findUnique({
        where: { id: commentID },
      });
      if (!comment) return res.status(404).json({ error: "Comment Not Found" });

      const like = await prisma.haikuCommentLike.create({
        data: {
          userID: req.user.id,
          commentID: commentID,
        },
      });
      return res.status(201).json(like);
    } catch (error) {
      next(error);
    }
  },
);

//user can delete their like (unlike)
haikuCommentRouter.delete(
  "/:commentID/like",
  verifyToken,
  async (req, res, next) => {
    try {
      const commentID = parseInt(req.params.commentID);
      if (isNaN(commentID))
        return res.status(400).json({ error: "Invalid Comment ID" });

      const comment = await prisma.haikuComment.findUnique({
        where: { id: commentID },
      });
      if (!comment) return res.status(404).json({ error: "Comment Not Found" });

      const like = await prisma.haikuCommentLike.delete({
        where: {
          userID_commentID: {
            commentID: commentID,
            userID: req.user.id,
          },
        },
      });
      return res.status(200).json(like);
    } catch (error) {
      next(error);
    }
  },
);

export default haikuCommentRouter;
