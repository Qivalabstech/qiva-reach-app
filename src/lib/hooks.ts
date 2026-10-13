import { findBanned, inventedNumbers } from "@/lib/banned";

export const HOOK_MAX = 120;
export const HOOK_LONG = 100; // longer than this caps the score at 6
export const HOOK_TYPES = ["question", "bold_claim", "number", "story", "contrarian", "curiosity", "direct_promise", "short_punch"] as const;
export type HookType = (typeof HOOK_TYPES)[number];
export const HOOK_TYPE_LABEL: Record<HookType, string> = {
  question: "Question", bold_claim: "Bold claim", number: "Number", story: "Story", contrarian: "Contrarian",
  curiosity: "Curiosity", direct_promise: "Direct promise", short_punch: "Short punch",
};

export type Hook = { text: string; type?: HookType; score: number; reason: string };

// The hook is the first line. Everything else, including leading blank lines, is kept byte for byte.
export function splitFirstLine(body: string): { prefix: string; hook: string; rest: string } {
  const m = body.match(/^(\s*)([^\n]*)([\s\S]*)$/)!;
  return { prefix: m[1], hook: m[2], rest: m[3] };
}

export function swapFirstLine(body: string, newHook: string): string {
  const { prefix, rest } = splitFirstLine(body);
  return prefix + newHook + rest;
}

const GENERIC = /^(i['’]m|i am|we['’]re|we are)\s+(so\s+)?(excited|thrilled|happy|proud|delighted)\b|^let['’]s talk about\b|^today i want to\b|^in today['’]s\b/i;
const key = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const clampScore = (n: unknown) => Math.min(10, Math.max(1, Math.round(Number(n)) || 1));

// Fixed rules applied after the model rates the hooks. Returns only valid hooks, best first.
export function applyRules(raw: unknown, ctx: { post: string; banned: string[]; currentLine: string }): Hook[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set([key(ctx.currentLine)]);
  const out: Hook[] = [];
  for (const r of raw) {
    if (!r || typeof r !== "object") continue;
    const h = r as Record<string, unknown>;
    const text = typeof h.text === "string" ? h.text.trim() : "";
    if (!text || text.includes("\n") || text.length > HOOK_MAX || seen.has(key(text))) continue;
    if (findBanned(text, ctx.banned).length || inventedNumbers(text, ctx.post).length) continue;
    seen.add(key(text));
    let score = clampScore(h.score);
    if (GENERIC.test(text)) score = Math.min(score, 4);
    if (text.length > HOOK_LONG) score = Math.min(score, 6);
    out.push({
      text,
      type: HOOK_TYPES.find((t) => t === h.type),
      score,
      reason: typeof h.reason === "string" ? h.reason.trim().slice(0, 90) : "",
    });
  }
  return out.map((h, i) => ({ h, i })).sort((a, b) => b.h.score - a.h.score || a.i - b.i).map((x) => x.h);
}

// The user's own current line is scored but never dropped; the same caps apply.
export function scoreCurrent(line: string, raw: unknown): { score: number; reason: string } | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (r.score == null) return null;
  let score = clampScore(r.score);
  if (GENERIC.test(line)) score = Math.min(score, 4);
  if (line.length > HOOK_LONG) score = Math.min(score, 6);
  return { score, reason: typeof r.reason === "string" ? r.reason.trim().slice(0, 90) : "" };
}

export function parseHookReply(text: string): { current: unknown; hooks: unknown } | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const d = JSON.parse(text.slice(start, end + 1));
    return { current: d.current, hooks: d.hooks };
  } catch {
    return null;
  }
}
