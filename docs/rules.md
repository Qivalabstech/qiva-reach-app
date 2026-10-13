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

## AI calls: thinking tokens
The models think before they answer, and those hidden tokens count toward `max_tokens`. List-style calls (voice analysis, preset samples, hooks, ideas) pass `noThinking: true` to `askModel` and use a generous limit. The post writer keeps thinking and has a 2,500-token limit. Never set a tight `max_tokens` without checking `stop_reason`.

## Browser tests and the Supabase login limit
Supabase Auth allows about 30 token verifications per 5 minutes per IP. Tests therefore log in once per worker (`sharedUser` in `tests/e2e/helpers.ts`), wipe that user's data before each test, and use `freshUser` only when a second person is needed. Do not add a magic-link login to every test. A full run uses about 15 logins; leave a few minutes between a local and a live run.

## LinkedIn token
The token is saved only by `saveLinkedInConnection` (`src/lib/linkedin.ts`) through the service-role client, encrypted with `TOKEN_ENCRYPTION_KEY`. Never read the token columns from the browser, never log them, never change the key (old tokens could no longer be read). If a key must change, add a `v2:` format and keep decrypting `v1:`.
