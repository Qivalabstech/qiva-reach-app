import { presetSystem, presetUser, type VoiceForPrompt } from "@/ai/prompts/presets.v1";
import { findBanned, inventedNumbers } from "@/lib/banned";
import type { Preset } from "@/lib/presets";

export type AskFn = (system: string, user: string) => Promise<string>;
export type SampleResult = { preset: Preset; text?: string; error?: string };

export const SAMPLE_ERROR = "This one didn't load. Try again.";

// One sample for one preset. If the draft uses a banned phrase (or, for Data-driven, a number the
// user did not give), it is regenerated once with a correction. A second miss fails closed.
export async function generateSample(args: {
  preset: Preset;
  topic: string;
  facts: string;
  voice: VoiceForPrompt;
  ask: AskFn;
}): Promise<SampleResult> {
  const { preset, topic, facts, voice, ask } = args;
  const user = presetUser(topic, facts);
  let correction = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    let text: string;
    try {
      text = (await ask(presetSystem(preset, voice, correction), user)).trim().replace(/^["“]([\s\S]*)["”]$/, "$1");
    } catch {
      return { preset, error: SAMPLE_ERROR };
    }
    const banned = findBanned(text, voice.banned_phrases);
    const invented = preset === "data_driven" ? inventedNumbers(text, `${topic} ${facts}`) : [];
    if (text && !banned.length && !invented.length) return { preset, text };
    correction = `Your last draft broke a rule. ${
      banned.length ? `It used banned phrases: ${banned.join(", ")}. ` : ""
    }${invented.length ? `It used numbers the person did not give: ${invented.join(", ")}. ` : ""}Rewrite it without them.`;
  }
  return { preset, error: SAMPLE_ERROR };
}
