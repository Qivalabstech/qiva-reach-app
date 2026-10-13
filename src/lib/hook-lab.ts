import { hookSystem, hookUser } from "@/ai/prompts/hook-lab.v1";
import type { VoiceForPrompt } from "@/ai/prompts/presets.v1";
import { applyRules, parseHookReply, scoreCurrent, splitFirstLine, type Hook } from "@/lib/hooks";
import type { Preset } from "@/lib/presets";

export type AskFn = (system: string, user: string) => Promise<string>;
export const HOOK_ERROR = "We couldn't get hooks. Try again.";
export const HOOKS_WANTED = 10;
export const MIN_SHOWN = 5;

export type HookList = {
  current: { text: string; score: number | null; reason: string };
  hooks: Hook[];
};

// Asks for 12 hooks, applies the fixed rules, and asks once more if fewer than 10 survive.
export async function generateHooks(args: {
  post: string;
  voice: VoiceForPrompt;
  preset: Preset | null;
  avoid: string[];
  ask: AskFn;
}): Promise<HookList | { error: string }> {
  const { post, voice, preset, ask } = args;
  const currentLine = splitFirstLine(post).hook.trim();
  const ctx = { post, banned: voice.banned_phrases, currentLine };
  let hooks: Hook[] = [];
  let current: { score: number; reason: string } | null = null;
  const avoid = [...args.avoid];

  for (let attempt = 0; attempt < 2 && hooks.length < HOOKS_WANTED; attempt++) {
    let reply: ReturnType<typeof parseHookReply>;
    try {
      reply = parseHookReply(await ask(hookSystem({ voice, preset, count: attempt === 0 ? 12 : 8 }), hookUser(post, currentLine, avoid)));
    } catch {
      return { error: HOOK_ERROR };
    }
    if (!reply) continue;
    current ??= scoreCurrent(currentLine, reply.current);
    const have = new Set(hooks.map((h) => h.text.toLowerCase()));
    const fresh = applyRules(reply.hooks, ctx).filter((h) => !have.has(h.text.toLowerCase()));
    hooks = applyRules([...hooks, ...fresh], ctx);
    avoid.push(...fresh.map((h) => h.text));
  }
  if (hooks.length < MIN_SHOWN) return { error: HOOK_ERROR };
  return {
    current: { text: currentLine, score: current?.score ?? null, reason: current?.reason ?? "" },
    hooks: hooks.slice(0, HOOKS_WANTED),
  };
}
