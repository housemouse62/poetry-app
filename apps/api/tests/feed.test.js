import express from "express";
import request from "supertest";
import { describe, test, expect, beforeAll, afterAll } from "vitest";
import userRouter from "../src/user.js";
import haikuRouter from "../src/haiku.js";
import limerickRouter from "../src/limerick.js";
import feedRouter from "../src/feed.js";
import { prisma } from "../db/prismaClient.js";
import { cleanup, TEST_USER, TEST_OTHER_USER } from "./helpers.js";

const app = express();
app.use(express.json());
app.use("/users", userRouter);
app.use("/haiku", haikuRouter);
app.use("/limerick", limerickRouter);
app.use("/feed", feedRouter);

let authorToken, otherToken, authorID;

const testHaiku = {
  title: "Feed Haiku",
  lineOne: "An old silent pond",
  lineTwo: "A frog jumps into the pond",
  lineThree: "Splash! Silence again",
  lineOneSyllables: 5,
  lineTwoSyllables: 7,
  lineThreeSyllables: 5,
  published: true,
};

const testLimerick = {
  title: "Feed Limerick",
  lineOne: "There once was a man from Nantucket",
  lineTwo: "Who kept all his cash in a bucket",
  lineThree: "But his daughter named Nan",
  lineFour: "Ran away with a man",
  lineFive: "And as for the bucket, Nantucket",
  lineOneSyllables: 9,
  lineTwoSyllables: 8,
  lineThreeSyllables: 7,
  lineFourSyllables: 6,
  lineFiveSyllables: 9,
  published: true,
};

async function createHaiku(overrides = {}) {
  const res = await request(app)
    .post("/haiku")
    .set("Authorization", `Bearer ${authorToken}`)
    .send({ ...testHaiku, ...overrides });
  return res.body;
}

async function createLimerick(overrides = {}) {
  const res = await request(app)
    .post("/limerick")
    .set("Authorization", `Bearer ${authorToken}`)
    .send({ ...testLimerick, ...overrides });
  return res.body;
}

beforeAll(async () => {
  await cleanup();

  const createRes = await request(app).post("/users/create").send(TEST_USER);
  authorID = createRes.body.id;
  const loginRes = await request(app)
    .post("/users/login")
    .send({ email: TEST_USER.email, password: TEST_USER.password });
  authorToken = loginRes.body.token;

  await request(app).post("/users/create").send(TEST_OTHER_USER);
  const otherLogin = await request(app)
    .post("/users/login")
    .send({ email: TEST_OTHER_USER.email, password: TEST_OTHER_USER.password });
  otherToken = otherLogin.body.token;
});

afterAll(async () => {
  await cleanup();
});

// ─── GET /feed ────────────────────────────────────────────────────────────────

describe("GET /feed", () => {
  test("401 - no token", async () => {
    const res = await request(app).get("/feed");
    expect(res.status).toBe(401);
  });

  test("200 - response shape includes totalPages, totalPoems, paginated array", async () => {
    const res = await request(app)
      .get("/feed")
      .set("Authorization", `Bearer ${authorToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("totalPages");
    expect(res.body).toHaveProperty("totalPoems");
    expect(res.body).toHaveProperty("paginated");
    expect(Array.isArray(res.body.paginated)).toBe(true);
  });

  test("200 - only returns published poems", async () => {
    await createHaiku({ title: "Published Haiku" });
    await createHaiku({ title: "Unpublished Haiku", published: false });
    await createLimerick({ title: "Published Limerick" });
    await createLimerick({ title: "Unpublished Limerick", published: false });

    const res = await request(app)
      .get("/feed?pageSize=100")
      .set("Authorization", `Bearer ${authorToken}`);
    const titles = res.body.paginated.map((p) => p.title);
    expect(titles).toContain("Published Haiku");
    expect(titles).toContain("Published Limerick");
    expect(titles).not.toContain("Unpublished Haiku");
    expect(titles).not.toContain("Unpublished Limerick");
  });

  test("200 - haikus have poemType=haiku and limericks have poemType=limerick", async () => {
    await createHaiku({ title: "PoemType Haiku" });
    await createLimerick({ title: "PoemType Limerick" });

    const res = await request(app)
      .get("/feed?pageSize=100")
      .set("Authorization", `Bearer ${authorToken}`);
    const haiku = res.body.paginated.find((p) => p.title === "PoemType Haiku");
    const limerick = res.body.paginated.find(
      (p) => p.title === "PoemType Limerick"
    );
    expect(haiku.poemType).toBe("haiku");
    expect(limerick.poemType).toBe("limerick");
  });
});

// ─── GET /feed?type ───────────────────────────────────────────────────────────

describe("GET /feed - type filter", () => {
  test("200 - type=haiku returns only haikus", async () => {
    await createHaiku({ title: "Type Filter Haiku" });
    await createLimerick({ title: "Type Filter Limerick" });

    const res = await request(app)
      .get("/feed?type=haiku&pageSize=100")
      .set("Authorization", `Bearer ${authorToken}`);
    expect(res.status).toBe(200);
    const types = res.body.paginated.map((p) => p.poemType);
    expect(types.every((t) => t === "haiku")).toBe(true);
    expect(types.length).toBeGreaterThan(0);
  });

  test("200 - type=limerick returns only limericks", async () => {
    await createHaiku({ title: "Type Filter Haiku 2" });
    await createLimerick({ title: "Type Filter Limerick 2" });

    const res = await request(app)
      .get("/feed?type=limerick&pageSize=100")
      .set("Authorization", `Bearer ${authorToken}`);
    expect(res.status).toBe(200);
    const types = res.body.paginated.map((p) => p.poemType);
    expect(types.every((t) => t === "limerick")).toBe(true);
    expect(types.length).toBeGreaterThan(0);
  });

  test("200 - type=all returns both haikus and limericks", async () => {
    await createHaiku({ title: "All Type Haiku" });
    await createLimerick({ title: "All Type Limerick" });

    const res = await request(app)
      .get("/feed?type=all&pageSize=100")
      .set("Authorization", `Bearer ${authorToken}`);
    const types = new Set(res.body.paginated.map((p) => p.poemType));
    expect(types.has("haiku")).toBe(true);
    expect(types.has("limerick")).toBe(true);
  });

  test("200 - type=haiku totalPoems counts only haikus", async () => {
    const haikuRes = await request(app)
      .get("/feed?type=haiku&pageSize=100")
      .set("Authorization", `Bearer ${authorToken}`);
    const allRes = await request(app)
      .get("/feed?type=all&pageSize=100")
      .set("Authorization", `Bearer ${authorToken}`);
    expect(haikuRes.body.totalPoems).toBeLessThan(allRes.body.totalPoems);
  });
});

// ─── GET /feed?sort ───────────────────────────────────────────────────────────

describe("GET /feed - sort", () => {
  test("200 - default sort is newest first (createdAt descending)", async () => {
    await createHaiku({ title: "Sort Haiku A" });
    await createHaiku({ title: "Sort Haiku B" });

    const res = await request(app)
      .get("/feed?pageSize=100")
      .set("Authorization", `Bearer ${authorToken}`);
    const dates = res.body.paginated.map((p) =>
      new Date(p.createdAt).getTime()
    );
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i - 1]).toBeGreaterThanOrEqual(dates[i]);
    }
  });

  test("200 - sort=likes places most-liked poems first", async () => {
    const limerick1 = await createLimerick({ title: "Zero Likes Limerick" });
    const limerick2 = await createLimerick({ title: "One Like Limerick" });

    await request(app)
      .post(`/limerick/${limerick2.id}/like`)
      .set("Authorization", `Bearer ${otherToken}`);

    const res = await request(app)
      .get("/feed?type=limerick&sort=likes&pageSize=100")
      .set("Authorization", `Bearer ${authorToken}`);
    expect(res.status).toBe(200);

    const resultIds = res.body.paginated.map((p) => p.id);
    const likedIndex = resultIds.indexOf(limerick2.id);
    const unlikedIndex = resultIds.indexOf(limerick1.id);
    expect(likedIndex).toBeLessThan(unlikedIndex);
  });

  test("200 - sort=likes includes _count on each poem", async () => {
    const res = await request(app)
      .get("/feed?sort=likes&pageSize=10")
      .set("Authorization", `Bearer ${authorToken}`);
    expect(res.status).toBe(200);
    for (const poem of res.body.paginated) {
      expect(poem).toHaveProperty("_count");
      expect(poem._count).toHaveProperty("comments");
    }
  });
});

// ─── GET /feed?date ───────────────────────────────────────────────────────────

describe("GET /feed - date filter", () => {
  test("200 - date=24hours includes freshly created poems", async () => {
    await createHaiku({ title: "Fresh 24h Haiku" });

    const res = await request(app)
      .get("/feed?date=24hours&pageSize=100")
      .set("Authorization", `Bearer ${authorToken}`);
    const titles = res.body.paginated.map((p) => p.title);
    expect(titles).toContain("Fresh 24h Haiku");
  });

  test("200 - date=3days includes freshly created poems", async () => {
    await createHaiku({ title: "Fresh 3day Haiku" });

    const res = await request(app)
      .get("/feed?date=3days&pageSize=100")
      .set("Authorization", `Bearer ${authorToken}`);
    const titles = res.body.paginated.map((p) => p.title);
    expect(titles).toContain("Fresh 3day Haiku");
  });

  test("200 - date=7days includes freshly created poems", async () => {
    await createHaiku({ title: "Fresh 7day Haiku" });

    const res = await request(app)
      .get("/feed?date=7days&pageSize=100")
      .set("Authorization", `Bearer ${authorToken}`);
    const titles = res.body.paginated.map((p) => p.title);
    expect(titles).toContain("Fresh 7day Haiku");
  });

  test("200 - date=24hours excludes poems older than 24 hours", async () => {
    await prisma.haiku.create({
      data: {
        title: "Old 2-Day Haiku",
        lineOne: "An old silent pond",
        lineTwo: "A frog jumps into the pond",
        lineThree: "Splash! Silence again",
        lineOneSyllables: 5,
        lineTwoSyllables: 7,
        lineThreeSyllables: 5,
        published: true,
        authorID: authorID,
        screenname: TEST_USER.screenname,
        createdAt: new Date(Date.now() - 86400000 * 2),
      },
    });

    const res = await request(app)
      .get("/feed?date=24hours&pageSize=100")
      .set("Authorization", `Bearer ${authorToken}`);
    const titles = res.body.paginated.map((p) => p.title);
    expect(titles).not.toContain("Old 2-Day Haiku");
  });

  test("200 - date=7days excludes poems older than 7 days", async () => {
    await prisma.haiku.create({
      data: {
        title: "Old 8-Day Haiku",
        lineOne: "An old silent pond",
        lineTwo: "A frog jumps into the pond",
        lineThree: "Splash! Silence again",
        lineOneSyllables: 5,
        lineTwoSyllables: 7,
        lineThreeSyllables: 5,
        published: true,
        authorID: authorID,
        screenname: TEST_USER.screenname,
        createdAt: new Date(Date.now() - 86400000 * 8),
      },
    });

    const res = await request(app)
      .get("/feed?date=7days&pageSize=100")
      .set("Authorization", `Bearer ${authorToken}`);
    const titles = res.body.paginated.map((p) => p.title);
    expect(titles).not.toContain("Old 8-Day Haiku");
  });

  test("200 - date=all includes poems regardless of age", async () => {
    const res = await request(app)
      .get("/feed?date=all&pageSize=100")
      .set("Authorization", `Bearer ${authorToken}`);
    expect(res.status).toBe(200);
    const titles = res.body.paginated.map((p) => p.title);
    expect(titles).toContain("Old 2-Day Haiku");
    expect(titles).toContain("Old 8-Day Haiku");
  });

  test("200 - date=3days excludes poems older than 3 days", async () => {
    const res = await request(app)
      .get("/feed?date=3days&pageSize=100")
      .set("Authorization", `Bearer ${authorToken}`);
    const titles = res.body.paginated.map((p) => p.title);
    expect(titles).not.toContain("Old 8-Day Haiku");
  });
});

// ─── GET /feed - pagination ───────────────────────────────────────────────────

describe("GET /feed - pagination", () => {
  test.each([
    "/feed?page=0",
    "/feed?page=1.5",
    "/feed?pageSize=0",
    "/feed?pageSize=1001",
    "/feed?type=sonnet",
    "/feed?date=yesterday",
    "/feed?sort=random",
  ])("400 - rejects invalid query: %s", async (url) => {
    const res = await request(app)
      .get(url)
      .set("Authorization", `Bearer ${authorToken}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid feed query");
  });

  test("200 - pageSize limits the number of returned results", async () => {
    const res = await request(app)
      .get("/feed?pageSize=3")
      .set("Authorization", `Bearer ${authorToken}`);
    expect(res.status).toBe(200);
    expect(res.body.paginated.length).toBeLessThanOrEqual(3);
  });

  test("200 - page=2 returns a different set of results from page=1", async () => {
    const res1 = await request(app)
      .get("/feed?pageSize=2&page=1")
      .set("Authorization", `Bearer ${authorToken}`);
    const res2 = await request(app)
      .get("/feed?pageSize=2&page=2")
      .set("Authorization", `Bearer ${authorToken}`);

    const ids1 = res1.body.paginated.map((p) => p.id);
    const ids2 = res2.body.paginated.map((p) => p.id);
    expect(ids1.some((id) => ids2.includes(id))).toBe(false);
  });

  test("200 - all pages together cover all poems without overlap", async () => {
    const pageSize = 3;
    const allRes = await request(app)
      .get("/feed?pageSize=1000")
      .set("Authorization", `Bearer ${authorToken}`);
    const totalPoems = allRes.body.totalPoems;
    const totalPages = Math.ceil(totalPoems / pageSize);

    const allIds = new Set();
    for (let page = 1; page <= totalPages; page++) {
      const res = await request(app)
        .get(`/feed?pageSize=${pageSize}&page=${page}`)
        .set("Authorization", `Bearer ${authorToken}`);
      for (const poem of res.body.paginated) {
        expect(allIds.has(poem.id)).toBe(false);
        allIds.add(poem.id);
      }
    }
    expect(allIds.size).toBe(totalPoems);
  });

  test("200 - totalPages equals ceil(totalPoems / pageSize)", async () => {
    const pageSize = 3;
    const res = await request(app)
      .get(`/feed?pageSize=${pageSize}`)
      .set("Authorization", `Bearer ${authorToken}`);
    expect(res.body.totalPages).toBe(
      Math.ceil(res.body.totalPoems / pageSize)
    );
  });

  test("200 - totalPoems for type=all equals haiku count plus limerick count", async () => {
    const haikuRes = await request(app)
      .get("/feed?type=haiku&pageSize=1000")
      .set("Authorization", `Bearer ${authorToken}`);
    const limerickRes = await request(app)
      .get("/feed?type=limerick&pageSize=1000")
      .set("Authorization", `Bearer ${authorToken}`);
    const allRes = await request(app)
      .get("/feed?type=all&pageSize=1000")
      .set("Authorization", `Bearer ${authorToken}`);
    expect(allRes.body.totalPoems).toBe(
      haikuRes.body.totalPoems + limerickRes.body.totalPoems
    );
  });

  test("200 - page beyond totalPages returns empty paginated array", async () => {
    const res = await request(app)
      .get("/feed?page=9999&pageSize=20")
      .set("Authorization", `Bearer ${authorToken}`);
    expect(res.status).toBe(200);
    expect(res.body.paginated).toHaveLength(0);
  });

  test("200 - last page contains the remaining poems", async () => {
    const pageSize = 3;
    const allRes = await request(app)
      .get("/feed?pageSize=1000")
      .set("Authorization", `Bearer ${authorToken}`);
    const totalPoems = allRes.body.totalPoems;
    const totalPages = Math.ceil(totalPoems / pageSize);
    const expectedLastPageCount = totalPoems % pageSize || pageSize;

    const res = await request(app)
      .get(`/feed?pageSize=${pageSize}&page=${totalPages}`)
      .set("Authorization", `Bearer ${authorToken}`);
    expect(res.body.paginated.length).toBe(expectedLastPageCount);
  });
});
