// Run on demand to record real model outputs: GEN_FIXTURES=1 npx vitest run tests/gen-preset-fixtures.test.ts
// Writes tests/fixtures/preset-samples.json (used by preset-samples.test.ts). Skipped otherwise.
import Anthropic from "@anthropic-ai/sdk";
import { writeFileSync } from "node:fs";
import { describe, it } from "vitest";
import { generateSample } from "../src/lib/preset-sample";
import { PRESETS } from "../src/lib/presets";
import { DEFAULT_BANNED_PHRASES } from "../src/lib/voice-profile";

const TOPICS = [
  { topic: "Why I stopped taking sales calls without an agenda", facts: "We tested it for 6 weeks. Win rate went from 18% to 27%." },
  { topic: "Hiring your first support person", facts: "We hired in March. Response time dropped from 9 hours to 2 hours." },
];

describe.skipIf(!process.env.GEN_FIXTURES)("record preset samples", () => {
  it("writes fixtures", async () => {
    const client = new Anthropic();
    const ask = async (system: string, user: string) => {
      const r = await client.messages.create({
        model: process.env.ANTHROPIC_MODEL_FAST!, max_tokens: 400, system, messages: [{ role: "user", content: user }],
      });
      return r.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    };
    const voice = { tone: "direct, warm, short sentences", emoji_use: "none", signature_phrases: ["Here's the thing"], banned_phrases: DEFAULT_BANNED_PHRASES };
    const out = [];
    for (const t of TOPICS)
      for (const p of PRESETS) out.push({ ...t, ...(await generateSample({ preset: p.value, ...t, voice, ask })) });
    const failed = out.filter((o) => !o.text);
    if (failed.length) throw new Error(`Samples failed: ${failed.map((f) => f.preset).join(", ")}. Run again.`);
    writeFileSync("tests/fixtures/preset-samples.json", JSON.stringify(out, null, 2));
  }, 120_000);
});
