import express from "express";
import request from "supertest";
import { describe, test, expect, beforeAll, afterAll } from "vitest";
import userRouter from "../src/user.js";
import wordRouter from "../src/word.js";
import { prisma } from "../db/prismaClient.js";
import { cleanup, TEST_USER } from "./helpers.js";

const app = express();
app.use(express.json());
app.use("/users", userRouter);
app.use("/word", wordRouter);

let token;

const testWord = {
  word: "ponderous",
  source: "test",
  syllableCount: 3,
  data: { syllables: ["pon", "der", "ous"] },
};

beforeAll(async () => {
  await cleanup();
  await prisma.word.deleteMany({ where: { word: testWord.word } });

  await request(app).post("/users/create").send(TEST_USER);
  const loginRes = await request(app)
    .post("/users/login")
    .send({ email: TEST_USER.email, password: TEST_USER.password });
  token = loginRes.body.token;
});

afterAll(async () => {
  await prisma.word.deleteMany({ where: { word: testWord.word } });
  await cleanup();
});

// ─── POST /word ───────────────────────────────────────────────────────────────

describe("POST /word", () => {
  test("201 - creates a new word", async () => {
    await prisma.word.deleteMany({ where: { word: testWord.word } });

    const res = await request(app)
      .post("/word")
      .set("Authorization", `Bearer ${token}`)
      .send(testWord);

    expect(res.status).toBe(201);
    expect(res.body.word).toBe(testWord.word);
    expect(res.body.syllableCount).toBe(testWord.syllableCount);
  });

  test("200 - returns existing word without creating a duplicate", async () => {
    await prisma.word.deleteMany({ where: { word: testWord.word } });
    await request(app)
      .post("/word")
      .set("Authorization", `Bearer ${token}`)
      .send(testWord);

    const res = await request(app)
      .post("/word")
      .set("Authorization", `Bearer ${token}`)
      .send(testWord);

    expect(res.status).toBe(200);
    expect(res.body.word).toBe(testWord.word);
  });

  test("401 - no token", async () => {
    const res = await request(app).post("/word").send(testWord);
    expect(res.status).toBe(401);
  });
});

// ─── GET /word/:word ──────────────────────────────────────────────────────────

describe("GET /word/:word", () => {
  test("200 - returns a word", async () => {
    await prisma.word.deleteMany({ where: { word: testWord.word } });
    await request(app)
      .post("/word")
      .set("Authorization", `Bearer ${token}`)
      .send(testWord);

    const res = await request(app)
      .get(`/word/${testWord.word}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.word).toBe(testWord.word);
    expect(res.body.syllableCount).toBe(testWord.syllableCount);
  });

  test("404 - word not in database", async () => {
    const res = await request(app)
      .get("/word/zxqvfjklm")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  test("401 - no token", async () => {
    const res = await request(app).get(`/word/${testWord.word}`);
    expect(res.status).toBe(401);
  });
});

// ─── PATCH /word/:word/flag ───────────────────────────────────────────────────

describe("PATCH /word/:word/flag", () => {
  test("200 - toggles flagged from false to true", async () => {
    await prisma.word.deleteMany({ where: { word: testWord.word } });
    await request(app)
      .post("/word")
      .set("Authorization", `Bearer ${token}`)
      .send(testWord);

    const res = await request(app)
      .patch(`/word/${testWord.word}/flag`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.flagged).toBe(true);
  });

  test("200 - toggles flagged back to false", async () => {
    await prisma.word.deleteMany({ where: { word: testWord.word } });
    await request(app)
      .post("/word")
      .set("Authorization", `Bearer ${token}`)
      .send(testWord);
    await request(app)
      .patch(`/word/${testWord.word}/flag`)
      .set("Authorization", `Bearer ${token}`);

    const res = await request(app)
      .patch(`/word/${testWord.word}/flag`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.flagged).toBe(false);
  });

  test("404 - word not in database", async () => {
    const res = await request(app)
      .patch("/word/zxqvfjklm/flag")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  test("401 - no token", async () => {
    const res = await request(app).patch(`/word/${testWord.word}/flag`);
    expect(res.status).toBe(401);
  });
});
