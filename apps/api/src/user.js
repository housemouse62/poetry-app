import { Router } from "express";
import { prisma } from "../db/prismaClient.js";
import rateLimit from "express-rate-limit";
import { body } from "express-validator";
import { validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import verifyToken from "../middleware/verifyToken.js";

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });

const userRouter = Router();

userRouter.patch(
  "/profile",
  authLimiter,
  verifyToken,
  body("confirmNewPassword").custom((value, { req }) => {
    if (value !== req.body.newPassword)
      throw new Error("New passwords do not match.");
    return true;
  }),
  body("confirmEmail").custom((value, { req }) => {
    if (req.body.email && value !== req.body.email)
      throw new Error("Email addresses do not match.");
    return true;
  }),
  async (req, res, next) => {
    const formErrors = validationResult(req);
    if (!formErrors.isEmpty()) {
      const err = new Error("Errors found in the form. Try again.");
      return res.status(400).json(formErrors);
    }
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: "No fields provided to update" });
    }
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
      });
      const updateData = {};
      if (req.body.newPassword) {
        const match = await bcrypt.compare(
          req.body.currentPassword,
          user.password,
        );
        if (!match) {
          return res.status(404).json({ error: "Invalid Credentials" });
        }
        const hashedPassword = await bcrypt.hash(req.body.newPassword, 10);
        updateData.password = hashedPassword;
      }
      if (req.body.name) updateData.name = req.body.name;
      if (req.body.email) updateData.email = req.body.email;
      if (req.body.screenname) updateData.screenname = req.body.screenname;

      const newUser = await prisma.user.update({
        where: { id: user.id },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          screenname: true,
        },
      });
      const tokenUser = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        screenname: newUser.screenname,
      };
      jwt.sign(
        { tokenUser },
        process.env.JWT_SECRET,
        { expiresIn: "7d" },
        (err, token) => {
          if (err) {
            return next(err);
          }
          res.status(200).json({
            token,
            user: tokenUser,
          });
        },
      );
    } catch (err) {
      next(err);
    }
  },
);

userRouter.post(
  "/create",
  authLimiter,
  body("confirmEmail").custom((value, { req }) => {
    if (value !== req.body.email)
      throw new Error("Email addresses do not match.");
    return true;
  }),
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.password) throw new Error("Passwords do not match.");
    return true;
  }),
  body("email").isEmail().withMessage("Please enter a valid email address"),

  async (req, res, next) => {
    const formErrors = validationResult(req);
    if (!formErrors.isEmpty()) {
      const err = new Error("Errors found in the form. Try again.");
      return res.status(400).json(formErrors);
    }
    try {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      const user = await prisma.user.create({
        data: {
          email: req.body.email,
          password: hashedPassword,
          name: req.body.name || "",
          screenname: req.body.screenname,
        },
        select: {
          id: true,
          email: true,
          name: true,
          screenname: true,
        },
      });
      return res.status(201).json(user);
    } catch (err) {
      if (err.code === "P2002") {
        return res.status(400).json({ error: "Email already in use" });
      }
      return next(err);
    }
  },
);

userRouter.post("/login", async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { email: req.body.email },
    });
    if (!user) {
      return res.status(404).json({ error: "Invalid Credentials" });
    }
    const match = await bcrypt.compare(req.body.password, user.password);
    if (!match) {
      return res.status(404).json({ error: "Invalid Credentials" });
    }
    const tokenUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      screenname: user.screenname,
    };
    jwt.sign(
      { tokenUser },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
      (err, token) => {
        if (err) {
          return next(err);
        }
        res.status(200).json({
          token,
          user: tokenUser,
        });
      },
    );
    // return res.status(200).json(user);
  } catch (err) {
    return next(err);
  }
});

export default userRouter;
