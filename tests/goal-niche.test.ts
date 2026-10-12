import { describe, expect, it } from "vitest";
import { parseGoalNiche } from "../src/lib/goal-niche";

describe("parseGoalNiche", () => {
  it("accepts a valid goal and trims the niche", () => {
    expect(parseGoalNiche("get_leads", "  Sales ")).toEqual({ ok: true, goal: "get_leads", niche: "Sales" });
  });
  it("rejects a missing or unknown goal", () => {
    expect(parseGoalNiche(null, "Sales").ok).toBe(false);
    expect(parseGoalNiche("become_famous", "Sales").ok).toBe(false);
  });
  it("rejects an empty or whitespace niche with the spec message", () => {
    expect(parseGoalNiche("get_leads", "   ")).toEqual({ ok: false, error: "Add a niche so your ideas fit you." });
  });
  it("rejects a niche over 80 characters", () => {
    expect(parseGoalNiche("get_leads", "x".repeat(81)).ok).toBe(false);
    expect(parseGoalNiche("get_leads", "x".repeat(80)).ok).toBe(true);
  });
});
