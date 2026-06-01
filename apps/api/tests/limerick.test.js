import express from "express";
import request from "supertest";
import { describe, test, expect, beforeAll, afterAll } from "vitest";
import userRouter from "../src/user.js";
import limerickRouter from "../src/limerick.js";
import { prisma } from "../db/prismaClient.js";
import { cleanup, TEST_USER, TEST_OTHER_USER, TEST_ADMIN_USER } from "./helpers.js";

const app = express();
app.use(express.json());
app.use("/users", userRouter);
app.use("/limerick", limerickRouter);

let authorToken, otherToken, adminToken, authorID;

const testLimerick = {
  title: "Test Limerick",
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

  await request(app).post("/users/create").send(TEST_ADMIN_USER);
  await prisma.user.update({
    where: { email: TEST_ADMIN_USER.email },
    data: { usertype: "admin" },
  });
  const adminLogin = await request(app)
    .post("/users/login")
    .send({ email: TEST_ADMIN_USER.email, password: TEST_ADMIN_USER.password });
  adminToken = adminLogin.body.token;
});

afterAll(async () => {
  await cleanup();
});

// ─── POST /limerick ───────────────────────────────────────────────────────────

describe("POST /limerick", () => {
  test("201 - creates a published limerick", async () => {
    const res = await request(app)
      .post("/limerick")
      .set("Authorization", `Bearer ${authorToken}`)
      .send(testLimerick);

    expect(res.status).toBe(201);
    expect(res.body.title).toBe(testLimerick.title);
    expect(res.body.authorID).toBe(authorID);
    expect(res.body.published).toBe(true);
  });

  test("201 - creates an unpublished limerick", async () => {
    const res = await request(app)
      .post("/limerick")
      .set("Authorization", `Bearer ${authorToken}`)
      .send({ ...testLimerick, published: false });

    expect(res.status).toBe(201);
    expect(res.body.published).toBe(false);
  });

  test("400 - missing title", async () => {
    const { title, ...noTitle } = testLimerick;
    const res = await request(app)
      .post("/limerick")
      .set("Authorization", `Bearer ${authorToken}`)
      .send(noTitle);

    expect(res.status).toBe(400);
  });

  test("400 - syllable count out of range", async () => {
    const res = await request(app)
      .post("/limerick")
      .set("Authorization", `Bearer ${authorToken}`)
      .send({ ...testLimerick, lineOneSyllables: 10 });

    expect(res.status).toBe(400);
  });

  test("400 - empty line", async () => {
    const res = await request(app)
      .post("/limerick")
      .set("Authorization", `Bearer ${authorToken}`)
      .send({ ...testLimerick, lineOne: "" });

    expect(res.status).toBe(400);
  });

  test("401 - no token", async () => {
    const res = await request(app).post("/limerick").send(testLimerick);
    expect(res.status).toBe(401);
  });
});

// ─── GET /limerick ────────────────────────────────────────────────────────────

describe("GET /limerick", () => {
  test("200 - returns only published limericks", async () => {
    await createLimerick({ published: true });
    await createLimerick({ published: false, title: "Unpublished" });

    const res = await request(app)
      .get("/limerick")
      .set("Authorization", `Bearer ${authorToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const titles = res.body.map((l) => l.title);
    expect(titles).not.toContain("Unpublished");
  });

  test("401 - no token", async () => {
    const res = await request(app).get("/limerick");
    expect(res.status).toBe(401);
  });
});

// ─── GET /limerick/mine ───────────────────────────────────────────────────────

describe("GET /limerick/mine", () => {
  test("200 - returns all my limericks including unpublished", async () => {
    await createLimerick({ published: true, title: "My Published" });
    await createLimerick({ published: false, title: "My Unpublished" });

    const res = await request(app)
      .get("/limerick/mine")
      .set("Authorization", `Bearer ${authorToken}`);

    expect(res.status).toBe(200);
    const titles = res.body.map((l) => l.title);
    expect(titles).toContain("My Published");
    expect(titles).toContain("My Unpublished");
  });
});

// ─── GET /limerick/:id ────────────────────────────────────────────────────────

describe("GET /limerick/:id", () => {
  test("200 - author can get their own unpublished limerick", async () => {
    const limerick = await createLimerick({ published: false });

    const res = await request(app)
      .get(`/limerick/${limerick.id}`)
      .set("Authorization", `Bearer ${authorToken}`);

    expect(res.status).toBe(200);
  });

  test("200 - anyone can get a published limerick", async () => {
    const limerick = await createLimerick({ published: true });

    const res = await request(app)
      .get(`/limerick/${limerick.id}`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(200);
  });

  test("403 - cannot get another user's unpublished limerick", async () => {
    const limerick = await createLimerick({ published: false });

    const res = await request(app)
      .get(`/limerick/${limerick.id}`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
  });

  test("404 - limerick not found", async () => {
    const res = await request(app)
      .get("/limerick/999999")
      .set("Authorization", `Bearer ${authorToken}`);

    expect(res.status).toBe(404);
  });
});

// ─── GET /limerick/user/:userID ───────────────────────────────────────────────

describe("GET /limerick/user/:userID", () => {
  test("200 - returns only published limericks for that user", async () => {
    await createLimerick({ published: true, title: "Public" });
    await createLimerick({ published: false, title: "Private" });

    const res = await request(app)
      .get(`/limerick/user/${authorID}`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(200);
    const titles = res.body.map((l) => l.title);
    expect(titles).toContain("Public");
    expect(titles).not.toContain("Private");
  });
});

// ─── PATCH /limerick/:id ──────────────────────────────────────────────────────

describe("PATCH /limerick/:id", () => {
  test("200 - author can update their limerick", async () => {
    const limerick = await createLimerick();

    const res = await request(app)
      .patch(`/limerick/${limerick.id}`)
      .set("Authorization", `Bearer ${authorToken}`)
      .send({ title: "Updated Title" });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Updated Title");
  });

  test("403 - non-author cannot update", async () => {
    const limerick = await createLimerick();

    const res = await request(app)
      .patch(`/limerick/${limerick.id}`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ title: "Stolen Title" });

    expect(res.status).toBe(403);
  });

  test("404 - limerick not found", async () => {
    const res = await request(app)
      .patch("/limerick/999999")
      .set("Authorization", `Bearer ${authorToken}`)
      .send({ title: "Updated" });

    expect(res.status).toBe(404);
  });

  test("400 - empty title fails validation", async () => {
    const limerick = await createLimerick();

    const res = await request(app)
      .patch(`/limerick/${limerick.id}`)
      .set("Authorization", `Bearer ${authorToken}`)
      .send({ title: "" });

    expect(res.status).toBe(400);
  });
});

// ─── DELETE /limerick/:id ─────────────────────────────────────────────────────

describe("DELETE /limerick/:id", () => {
  test("200 - author can delete their limerick", async () => {
    const limerick = await createLimerick();

    const res = await request(app)
      .delete(`/limerick/${limerick.id}`)
      .set("Authorization", `Bearer ${authorToken}`);

    expect(res.status).toBe(200);
  });

  test("403 - non-author cannot delete", async () => {
    const limerick = await createLimerick();

    const res = await request(app)
      .delete(`/limerick/${limerick.id}`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
  });

  test("200 - admin can delete any limerick", async () => {
    const limerick = await createLimerick();

    const res = await request(app)
      .delete(`/limerick/${limerick.id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  test("404 - limerick not found", async () => {
    const res = await request(app)
      .delete("/limerick/999999")
      .set("Authorization", `Bearer ${authorToken}`);

    expect(res.status).toBe(404);
  });
});

// ─── POST /limerick/:id/like ──────────────────────────────────────────────────

describe("POST /limerick/:id/like", () => {
  test("201 - user can like a limerick", async () => {
    const limerick = await createLimerick();

    const res = await request(app)
      .post(`/limerick/${limerick.id}/like`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(201);
  });

  test("409 - cannot like the same limerick twice", async () => {
    const limerick = await createLimerick();
    await request(app)
      .post(`/limerick/${limerick.id}/like`)
      .set("Authorization", `Bearer ${otherToken}`);

    const res = await request(app)
      .post(`/limerick/${limerick.id}/like`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(409);
  });

  test("404 - limerick not found", async () => {
    const res = await request(app)
      .post("/limerick/999999/like")
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(404);
  });
});

// ─── DELETE /limerick/:id/like ────────────────────────────────────────────────

describe("DELETE /limerick/:id/like", () => {
  test("200 - user can unlike a limerick", async () => {
    const limerick = await createLimerick();
    await request(app)
      .post(`/limerick/${limerick.id}/like`)
      .set("Authorization", `Bearer ${otherToken}`);

    const res = await request(app)
      .delete(`/limerick/${limerick.id}/like`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(200);
  });

  test("404 - limerick not found", async () => {
    const res = await request(app)
      .delete("/limerick/999999/like")
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(404);
  });
});
