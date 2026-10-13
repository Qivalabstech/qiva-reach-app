import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "@/lib/supabase/admin";

// USD per million tokens. Source: platform.claude.com/docs/en/about-claude/pricing (13 Oct 2026).
const PRICE: Record<string, { in: number; out: number }> = {
  "claude-haiku-5-5": { in: 0.1, out: 0.5 },
  "claude-sonnet-5-5": { in: 2, out: 10 },
};

export type AskArgs = {
  feature: string;
  model: string;
  system: string;
  user: string;
  maxTokens: number;
  /** Turn off the model's hidden thinking: faster and cheaper for list-style tasks, and it cannot eat the token limit. */
  noThinking?: boolean;
  userId: string;
  workspaceId: string;
};

const STUB_REPLY = '{"tone":"direct, warm, short sentences","signature_phrases":["Here is the thing"]}';

const filler = (n: number) => Array(n).fill("word").join(" ");

// Stub for the post writer. Markers in the notes pick a behaviour; a rewrite is recognised by the correction text.
function stubDraft(a: AskArgs): string {
  const style = a.system.match(/Preset id: (\w+)/)?.[1] ?? "none";
  const rewrite = a.system.includes("Your last draft broke a rule");
  const clean = `Stub draft for ${style}.\n\n${filler(70)}.\n\n${filler(70)}.`;
  if (a.user.includes("AI_STUB_BANNED_ALWAYS")) return `${clean} This is a game-changer.`;
  if (a.user.includes("AI_STUB_BANNED_ONCE") && !rewrite) return `${clean} This is a game-changer.`;
  if (a.user.includes("AI_STUB_SHORT_ONCE") && !rewrite) return `Short stub.\n\n${filler(78)}.`;
  if (a.user.includes("AI_STUB_NUMBERS")) return `${clean} Revenue grew 40% last year.`;
  if (a.user.includes("AI_STUB_FAIL")) throw new Error("stubbed failure");
  return clean;
}

const TYPES = ["question", "bold_claim", "number", "story", "contrarian", "curiosity", "direct_promise", "short_punch"];

// Stub for the hook lab. The top-up call is recognised by "Write 8 different hooks".
function stubHooks(a: AskArgs): string {
  if (a.user.includes("AI_STUB_FAIL")) throw new Error("stubbed failure");
  const topUp = a.system.includes("Write 8 different hooks");
  const bad = a.user.includes("AI_STUB_BADHOOKS") && !topUp;
  const n = topUp ? 8 : 12;
  const letters = (k: number) => [...String(k)].map((d) => "abcdefghij"[+d]).join(""); // digits would count as invented numbers
  const hooks = Array.from({ length: n }, (_, i) => ({
    text: bad && i < 3 ? `Stub hook that is far too long ${"x".repeat(120)}` : `Stub hook ${topUp ? "extra " : ""}${letters(i + 1)}`,
    type: TYPES[i % TYPES.length],
    score: topUp ? 5 : 3 + ((i * 5) % 7),
    reason: `Reason ${i + 1}`,
  }));
  return JSON.stringify({ current: { score: 5, reason: "Fine but plain" }, hooks });
}

function stubReply(a: AskArgs): string {
  if (a.feature === "post_write") return stubDraft(a);
  if (a.feature === "hook_lab") return stubHooks(a);
  if (a.feature !== "preset_preview") {
    if (a.user.includes("AI_STUB_FAIL")) throw new Error("stubbed failure");
    return STUB_REPLY;
  }
  const id = a.system.match(/Preset id: (\w+)/)?.[1] ?? "unknown";
  if (a.user.includes(`AI_STUB_FAIL_${id}`)) throw new Error("stubbed failure");
  return `Stub sample for ${id}. This is a short placeholder post.`;
}

// One place that calls the model and logs tokens and cost to ai_usage.
export async function askModel(a: AskArgs): Promise<string> {
  // Test-only switch. Never set AI_STUB in production.
  if (process.env.AI_STUB === "1") {
    return stubReply(a);
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const res = await client
    .messages.create({
      model: a.model,
      max_tokens: a.maxTokens,
      ...(a.noThinking ? { thinking: { type: "disabled" as const } } : {}),
      system: a.system,
      messages: [{ role: "user", content: a.user }],
    })
    .catch((err) => {
      // Logged for Vercel runtime logs. No prompt text and no keys.
      console.error(`AI call failed: feature=${a.feature} model=${a.model} status=${err?.status ?? "none"} ${err?.message ?? err}`);
      throw err;
    });

  const price = PRICE[a.model] ?? { in: 0, out: 0 };
  await supabaseAdmin().from("ai_usage").insert({
    workspace_id: a.workspaceId,
    user_id: a.userId,
    feature: a.feature,
    model: a.model,
    tokens_in: res.usage.input_tokens,
    tokens_out: res.usage.output_tokens,
    cost_usd: (res.usage.input_tokens * price.in + res.usage.output_tokens * price.out) / 1_000_000,
  });

  return res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
}
