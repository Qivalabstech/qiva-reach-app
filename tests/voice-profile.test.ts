import { describe, expect, it } from "vitest";
import {
  BANNED_MAX, DEFAULT_BANNED_PHRASES, averageLength, cleanPhrases, emojiUse, parseAnalysis, validateVoice,
} from "../src/lib/voice-profile";

const words = (n: number) => Array(n).fill("word").join(" ");

describe("averageLength", () => {
  it("rounds the mean to the nearest 10 words", () => {
    expect(averageLength([words(100), words(120)])).toBe(110);
    expect(averageLength([words(104)])).toBe(100);
  });
  it("stays inside 20 to 400", () => {
    expect(averageLength([words(3)])).toBe(20);
    expect(averageLength([words(900)])).toBe(400);
  });
});

describe("emojiUse", () => {
  it("none when 80% of posts have no emoji", () => {
    expect(emojiUse(["a", "b", "c", "d", "e 🚀"])).toBe("none");
  });
  it("light for one emoji here and there", () => {
    expect(emojiUse(["a 🚀", "b 🔥", "c", "d"])).toBe("light");
  });
  it("frequent when 40%+ of posts have 3 or more emoji", () => {
    expect(emojiUse(["a 🚀🔥✨", "b 🚀🔥✨", "c", "d 🚀"])).toBe("frequent");
  });
});

describe("cleanPhrases", () => {
  it("trims, ignores empties and case-insensitive duplicates", () => {
    expect(cleanPhrases(["  Hello ", "hello", "", "World", 4], 10)).toEqual(["Hello", "World"]);
  });
  it("applies the list limit", () => {
    expect(cleanPhrases(Array.from({ length: 40 }, (_, i) => `p${i}`), BANNED_MAX)).toHaveLength(30);
  });
  it("loads the default banned list without duplicates", () => {
    expect(cleanPhrases(DEFAULT_BANNED_PHRASES, BANNED_MAX)).toHaveLength(DEFAULT_BANNED_PHRASES.length);
  });
});

describe("validateVoice", () => {
  const ok = { tone: " warm ", avg_length: 120, emoji_use: "light", signature_phrases: ["x"], banned_phrases: [] };
  it("accepts a good profile and trims", () => {
    expect(validateVoice(ok)).toMatchObject({ ok: true, value: { tone: "warm", avg_length: 120 } });
  });
  it("rejects bad length, emoji value and long tone", () => {
    expect(validateVoice({ ...ok, avg_length: 5 }).ok).toBe(false);
    expect(validateVoice({ ...ok, avg_length: 12.5 }).ok).toBe(false);
    expect(validateVoice({ ...ok, emoji_use: "tons" }).ok).toBe(false);
    expect(validateVoice({ ...ok, tone: "x".repeat(201) }).ok).toBe(false);
  });
});

describe("parseAnalysis (stored model replies)", () => {
  it("reads a clean reply", () => {
    const r = parseAnalysis('{"tone":"direct, warm","signature_phrases":["Here is the thing","Here is the thing"]}');
    expect(r).toEqual({ tone: "direct, warm", signature: ["Here is the thing"] });
  });
  it("reads a reply wrapped in text or a code fence", () => {
    expect(parseAnalysis('```json\n{"tone":"calm","signature_phrases":[]}\n```')?.tone).toBe("calm");
  });
  it("returns null for empty, malformed or tone-less replies", () => {
    expect(parseAnalysis("")).toBeNull();
    expect(parseAnalysis("I cannot do that")).toBeNull();
    expect(parseAnalysis('{"tone":"","signature_phrases":[]}')).toBeNull();
    expect(parseAnalysis('{"tone": "unterminated')).toBeNull();
  });
});
