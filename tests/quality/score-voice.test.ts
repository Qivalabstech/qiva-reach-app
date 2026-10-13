// Quality test set: for each user in quality/users/*.json, build a voice from their posts, write 3 drafts
// and report length, banned phrases, signature phrases, time and cost. Humans fill in the voice-match rating.
// Run: npm run quality   (uses the real model; costs a few cents per user). Skipped otherwise.
import Anthropic from "@anthropic-ai/sdk";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { describe, it } from "vitest";
import { VOICE_ANALYSIS_SYSTEM, voiceAnalysisUser } from "../../src/ai/prompts/voice-analysis.v1";
import { findBanned } from "../../src/lib/banned";
import { countWords, generateDraft } from "../../src/lib/post-writer";
import { DEFAULT_BANNED_PHRASES, averageLength, emojiUse, parseAnalysis } from "../../src/lib/voice-profile";

const PRICE = { in: 2, out: 10 }; // USD per million tokens, Sonnet 5.5

type TestUser = { name: string; posts: string[]; notes: string[] };

describe.skipIf(!process.env.QUALITY)("voice quality test set", () => {
  it("writes the score report", async () => {
    const client = new Anthropic();
    const users: TestUser[] = readdirSync("quality/users")
      .filter((f) => f.endsWith(".json"))
      .map((f) => JSON.parse(readFileSync(`quality/users/${f}`, "utf8")));

    const lines = [
      `# Voice quality report, ${new Date().toISOString().slice(0, 10)}`, "",
      "Rating scale for people: 1 not me, 2 mostly not me, 3 somewhat me, 4 mostly me, 5 sounds exactly like me.", "",
      "| User | Draft | Words | Profile avg words | Banned found | Signature phrases used | Seconds | Cost USD | Human rating (1-5) |",
      "|---|---|---|---|---|---|---|---|---|",
    ];
    for (const u of users) {
      const a = await client.messages.create({
        model: process.env.ANTHROPIC_MODEL_FAST!, max_tokens: 400, system: VOICE_ANALYSIS_SYSTEM,
        messages: [{ role: "user", content: voiceAnalysisUser(u.posts) }],
      });
      const analysis = parseAnalysis(a.content.map((b) => (b.type === "text" ? b.text : "")).join(""));
      const voice = {
        tone: analysis?.tone ?? "", emoji_use: emojiUse(u.posts), signature_phrases: analysis?.signature ?? [],
        banned_phrases: DEFAULT_BANNED_PHRASES, avg_length: averageLength(u.posts),
      };
      for (const [i, notes] of u.notes.slice(0, 3).entries()) {
        let tokens = { in: 0, out: 0 };
        const t0 = Date.now();
        const r = await generateDraft({
          notes, preset: null, voice, examples: u.posts.slice(0, 3),
          ask: async (system, user) => {
            const m = await client.messages.create({
              model: process.env.ANTHROPIC_MODEL_WRITER!, max_tokens: 700, system, messages: [{ role: "user", content: user }],
            });
            tokens = { in: tokens.in + m.usage.input_tokens, out: tokens.out + m.usage.output_tokens };
            return m.content.map((b) => (b.type === "text" ? b.text : "")).join("");
          },
        });
        const seconds = ((Date.now() - t0) / 1000).toFixed(1);
        const cost = ((tokens.in * PRICE.in + tokens.out * PRICE.out) / 1e6).toFixed(4);
        if ("error" in r) { lines.push(`| ${u.name} | ${i + 1} | FAILED | ${voice.avg_length} | - | - | ${seconds} | ${cost} | |`); continue; }
        const used = voice.signature_phrases.filter((p) => r.text.toLowerCase().includes(p.toLowerCase())).length;
        lines.push(`| ${u.name} | ${i + 1} | ${countWords(r.text)} | ${voice.avg_length} | ${findBanned(r.text, voice.banned_phrases).length} | ${used} of ${voice.signature_phrases.length} | ${seconds} | ${cost} | |`);
        lines.push(`|  |  | <details><summary>draft</summary>${r.text.replace(/\n/g, "<br>")}</details> | | | | | | |`);
      }
    }
    mkdirSync("docs/quality", { recursive: true });
    writeFileSync(`docs/quality/report-${new Date().toISOString().slice(0, 10)}.md`, lines.join("\n") + "\n");
  }, 600_000);
});
