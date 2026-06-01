import express from "express";
import request from "supertest";
import { describe, test, expect, beforeAll, afterAll } from "vitest";
import userRouter from "../src/user.js";
import haikuRouter from "../src/haiku.js";
import haikuCommentRouter from "../src/haikuComment.js";
import { prisma } from "../db/prismaClient.js";
import { cleanup, TEST_USER, TEST_OTHER_USER, TEST_ADMIN_USER } from "./helpers.js";

const app = express();
app.use(express.json());
app.use("/users", userRouter);
app.use("/haiku", haikuRouter);
app.use("/haikuComment", haikuCommentRouter);

let authorToken, otherToken, adminToken, haikuID;

const testHaiku = {
  title: "Haiku for Comments",
  lineOne: "An old silent pond",
  lineTwo: "A frog jumps into the pond",
  lineThree: "Splash! Silence again",
  lineOneSyllables: 5,
  lineTwoSyllables: 7,
  lineThreeSyllables: 5,
  published: true,
};

async function createComment(token, poemID, body = "A thoughtful comment") {
  const res = await request(app)
    .post(`/haikuComment/${poemID}`)
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

  const haikuRes = await request(app)
    .post("/haiku")
    .set("Authorization", `Bearer ${authorToken}`)
    .send(testHaiku);
  haikuID = haikuRes.body.id;
});

afterAll(async () => {
  await cleanup();
});

// ─── POST /haikuComment/:poemID ───────────────────────────────────────────────

describe("POST /haikuComment/:poemID", () => {
  test("201 - creates a comment on a haiku", async () => {
    const res = await request(app)
      .post(`/haikuComment/${haikuID}`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ commentbody: "Beautiful haiku!" });

    expect(res.status).toBe(201);
    expect(res.body.commentbody).toBe("Beautiful haiku!");
    expect(res.body.poemID).toBe(haikuID);
  });

  test("400 - empty comment body", async () => {
    const res = await request(app)
      .post(`/haikuComment/${haikuID}`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ commentbody: "" });

    expect(res.status).toBe(400);
  });

  test("404 - haiku not found", async () => {
    const res = await request(app)
      .post("/haikuComment/999999")
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ commentbody: "Hello?" });

    expect(res.status).toBe(404);
  });

  test("401 - no token", async () => {
    const res = await request(app)
      .post(`/haikuComment/${haikuID}`)
      .send({ commentbody: "No auth comment" });

    expect(res.status).toBe(401);
  });
});

// ─── GET /haikuComment/:poemID ────────────────────────────────────────────────

describe("GET /haikuComment/:poemID", () => {
  test("200 - returns comments for a haiku", async () => {
    await createComment(authorToken, haikuID, "First comment");
    await createComment(otherToken, haikuID, "Second comment");

    const res = await request(app)
      .get(`/haikuComment/${haikuID}`)
      .set("Authorization", `Bearer ${authorToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  test("404 - haiku not found", async () => {
    const res = await request(app)
      .get("/haikuComment/999999")
      .set("Authorization", `Bearer ${authorToken}`);

    expect(res.status).toBe(404);
  });

  test("401 - no token", async () => {
    const res = await request(app).get(`/haikuComment/${haikuID}`);
    expect(res.status).toBe(401);
  });
});

// ─── PATCH /haikuComment/:commentID ──────────────────────────────────────────

describe("PATCH /haikuComment/:commentID", () => {
  test("200 - author can edit their comment", async () => {
    const comment = await createComment(authorToken, haikuID);

    const res = await request(app)
      .patch(`/haikuComment/${comment.id}`)
      .set("Authorization", `Bearer ${authorToken}`)
      .send({ commentbody: "Edited comment" });

    expect(res.status).toBe(200);
    expect(res.body.commentbody).toBe("Edited comment");
  });

  test("403 - non-author cannot edit", async () => {
    const comment = await createComment(authorToken, haikuID);

    const res = await request(app)
      .patch(`/haikuComment/${comment.id}`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ commentbody: "Stolen edit" });

    expect(res.status).toBe(403);
  });

  test("404 - comment not found", async () => {
    const res = await request(app)
      .patch("/haikuComment/999999")
      .set("Authorization", `Bearer ${authorToken}`)
      .send({ commentbody: "Updated" });

    expect(res.status).toBe(404);
  });

  test("400 - empty comment body", async () => {
    const comment = await createComment(authorToken, haikuID);

    const res = await request(app)
      .patch(`/haikuComment/${comment.id}`)
      .set("Authorization", `Bearer ${authorToken}`)
      .send({ commentbody: "" });

    expect(res.status).toBe(400);
  });
});

// ─── DELETE /haikuComment/:commentID ─────────────────────────────────────────

describe("DELETE /haikuComment/:commentID", () => {
  test("200 - author can delete their comment", async () => {
    const comment = await createComment(authorToken, haikuID);

    const res = await request(app)
      .delete(`/haikuComment/${comment.id}`)
      .set("Authorization", `Bearer ${authorToken}`);

    expect(res.status).toBe(200);
  });

  test("403 - non-author cannot delete", async () => {
    const comment = await createComment(authorToken, haikuID);

    const res = await request(app)
      .delete(`/haikuComment/${comment.id}`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
  });

  test("200 - admin can delete any comment", async () => {
    const comment = await createComment(authorToken, haikuID);

    const res = await request(app)
      .delete(`/haikuComment/${comment.id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  test("404 - comment not found", async () => {
    const res = await request(app)
      .delete("/haikuComment/999999")
      .set("Authorization", `Bearer ${authorToken}`);

    expect(res.status).toBe(404);
  });
});

// ─── POST /haikuComment/:commentID/like ──────────────────────────────────────

describe("POST /haikuComment/:commentID/like", () => {
  test("201 - user can like a comment", async () => {
    const comment = await createComment(authorToken, haikuID);

    const res = await request(app)
      .post(`/haikuComment/${comment.id}/like`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(201);
  });

  test("409 - cannot like the same comment twice", async () => {
    const comment = await createComment(authorToken, haikuID);
    await request(app)
      .post(`/haikuComment/${comment.id}/like`)
      .set("Authorization", `Bearer ${otherToken}`);

    const res = await request(app)
      .post(`/haikuComment/${comment.id}/like`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(409);
  });

  test("404 - comment not found", async () => {
    const res = await request(app)
      .post("/haikuComment/999999/like")
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(404);
  });
});

// ─── DELETE /haikuComment/:commentID/like ────────────────────────────────────

describe("DELETE /haikuComment/:commentID/like", () => {
  test("200 - user can unlike a comment", async () => {
    const comment = await createComment(authorToken, haikuID);
    await request(app)
      .post(`/haikuComment/${comment.id}/like`)
      .set("Authorization", `Bearer ${otherToken}`);

    const res = await request(app)
      .delete(`/haikuComment/${comment.id}/like`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(200);
  });

  test("404 - comment not found", async () => {
    const res = await request(app)
      .delete("/haikuComment/999999/like")
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(404);
  });
});
