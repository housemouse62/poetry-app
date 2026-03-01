import { describe, it, expect, beforeEach } from "vitest";
import { saveHaiku, deleteHaiku, getAllHaikus } from "./haikuStorage";

describe("haikuStorage", () => {
  beforeEach(() => {
    //Clear localStorage before each test
    localStorage.clear();
  });

  it("should save a haiku to localStorage", () => {
    const haiku = {
      line1: "An old silent pond",
      line2: "A frog jumps into the pond",
      line3: "Splash silence again",
    };

    const haiku2 = {
      line1: "And Do you Haiku",
      line2: "I do I do I Haiku",
      line3: "And Do you Haiku",
    };

    saveHaiku(haiku);
    saveHaiku(haiku2);

    const saved = getAllHaikus();
    expect(saved).toHaveLength(2);
    expect(saved[0].line1).toBe("An old silent pond");
    expect(saved[1].line2).toBe("I do I do I Haiku");
  });

  it("should delete a haiku from localStorage", () => {
    const haiku = {
      line1: "An old silent pond",
      line2: "A frog jumps into the pond",
      line3: "Splash silence again",
    };

    const haiku2 = {
      line1: "And Do you Haiku",
      line2: "I do I do I Haiku",
      line3: "And Do you Haiku",
    };

    saveHaiku(haiku);
    saveHaiku(haiku2);

    let saved = getAllHaikus();
    expect(saved).toHaveLength(2);

    const idToDelete = saved[0].id; // Get the ID of the first haiku

    deleteHaiku(idToDelete);

    saved = getAllHaikus(); // Get fresh data after deletion
    expect(saved).toHaveLength(1);
    expect(saved[0].line1).toBe("And Do you Haiku"); // The second Haiku should remain
  });
});
