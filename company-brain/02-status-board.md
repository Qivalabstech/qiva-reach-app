# 02 · Status board

Updated by whoever changes something. Keep it short; history goes in the logs.

**Last updated:** 13 Oct 2026 by CTO (Claude)

## Where we are

| Item | Now |
|---|---|
| Current phase | Phase 0: Validation and setup (12–25 Oct 2026). MVP build also starting early (decision D-008) |
| Waitlist | Live at https://www.qivareach.com since 11 Oct 2026 (Vercel; signups in Supabase table `public.waitlist`) |
| Waitlist launch day | Monday 12 Oct 2026 (founder LinkedIn posts, WhatsApp, 50 personal messages) |
| Waitlist signups | Not counted yet. Test rows to be deleted before launch (`delete from public.waitlist;`). Target 300 by 25 Oct |
| Written founding commitments | 0. Target 15 by 25 Oct |
| Paying customers / MRR | 0 / $0 |
| LinkedIn developer app | Not created yet (Phase 0 WP 0.4) |
| LinkedIn Community Management API | Not applied for yet |
| App (Vercel) | Live at https://qiva-reach-app.vercel.app (email sign-in). Vercel project `qiva-reach-app`, Supabase project `qiva-reach-app` (Mumbai) |
| Product repository | Created: private `Qivalabstech/qiva-reach-app`. Skeleton and core migration on branch `feat/foundation-skeleton` |
| Google Search Console | Property added, sitemap submitted 11 Oct 2026 |

## Gate G0 tracker (by 25 Oct 2026)

| Criterion | Target | Now |
|---|---|---|
| Waitlist signups | 300 | — |
| Written commitments to a founding plan | 15 | 0 |
| Phase 1–2 specs signed by both partners | 28 | 0 |
| LinkedIn app live with Sign In + Share | Yes | No |

## Feature status (only features that have started)

| ID | Status | Note |
|---|---|---|
| C3 | In progress | Built; favourite-hook check (Arman), PostHog events, help note still to do |
| C2 | In progress | Built; 10 test users rating, PostHog events, help note still to do |
| B2 | In progress | Built; blind test (Arman + 2), PostHog events and help note still to do |
| B1 | In progress | Built; PostHog events, help note and real-user tone check still to do |
| A4 | In progress | Built; PostHog event, help note and a real LinkedIn export check still to do |
| A3 | In progress | Built and live on preview; PostHog event and help note still to add |
| A2 | In progress | Email magic-link sign-in built and live; Google sign-in waiting for the Google OAuth client |

Statuses: Not started · In progress · Accepted · Blocked: compliance

## Blockers

- Repo `qiva-reach-app` is temporarily PUBLIC (Vercel Hobby limitation). Contains company-brain. Return to private after upgrading to Vercel Pro.

- Google OAuth client, Resend account, PostHog, Anthropic key (founders)
- Arman Hussain approval of D-008

## Each executive's current focus

| Role | Focus this week |
|---|---|
| CTO | Checkpoint 1 nearly done (skeleton, database, email sign-in live). Next: build C1 ideas |
| CMO | Waitlist launch, daily LinkedIn content, path to 300 signups |
| CFO | LLP vs Private Limited check, 24-month model, investor shortlist |
