import { isPreset, type Preset } from "@/lib/presets";

export const TONE_MAX = 200;
export const LENGTH_MIN = 20;
export const LENGTH_MAX = 400;
export const SIGNATURE_MAX = 10;
export const BANNED_MAX = 30;
export const PHRASE_MAX_CHARS = 60;
export const EMOJI_USES = ["none", "light", "frequent"] as const;
export type EmojiUse = (typeof EMOJI_USES)[number];

export const DEFAULT_BANNED_PHRASES = [
  "game-changer",
  "unlock",
  "delve",
  "in today's fast-paced world",
  "thrilled to announce",
  "I'm excited to share",
  "synergy",
  "leverage",
  "revolutionize",
  "dive deep",
];

const emojiCount = (s: string) => (s.match(/\p{Extended_Pictographic}/gu) ?? []).length;
const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

// Mean words per post, rounded to the nearest 10 and kept inside the allowed range.
export function averageLength(posts: string[]): number {
  if (!posts.length) return 0;
  const mean = posts.reduce((n, p) => n + words(p), 0) / posts.length;
  return Math.min(LENGTH_MAX, Math.max(LENGTH_MIN, Math.round(mean / 10) * 10));
}

// none: no emoji in 80%+ of posts. frequent: 3+ emoji in 40%+ of posts. Otherwise light.
export function emojiUse(posts: string[]): EmojiUse {
  if (!posts.length) return "none";
  const none = posts.filter((p) => emojiCount(p) === 0).length / posts.length;
  const heavy = posts.filter((p) => emojiCount(p) >= 3).length / posts.length;
  if (none >= 0.8) return "none";
  if (heavy >= 0.4) return "frequent";
  return "light";
}

// Trim, drop empties and case-insensitive duplicates, cap each phrase and the list.
export function cleanPhrases(list: unknown, max: number): string[] {
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of list) {
    if (typeof item !== "string") continue;
    const p = item.trim().slice(0, PHRASE_MAX_CHARS);
    if (!p || seen.has(p.toLowerCase())) continue;
    seen.add(p.toLowerCase());
    out.push(p);
  }
  return out.slice(0, max);
}

export type VoiceInput = {
  tone: string;
  avg_length: number;
  emoji_use: EmojiUse;
  signature_phrases: string[];
  banned_phrases: string[];
  preset: Preset | null;
};

export function validateVoice(input: unknown):
  | { ok: true; value: VoiceInput }
  | { ok: false; error: string } {
  const v = (input ?? {}) as Record<string, unknown>;
  const tone = typeof v.tone === "string" ? v.tone.trim() : "";
  if (tone.length > TONE_MAX) return { ok: false, error: `Keep your tone under ${TONE_MAX} characters.` };
  const len = Number(v.avg_length);
  if (!Number.isInteger(len) || len < LENGTH_MIN || len > LENGTH_MAX)
    return { ok: false, error: `Average length should be between ${LENGTH_MIN} and ${LENGTH_MAX} words.` };
  if (!EMOJI_USES.includes(v.emoji_use as EmojiUse)) return { ok: false, error: "Pick how much emoji you use." };
  return {
    ok: true,
    value: {
      tone,
      avg_length: len,
      emoji_use: v.emoji_use as EmojiUse,
      signature_phrases: cleanPhrases(v.signature_phrases, SIGNATURE_MAX),
      banned_phrases: cleanPhrases(v.banned_phrases, BANNED_MAX),
      preset: isPreset(v.preset) ? v.preset : null,
    },
  };
}

// Reads the model's reply. Returns null for anything that isn't the expected JSON.
export function parseAnalysis(text: string): { tone: string; signature: string[] } | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const d = JSON.parse(text.slice(start, end + 1));
    const tone = typeof d.tone === "string" ? d.tone.trim().slice(0, TONE_MAX) : "";
    if (!tone) return null;
    return { tone, signature: cleanPhrases(d.signature_phrases, 5) };
  } catch {
    return null;
  }
}
