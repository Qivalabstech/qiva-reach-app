# Qiva Reach — Architecture

## Tech Stack
- Framework: Next.js 16 (App Router, TypeScript strict), React 19
- Styling: Tailwind CSS 4 with brand tokens in `src/app/globals.css`
- Backend/DB: Supabase (Postgres, Auth, RLS), Mumbai region; separate project from the waitlist
- AI: Anthropic SDK, server only (added with C1)
- Email: Resend · Analytics: PostHog · Errors: Sentry
- Hosting: Vercel, functions pinned to Mumbai (`vercel.json`, bom1) next to Supabase to cut database latency (app on `app.qivareach.com` later)
- Tests: Vitest (logic), Playwright (acceptance, added with the first feature)

## High-Level Workflow
1. Browser talks to Next.js pages and server actions only.
2. Server code uses the Supabase server client (user session, RLS applies).
3. Privileged work (AI usage logging, audit log, LinkedIn tokens) uses the service-role key on the server only.
4. `src/proxy.ts` refreshes the Supabase session cookie on every request.
5. Every AI call: build prompt from `src/ai/prompts/` + voice profile + user posts, call Anthropic, banned-phrase check, log to `ai_usage`.

## Folder & File Structure
```
src/app/            routes (App Router)
src/lib/supabase/   server.ts, browser.ts clients
src/ai/prompts/     versioned prompts
src/proxy.ts        session refresh
supabase/migrations/ SQL migrations (RLS on every table)
docs/               project docs; docs/specs/<ID>.md feature specs
tests/              Vitest tests
company-brain/      shared memory for CTO, CMO, CFO
```

## Key Architectural Decisions
- Personal workspace is created for every user by a database trigger, so all data is workspace-scoped from day one (agency use in Phase 5 needs no schema change).
- LinkedIn token columns are not granted to the browser role at all; only the server can read them.
- `middleware.ts` is deprecated in this Next version; we use `proxy.ts`.
- Model names live in env vars (`ANTHROPIC_MODEL_FAST`, `ANTHROPIC_MODEL_WRITER`) so models switch without code changes.
