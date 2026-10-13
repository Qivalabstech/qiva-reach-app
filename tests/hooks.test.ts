import { describe, expect, it } from "vitest";
import { applyRules, parseHookReply, scoreCurrent, splitFirstLine, swapFirstLine } from "../src/lib/hooks";

describe("splitFirstLine and swapFirstLine", () => {
  const bodies = [
    "First line\n\nSecond paragraph.\nThird line.",
    "Only one line",
    "First line\nNo blank line after.",
    "\n\nStarts with blank lines\nthen text",
    "Hook with trailing spaces   \n\nBody  with  double  spaces\n",
  ];
  it("splits the first line from the rest", () => {
    expect(splitFirstLine(bodies[0])).toEqual({ prefix: "", hook: "First line", rest: "\n\nSecond paragraph.\nThird line." });
    expect(splitFirstLine(bodies[1])).toEqual({ prefix: "", hook: "Only one line", rest: "" });
    expect(splitFirstLine(bodies[3])).toMatchObject({ prefix: "\n\n", hook: "Starts with blank lines" });
  });
  it("changes only the first line and keeps every other character", () => {
    for (const b of bodies) {
      const next = swapFirstLine(b, "NEW HOOK");
      const { prefix, rest } = splitFirstLine(b);
      expect(next).toBe(`${prefix}NEW HOOK${rest}`);
      expect(next.endsWith(rest)).toBe(true);
    }
  });
  it("swap and swap back restores the exact original", () => {
    for (const b of bodies) {
      const original = splitFirstLine(b).hook;
      expect(swapFirstLine(swapFirstLine(b, "Something else"), original)).toBe(b);
    }
  });
});

const ctx = { post: "We cut onboarding from 9 days to 3 days.", banned: ["game-changer"], currentLine: "Our onboarding story" };
const h = (text: string, score = 7, type = "question") => ({ text, score, type, reason: "r" });

describe("applyRules", () => {
  it("drops hooks over 120 characters, with a newline, empty, or equal to the current line", () => {
    const out = applyRules([h("x".repeat(121)), h("two\nlines"), h("  "), h("Our onboarding story!"), h("Good one")], ctx);
    expect(out.map((o) => o.text)).toEqual(["Good one"]);
  });
  it("accepts exactly 120 characters but caps hooks over 100 at score 6", () => {
    const out = applyRules([h("y".repeat(120), 9), h("z".repeat(101), 9), h("short", 9)], ctx);
    expect(out.map((o) => [o.text.length, o.score])).toEqual([[5, 9], [120, 6], [101, 6]].sort((a, b) => b[1] - a[1]));
  });
  it("caps generic openers at 4", () => {
    const out = applyRules([h("I'm excited to share our new process", 9), h("Let's talk about onboarding", 8), h("Today I want to share", 9)], ctx);
    expect(out.every((o) => o.score <= 4)).toBe(true);
  });
  it("drops banned phrases", () => {
    expect(applyRules([h("A real Game-Changer for onboarding")], ctx)).toEqual([]);
  });
  it("drops numbers that are not in the post but keeps supplied ones", () => {
    const out = applyRules([h("We cut it from 9 days to 3"), h("We cut it by 70%"), h("We saved 5 days")], ctx);
    expect(out.map((o) => o.text)).toEqual(["We cut it from 9 days to 3"]);
  });
  it("removes duplicates, rounds and clamps scores to whole numbers 1-10", () => {
    const out = applyRules([h("Alpha", 7.6), h("alpha!", 9), h("Beta", 42), h("Gamma", -3), h("Delta", 0), h("Eps", "x" as unknown as number)], ctx);
    expect(out.map((o) => o.score)).toEqual([10, 8, 1, 1, 1]);
    expect(out.map((o) => o.text)).toEqual(["Beta", "Alpha", "Gamma", "Delta", "Eps"]);
  });
  it("sorts best first and keeps the model's order for ties", () => {
    const out = applyRules([h("alpha", 5), h("bravo", 8), h("charlie", 5), h("delta", 8)], ctx);
    expect(out.map((o) => o.text)).toEqual(["bravo", "delta", "alpha", "charlie"]);
  });
  it("ignores an unknown type and non-array input", () => {
    expect(applyRules([h("Fine", 5, "weird")], ctx)[0].type).toBeUndefined();
    expect(applyRules("nope", ctx)).toEqual([]);
  });
});

describe("scoreCurrent and parseHookReply", () => {
  it("scores the current line with the same caps", () => {
    expect(scoreCurrent("I'm excited to share", { score: 9, reason: "x" })).toEqual({ score: 4, reason: "x" });
    expect(scoreCurrent("Plain line", { score: 7 })).toEqual({ score: 7, reason: "" });
    expect(scoreCurrent("Plain line", null)).toBeNull();
  });
  it("reads JSON from text or a code fence and rejects junk", () => {
    expect(parseHookReply('```json\n{"current":{"score":5},"hooks":[]}\n```')).toEqual({ current: { score: 5 }, hooks: [] });
    expect(parseHookReply("no json")).toBeNull();
    expect(parseHookReply('{"hooks": [')).toBeNull();
  });
});
