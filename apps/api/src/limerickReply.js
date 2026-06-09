import { Router } from "express";
import { prisma } from "../db/prismaClient.js";
import verifyToken from "../middleware/verifyToken.js";
import { createLimiter } from "../middleware/limiters.js";
import { body, validationResult } from "express-validator";

const limerickReplyRouter = Router();

// any user post reply
limerickReplyRouter.post(
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

      const comment = await prisma.limerickComment.findUnique({
        where: { id: commentID },
      });
      if (!comment) return res.status(404).json({ error: "Comment Not Found" });

      const newReply = await prisma.limerickReply.create({
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
limerickReplyRouter.get("/:commentID", verifyToken, async (req, res, next) => {
  try {
    const commentID = parseInt(req.params.commentID);
    if (isNaN(commentID))
      return res.status(400).json({ error: "Invalid Comment ID" });

    const comment = await prisma.limerickComment.findUnique({
      where: { id: commentID },
    });
    if (!comment) return res.status(404).json({ error: "Comment Not Found" });

    const commentReplies = await prisma.limerickReply.findMany({
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
limerickReplyRouter.patch(
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

      const reply = await prisma.limerickReply.findUnique({
        where: { id: replyID },
      });
      if (!reply) return res.status(404).json({ error: "Reply Not Found" });
      if (req.user.id === reply.authorID) {
        const reply = await prisma.limerickReply.update({
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
limerickReplyRouter.delete("/:replyID", verifyToken, async (req, res, next) => {
  try {
    const replyID = parseInt(req.params.replyID);
    if (isNaN(replyID))
      return res.status(400).json({ error: "Invalid Reply ID" });

    const reply = await prisma.limerickReply.findUnique({
      where: { id: replyID },
    });
    if (!reply) return res.status(404).json({ error: "Reply Not Found" });

    if (req.user.id === reply.authorID || req.user.usertype === "admin") {
      const deleteReply = await prisma.limerickReply.delete({
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
limerickReplyRouter.post(
  "/:replyID/like",
  verifyToken,
  async (req, res, next) => {
    try {
      const replyID = parseInt(req.params.replyID);
      if (isNaN(replyID))
        return res.status(400).json({ error: "Invalid Reply ID" });

      const reply = await prisma.limerickReply.findUnique({
        where: { id: replyID },
      });
      if (!reply) return res.status(404).json({ error: "Reply Not Found" });

      const like = await prisma.limerickReplyLike.create({
        data: {
          userID: req.user.id,
          replyID: replyID,
        },
      });
      return res.status(201).json(like);
    } catch (error) {
      if (error.code === "P2002") {
        return res.status(409).json({ error: "Already liked" });
      }
      next(error);
    }
  },
);

//user can delete their like (unlike)
limerickReplyRouter.delete(
  "/:replyID/like",
  verifyToken,
  async (req, res, next) => {
    try {
      const replyID = parseInt(req.params.replyID);
      if (isNaN(replyID))
        return res.status(400).json({ error: "Invalid Reply ID" });

      const reply = await prisma.limerickReply.findUnique({
        where: { id: replyID },
      });
      if (!reply) return res.status(404).json({ error: "Reply Not Found" });

      const like = await prisma.limerickReplyLike.delete({
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

export default limerickReplyRouter;
