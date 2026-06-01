import express from "express";
import request from "supertest";
import { describe, test, expect, beforeAll, afterAll, beforeEach } from "vitest";
import userRouter from "../src/user.js";
import haikuRouter from "../src/haiku.js";
import limerickRouter from "../src/limerick.js";
import favoriteRouter from "../src/favorite.js";
import { prisma } from "../db/prismaClient.js";
import { cleanup, TEST_USER, TEST_OTHER_USER } from "./helpers.js";

const app = express();
app.use(express.json());
app.use("/users", userRouter);
app.use("/haiku", haikuRouter);
app.use("/limerick", limerickRouter);
app.use("/favorite", favoriteRouter);

let authorToken, otherToken, authorID, otherID, haikuID, limerickID;

const testHaiku = {
  title: "Haiku for Favorites",
  lineOne: "An old silent pond",
  lineTwo: "A frog jumps into the pond",
  lineThree: "Splash! Silence again",
  lineOneSyllables: 5,
  lineTwoSyllables: 7,
  lineThreeSyllables: 5,
  published: true,
};

const testLimerick = {
  title: "Limerick for Favorites",
  lineOne: "There once was a man from Nantucket",
  lineTwo: "Who kept all his cash in a bucket",
  lineThree: "His daughter named Nan",
  lineFour: "Ran away with a man",
  lineFive: "And the bucket? Well, Nantucket",
  lineOneSyllables: 8,
  lineTwoSyllables: 7,
  lineThreeSyllables: 6,
  lineFourSyllables: 5,
  lineFiveSyllables: 7,
  rhymeA: "ucket",
  rhymeB: "an",
  rhymeAVerified: false,
  rhymeBVerified: false,
  published: true,
};

beforeAll(async () => {
  await cleanup();

  const authorCreate = await request(app).post("/users/create").send(TEST_USER);
  authorID = authorCreate.body.id;
  const loginRes = await request(app)
    .post("/users/login")
    .send({ email: TEST_USER.email, password: TEST_USER.password });
  authorToken = loginRes.body.token;

  const otherCreate = await request(app)
    .post("/users/create")
    .send(TEST_OTHER_USER);
  otherID = otherCreate.body.id;
  const otherLogin = await request(app)
    .post("/users/login")
    .send({ email: TEST_OTHER_USER.email, password: TEST_OTHER_USER.password });
  otherToken = otherLogin.body.token;

  const haikuRes = await request(app)
    .post("/haiku")
    .set("Authorization", `Bearer ${authorToken}`)
    .send(testHaiku);
  haikuID = haikuRes.body.id;

  const limerickRes = await request(app)
    .post("/limerick")
    .set("Authorization", `Bearer ${authorToken}`)
    .send(testLimerick);
  limerickID = limerickRes.body.id;
});

afterAll(async () => {
  await cleanup();
});

beforeEach(async () => {
  await prisma.favorite.deleteMany({
    where: { userID: { in: [authorID, otherID] } },
  });
});

// ─── GET /favorite/mine ───────────────────────────────────────────────────────

describe("GET /favorite/mine", () => {
  test("200 - returns my favorites", async () => {
    await request(app)
      .post(`/favorite/haiku/${haikuID}`)
      .set("Authorization", `Bearer ${authorToken}`)
      .send({ privacy: "private" });

    const res = await request(app)
      .get("/favorite/mine")
      .set("Authorization", `Bearer ${authorToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((f) => f.poemID === haikuID)).toBe(true);
  });

  test("401 - no token", async () => {
    const res = await request(app).get("/favorite/mine");
    expect(res.status).toBe(401);
  });
});

// ─── GET /favorite/:userID ────────────────────────────────────────────────────

describe("GET /favorite/:userID", () => {
  test("200 - returns only public favorites for a user", async () => {
    await request(app)
      .post(`/favorite/haiku/${haikuID}`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ privacy: "public" });
    await request(app)
      .post(`/favorite/limerick/${limerickID}`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ privacy: "private" });

    const res = await request(app)
      .get(`/favorite/${otherID}`)
      .set("Authorization", `Bearer ${authorToken}`);

    expect(res.status).toBe(200);
    const favorites = res.body;
    expect(favorites.every((f) => f.privacy === "public")).toBe(true);
    expect(favorites.some((f) => f.poemID === haikuID)).toBe(true);
    expect(favorites.some((f) => f.poemID === limerickID)).toBe(false);
  });

  test("401 - no token", async () => {
    const res = await request(app).get(`/favorite/${otherID}`);
    expect(res.status).toBe(401);
  });
});

// ─── POST /favorite/:poemType/:poemID ─────────────────────────────────────────

describe("POST /favorite/:poemType/:poemID", () => {
  test("201 - adds a haiku to favorites", async () => {
    const res = await request(app)
      .post(`/favorite/haiku/${haikuID}`)
      .set("Authorization", `Bearer ${authorToken}`)
      .send({ privacy: "private" });

    expect(res.status).toBe(201);
    expect(res.body.poemID).toBe(haikuID);
    expect(res.body.poemType).toBe("haiku");
    expect(res.body.privacy).toBe("private");
  });

  test("201 - adds a limerick to favorites as public", async () => {
    const res = await request(app)
      .post(`/favorite/limerick/${limerickID}`)
      .set("Authorization", `Bearer ${authorToken}`)
      .send({ privacy: "public" });

    expect(res.status).toBe(201);
    expect(res.body.poemType).toBe("limerick");
    expect(res.body.privacy).toBe("public");
  });

  test("401 - no token", async () => {
    const res = await request(app)
      .post(`/favorite/haiku/${haikuID}`)
      .send({ privacy: "private" });

    expect(res.status).toBe(401);
  });
});

// ─── PATCH /favorite/:poemType/:poemID ───────────────────────────────────────

describe("PATCH /favorite/:poemType/:poemID", () => {
  test("200 - updates privacy to public", async () => {
    await request(app)
      .post(`/favorite/haiku/${haikuID}`)
      .set("Authorization", `Bearer ${authorToken}`)
      .send({ privacy: "private" });

    const res = await request(app)
      .patch(`/favorite/haiku/${haikuID}`)
      .set("Authorization", `Bearer ${authorToken}`)
      .send({ privacy: "public" });

    expect(res.status).toBe(200);
    expect(res.body.privacy).toBe("public");
  });

  test("200 - updates privacy to private", async () => {
    await request(app)
      .post(`/favorite/haiku/${haikuID}`)
      .set("Authorization", `Bearer ${authorToken}`)
      .send({ privacy: "public" });

    const res = await request(app)
      .patch(`/favorite/haiku/${haikuID}`)
      .set("Authorization", `Bearer ${authorToken}`)
      .send({ privacy: "private" });

    expect(res.status).toBe(200);
    expect(res.body.privacy).toBe("private");
  });

  test("404 - favorite not found", async () => {
    const res = await request(app)
      .patch(`/favorite/haiku/${haikuID}`)
      .set("Authorization", `Bearer ${authorToken}`)
      .send({ privacy: "public" });

    expect(res.status).toBe(404);
  });

  test("401 - no token", async () => {
    const res = await request(app)
      .patch(`/favorite/haiku/${haikuID}`)
      .send({ privacy: "public" });

    expect(res.status).toBe(401);
  });
});

// ─── DELETE /favorite/:poemType/:poemID ───────────────────────────────────────

describe("DELETE /favorite/:poemType/:poemID", () => {
  test("200 - removes a favorite", async () => {
    await request(app)
      .post(`/favorite/haiku/${haikuID}`)
      .set("Authorization", `Bearer ${authorToken}`)
      .send({ privacy: "private" });

    const res = await request(app)
      .delete(`/favorite/haiku/${haikuID}`)
      .set("Authorization", `Bearer ${authorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.poemID).toBe(haikuID);
  });

  test("401 - no token", async () => {
    const res = await request(app).delete(`/favorite/haiku/${haikuID}`);
    expect(res.status).toBe(401);
  });
});
