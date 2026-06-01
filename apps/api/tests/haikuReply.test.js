import express from "express";
import request from "supertest";
import { describe, test, expect, beforeAll, afterAll } from "vitest";
import userRouter from "../src/user.js";
import haikuRouter from "../src/haiku.js";
import haikuCommentRouter from "../src/haikuComment.js";
import haikuReplyRouter from "../src/haikuReply.js";
import { prisma } from "../db/prismaClient.js";
import { cleanup, TEST_USER, TEST_OTHER_USER, TEST_ADMIN_USER } from "./helpers.js";

const app = express();
app.use(express.json());
app.use("/users", userRouter);
app.use("/haiku", haikuRouter);
app.use("/haikuComment", haikuCommentRouter);
app.use("/haikuReply", haikuReplyRouter);

let authorToken, otherToken, adminToken, commentID;

const testHaiku = {
  title: "Haiku for Replies",
  lineOne: "An old silent pond",
  lineTwo: "A frog jumps into the pond",
  lineThree: "Splash! Silence again",
  lineOneSyllables: 5,
  lineTwoSyllables: 7,
  lineThreeSyllables: 5,
  published: true,
};

async function createReply(token, cID, body = "A reply") {
  const res = await request(app)
    .post(`/haikuReply/${cID}/replies`)
    .set("Authorization", `Bearer ${token}`)
    .send({ replybody: body });
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
  const haikuID = haikuRes.body.id;

  const commentRes = await request(app)
    .post(`/haikuComment/${haikuID}`)
    .set("Authorization", `Bearer ${authorToken}`)
    .send({ commentbody: "A comment to reply to" });
  commentID = commentRes.body.id;
});

afterAll(async () => {
  await cleanup();
});

// ─── POST /haikuReply/:commentID/replies ──────────────────────────────────────

describe("POST /haikuReply/:commentID/replies", () => {
  test("201 - creates a reply to a comment", async () => {
    const res = await request(app)
      .post(`/haikuReply/${commentID}/replies`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ replybody: "I agree!" });

    expect(res.status).toBe(201);
    expect(res.body.replybody).toBe("I agree!");
    expect(res.body.commentID).toBe(commentID);
  });

  test("400 - empty reply body", async () => {
    const res = await request(app)
      .post(`/haikuReply/${commentID}/replies`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ replybody: "" });

    expect(res.status).toBe(400);
  });

  test("404 - comment not found", async () => {
    const res = await request(app)
      .post("/haikuReply/999999/replies")
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ replybody: "Hello?" });

    expect(res.status).toBe(404);
  });

  test("401 - no token", async () => {
    const res = await request(app)
      .post(`/haikuReply/${commentID}/replies`)
      .send({ replybody: "No auth reply" });

    expect(res.status).toBe(401);
  });
});

// ─── GET /haikuReply/:commentID ───────────────────────────────────────────────

describe("GET /haikuReply/:commentID", () => {
  test("200 - returns replies for a comment", async () => {
    await createReply(authorToken, commentID, "Reply one");
    await createReply(otherToken, commentID, "Reply two");

    const res = await request(app)
      .get(`/haikuReply/${commentID}`)
      .set("Authorization", `Bearer ${authorToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  test("404 - comment not found", async () => {
    const res = await request(app)
      .get("/haikuReply/999999")
      .set("Authorization", `Bearer ${authorToken}`);

    expect(res.status).toBe(404);
  });

  test("401 - no token", async () => {
    const res = await request(app).get(`/haikuReply/${commentID}`);
    expect(res.status).toBe(401);
  });
});

// ─── PATCH /haikuReply/:replyID ───────────────────────────────────────────────

describe("PATCH /haikuReply/:replyID", () => {
  test("200 - author can edit their reply", async () => {
    const reply = await createReply(authorToken, commentID);

    const res = await request(app)
      .patch(`/haikuReply/${reply.id}`)
      .set("Authorization", `Bearer ${authorToken}`)
      .send({ replybody: "Edited reply" });

    expect(res.status).toBe(200);
    expect(res.body.replybody).toBe("Edited reply");
  });

  test("403 - non-author cannot edit", async () => {
    const reply = await createReply(authorToken, commentID);

    const res = await request(app)
      .patch(`/haikuReply/${reply.id}`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ replybody: "Stolen edit" });

    expect(res.status).toBe(403);
  });

  test("404 - reply not found", async () => {
    const res = await request(app)
      .patch("/haikuReply/999999")
      .set("Authorization", `Bearer ${authorToken}`)
      .send({ replybody: "Updated" });

    expect(res.status).toBe(404);
  });

  test("400 - empty reply body", async () => {
    const reply = await createReply(authorToken, commentID);

    const res = await request(app)
      .patch(`/haikuReply/${reply.id}`)
      .set("Authorization", `Bearer ${authorToken}`)
      .send({ replybody: "" });

    expect(res.status).toBe(400);
  });
});

// ─── DELETE /haikuReply/:replyID ──────────────────────────────────────────────

describe("DELETE /haikuReply/:replyID", () => {
  test("200 - author can delete their reply", async () => {
    const reply = await createReply(authorToken, commentID);

    const res = await request(app)
      .delete(`/haikuReply/${reply.id}`)
      .set("Authorization", `Bearer ${authorToken}`);

    expect(res.status).toBe(200);
  });

  test("403 - non-author cannot delete", async () => {
    const reply = await createReply(authorToken, commentID);

    const res = await request(app)
      .delete(`/haikuReply/${reply.id}`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
  });

  test("200 - admin can delete any reply", async () => {
    const reply = await createReply(authorToken, commentID);

    const res = await request(app)
      .delete(`/haikuReply/${reply.id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  test("404 - reply not found", async () => {
    const res = await request(app)
      .delete("/haikuReply/999999")
      .set("Authorization", `Bearer ${authorToken}`);

    expect(res.status).toBe(404);
  });
});

// ─── POST /haikuReply/:replyID/like ───────────────────────────────────────────

describe("POST /haikuReply/:replyID/like", () => {
  test("201 - user can like a reply", async () => {
    const reply = await createReply(authorToken, commentID);

    const res = await request(app)
      .post(`/haikuReply/${reply.id}/like`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(201);
  });

  test("409 - cannot like the same reply twice", async () => {
    const reply = await createReply(authorToken, commentID);
    await request(app)
      .post(`/haikuReply/${reply.id}/like`)
      .set("Authorization", `Bearer ${otherToken}`);

    const res = await request(app)
      .post(`/haikuReply/${reply.id}/like`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(409);
  });

  test("404 - reply not found", async () => {
    const res = await request(app)
      .post("/haikuReply/999999/like")
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(404);
  });
});

// ─── DELETE /haikuReply/:replyID/like ─────────────────────────────────────────

describe("DELETE /haikuReply/:replyID/like", () => {
  test("200 - user can unlike a reply", async () => {
    const reply = await createReply(authorToken, commentID);
    await request(app)
      .post(`/haikuReply/${reply.id}/like`)
      .set("Authorization", `Bearer ${otherToken}`);

    const res = await request(app)
      .delete(`/haikuReply/${reply.id}/like`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(200);
  });

  test("404 - reply not found", async () => {
    const res = await request(app)
      .delete("/haikuReply/999999/like")
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(404);
  });
});
