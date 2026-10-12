# Qiva Reach — Memory

> Update continuously. Company-wide memory is `company-brain/`; this file is the build tracker.

## Status: In Progress (Checkpoint 1: email sign-in built, Google pending)

## Currently Working On
- A2 email sign-in done on `feat/A2-sign-in`; waiting on Vercel project, Google OAuth client, Arman approval of D-008.

## Completed
- [x] Repo cloned, brain read — 12 Oct 2026
- [x] Next.js 16 skeleton, brand tokens, Supabase client helpers, proxy — 12 Oct 2026
- [x] Core migration (14 tables, RLS) tested on local Postgres: cross-user read/write blocked, token columns hidden — 12 Oct 2026
- [x] Draft specs A2, A3, A4 in `docs/specs/` — 12 Oct 2026

- [x] Supabase project `qiva-reach-app` created, migration applied, 14 tables checked — 13 Oct 2026
- [x] A2 email magic-link sign-in, /app and /onboarding protected, 5 Playwright tests pass — 13 Oct 2026

- [x] Vercel project `qiva-reach-app` live at https://qiva-reach-app.vercel.app; Supabase redirect URLs added (prod + preview wildcard) — 13 Oct 2026

- [x] A3 goal and niche (onboarding step 1 + settings; verified live), 4 unit and 4 e2e tests pass, RLS checked — 13 Oct 2026

- [x] A4 voice import (paste, Shares.csv, zip; dedupe; skip; empty state), 12 unit and 6 A4 e2e tests pass — 13 Oct 2026

- [x] B1 voice profile: counted length and emoji, Haiku 5.5 tone and signature phrases, editable, relearn, 5-a-day limit, ai_usage logging; 25 unit and 22 e2e tests pass with stubbed AI — 13 Oct 2026
- [x] Anthropic key set locally and on Vercel; models `claude-haiku-5-5` (fast) and `claude-sonnet-5-5` (writer) — 13 Oct 2026

## Remaining
- Specs B1, B2, C1, C2, C3, A1; accounts; A2 build; Playwright setup; quality test set.

## Blockers
- Google OAuth client, Resend (Supabase built-in email is limited to a few emails an hour), PostHog, Anthropic key, LinkedIn app (Q-003).

## Decisions Log
- 12 Oct 2026: Next 16 uses `proxy.ts` instead of `middleware.ts`.
- 12 Oct 2026: Vitest installed with @types/node 22 (vitest 5 needs it).
- 13 Oct 2026: `cacheComponents` turned off in next.config; every signed-in page is dynamic, so it only added friction.
- 13 Oct 2026: Google button and PostHog events deferred until their accounts exist (nothing to wire yet).
- 13 Oct 2026: Repo made PUBLIC by founder decision (Razam Sir) because Vercel Hobby blocks deployments from commits on private repos. The company-brain folder is public too. Make the repo private again when Vercel Pro is bought.
- 13 Oct 2026: Migration 20261013000001 (analyzed_at, tone_source) applied to the Supabase project by Razam Sir.
