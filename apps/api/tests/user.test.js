import express from "express";
import request from "supertest";
import userRouter from "../src/user.js";
import { describe, test, expect, beforeEach } from "vitest";
import { prisma } from "../db/prismaClient.js";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/users", userRouter);

const testUser = {
  email: "poem@poem.com",
  confirmEmail: "poem@poem.com",
  password: "Poems4fun!",
  confirmPassword: "Poems4fun!",
  name: "pippi longstocking",
  screenname: "poempal",
};

const testUser2 = {
  email: "test@test.com",
  confirmEmail: "test@test.com",
  password: "Testing4fun!",
  confirmPassword: "Testing4fun!",
  name: "tester time",
  screenname: "letustest",
};

beforeEach(async () => {
  await prisma.user.deleteMany({ where: { email: testUser.email } });
});

// ─── POST /users/create ───────────────────────────────────────────────────────

describe("POST /users/create", () => {
  test("201 - creates user and returns public fields", async () => {
    const res = await request(app).post("/users/create").send(testUser);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      email: testUser.email,
      name: testUser.name,
      screenname: testUser.screenname,
      usertype: "user",
    });
    expect(res.body.id).toBeDefined();
    expect(res.body.password).toBeUndefined();
  });

  test("400 - email already in use", async () => {
    await request(app).post("/users/create").send(testUser);
    const res = await request(app).post("/users/create").send(testUser);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Email already in use");
  });

  test("400 - emails do not match", async () => {
    const res = await request(app)
      .post("/users/create")
      .send({ ...testUser, confirmEmail: "wrong@wrong.com" });

    expect(res.status).toBe(400);
  });

  test("400 - passwords do not match", async () => {
    const res = await request(app)
      .post("/users/create")
      .send({ ...testUser, confirmPassword: "WrongPass1!" });

    expect(res.status).toBe(400);
  });

  test("400 - weak password", async () => {
    const res = await request(app)
      .post("/users/create")
      .send({ ...testUser, password: "weak", confirmPassword: "weak" });

    expect(res.status).toBe(400);
  });

  test("400 - invalid email format", async () => {
    const res = await request(app)
      .post("/users/create")
      .send({ ...testUser, email: "notanemail", confirmEmail: "notanemail" });

    expect(res.status).toBe(400);
  });

  test("screenname === 'anonymous' when user leaves blank'", async () => {
    const res = await request(app)
      .post("/users/create")
      .send({ ...testUser, screenname: "" });

    expect(res.body.screenname).toBe("anonymous");
  });
});

// ─── POST /users/login ────────────────────────────────────────────────────────

describe("POST /users/login", () => {
  beforeEach(async () => {
    await request(app).post("/users/create").send(testUser);
  });

  test("200 - returns token and public user fields", async () => {
    const res = await request(app)
      .post("/users/login")
      .send({ email: testUser.email, password: testUser.password });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toMatchObject({
      email: testUser.email,
      name: testUser.name,
      screenname: testUser.screenname,
      usertype: "user",
    });
    expect(res.body.user.password).toBeUndefined();
  });

  test("404 - wrong password", async () => {
    const res = await request(app)
      .post("/users/login")
      .send({ email: testUser.email, password: "WrongPass1!" });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Invalid Credentials");
  });

  test("404 - user not found", async () => {
    const res = await request(app)
      .post("/users/login")
      .send({ email: "nobody@nowhere.com", password: testUser.password });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Invalid Credentials");
  });
});

// ─── PATCH /users/profile ─────────────────────────────────────────────────────

describe("PATCH /users/profile", () => {
  let token;

  beforeEach(async () => {
    await request(app).post("/users/create").send(testUser);
    const loginRes = await request(app)
      .post("/users/login")
      .send({ email: testUser.email, password: testUser.password });
    token = loginRes.body.token;

    await request(app).post("/users/create").send(testUser2);
  });

  test("401 - no token provided", async () => {
    const res = await request(app)
      .patch("/users/profile")
      .send({ name: "new name" });

    expect(res.status).toBe(401);
  });

  test("403 - invalid token", async () => {
    const res = await request(app)
      .patch("/users/profile")
      .set("Authorization", "Bearer notarealtoken")
      .send({ name: "new name" });

    expect(res.status).toBe(403);
  });

  test("400 - empty body", async () => {
    const res = await request(app)
      .patch("/users/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });

  test("200 - updates name", async () => {
    const res = await request(app)
      .patch("/users/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "new name" });

    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe("new name");
    expect(res.body.token).toBeDefined();
  });

  test("200 - updates password with correct current password", async () => {
    const res = await request(app)
      .patch("/users/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: testUser.password,
        newPassword: "NewPoems4fun!",
        confirmNewPassword: "NewPoems4fun!",
      });
    expect(res.status).toBe(200);
  });

  test("400 - email already in use", async () => {
    await request(app).post("/users/create").send(testUser);
    const res = await request(app)
      .patch("/users/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({ email: testUser2.email, confirmEmail: testUser2.confirmEmail });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Email already in use");
  });

  test("404 - wrong current password when updating password", async () => {
    const res = await request(app)
      .patch("/users/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: "WrongPass1!",
        newPassword: "NewPoems4fun!",
        confirmNewPassword: "NewPoems4fun!",
      });

    expect(res.status).toBe(404);
  });

  test("400 - new passwords do not match", async () => {
    const res = await request(app)
      .patch("/users/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: testUser.password,
        newPassword: "NewPoems4fun!",
        confirmNewPassword: "DifferentPoems4fun!",
      });

    expect(res.status).toBe(400);
  });

  test("400 - emails do not match when updating email", async () => {
    const res = await request(app)
      .patch("/users/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({ email: "new@new.com", confirmEmail: "wrong@wrong.com" });

    expect(res.status).toBe(400);
  });
});
