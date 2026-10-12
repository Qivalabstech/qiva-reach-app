import { describe, expect, it } from "vitest";
import fixtures from "./fixtures/preset-samples.json";
import { findBanned, inventedNumbers } from "../src/lib/banned";
import { generateSample, SAMPLE_ERROR } from "../src/lib/preset-sample";
import { DEFAULT_BANNED_PHRASES } from "../src/lib/voice-profile";

type Sample = { preset: string; topic: string; facts: string; text: string };
const samples = fixtures as Sample[];
const topics = [...new Set(samples.map((s) => s.topic))];
const words = (t: string) => new Set(t.toLowerCase().match(/[a-z']+/g) ?? []);
const overlap = (a: string, b: string) => {
  const [x, y] = [words(a), words(b)];
  return [...x].filter((w) => y.has(w)).length / Math.min(x.size, y.size);
};
const firstLine = (t: string) => t.split("\n")[0];

describe.each(topics)("recorded real samples: %s", (topic) => {
  const set = samples.filter((s) => s.topic === topic);
  const by = (p: string) => set.find((s) => s.preset === p)!;

  it("has all five presets", () => expect(set.map((s) => s.preset).sort()).toEqual(
    ["contrarian", "data_driven", "hinglish_friendly", "professional", "story_led"]));

  it("no two presets share more than 70% of their words (they read differently)", () => {
    for (let i = 0; i < set.length; i++)
      for (let j = i + 1; j < set.length; j++) expect(overlap(set[i].text, set[j].text), `${set[i].preset} vs ${set[j].preset}`).toBeLessThan(0.7);
  });

  it("Hinglish uses common Hindi words in Roman script", () => {
    const hindi = ["hai", "hota", "nahi", "kya", "aur", "ko", "ka", "ki", "se", "mein", "tha", "kiya", "maine", "yeh", "toh", "bhi", "par", "ke", "ho"];
    const found = hindi.filter((h) => words(by("hinglish_friendly").text).has(h));
    expect(found.length).toBeGreaterThanOrEqual(3);
    expect(by("hinglish_friendly").text).not.toMatch(/[ऀ-ॿ]/);
  });

  it("Data-driven uses only numbers the user supplied", () => {
    const s = by("data_driven");
    expect(inventedNumbers(s.text, `${s.topic} ${s.facts}`)).toEqual([]);
  });

  it("Story-led opens in the first person, past tense", () => {
    expect(firstLine(by("story_led").text)).toMatch(/\b(I|we|We)\b[^.]*\b(was|were|had|took|hired|tried|stopped|spent|did|got|used|ran|started|answered)\b/i);
  });

  it("Contrarian's first line disagrees with a common belief", () => {
    expect(firstLine(by("contrarian").text).toLowerCase()).toMatch(/disagree|wrong|myth|isn't|not |bad advice|overrated|stop|backwards|don't/);
  });

  it("no sample uses a default banned phrase", () => {
    for (const s of set) expect(findBanned(s.text, DEFAULT_BANNED_PHRASES), s.preset).toEqual([]);
  });
});

describe("generateSample", () => {
  const voice = { tone: "", emoji_use: "none", signature_phrases: [], banned_phrases: ["game-changer", "unlock"] };
  const base = { preset: "professional" as const, topic: "t", facts: "", voice };

  it("regenerates once when a banned phrase appears, then returns the clean draft", async () => {
    const replies = ["This is a Game-Changer.", "A plain, clean draft."];
    const systems: string[] = [];
    const r = await generateSample({ ...base, ask: async (sys) => (systems.push(sys), replies.shift()!) });
    expect(r).toEqual({ preset: "professional", text: "A plain, clean draft." });
    expect(systems[1]).toContain("banned phrases: Game-Changer".replace("Game-Changer", "game-changer"));
  });

  it("fails closed when the banned phrase appears twice", async () => {
    const r = await generateSample({ ...base, ask: async () => "Let's unlock growth." });
    expect(r).toEqual({ preset: "professional", error: SAMPLE_ERROR });
  });

  it("fails when the model call throws", async () => {
    const r = await generateSample({ ...base, ask: async () => { throw new Error("x"); } });
    expect(r.error).toBe(SAMPLE_ERROR);
  });

  it("Data-driven rejects a number the user did not give, but accepts supplied ones", async () => {
    const bad = await generateSample({ ...base, preset: "data_driven", facts: "Win rate rose 18%", ask: async () => "Win rate rose 18% and 40% more calls." });
    expect(bad.error).toBe(SAMPLE_ERROR);
    const good = await generateSample({ ...base, preset: "data_driven", facts: "Win rate rose 18%", ask: async () => "Win rate rose 18%." });
    expect(good.text).toBe("Win rate rose 18%.");
  });

  it("strips quotes around the whole post", async () => {
    expect((await generateSample({ ...base, ask: async () => "“Hello there.”" })).text).toBe("Hello there.");
  });
});
