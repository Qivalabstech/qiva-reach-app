import { MAX_WORDS, MIN_WORDS, writerSystem, writerUser } from "@/ai/prompts/post-writer.v1";
import type { VoiceForPrompt } from "@/ai/prompts/presets.v1";
import { findBanned, inventedNumbers } from "@/lib/banned";
import type { Preset } from "@/lib/presets";

export { MAX_WORDS, MIN_WORDS };
export const MAX_NOTES = 2000;
export const MAX_BODY = 3000; // LinkedIn's post limit
export const DRAFT_ERROR = "We couldn't write a clean draft. Try again.";

export const countWords = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
export const lengthTarget = (avg: number) => Math.min(MAX_WORDS, Math.max(MIN_WORDS, avg || 180));

export type AskFn = (system: string, user: string) => Promise<string>;
export type DraftResult = { text: string; invented: string[] } | { error: string };

// Writes a draft and checks it before anyone sees it: no banned phrases, 120-250 words.
// A failed check triggers up to 2 rewrites with a correction. Numbers the user did not give
// do not block the draft; they are returned so the screen can warn.
export async function generateDraft(args: {
  notes: string;
  preset: Preset | null;
  voice: VoiceForPrompt & { avg_length: number };
  examples: string[];
  ask: AskFn;
}): Promise<DraftResult> {
  const { notes, preset, voice, examples, ask } = args;
  const targetWords = lengthTarget(voice.avg_length);
  let correction = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    let text: string;
    try {
      text = (await ask(writerSystem({ voice, preset, targetWords, examples, correction }), writerUser(notes)))
        .trim()
        .replace(/^["“]([\s\S]*)["”]$/, "$1");
    } catch {
      return { error: DRAFT_ERROR };
    }
    const words = countWords(text);
    const banned = findBanned(text, voice.banned_phrases);
    if (text && !banned.length && words >= MIN_WORDS && words <= MAX_WORDS)
      return { text, invented: inventedNumbers(text, notes) };
    correction = `Your last draft broke a rule. ${banned.length ? `It used banned phrases: ${banned.join(", ")}. ` : ""}${
      words < MIN_WORDS || words > MAX_WORDS ? `It had ${words} words; it must have between ${MIN_WORDS} and ${MAX_WORDS}. ` : ""
    }Rewrite it without these problems.`;
  }
  return { error: DRAFT_ERROR };
}
