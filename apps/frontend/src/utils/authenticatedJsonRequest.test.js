import { describe, expect, it } from "vitest";
import { authenticatedJsonRequest } from "./authenticatedJsonRequest";

describe("authenticatedJsonRequest", () => {
  it("injects auth and JSON headers while preserving request options", async () => {
    const controller = new AbortController();
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 7 }),
    });

    await expect(
      authenticatedJsonRequest("/resource", "token-value", {
        method: "POST",
        body: JSON.stringify({ value: "test" }),
        signal: controller.signal,
      }),
    ).resolves.toEqual({ id: 7 });

    expect(fetch).toHaveBeenCalledWith("/resource", {
      method: "POST",
      body: JSON.stringify({ value: "test" }),
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token-value",
      },
    });
  });

  it("preserves caller-supplied header overrides", async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    await authenticatedJsonRequest("/resource", "token-value", {
      headers: { "Content-Type": "application/merge-patch+json" },
    });

    expect(fetch).toHaveBeenCalledWith(
      "/resource",
      expect.objectContaining({
        headers: {
          "Content-Type": "application/merge-patch+json",
          Authorization: "Bearer token-value",
        },
      }),
    );
  });

  it("uses the server error message for a non-success response", async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Server message" }),
    });

    await expect(
      authenticatedJsonRequest("/resource", "token-value"),
    ).rejects.toThrow("Server message");
  });

  it("uses the existing fallback when the server omits an error message", async () => {
    fetch.mockResolvedValueOnce({ ok: false, json: async () => ({}) });

    await expect(
      authenticatedJsonRequest("/resource", "token-value"),
    ).rejects.toThrow("Request failed");
  });
});
