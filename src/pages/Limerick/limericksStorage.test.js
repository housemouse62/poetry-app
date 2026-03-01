import { describe, it, expect, beforeEach } from "vitest";
import {
  saveLimerick,
  deleteLimerick,
  getAllLimericks,
} from "./limericksStorage";

describe("limerickStorage", () => {
  beforeEach(() => {
    //Clear localStorage before each test
    localStorage.clear();
  });

  it("should save a limerick to localStorage", () => {
    const limerick = {
      line1: "An old silent pond",
      line2: "A frog jumps into the pond",
      line3: "Splash silence again",
    };

    const limerick2 = {
      line1: "And Do you Limerick",
      line2: "I do I do I Limerick",
      line3: "And Do you Limerick",
    };

    saveLimerick(limerick);
    saveLimerick(limerick2);

    const saved = getAllLimericks();
    expect(saved).toHaveLength(2);
    expect(saved[0].line1).toBe("An old silent pond");
    expect(saved[1].line2).toBe("I do I do I Limerick");
  });

  it("should delete a limerick from localStorage", () => {
    const limerick = {
      line1: "An old silent pond",
      line2: "A frog jumps into the pond",
      line3: "Splash silence again",
    };

    const limerick2 = {
      line1: "And Do you Limerick",
      line2: "I do I do I Limerick",
      line3: "And Do you Limerick",
    };

    saveLimerick(limerick);
    saveLimerick(limerick2);

    let saved = getAllLimericks();
    expect(saved).toHaveLength(2);

    const idToDelete = saved[0].id; // Get the ID of the first limerick

    deleteLimerick(idToDelete);

    saved = getAllLimericks(); // Get fresh data after deletion
    expect(saved).toHaveLength(1);
    expect(saved[0].line1).toBe("And Do you Limerick"); // The second Limerick should remain
  });
});
