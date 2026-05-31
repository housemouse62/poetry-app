import { Router } from "express";
import { prisma } from "../db/prismaClient.js";
import verifyToken from "../middleware/verifyToken.js";
import { createLimiter } from "../middleware/limiters.js";
import { body, validationResult } from "express-validator";

const haikuReplyRouter = Router();

// any user post reply
haikuReplyRouter.post(
  "/:commentID/replies",
  verifyToken,
  createLimiter,
  body("replybody")
    .notEmpty()
    .withMessage("Comment cannot be empty")
    .isLength({ max: 600 }),
  async (req, res, next) => {
    const formErrors = validationResult(req);
    if (!formErrors.isEmpty()) {
      return res.status(400).json(formErrors);
    }
    try {
      const commentID = parseInt(req.params.commentID);
      if (isNaN(commentID))
        return res.status(400).json({ error: "Invalid Comment ID" });

      const comment = await prisma.haikuComment.findUnique({
        where: { id: commentID },
      });
      if (!comment) return res.status(404).json({ error: "Comment Not Found" });

      const newReply = await prisma.haikuReply.create({
        data: {
          replybody: req.body.replybody,
          authorID: req.user.id,
          commentID: commentID,
        },
      });
      res.status(201).json(newReply);
    } catch (error) {
      next(error);
    }
  },
);

// any user get all replies for one comment
haikuReplyRouter.get("/:commentID", verifyToken, async (req, res, next) => {
  try {
    const commentID = parseInt(req.params.commentID);
    if (isNaN(commentID))
      return res.status(400).json({ error: "Invalid Comment ID" });

    const comment = await prisma.haikuComment.findUnique({
      where: { id: commentID },
    });
    if (!comment) return res.status(404).json({ error: "Comment Not Found" });

    const commentReplies = await prisma.haikuReply.findMany({
      where: { commentID: commentID },
      include: {
        _count: { select: { replyLikes: true } },
        author: { select: { screenname: true } },
      },
    });
    res.status(200).json(commentReplies);
  } catch (error) {
    next(error);
  }
});

// author edit their own reply.
haikuReplyRouter.patch(
  "/:replyID",
  verifyToken,
  createLimiter,
  body("replybody")
    .notEmpty()
    .withMessage("Comment cannot be empty")
    .isLength({ max: 600 }),
  async (req, res, next) => {
    const formErrors = validationResult(req);
    if (!formErrors.isEmpty()) {
      return res.status(400).json(formErrors);
    }
    try {
      const replyID = parseInt(req.params.replyID);
      if (isNaN(replyID))
        return res.status(400).json({ error: "Invalid Reply ID" });

      const reply = await prisma.haikuReply.findUnique({
        where: { id: replyID },
      });
      if (!reply) return res.status(404).json({ error: "Reply Not Found" });
      if (req.user.id === reply.authorID) {
        const reply = await prisma.haikuReply.update({
          where: { id: replyID },
          data: {
            replybody: req.body.replybody,
          },
        });
        return res.status(200).json(reply);
      } else {
        return res.status(403).json({ error: "Unauthorized Credentials" });
      }
    } catch (error) {
      next(error);
    }
  },
);

// author delete their own reply || admin delete any reply
haikuReplyRouter.delete("/:replyID", verifyToken, async (req, res, next) => {
  try {
    const replyID = parseInt(req.params.replyID);
    if (isNaN(replyID))
      return res.status(400).json({ error: "Invalid Reply ID" });

    const reply = await prisma.haikuReply.findUnique({
      where: { id: replyID },
    });
    if (!reply) return res.status(404).json({ error: "Reply Not Found" });

    if (req.user.id === reply.authorID || req.user.usertype === "admin") {
      const deleteReply = await prisma.haikuReply.delete({
        where: { id: replyID },
      });
      return res.status(200).json(deleteReply);
    } else {
      return res.status(403).json({ error: "Unauthorized Credentials" });
    }
  } catch (error) {
    next(error);
  }
});

// user can like a reply
haikuReplyRouter.post("/:replyID/like", verifyToken, async (req, res, next) => {
  try {
    const replyID = parseInt(req.params.replyID);
    if (isNaN(replyID))
      return res.status(400).json({ error: "Invalid Reply ID" });

    const reply = await prisma.haikuReply.findUnique({
      where: { id: replyID },
    });
    if (!reply) return res.status(404).json({ error: "Reply Not Found" });

    const like = await prisma.haikuReplyLike.create({
      data: {
        userID: req.user.id,
        replyID: replyID,
      },
    });
    return res.status(201).json(like);
  } catch (error) {
    next(error);
  }
});

//user can delete their like (unlike)
haikuReplyRouter.delete(
  "/:replyID/like",
  verifyToken,
  async (req, res, next) => {
    try {
      const replyID = parseInt(req.params.replyID);
      if (isNaN(replyID))
        return res.status(400).json({ error: "Invalid Reply ID" });

      const reply = await prisma.haikuReply.findUnique({
        where: { id: replyID },
      });
      if (!reply) return res.status(404).json({ error: "Reply Not Found" });

      const like = await prisma.haikuReplyLike.delete({
        where: {
          userID_replyID: {
            replyID: replyID,
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

export default haikuReplyRouter;
