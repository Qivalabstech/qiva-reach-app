export const PRESETS = [
  { value: "professional", label: "Professional", blurb: "A clear point, short reasons, a calm close.", example: "Three changes that improved how we onboard clients." },
  { value: "story_led", label: "Story-led", blurb: "A real moment first, then the lesson.", example: "Last year a client almost left. One call changed that." },
  { value: "contrarian", label: "Contrarian", blurb: "Challenges a common belief, then argues it fairly.", example: "Posting every day is bad advice. Here is what works." },
  { value: "hinglish_friendly", label: "Hinglish-friendly", blurb: "Hindi and English mixed, plain and conversational.", example: "Client ne kaha price kam karo. Maine yeh kiya." },
  { value: "data_driven", label: "Data-driven", blurb: "Starts with a number or finding you give us.", example: "We tested hooks for six weeks. Three patterns kept winning." },
] as const;

export type Preset = (typeof PRESETS)[number]["value"];

export const isPreset = (v: unknown): v is Preset => PRESETS.some((p) => p.value === v);
export const presetLabel = (p: Preset) => PRESETS.find((x) => x.value === p)!.label;
