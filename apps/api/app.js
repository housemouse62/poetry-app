import "dotenv/config";
import express from "express";
import cors from "cors";
import userRouter from "./src/user.js";
import wordRouter from "./src/word.js";
import haikuRouter from "./src/haiku.js";
import limerickRouter from "./src/limerick.js";
import haikuCommentRouter from "./src/haikuComment.js";
import limerickCommentRouter from "./src/limerickComment.js";
import haikuReplyRouter from "./src/haikuReply.js";
import limerickReplyRouter from "./src/limerickReply.js";
import favoriteRouter from "./src/favorite.js";
import { globalLimiter } from "./middleware/limiters.js";

const app = express();

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(globalLimiter);
app.use("/users", userRouter);
app.use("/word", wordRouter);
app.use("/haiku", haikuRouter);
app.use("/limerick", limerickRouter);
app.use("/haikuComment", haikuCommentRouter);
app.use("/limerickComment", limerickCommentRouter);
app.use("/haikuReply", haikuReplyRouter);
app.use("/limerickReply", limerickReplyRouter);
app.use("/favorite", favoriteRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong" });
});

app.listen(process.env.PORT, () =>
  console.log(`Listening on port ${process.env.PORT}`),
);
