# Gate G1 checklist (Phase 1 exit)

**Gate date:** 8 Nov 2026 (plan). **Last updated:** 14 Oct 2026 by the CTO.
G1 passes only when all four are true (from `company-brain/01-plan-and-scope.md`):

| # | Gate criterion | Now |
|---|---|---|
| G1.1 | All 9 Phase 1 features meet their acceptance criteria | 8 of 9 built and tested. A1 (LinkedIn sign-in) is not built; the A2 Google button is waiting for a Google client. |
| G1.2 | 10 test users each reach a draft in under 5 minutes | Not started. Needs 10 testers (Arman) and working email (see "Before the test sessions"). |
| G1.3 | 7 of 10 test users rate voice match 4 or 5 out of 5 | Not started. Same 10 testers. |
| G1.4 | Row-level security verified on every table | Tested table by table in code; one audit query still to run on the live database (section 5). |

Legend: ✅ done · 🟡 partly done · ⬜ not done · 🔒 waiting for a founder

## 1. Feature status

"Criteria tested" means the acceptance criteria are covered by automatic tests that pass on the live site (about 90 unit tests and 60 browser tests). Definition-of-done items come from `CLAUDE.md`.

| ID | Feature | Criteria tested | LinkedIn gate | Chrome | 390 px phone | Safari | RLS | PostHog event | Help note | Demoed |
|---|---|---|---|---|---|---|---|---|---|---|
| A1 | Sign in with LinkedIn | ⬜ spec not written | ⬜ | ⬜ | ⬜ | ⬜ | ✅ table exists | ⬜ | ⬜ | ⬜ |
| A2 | Email and Google sign-up | 🟡 email ✅, Google 🔒 | ✅ | ✅ | ✅ | ⬜ | ✅ | ⬜ | ⬜ | ⬜ |
| A3 | Goal and niche | ✅ | ✅ | ✅ | ✅ | ⬜ | ✅ | ⬜ | ⬜ | ⬜ |
| A4 | Voice import | ✅ (made-up export; real export 🔒) | ✅ | ✅ | ✅ | ⬜ | ✅ | ⬜ | ⬜ | ⬜ |
| B1 | Voice profile | ✅ (3 real users' check 🔒) | ✅ | ✅ | ✅ | ⬜ | ✅ | ⬜ | ⬜ | ⬜ |
| B2 | Tone presets | ✅ (blind test 🔒) | ✅ | ✅ | ✅ | ⬜ | ✅ | ⬜ | ⬜ | ⬜ |
| C1 | Idea generator | ✅ (relevance rating 🔒) | ✅ | ✅ | ✅ | ⬜ | ✅ | ⬜ | ⬜ | ⬜ |
| C2 | Post writer | ✅ (10-user rating 🔒) | ✅ | ✅ | ✅ | ⬜ | ✅ | ⬜ | ⬜ | ⬜ |
| C3 | Hook lab | ✅ (favourite-hook check 🔒) | ✅ | ✅ | ✅ | ⬜ | ✅ | ⬜ | ⬜ | ⬜ |

**LinkedIn compliance gate, one line each (CTO review, 14 Oct 2026):** A2 to C3 use only text the user pastes or types, and never read, post to or log in to LinkedIn. The user copies drafts by hand. All pass. A1 will be reviewed when it is specified.

## 2. CTO tasks (Razam Sir's AI CTO)

| # | Task | Needs from founders | Status |
|---|---|---|---|
| 1 | Write the A1 spec (LinkedIn sign-in) and get it approved | Approval from both partners | ⬜ next |
| 2 | Build A1 | LinkedIn developer app (Q-003): client ID and secret | 🔒 |
| 3 | Build the Google button for A2 | Google OAuth client | 🔒 |
| 4 | Add PostHog and the usage events listed in each spec | PostHog account and project key | 🔒 |
| 5 | Write the 9 one-paragraph help notes and a `/help` page | none | ⬜ |
| 6 | Make test emails work for 10 people: Resend as the email sender, plus the magic-link email template that opens in any browser | Resend account; a decision on a sender subdomain such as `mail.qivareach.com` (DNS records on that subdomain only; `www` and the root domain stay untouched) | 🔒 |
| 7 | Run Hakscan on the live site and fix high and critical findings | Hakscan access (Razam Sir) | ⬜ |
| 8 | Write the RLS audit report (section 5) | Razam Sir runs one query | ⬜ |
| 9 | Run the G1 test sessions with Arman and fill `docs/g1-test-log.md` | the 10 testers | 🔒 |
| 10 | Demo to both partners (or 3 beta users) and record it in the status board | a 20-minute call | ⬜ |

## 3. Arman's tasks

All the steps are in [`docs/for-arman.md`](for-arman.md). Summary:

| # | Task | Time | Status |
|---|---|---|---|
| 1 | Approve D-008 (build started early) and the specs | 15 min | ⬜ |
| 2 | Recruit 10 test users and collect their posts (permission first) | a few days | ⬜ |
| 3 | Privacy policy: add the line about AI processing (Q-004) | 15 min | ⬜ |
| 4 | Run the 10 timed sessions (under 5 minutes) and collect voice-match ratings | about 20 min each | ⬜ |
| 5 | B2 blind test, with 2 other people | 20 min each | ⬜ |
| 6 | C1 relevance rating (3 niches) | 15 min | ⬜ |
| 7 | C3 favourite-hook check (10 posts) | 20 min | ⬜ |
| 8 | B1 tone check with 3 real users | 10 min each | ⬜ |
| 9 | Safari check on iPhone and Mac | 20 min | ⬜ |

## 4. Razam Sir's tasks

| # | Task | Status |
|---|---|---|
| 1 | Create the LinkedIn developer app under the QivaLabs company page; enable "Sign In with LinkedIn using OpenID Connect" and "Share on LinkedIn" (Q-003). The CTO gives the click-by-click steps when you say so. | ⬜ |
| 2 | Create the Google OAuth client (CTO gives the steps) | ⬜ |
| 3 | Create the PostHog account and share the project key through the environment settings, never in chat | ⬜ |
| 4 | Create the Resend account and confirm the sender subdomain | ⬜ |
| 5 | Run Hakscan on https://qiva-reach-app.vercel.app | ⬜ |
| 6 | Run the RLS audit query (section 5) and send the CTO the result | ⬜ |
| 7 | Decide: Vercel Pro before the beta (the repo is public until then; see the status board) | ⬜ |
| 8 | Keep the Anthropic monthly limit at $30 for development and check the console once a week | ⬜ |

## 5. Row-level security audit (G1.4)

Every table has RLS switched on and policies, in `supabase/migrations/20261012000001_core_tables.sql`. Browser tests prove that a second user cannot read or change the first user's data for: profiles, posts (drafts and imported), voice profiles, ideas, workspaces. These tables are server-only by design (no access from the browser): `ai_usage` and `audit_log` writes, and LinkedIn token columns.

**Audit query (run in Supabase, SQL Editor, project `qiva-reach-app`).** It must return zero rows from the first query and a policy list for the second:

```sql
-- 1) tables in the public schema WITHOUT row-level security (expected: no rows)
select tablename from pg_tables where schemaname = 'public' and not rowsecurity;

-- 2) all policies, to read through once
select tablename, policyname, cmd from pg_policies where schemaname = 'public' order by tablename, cmd;
```

Pass: query 1 returns no rows, and nothing in query 2 lets a signed-in user read `audit_log` or the LinkedIn token columns. The CTO records the result in the status board.

## 6. Before the test sessions (blockers)

1. **Email must work for 10 people.** Supabase's built-in sender allows only a few emails an hour. Task 6 in section 2 fixes this (Resend). Without it, the sessions will stall.
2. **The sign-in link must open in any browser.** Today it works only in the same browser that asked for it. The new email template (also task 6) fixes this, which matters when testers read the email on their phone.
3. **The privacy line** about AI processing must be live before real people paste their posts.
4. **Test users' permission** must be written down (a chat message is enough) before their posts are used.

## 7. Suggested timeline (CTO estimate, not a promise)

| When | What |
|---|---|
| By 18 Oct | Founders: Resend, PostHog, Google client, LinkedIn app. CTO: A1 spec, help notes, RLS audit result. |
| 19 to 25 Oct | CTO: email setup, PostHog events, Google sign-in, A1 build. Arman: recruit 10 testers and collect posts. |
| 26 Oct to 1 Nov | Run the timed sessions and ratings. Blind test, relevance rating, hook check, Safari check. Hakscan run. |
| 2 to 7 Nov | Fix what the sessions show (prompt and profile changes only; scope does not change). Re-run the quality script. |
| 8 Nov | Gate G1 review with both partners. |

If drafts sound generic, the plan allows up to 3 extra days on prompts and the voice profile. The date moves, the scope does not.
