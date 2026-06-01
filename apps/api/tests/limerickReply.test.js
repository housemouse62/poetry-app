import express from "express";
import request from "supertest";
import { describe, test, expect, beforeAll, afterAll } from "vitest";
import userRouter from "../src/user.js";
import limerickRouter from "../src/limerick.js";
import limerickCommentRouter from "../src/limerickComment.js";
import limerickReplyRouter from "../src/limerickReply.js";
import { prisma } from "../db/prismaClient.js";
import { cleanup, TEST_USER, TEST_OTHER_USER, TEST_ADMIN_USER } from "./helpers.js";

const app = express();
app.use(express.json());
app.use("/users", userRouter);
app.use("/limerick", limerickRouter);
app.use("/limerickComment", limerickCommentRouter);
app.use("/limerickReply", limerickReplyRouter);

let authorToken, otherToken, adminToken, commentID;

const testLimerick = {
  title: "Limerick for Replies",
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

async function createReply(token, cID, body = "A reply") {
  const res = await request(app)
    .post(`/limerickReply/${cID}/replies`)
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

  const limerickRes = await request(app)
    .post("/limerick")
    .set("Authorization", `Bearer ${authorToken}`)
    .send(testLimerick);
  const limerickID = limerickRes.body.id;

  const commentRes = await request(app)
    .post(`/limerickComment/${limerickID}`)
    .set("Authorization", `Bearer ${authorToken}`)
    .send({ commentbody: "A comment to reply to" });
  commentID = commentRes.body.id;
});

afterAll(async () => {
  await cleanup();
});

// ─── POST /limerickReply/:commentID/replies ───────────────────────────────────

describe("POST /limerickReply/:commentID/replies", () => {
  test("201 - creates a reply to a comment", async () => {
    const res = await request(app)
      .post(`/limerickReply/${commentID}/replies`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ replybody: "I agree!" });

    expect(res.status).toBe(201);
    expect(res.body.replybody).toBe("I agree!");
    expect(res.body.commentID).toBe(commentID);
  });

  test("400 - empty reply body", async () => {
    const res = await request(app)
      .post(`/limerickReply/${commentID}/replies`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ replybody: "" });

    expect(res.status).toBe(400);
  });

  test("404 - comment not found", async () => {
    const res = await request(app)
      .post("/limerickReply/999999/replies")
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ replybody: "Hello?" });

    expect(res.status).toBe(404);
  });

  test("401 - no token", async () => {
    const res = await request(app)
      .post(`/limerickReply/${commentID}/replies`)
      .send({ replybody: "No auth reply" });

    expect(res.status).toBe(401);
  });
});

// ─── GET /limerickReply/:commentID ────────────────────────────────────────────

describe("GET /limerickReply/:commentID", () => {
  test("200 - returns replies for a comment", async () => {
    await createReply(authorToken, commentID, "Reply one");
    await createReply(otherToken, commentID, "Reply two");

    const res = await request(app)
      .get(`/limerickReply/${commentID}`)
      .set("Authorization", `Bearer ${authorToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  test("404 - comment not found", async () => {
    const res = await request(app)
      .get("/limerickReply/999999")
      .set("Authorization", `Bearer ${authorToken}`);

    expect(res.status).toBe(404);
  });

  test("401 - no token", async () => {
    const res = await request(app).get(`/limerickReply/${commentID}`);
    expect(res.status).toBe(401);
  });
});

// ─── PATCH /limerickReply/:replyID ────────────────────────────────────────────

describe("PATCH /limerickReply/:replyID", () => {
  test("200 - author can edit their reply", async () => {
    const reply = await createReply(authorToken, commentID);

    const res = await request(app)
      .patch(`/limerickReply/${reply.id}`)
      .set("Authorization", `Bearer ${authorToken}`)
      .send({ replybody: "Edited reply" });

    expect(res.status).toBe(200);
    expect(res.body.replybody).toBe("Edited reply");
  });

  test("403 - non-author cannot edit", async () => {
    const reply = await createReply(authorToken, commentID);

    const res = await request(app)
      .patch(`/limerickReply/${reply.id}`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ replybody: "Stolen edit" });

    expect(res.status).toBe(403);
  });

  test("404 - reply not found", async () => {
    const res = await request(app)
      .patch("/limerickReply/999999")
      .set("Authorization", `Bearer ${authorToken}`)
      .send({ replybody: "Updated" });

    expect(res.status).toBe(404);
  });

  test("400 - empty reply body", async () => {
    const reply = await createReply(authorToken, commentID);

    const res = await request(app)
      .patch(`/limerickReply/${reply.id}`)
      .set("Authorization", `Bearer ${authorToken}`)
      .send({ replybody: "" });

    expect(res.status).toBe(400);
  });
});

// ─── DELETE /limerickReply/:replyID ───────────────────────────────────────────

describe("DELETE /limerickReply/:replyID", () => {
  test("200 - author can delete their reply", async () => {
    const reply = await createReply(authorToken, commentID);

    const res = await request(app)
      .delete(`/limerickReply/${reply.id}`)
      .set("Authorization", `Bearer ${authorToken}`);

    expect(res.status).toBe(200);
  });

  test("403 - non-author cannot delete", async () => {
    const reply = await createReply(authorToken, commentID);

    const res = await request(app)
      .delete(`/limerickReply/${reply.id}`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
  });

  test("200 - admin can delete any reply", async () => {
    const reply = await createReply(authorToken, commentID);

    const res = await request(app)
      .delete(`/limerickReply/${reply.id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  test("404 - reply not found", async () => {
    const res = await request(app)
      .delete("/limerickReply/999999")
      .set("Authorization", `Bearer ${authorToken}`);

    expect(res.status).toBe(404);
  });
});

// ─── POST /limerickReply/:replyID/like ────────────────────────────────────────

describe("POST /limerickReply/:replyID/like", () => {
  test("201 - user can like a reply", async () => {
    const reply = await createReply(authorToken, commentID);

    const res = await request(app)
      .post(`/limerickReply/${reply.id}/like`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(201);
  });

  test("409 - cannot like the same reply twice", async () => {
    const reply = await createReply(authorToken, commentID);
    await request(app)
      .post(`/limerickReply/${reply.id}/like`)
      .set("Authorization", `Bearer ${otherToken}`);

    const res = await request(app)
      .post(`/limerickReply/${reply.id}/like`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(409);
  });

  test("404 - reply not found", async () => {
    const res = await request(app)
      .post("/limerickReply/999999/like")
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(404);
  });
});

// ─── DELETE /limerickReply/:replyID/like ──────────────────────────────────────

describe("DELETE /limerickReply/:replyID/like", () => {
  test("200 - user can unlike a reply", async () => {
    const reply = await createReply(authorToken, commentID);
    await request(app)
      .post(`/limerickReply/${reply.id}/like`)
      .set("Authorization", `Bearer ${otherToken}`);

    const res = await request(app)
      .delete(`/limerickReply/${reply.id}/like`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(200);
  });

  test("404 - reply not found", async () => {
    const res = await request(app)
      .delete("/limerickReply/999999/like")
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(404);
  });
});
