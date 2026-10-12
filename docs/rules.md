# Qiva Reach — Rules

Full operating manual: `CLAUDE.md`. Short version for builders:

## Approved Libraries
Next.js, React, Tailwind, `@supabase/ssr`, `@supabase/supabase-js`, Anthropic SDK, Vitest, Playwright, Resend, PostHog, Sentry, fflate (unzip LinkedIn export in the browser), @anthropic-ai/sdk (server only).

## Avoid
- Any new dependency without listing it first and a reason.
- Headless browsers, scraping, LinkedIn passwords or cookies (LinkedIn compliance gate).
- Emoji in product UI, LinkedIn blue, all-caps labels.

## Error Handling Policy
- Validate all input at trust boundaries (server actions, route handlers).
- Errors shown to users say what happened and how to fix it. No "Oops".
- AI failures never lose the user's input.

## AI Agent Boundaries
- Do not: spend money, create or change outside accounts, run migrations on production, change DNS, or delete data without asking.
- Do not: build anything outside Scope v1.0 or outside the current phase.
- Do not: print or commit secrets. Keys live in `.env.local` and Vercel only.
- Always: one branch per feature (`feat/<ID>-name`), spec approved before build.
- Always: RLS on every new table; log AI calls to `ai_usage`.
- Never set `AI_STUB` in production. It makes model calls return a fixed reply and exists only for local tests.
- Always: update `docs/memory.md` after each feature, and end sessions with a BRAIN UPDATE.

## Code Conventions
TypeScript strict. Sentence-case copy. Plain English in code and commits. Comments only for non-obvious "why".

## Tests that call the real model
`tests/gen-preset-fixtures.test.ts` records real outputs on demand (`GEN_FIXTURES=1`). Re-record after any change to `src/ai/prompts/presets.v1.ts`, then run `npm test`.
