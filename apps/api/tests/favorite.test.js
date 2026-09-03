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

describe("GET /favorite/mine/hydrated", () => {
  test("returns private and public haiku and limerick entries newest first", async () => {
    await request(app)
      .post(`/limerick/${limerickID}/like`)
      .set("Authorization", `Bearer ${authorToken}`);
    const older = await prisma.favorite.create({
      data: {
        userID: authorID,
        poemID: haikuID,
        poemType: "haiku",
        privacy: "private",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    });
    const newer = await prisma.favorite.create({
      data: {
        userID: authorID,
        poemID: limerickID,
        poemType: "limerick",
        privacy: "public",
        createdAt: new Date("2026-01-02T00:00:00.000Z"),
      },
    });

    const res = await request(app)
      .get("/favorite/mine/hydrated")
      .set("Authorization", `Bearer ${authorToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.map((entry) => entry.favorite.id)).toEqual([
      newer.id,
      older.id,
    ]);
    expect(res.body.map((entry) => entry.favorite.privacy)).toEqual([
      "public",
      "private",
    ]);
    expect(res.body.map((entry) => entry.poem.poemType)).toEqual([
      "limerick",
      "haiku",
    ]);
    expect(res.body.every((entry) => entry.poem.isFavorited)).toBe(true);
    expect(res.body[0].poem).toMatchObject({
      id: limerickID,
      title: testLimerick.title,
      lineOne: testLimerick.lineOne,
      lineTwo: testLimerick.lineTwo,
      lineThree: testLimerick.lineThree,
      lineFour: testLimerick.lineFour,
      lineFive: testLimerick.lineFive,
      screenname: TEST_USER.screenname,
      poemType: "limerick",
      isFavorited: true,
      _count: { comments: 0, limerickLikes: 1 },
      limerickLikes: [expect.objectContaining({ userID: authorID })],
    });
    expect(res.body[0].poem.createdAt).toEqual(expect.any(String));
    expect(res.body[0].poem.author).toBeUndefined();
    expect(res.body[1].poem).toMatchObject({
      id: haikuID,
      title: testHaiku.title,
      lineOne: testHaiku.lineOne,
      lineTwo: testHaiku.lineTwo,
      lineThree: testHaiku.lineThree,
      screenname: TEST_USER.screenname,
      poemType: "haiku",
      isFavorited: true,
      _count: { comments: 0, haikuLikes: 0 },
      haikuLikes: [],
    });
    expect(res.body[1].poem.createdAt).toEqual(expect.any(String));
    expect(res.body[1].poem.author).toBeUndefined();
  });

  test("omits a favorite whose poem target no longer exists", async () => {
    await prisma.favorite.create({
      data: {
        userID: authorID,
        poemID: 999999,
        poemType: "haiku",
        privacy: "private",
      },
    });

    const res = await request(app)
      .get("/favorite/mine/hydrated")
      .set("Authorization", `Bearer ${authorToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test("omits another user's unpublished poem but includes the owner's unpublished poem", async () => {
    const formerlyPublished = await request(app)
      .post("/haiku")
      .set("Authorization", `Bearer ${authorToken}`)
      .send({ ...testHaiku, title: "Later unpublished" });
    await request(app)
      .post(`/favorite/haiku/${formerlyPublished.body.id}`)
      .set("Authorization", `Bearer ${otherToken}`);
    await prisma.haiku.update({
      where: { id: formerlyPublished.body.id },
      data: { published: false },
    });

    const ownUnpublished = await request(app)
      .post("/limerick")
      .set("Authorization", `Bearer ${otherToken}`)
      .send({
        ...testLimerick,
        title: "Own unpublished favorite",
        published: false,
      });
    await request(app)
      .post(`/favorite/limerick/${ownUnpublished.body.id}`)
      .set("Authorization", `Bearer ${otherToken}`);

    const res = await request(app)
      .get("/favorite/mine/hydrated")
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(200);
    expect(
      res.body.some(
        (entry) =>
          entry.poem.poemType === "haiku" &&
          entry.poem.id === formerlyPublished.body.id,
      ),
    ).toBe(false);
    expect(
      res.body.some(
        (entry) =>
          entry.poem.poemType === "limerick" &&
          entry.poem.id === ownUnpublished.body.id,
      ),
    ).toBe(true);
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
  test("201 - defaults an omitted privacy value to private", async () => {
    const res = await request(app)
      .post(`/favorite/haiku/${haikuID}`)
      .set("Authorization", `Bearer ${authorToken}`);
    expect(res.status).toBe(201);
    expect(res.body.privacy).toBe("private");
  });

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

  test.each([
    ["haiku", testHaiku],
    ["limerick", testLimerick],
  ])("201 - owner can favorite their unpublished %s", async (poemType, poem) => {
    const create = await request(app)
      .post(`/${poemType}`)
      .set("Authorization", `Bearer ${authorToken}`)
      .send({ ...poem, published: false, title: `Private ${poemType}` });
    const res = await request(app)
      .post(`/favorite/${poemType}/${create.body.id}`)
      .set("Authorization", `Bearer ${authorToken}`)
      .send({ privacy: "private" });
    expect(res.status).toBe(201);
  });

  test.each([
    ["haiku", testHaiku],
    ["limerick", testLimerick],
  ])("403 - non-owner cannot favorite an unpublished %s", async (poemType, poem) => {
    const create = await request(app)
      .post(`/${poemType}`)
      .set("Authorization", `Bearer ${authorToken}`)
      .send({ ...poem, published: false, title: `Blocked ${poemType}` });
    const res = await request(app)
      .post(`/favorite/${poemType}/${create.body.id}`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ privacy: "private" });
    expect(res.status).toBe(403);
  });

  test("404 - rejects a nonexistent poem", async () => {
    const res = await request(app)
      .post("/favorite/haiku/999999")
      .set("Authorization", `Bearer ${authorToken}`)
      .send({ privacy: "private" });
    expect(res.status).toBe(404);
  });

  test("400 - rejects an unsupported poem type", async () => {
    const res = await request(app)
      .post(`/favorite/sonnet/${haikuID}`)
      .set("Authorization", `Bearer ${authorToken}`)
      .send({ privacy: "private" });
    expect(res.status).toBe(400);
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

  test("400 - rejects invalid privacy", async () => {
    await request(app)
      .post(`/favorite/haiku/${haikuID}`)
      .set("Authorization", `Bearer ${authorToken}`);

    const res = await request(app)
      .patch(`/favorite/haiku/${haikuID}`)
      .set("Authorization", `Bearer ${authorToken}`)
      .send({ privacy: "friends" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Invalid Privacy" });
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
