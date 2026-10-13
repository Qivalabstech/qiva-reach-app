// Writes docs/quality/c1-relevance-sheet.md: 20 real ideas for each of 3 niches, for a person to mark relevant or not.
// Run: IDEAS_SHEET=1 npx vitest run tests/quality/ideas-sheet.test.ts   (real model, a fraction of a cent). Skipped otherwise.
import Anthropic from "@anthropic-ai/sdk";
import { mkdirSync, writeFileSync } from "node:fs";
import { describe, it } from "vitest";
import { generateIdeas } from "../../src/lib/ideas";
import { DEFAULT_BANNED_PHRASES } from "../../src/lib/voice-profile";

const CASES = [
  { niche: "SaaS founder", goal: "grow_audience", label: "SaaS founder, grow my audience" },
  { niche: "Marketing", goal: "get_leads", label: "Marketing, get leads and clients" },
  { niche: "Recruiting and HR", goal: "build_authority", label: "Recruiting and HR, build authority" },
];

describe.skipIf(!process.env.IDEAS_SHEET)("c1 relevance sheet", () => {
  it("writes the sheet", async () => {
    const client = new Anthropic();
    const ask = async (system: string, user: string) => {
      const r = await client.messages.create({
        model: process.env.ANTHROPIC_MODEL_FAST!, max_tokens: 2500, thinking: { type: "disabled" }, system,
        messages: [{ role: "user", content: user }],
      });
      return r.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    };
    const out = [
      "# Idea generator: relevance rating", "",
      "**Who:** Arman Hussain. **Time:** about 15 minutes.", "",
      "For each idea, write **yes** if it is relevant to that niche and goal and a real person in that niche could post it, or **no** if not.",
      "Pass mark: at least 16 of 20 (80%) rated yes in each of the 3 niches.", "",
    ];
    for (const c of CASES) {
      const r = await generateIdeas({ goal: c.goal, niche: c.niche, focus: "", recentLines: [], seen: [], banned: DEFAULT_BANNED_PHRASES, ask });
      if ("error" in r) throw new Error(r.error);
      out.push(`## ${c.label}`, "", "| # | Idea | Relevant? (yes/no) |", "|---|---|---|");
      r.ideas.forEach((idea, i) => out.push(`| ${i + 1} | ${idea} | |`));
      out.push("", "Yes count: ___ of 20", "");
    }
    mkdirSync("docs/quality", { recursive: true });
    writeFileSync("docs/quality/c1-relevance-sheet.md", out.join("\n"));
  }, 120_000);
});
