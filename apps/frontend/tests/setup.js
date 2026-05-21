import { expect, afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

// Create a real implementation of localStorage for tests
const localStorageMock = (() => {
  let store = {};

  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

// mock html2canvas
vi.mock("html2canvas", () => ({
  default: vi.fn(() =>
    Promise.resolve({
      toBlob: vi.fn((callback) => callback(new Blob())),
    }),
  ),
}));

globalThis.localStorage = localStorageMock;

globalThis.fetch = vi.fn();

beforeEach(() => {
  localStorage.clear();
  globalThis.fetch.mockClear();
});

afterEach(() => {
  cleanup();
});
