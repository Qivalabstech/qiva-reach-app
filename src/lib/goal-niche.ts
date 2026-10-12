export const GOALS = [
  { value: "grow_audience", label: "Grow my audience" },
  { value: "get_leads", label: "Get leads and clients" },
  { value: "build_authority", label: "Build authority in my field" },
  { value: "find_a_job", label: "Find a job" },
] as const;

export const NICHES = [
  "SaaS founder",
  "Consultant or coach",
  "Marketing",
  "Recruiting and HR",
  "Finance",
  "Tech and engineering",
  "Sales",
  "Design",
] as const;

export type Goal = (typeof GOALS)[number]["value"];

export function parseGoalNiche(goal: unknown, niche: unknown) {
  const g = GOALS.find((x) => x.value === goal)?.value;
  const n = typeof niche === "string" ? niche.trim() : "";
  if (!g) return { ok: false as const, error: "Pick one goal so your ideas fit what you want." };
  if (!n) return { ok: false as const, error: "Add a niche so your ideas fit you." };
  if (n.length > 80) return { ok: false as const, error: "Keep your niche under 80 characters." };
  return { ok: true as const, goal: g, niche: n };
}
