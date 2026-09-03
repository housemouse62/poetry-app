import express from "express";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import userRouter from "../src/user.js";
import wordRouter from "../src/word.js";
import { fetchWordFromAPI } from "../src/utils/wordsAPI.js";
import { prisma } from "../db/prismaClient.js";
import { cleanup, TEST_USER } from "./helpers.js";

vi.mock("../src/utils/wordsAPI.js", () => ({ fetchWordFromAPI: vi.fn() }));

const app = express();
app.use(express.json());
app.use("/users", userRouter);
app.use("/word", wordRouter);

let token;
const apiData = (word = "hello", count = 2) => ({
  word,
  syllables: { count, list: ["hel", "lo"] },
  pronunciation: { all: "hɛ'loʊ" },
});
const auth = () => ({ Authorization: `Bearer ${token}` });
const oldDate = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

beforeAll(async () => {
  await cleanup();
  await request(app).post("/users/create").send(TEST_USER);
  const login = await request(app)
    .post("/users/login")
    .send({ email: TEST_USER.email, password: TEST_USER.password });
  token = login.body.token;
});

beforeEach(async () => {
  await prisma.word.deleteMany({ where: { word: { startsWith: "cachetest" } } });
  fetchWordFromAPI.mockReset();
});

afterAll(async () => {
  await prisma.word.deleteMany({ where: { word: { startsWith: "cachetest" } } });
  await cleanup();
});

describe("word cache lifecycle", () => {
  test("fresh API cache hit avoids WordsAPI and returns the normalized contract", async () => {
    await prisma.word.create({
      data: {
        word: "cachetestfresh",
        source: "api",
        flagged: false,
        syllableCount: 2,
        data: apiData("cachetestfresh"),
      },
    });
    const res = await request(app)
      .post("/word")
      .set(auth())
      .send({ word: "cachetestfresh" });

    expect(res.status).toBe(200);
    expect(fetchWordFromAPI).not.toHaveBeenCalled();
    expect(res.body).toMatchObject({
      word: "cachetestfresh",
      source: "api",
      flagged: false,
      syllables: { count: 2, list: ["hel", "lo"] },
      pronunciation: { all: "hɛ'loʊ" },
      data: apiData("cachetestfresh"),
    });
  });

  test("expired API row refreshes in place while preserving id and flagged", async () => {
    const original = await prisma.word.create({
      data: {
        word: "cachetestrefresh",
        source: "api",
        flagged: true,
        syllableCount: 2,
        data: apiData("cachetestrefresh"),
        refreshedAt: oldDate(31),
      },
    });
    fetchWordFromAPI.mockResolvedValue({ ok: true, data: apiData("cachetestrefresh", 3) });
    const res = await request(app).post("/word").set(auth()).send({ word: "cachetestrefresh" });
    const stored = await prisma.word.findUnique({ where: { word: "cachetestrefresh" } });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ source: "api", flagged: true, syllables: { count: 3 } });
    expect(stored.id).toBe(original.id);
    expect(stored.flagged).toBe(true);
    expect(stored.refreshedAt.getTime()).toBeGreaterThan(original.refreshedAt.getTime());
  });

  test("expired authoritative row serves stale data on transient failure", async () => {
    await prisma.word.create({
      data: { word: "cacheteststale", source: "api", syllableCount: 2, data: apiData(), refreshedAt: oldDate(31) },
    });
    fetchWordFromAPI.mockResolvedValue({ ok: false, kind: "http", status: 503 });
    const res = await request(app).post("/word").set(auth()).send({ word: "cacheteststale" });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ source: "api", syllables: { count: 2 } });
  });

  test("new transient failure returns an unpersisted estimate", async () => {
    fetchWordFromAPI.mockResolvedValue({ ok: false, kind: "network" });
    const res = await request(app).post("/word").set(auth()).send({ word: "cachetestfailure" });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ word: "cachetestfailure", source: "fallback", syllables: { count: expect.any(Number) } });
    expect(await prisma.word.findUnique({ where: { word: "cachetestfailure" } })).toBeNull();
  });

  test("successful response without syllables creates an algorithm row", async () => {
    fetchWordFromAPI.mockResolvedValue({ ok: true, data: { word: "cachetestmissing" } });
    const res = await request(app).post("/word").set(auth()).send({ word: "cachetestmissing" });
    expect(res.status).toBe(201);
    expect(res.body.source).toBe("algorithm");
    expect(await prisma.word.findUnique({ where: { word: "cachetestmissing" } })).not.toBeNull();
  });

  test("fresh algorithm row avoids upstream while an expired row can become API-sourced", async () => {
    await prisma.word.create({ data: { word: "cachetestalgorithmfresh", source: "algorithm", syllableCount: 4, data: {} } });
    await request(app).post("/word").set(auth()).send({ word: "cachetestalgorithmfresh" });
    expect(fetchWordFromAPI).not.toHaveBeenCalled();

    await prisma.word.create({ data: { word: "cachetestalgorithmold", source: "algorithm", syllableCount: 4, data: {}, refreshedAt: oldDate(2) } });
    fetchWordFromAPI.mockResolvedValueOnce({ ok: true, data: apiData("cachetestalgorithmold", 3) });
    const refreshed = await request(app).post("/word").set(auth()).send({ word: "cachetestalgorithmold" });
    expect(refreshed.body).toMatchObject({ source: "api", syllables: { count: 3 } });
  });

  test.each([
    [{ ok: false, kind: "http", status: 429 }],
    [{ ok: false, kind: "configuration" }],
    [{ ok: true, data: { syllables: { count: 0 } } }],
    [{ ok: true, data: { syllables: { count: "two" } } }],
  ])("does not treat invalid or failed upstream data as authoritative", async (upstream) => {
    fetchWordFromAPI.mockResolvedValue(upstream);
    const res = await request(app).post("/word").set(auth()).send({ word: `cachetestinvalid${Math.random()}` });
    expect(res.body.source).not.toBe("api");
  });

  test("trim and lowercase variants use one database row", async () => {
    fetchWordFromAPI.mockResolvedValue({ ok: true, data: apiData("cachetestcase") });
    await request(app).post("/word").set(auth()).send({ word: "  CacheTestCase " });
    await request(app).post("/word").set(auth()).send({ word: "cachetestcase" });
    expect(fetchWordFromAPI).toHaveBeenCalledTimes(1);
    expect(await prisma.word.count({ where: { word: "cachetestcase" } })).toBe(1);
  });

  test("a concurrent-create unique race re-reads the winning row", async () => {
    fetchWordFromAPI.mockResolvedValue({ ok: true, data: apiData("cachetestrace") });
    const originalCreate = prisma.word.create.bind(prisma.word);
    const createSpy = vi.spyOn(prisma.word, "create").mockImplementationOnce(async (args) => {
      await originalCreate(args);
      throw { code: "P2002" };
    });
    const res = await request(app).post("/word").set(auth()).send({ word: "cachetestrace" });
    createSpy.mockRestore();
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ word: "cachetestrace", source: "api" });
  });
});

describe("word routes", () => {
  test.each([undefined, "", "   "])("rejects an empty canonical word: %s", async (word) => {
    const res = await request(app).post("/word").set(auth()).send(
      word === undefined ? {} : { word },
    );
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Word is required" });
    expect(await prisma.word.findUnique({ where: { word: "" } })).toBeNull();
    expect(fetchWordFromAPI).not.toHaveBeenCalled();
  });

  test("lazily adopts a legacy case and whitespace row without losing its state", async () => {
    const legacy = await prisma.word.create({
      data: {
        word: "  CacheTestLegacy  ",
        source: "api",
        flagged: true,
        syllableCount: 3,
        data: apiData("cachetestlegacy", 3),
      },
    });
    const res = await request(app)
      .post("/word")
      .set(auth())
      .send({ word: "cachetestlegacy" });
    const adopted = await prisma.word.findUnique({
      where: { word: "cachetestlegacy" },
    });

    expect(res.status).toBe(200);
    expect(fetchWordFromAPI).not.toHaveBeenCalled();
    expect(adopted).toMatchObject({ id: legacy.id, flagged: true });
    expect(
      await prisma.word.findUnique({ where: { word: "  CacheTestLegacy  " } }),
    ).toBeNull();
  });

  test("flagging finds and canonicalizes a legacy row", async () => {
    const legacy = await prisma.word.create({
      data: {
        word: "CacheTestFlagLegacy",
        source: "api",
        syllableCount: 3,
        data: apiData(),
      },
    });
    const res = await request(app)
      .patch("/word/cachetestflaglegacy/flag")
      .set(auth());
    expect(res.status).toBe(200);
    expect(res.body.flagged).toBe(true);
    expect(
      await prisma.word.findUnique({ where: { word: "cachetestflaglegacy" } }),
    ).toMatchObject({ id: legacy.id, flagged: true });
  });

  test("GET canonicalizes lookup and PATCH canonicalizes flagging", async () => {
    await prisma.word.create({ data: { word: "cachetestflag", source: "api", syllableCount: 2, data: apiData() } });
    const get = await request(app).get("/word/CACHETESTFLAG").set(auth());
    const patch = await request(app).patch("/word/CACHETESTFLAG/flag").set(auth());
    expect(get.status).toBe(200);
    expect(patch.body.flagged).toBe(true);
  });

  test("requires authentication and returns 404 for a missing GET", async () => {
    expect((await request(app).post("/word").send({ word: "cachetestauth" })).status).toBe(401);
    expect((await request(app).get("/word/cachetestabsent").set(auth())).status).toBe(404);
  });
});
