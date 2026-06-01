import express from "express";
import request from "supertest";
import { describe, test, expect, beforeAll, afterAll } from "vitest";
import userRouter from "../src/user.js";
import limerickRouter from "../src/limerick.js";
import limerickCommentRouter from "../src/limerickComment.js";
import { prisma } from "../db/prismaClient.js";
import { cleanup, TEST_USER, TEST_OTHER_USER, TEST_ADMIN_USER } from "./helpers.js";

const app = express();
app.use(express.json());
app.use("/users", userRouter);
app.use("/limerick", limerickRouter);
app.use("/limerickComment", limerickCommentRouter);

let authorToken, otherToken, adminToken, limerickID;

const testLimerick = {
  title: "Limerick for Comments",
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

async function createComment(token, poemID, body = "A thoughtful comment") {
  const res = await request(app)
    .post(`/limerickComment/${poemID}`)
    .set("Authorization", `Bearer ${token}`)
    .send({ commentbody: body });
  return res.body;
}

beforeAll(async () => {
  await cleanup();

  await request(app).post("/users/create").send(TEST_USER);
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

  const limerickRes = await request(app)
    .post("/limerick")
    .set("Authorization", `Bearer ${authorToken}`)
    .send(testLimerick);
  limerickID = limerickRes.body.id;
});

afterAll(async () => {
  await cleanup();
});

// ─── POST /limerickComment/:poemID ────────────────────────────────────────────

describe("POST /limerickComment/:poemID", () => {
  test("201 - creates a comment on a limerick", async () => {
    const res = await request(app)
      .post(`/limerickComment/${limerickID}`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ commentbody: "Delightful limerick!" });

    expect(res.status).toBe(201);
    expect(res.body.commentbody).toBe("Delightful limerick!");
    expect(res.body.poemID).toBe(limerickID);
  });

  test("400 - empty comment body", async () => {
    const res = await request(app)
      .post(`/limerickComment/${limerickID}`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ commentbody: "" });

    expect(res.status).toBe(400);
  });

  test("404 - limerick not found", async () => {
    const res = await request(app)
      .post("/limerickComment/999999")
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ commentbody: "Hello?" });

    expect(res.status).toBe(404);
  });

  test("401 - no token", async () => {
    const res = await request(app)
      .post(`/limerickComment/${limerickID}`)
      .send({ commentbody: "No auth comment" });

    expect(res.status).toBe(401);
  });
});

// ─── GET /limerickComment/:poemID ─────────────────────────────────────────────

describe("GET /limerickComment/:poemID", () => {
  test("200 - returns comments for a limerick", async () => {
    await createComment(authorToken, limerickID, "First comment");
    await createComment(otherToken, limerickID, "Second comment");

    const res = await request(app)
      .get(`/limerickComment/${limerickID}`)
      .set("Authorization", `Bearer ${authorToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  test("404 - limerick not found", async () => {
    const res = await request(app)
      .get("/limerickComment/999999")
      .set("Authorization", `Bearer ${authorToken}`);

    expect(res.status).toBe(404);
  });

  test("401 - no token", async () => {
    const res = await request(app).get(`/limerickComment/${limerickID}`);
    expect(res.status).toBe(401);
  });
});

// ─── PATCH /limerickComment/:commentID ───────────────────────────────────────

describe("PATCH /limerickComment/:commentID", () => {
  test("200 - author can edit their comment", async () => {
    const comment = await createComment(authorToken, limerickID);

    const res = await request(app)
      .patch(`/limerickComment/${comment.id}`)
      .set("Authorization", `Bearer ${authorToken}`)
      .send({ commentbody: "Edited comment" });

    expect(res.status).toBe(200);
    expect(res.body.commentbody).toBe("Edited comment");
  });

  test("403 - non-author cannot edit", async () => {
    const comment = await createComment(authorToken, limerickID);

    const res = await request(app)
      .patch(`/limerickComment/${comment.id}`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ commentbody: "Stolen edit" });

    expect(res.status).toBe(403);
  });

  test("404 - comment not found", async () => {
    const res = await request(app)
      .patch("/limerickComment/999999")
      .set("Authorization", `Bearer ${authorToken}`)
      .send({ commentbody: "Updated" });

    expect(res.status).toBe(404);
  });

  test("400 - empty comment body", async () => {
    const comment = await createComment(authorToken, limerickID);

    const res = await request(app)
      .patch(`/limerickComment/${comment.id}`)
      .set("Authorization", `Bearer ${authorToken}`)
      .send({ commentbody: "" });

    expect(res.status).toBe(400);
  });
});

// ─── DELETE /limerickComment/:commentID ──────────────────────────────────────

describe("DELETE /limerickComment/:commentID", () => {
  test("200 - author can delete their comment", async () => {
    const comment = await createComment(authorToken, limerickID);

    const res = await request(app)
      .delete(`/limerickComment/${comment.id}`)
      .set("Authorization", `Bearer ${authorToken}`);

    expect(res.status).toBe(200);
  });

  test("403 - non-author cannot delete", async () => {
    const comment = await createComment(authorToken, limerickID);

    const res = await request(app)
      .delete(`/limerickComment/${comment.id}`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
  });

  test("200 - admin can delete any comment", async () => {
    const comment = await createComment(authorToken, limerickID);

    const res = await request(app)
      .delete(`/limerickComment/${comment.id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  test("404 - comment not found", async () => {
    const res = await request(app)
      .delete("/limerickComment/999999")
      .set("Authorization", `Bearer ${authorToken}`);

    expect(res.status).toBe(404);
  });
});

// ─── POST /limerickComment/:commentID/like ────────────────────────────────────

describe("POST /limerickComment/:commentID/like", () => {
  test("201 - user can like a comment", async () => {
    const comment = await createComment(authorToken, limerickID);

    const res = await request(app)
      .post(`/limerickComment/${comment.id}/like`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(201);
  });

  test("409 - cannot like the same comment twice", async () => {
    const comment = await createComment(authorToken, limerickID);
    await request(app)
      .post(`/limerickComment/${comment.id}/like`)
      .set("Authorization", `Bearer ${otherToken}`);

    const res = await request(app)
      .post(`/limerickComment/${comment.id}/like`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(409);
  });

  test("404 - comment not found", async () => {
    const res = await request(app)
      .post("/limerickComment/999999/like")
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(404);
  });
});

// ─── DELETE /limerickComment/:commentID/like ──────────────────────────────────

describe("DELETE /limerickComment/:commentID/like", () => {
  test("200 - user can unlike a comment", async () => {
    const comment = await createComment(authorToken, limerickID);
    await request(app)
      .post(`/limerickComment/${comment.id}/like`)
      .set("Authorization", `Bearer ${otherToken}`);

    const res = await request(app)
      .delete(`/limerickComment/${comment.id}/like`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(200);
  });

  test("404 - comment not found", async () => {
    const res = await request(app)
      .delete("/limerickComment/999999/like")
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(404);
  });
});
