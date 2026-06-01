import express from "express";
import request from "supertest";
import { describe, test, expect, beforeAll, afterAll } from "vitest";
import userRouter from "../src/user.js";
import haikuRouter from "../src/haiku.js";
import { prisma } from "../db/prismaClient.js";
import { cleanup, TEST_USER, TEST_OTHER_USER, TEST_ADMIN_USER } from "./helpers.js";

const app = express();
app.use(express.json());
app.use("/users", userRouter);
app.use("/haiku", haikuRouter);

let authorToken, otherToken, adminToken, authorID;

const testHaiku = {
  title: "Test Haiku",
  lineOne: "An old silent pond",
  lineTwo: "A frog jumps into the pond",
  lineThree: "Splash! Silence again",
  lineOneSyllables: 5,
  lineTwoSyllables: 7,
  lineThreeSyllables: 5,
  published: true,
};

async function createHaiku(overrides = {}) {
  const res = await request(app)
    .post("/haiku")
    .set("Authorization", `Bearer ${authorToken}`)
    .send({ ...testHaiku, ...overrides });
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

// ─── POST /haiku ──────────────────────────────────────────────────────────────

describe("POST /haiku", () => {
  test("201 - creates a published haiku", async () => {
    const res = await request(app)
      .post("/haiku")
      .set("Authorization", `Bearer ${authorToken}`)
      .send(testHaiku);

    expect(res.status).toBe(201);
    expect(res.body.title).toBe(testHaiku.title);
    expect(res.body.authorID).toBe(authorID);
    expect(res.body.published).toBe(true);
  });

  test("201 - creates an unpublished haiku", async () => {
    const res = await request(app)
      .post("/haiku")
      .set("Authorization", `Bearer ${authorToken}`)
      .send({ ...testHaiku, published: false });

    expect(res.status).toBe(201);
    expect(res.body.published).toBe(false);
  });

  test("400 - missing title", async () => {
    const { title, ...noTitle } = testHaiku;
    const res = await request(app)
      .post("/haiku")
      .set("Authorization", `Bearer ${authorToken}`)
      .send(noTitle);

    expect(res.status).toBe(400);
  });

  test("400 - syllable count out of range", async () => {
    const res = await request(app)
      .post("/haiku")
      .set("Authorization", `Bearer ${authorToken}`)
      .send({ ...testHaiku, lineOneSyllables: 10 });

    expect(res.status).toBe(400);
  });

  test("400 - empty line", async () => {
    const res = await request(app)
      .post("/haiku")
      .set("Authorization", `Bearer ${authorToken}`)
      .send({ ...testHaiku, lineOne: "" });

    expect(res.status).toBe(400);
  });

  test("401 - no token", async () => {
    const res = await request(app).post("/haiku").send(testHaiku);

    expect(res.status).toBe(401);
  });
});

// ─── GET /haiku ───────────────────────────────────────────────────────────────

describe("GET /haiku", () => {
  test("200 - returns only published haikus", async () => {
    await createHaiku({ published: true });
    await createHaiku({ published: false, title: "Unpublished" });

    const res = await request(app)
      .get("/haiku")
      .set("Authorization", `Bearer ${authorToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const titles = res.body.map((h) => h.title);
    expect(titles).not.toContain("Unpublished");
  });

  test("401 - no token", async () => {
    const res = await request(app).get("/haiku");
    expect(res.status).toBe(401);
  });
});

// ─── GET /haiku/mine ──────────────────────────────────────────────────────────

describe("GET /haiku/mine", () => {
  test("200 - returns all my haikus including unpublished", async () => {
    await createHaiku({ published: true, title: "My Published" });
    await createHaiku({ published: false, title: "My Unpublished" });

    const res = await request(app)
      .get("/haiku/mine")
      .set("Authorization", `Bearer ${authorToken}`);

    expect(res.status).toBe(200);
    const titles = res.body.map((h) => h.title);
    expect(titles).toContain("My Published");
    expect(titles).toContain("My Unpublished");
  });

  test("401 - no token", async () => {
    const res = await request(app).get("/haiku/mine");
    expect(res.status).toBe(401);
  });
});

// ─── GET /haiku/:id ───────────────────────────────────────────────────────────

describe("GET /haiku/:id", () => {
  test("200 - author can get their own unpublished haiku", async () => {
    const haiku = await createHaiku({ published: false });

    const res = await request(app)
      .get(`/haiku/${haiku.id}`)
      .set("Authorization", `Bearer ${authorToken}`);

    expect(res.status).toBe(200);
  });

  test("200 - anyone can get a published haiku", async () => {
    const haiku = await createHaiku({ published: true });

    const res = await request(app)
      .get(`/haiku/${haiku.id}`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(200);
  });

  test("403 - cannot get another user's unpublished haiku", async () => {
    const haiku = await createHaiku({ published: false });

    const res = await request(app)
      .get(`/haiku/${haiku.id}`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
  });

  test("404 - haiku not found", async () => {
    const res = await request(app)
      .get("/haiku/999999")
      .set("Authorization", `Bearer ${authorToken}`);

    expect(res.status).toBe(404);
  });
});

// ─── GET /haiku/user/:userID ──────────────────────────────────────────────────

describe("GET /haiku/user/:userID", () => {
  test("200 - returns only published haikus for that user", async () => {
    await createHaiku({ published: true, title: "Public" });
    await createHaiku({ published: false, title: "Private" });

    const res = await request(app)
      .get(`/haiku/user/${authorID}`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(200);
    const titles = res.body.map((h) => h.title);
    expect(titles).toContain("Public");
    expect(titles).not.toContain("Private");
  });
});

// ─── PATCH /haiku/:id ─────────────────────────────────────────────────────────

describe("PATCH /haiku/:id", () => {
  test("200 - author can update their haiku", async () => {
    const haiku = await createHaiku();

    const res = await request(app)
      .patch(`/haiku/${haiku.id}`)
      .set("Authorization", `Bearer ${authorToken}`)
      .send({ title: "Updated Title" });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Updated Title");
  });

  test("403 - non-author cannot update", async () => {
    const haiku = await createHaiku();

    const res = await request(app)
      .patch(`/haiku/${haiku.id}`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ title: "Stolen Title" });

    expect(res.status).toBe(403);
  });

  test("404 - haiku not found", async () => {
    const res = await request(app)
      .patch("/haiku/999999")
      .set("Authorization", `Bearer ${authorToken}`)
      .send({ title: "Updated" });

    expect(res.status).toBe(404);
  });

  test("400 - empty title fails validation", async () => {
    const haiku = await createHaiku();

    const res = await request(app)
      .patch(`/haiku/${haiku.id}`)
      .set("Authorization", `Bearer ${authorToken}`)
      .send({ title: "" });

    expect(res.status).toBe(400);
  });

  test("401 - no token", async () => {
    const haiku = await createHaiku();

    const res = await request(app)
      .patch(`/haiku/${haiku.id}`)
      .send({ title: "Updated" });

    expect(res.status).toBe(401);
  });
});

// ─── DELETE /haiku/:id ────────────────────────────────────────────────────────

describe("DELETE /haiku/:id", () => {
  test("200 - author can delete their haiku", async () => {
    const haiku = await createHaiku();

    const res = await request(app)
      .delete(`/haiku/${haiku.id}`)
      .set("Authorization", `Bearer ${authorToken}`);

    expect(res.status).toBe(200);
  });

  test("403 - non-author cannot delete", async () => {
    const haiku = await createHaiku();

    const res = await request(app)
      .delete(`/haiku/${haiku.id}`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
  });

  test("200 - admin can delete any haiku", async () => {
    const haiku = await createHaiku();

    const res = await request(app)
      .delete(`/haiku/${haiku.id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  test("404 - haiku not found", async () => {
    const res = await request(app)
      .delete("/haiku/999999")
      .set("Authorization", `Bearer ${authorToken}`);

    expect(res.status).toBe(404);
  });
});

// ─── POST /haiku/:id/like ─────────────────────────────────────────────────────

describe("POST /haiku/:id/like", () => {
  test("201 - user can like a haiku", async () => {
    const haiku = await createHaiku();

    const res = await request(app)
      .post(`/haiku/${haiku.id}/like`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(201);
  });

  test("409 - cannot like the same haiku twice", async () => {
    const haiku = await createHaiku();
    await request(app)
      .post(`/haiku/${haiku.id}/like`)
      .set("Authorization", `Bearer ${otherToken}`);

    const res = await request(app)
      .post(`/haiku/${haiku.id}/like`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(409);
  });

  test("404 - haiku not found", async () => {
    const res = await request(app)
      .post("/haiku/999999/like")
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(404);
  });
});

// ─── DELETE /haiku/:id/like ───────────────────────────────────────────────────

describe("DELETE /haiku/:id/like", () => {
  test("200 - user can unlike a haiku", async () => {
    const haiku = await createHaiku();
    await request(app)
      .post(`/haiku/${haiku.id}/like`)
      .set("Authorization", `Bearer ${otherToken}`);

    const res = await request(app)
      .delete(`/haiku/${haiku.id}/like`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(200);
  });

  test("404 - haiku not found", async () => {
    const res = await request(app)
      .delete("/haiku/999999/like")
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(404);
  });
});
