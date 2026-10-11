# Qiva Reach — Memory

> Update continuously. Company-wide memory is `company-brain/`; this file is the build tracker.

## Status: In Progress (Checkpoint 1)

## Currently Working On
- Waiting on: founders' approval of D-008 (Arman), specs A2/A3/A4, and accounts (Supabase, Vercel).

## Completed
- [x] Repo cloned, brain read — 12 Oct 2026
- [x] Next.js 16 skeleton, brand tokens, Supabase client helpers, proxy — 12 Oct 2026
- [x] Core migration (14 tables, RLS) tested on local Postgres: cross-user read/write blocked, token columns hidden — 12 Oct 2026
- [x] Draft specs A2, A3, A4 in `docs/specs/` — 12 Oct 2026

## Remaining
- Specs B1, B2, C1, C2, C3, A1; accounts; A2 build; Playwright setup; quality test set.

## Blockers
- Supabase project, Vercel project, Google OAuth client, Anthropic key, LinkedIn app (Q-003).

## Decisions Log
- 12 Oct 2026: Next 16 uses `proxy.ts` instead of `middleware.ts`.
- 12 Oct 2026: Vitest installed with @types/node 22 (vitest 5 needs it).
