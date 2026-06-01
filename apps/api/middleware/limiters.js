import rateLimit from "express-rate-limit";

const skipInTest = () => process.env.NODE_ENV === "test";

export const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, skip: skipInTest });
export const createLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, skip: skipInTest });
