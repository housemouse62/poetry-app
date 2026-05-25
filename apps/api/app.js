import "dotenv/config";
import express from "express";
import cors from "cors";
import userRouter from "./src/user.js";
import wordRouter from "./src/word.js";

const app = express();

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/users", userRouter);
app.use("/word", wordRouter);

app.listen(process.env.PORT, () =>
  console.log(`Listening on port ${process.env.PORT}`),
);
