import { describe, expect, it } from "vitest";
import { linkedInFromSession, oauthErrorKind, safeNext } from "../src/lib/linkedin-auth";

const q = (s: string) => new URLSearchParams(s);

describe("oauthErrorKind", () => {
  it("returns null when there is no error", () => {
    expect(oauthErrorKind(q("code=abc"))).toBeNull();
    expect(oauthErrorKind(q(""))).toBeNull();
  });
  it("recognises a cancel", () => {
    expect(oauthErrorKind(q("error=access_denied&error_description=user_cancelled_login"))).toBe("linkedin_cancelled");
    expect(oauthErrorKind(q("error=server_error&error_description=The+user+cancelled+authorize"))).toBe("linkedin_cancelled");
  });
  it("recognises an account already linked", () => {
    expect(oauthErrorKind(q("error=server_error&error_code=identity_already_exists"))).toBe("linkedin_already");
    expect(oauthErrorKind(q("error=x&error_description=Identity+is+already+linked+to+another+user"))).toBe("linkedin_already");
  });
  it("recognises a missing email", () => {
    expect(oauthErrorKind(q("error=server_error&error_description=Error+getting+user+email+from+external+provider"))).toBe("linkedin_no_email");
  });
  it("falls back to a general failure", () => {
    expect(oauthErrorKind(q("error=server_error&error_description=boom"))).toBe("linkedin_failed");
    expect(oauthErrorKind(q("error_code=unexpected_failure"))).toBe("linkedin_failed");
  });
});

describe("linkedInFromSession", () => {
  const session = (over: object = {}) => ({
    provider_token: "TOKEN",
    user: { identities: [{ provider: "email" }, { provider: "linkedin_oidc", identity_data: { sub: "abc123", name: " Asha Rao ", picture: "https://media.licdn.com/p.jpg" } }] },
    ...over,
  });
  it("reads the profile and the token", () => {
    expect(linkedInFromSession(session())).toEqual({ sub: "abc123", name: "Asha Rao", picture: "https://media.licdn.com/p.jpg", token: "TOKEN" });
  });
  it("is null without a token, without a LinkedIn identity, or without an id", () => {
    expect(linkedInFromSession(session({ provider_token: null }))).toBeNull();
    expect(linkedInFromSession({ provider_token: "T", user: { identities: [{ provider: "email" }] } })).toBeNull();
    expect(linkedInFromSession({ provider_token: "T", user: { identities: [{ provider: "linkedin_oidc", identity_data: {} }] } })).toBeNull();
    expect(linkedInFromSession(null)).toBeNull();
  });
  it("falls back to provider_id and to alternative name and photo keys, and allows missing name and photo", () => {
    const s = { provider_token: "T", user: { identities: [{ provider: "linkedin_oidc", identity_data: { provider_id: "pid", full_name: "A B", avatar_url: "https://x/y.png" } }] } };
    expect(linkedInFromSession(s)).toEqual({ sub: "pid", name: "A B", picture: "https://x/y.png", token: "T" });
    const bare = { provider_token: "T", user: { identities: [{ provider: "linkedin_oidc", identity_data: { sub: "s" } }] } };
    expect(linkedInFromSession(bare)).toEqual({ sub: "s", name: null, picture: null, token: "T" });
  });
});

describe("safeNext", () => {
  it("only allows the settings page", () => {
    expect(safeNext("/app/settings")).toBe("/app/settings");
    expect(safeNext("/app")).toBeNull();
    expect(safeNext("https://evil.example")).toBeNull();
    expect(safeNext("//evil.example")).toBeNull();
    expect(safeNext(undefined)).toBeNull();
  });
});
