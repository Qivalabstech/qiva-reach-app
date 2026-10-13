import { ideasSystem, ideasUser, IDEA_MAX_CHARS } from "@/ai/prompts/ideas.v1";
import { findBanned } from "@/lib/banned";

export const IDEAS_WANTED = 20;
export const IDEAS_ERROR = "We couldn't get ideas. Try again.";
export const FOCUS_MAX = 100;

export type AskFn = (system: string, user: string) => Promise<string>;

export const ideaKey = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

// Trims numbering and bullets, then keeps only usable, new ideas.
export function cleanIdeas(raw: unknown, ctx: { banned: string[]; seen: Set<string> }): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set(ctx.seen);
  const out: string[] = [];
  for (const r of raw) {
    if (typeof r !== "string") continue;
    const text = r.trim().replace(/^(?:[-*•]|\d+[.)])\s+/, "").replace(/^["“](.*)["”]$/, "$1").trim();
    if (!text || text.includes("\n") || text.length > IDEA_MAX_CHARS) continue;
    const k = ideaKey(text);
    if (!k || seen.has(k) || findBanned(text, ctx.banned).length) continue;
    seen.add(k);
    out.push(text);
  }
  return out;
}

function parse(reply: string): unknown {
  const start = reply.indexOf("{");
  const end = reply.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(reply.slice(start, end + 1)).ideas;
  } catch {
    return null;
  }
}

// Asks for 25 ideas, drops the unusable and the already-shown, and asks once more if fewer than 20 are left.
export async function generateIdeas(args: {
  goal: string | null;
  niche: string;
  focus: string;
  recentLines: string[];
  seen: string[]; // ideas already shown to this workspace recently
  banned: string[];
  ask: AskFn;
}): Promise<{ ideas: string[] } | { error: string }> {
  const seen = new Set(args.seen.map(ideaKey));
  const avoid = args.seen.slice(0, 60);
  const ideas: string[] = [];
  for (let attempt = 0; attempt < 2 && ideas.length < IDEAS_WANTED; attempt++) {
    const count = attempt === 0 ? IDEAS_WANTED + 5 : IDEAS_WANTED - ideas.length + 5;
    let reply: string;
    try {
      reply = await args.ask(
        ideasSystem({ goal: args.goal, niche: args.niche, banned: args.banned, count }),
        ideasUser({ focus: args.focus, recentLines: args.recentLines, avoid: [...avoid, ...ideas] }),
      );
    } catch {
      return { error: IDEAS_ERROR };
    }
    const fresh = cleanIdeas(parse(reply), { banned: args.banned, seen });
    for (const f of fresh) {
      seen.add(ideaKey(f));
      ideas.push(f);
    }
  }
  return ideas.length ? { ideas: ideas.slice(0, IDEAS_WANTED) } : { error: IDEAS_ERROR };
}
