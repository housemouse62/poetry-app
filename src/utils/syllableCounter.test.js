import { describe, it, expect } from "vitest";
import { countSyllables } from "./syllableCounter";

describe("countSyllables", () => {
  // Edge cases
  it("returns 0 for empty string", () => expect(countSyllables("")).toBe(0));
  it("returns 0 for whitespace-only string", () => expect(countSyllables("   ")).toBe(0));

  // Basic counting
  it("counts single-syllable word", () => expect(countSyllables("cat")).toBe(1));
  it("counts two-syllable word", () => expect(countSyllables("hello")).toBe(2));
  it("counts three-syllable word", () => expect(countSyllables("beautiful")).toBe(3));

  // Silent-e branch
  it("subtracts for trailing silent e", () => expect(countSyllables("make")).toBe(1));
  it("subtracts for trailing silent e on longer word", () => expect(countSyllables("late")).toBe(1));

  // -le branch
  it("adds syllable for consonant + le", () => expect(countSyllables("little")).toBe(2));
  it("adds syllable for simple", () => expect(countSyllables("simple")).toBe(2));

  // -some branch
  it("subtracts syllable for -some ending (handsome)", () => expect(countSyllables("handsome")).toBe(2));
  it("subtracts syllable for -some ending with silent-e root (awesome)", () => expect(countSyllables("awesome")).toBe(2));
  it("subtracts syllable for -some ending with silent-e root (tiresome)", () => expect(countSyllables("tiresome")).toBe(2));

  // -ing branches
  it("handles -ing word (running)", () => expect(countSyllables("running")).toBe(2));
  it("handles -ing word (singing)", () => expect(countSyllables("singing")).toBe(2));
  it("handles -ing word with silent e in root (dancing)", () => expect(countSyllables("dancing")).toBe(2));
  it("handles short -ing word that is exactly 3 chars (ing itself)", () => expect(countSyllables("ing")).toBe(1));
  // Line 26: -ing root ends in silent e (shoe + ing)
  it("handles -ing word where root ends in silent e (shoeing)", () => expect(countSyllables("shoeing")).toBe(1));

  // -ed branches
  it("handles -ed word with generic silent ending (walked)", () => expect(countSyllables("walked")).toBe(1));
  it("handles -ed with l root ending (called)", () => expect(countSyllables("called")).toBe(1));
  it("handles -ed with r root ending (answered)", () => expect(countSyllables("answered")).toBe(2));
  it("handles -ed with t root ending adds syllable (wanted)", () => expect(countSyllables("wanted")).toBe(2));
  it("handles -ed with d root ending adds syllable (added)", () => expect(countSyllables("added")).toBe(2));
  // Line 47: -ed root ends in e with >1 syllable
  it("handles -ed where root ends in e (agreed)", () => expect(countSyllables("agreed")).toBe(1));

  // Line 74: no vowel groups at all — syllables floor to 1
  it("returns 1 for word with no vowels (nth)", () => expect(countSyllables("nth")).toBe(1));

  // Multi-word input
  it("counts syllables across multiple words", () => expect(countSyllables("hello world")).toBe(3));

  // Haiku-relevant words
  it("counts 'ancient' correctly (2)", () => expect(countSyllables("ancient")).toBe(2));
  it("counts 'river' correctly (2)", () => expect(countSyllables("river")).toBe(2));
  it("counts 'mountain' correctly (2)", () => expect(countSyllables("mountain")).toBe(2));
  it("counts 'silence' correctly (2)", () => expect(countSyllables("silence")).toBe(2));
  it("counts 'blossom' correctly (2)", () => expect(countSyllables("blossom")).toBe(2));
  it("counts a 5-syllable haiku line (ancient silent pond)", () => expect(countSyllables("ancient silent pond")).toBe(5));

  // Diphthong / multi-syllable checks
  it("counts 'coin' as 1 syllable", () => expect(countSyllables("coin")).toBe(1));
  // Known limitation: 'coincidence' has 4 syllables, but 'oi' is treated as a
  // diphthong (like 'coin'), collapsing 'co-in' into 1 group. The regex approach
  // can't distinguish 'coin' (true diphthong) from the 'co-in' syllable boundary
  // in 'coincidence'. The WordFind API returns the correct count (4).
  it("coincidence returns 3 due to 'oi' diphthong detection (known limitation)", () => expect(countSyllables("coincidence")).toBe(3));
});
