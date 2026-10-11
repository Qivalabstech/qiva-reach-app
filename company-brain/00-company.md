# 00 · Company and product facts

## Company

| Item | Fact |
|---|---|
| Legal entity | QivaLabs LLP (LLPIN ACV-6746), incorporated February 2026 |
| Recognition | DPIIT-recognised startup, certificate DIPP247112 |
| Headquarters | Udaipur, Rajasthan, India |
| Partners | Rajamuddin ("Razam Sir"), CTO and Designated Partner, 50%; Arman Hussain, Designated Partner, business, sales and growth, 50% |
| Other QivaLabs work | Full-service IT and software agency (33+ services); Hakscan (security-scanning SaaS, hakscan.online) |
| Founders' working style | Founders build with AI coding tools and do not write code by hand. Explain technical points in plain language |
| Contact | admin@qivareach.com |

## Product: Qiva Reach

**One line:** Qiva Reach is an AI LinkedIn post writer, scheduler and engagement community in one workspace.

**Positioning:** The LinkedIn growth co-pilot that sounds like you and never risks your account. For founders, consultants, creators, B2B marketers and agencies who need to grow on LinkedIn. Unlike engagement-pod tools it never automates actions on a user's account; unlike generic AI writers it writes in the user's own voice.

**Website:** https://www.qivareach.com (waitlist, live since 11 Oct 2026)

**Origin:** Modelled on a LinkedIn growth SaaS listed on Acquire.com in 2026 with $12,420 MRR, 103 customers, about $1,047 a month of infrastructure, 92% gross margin, +595% revenue in 12 months, all from SEO and word of mouth. Its seller said annual plans, CRO, affiliates, an agency tier and paid ads were never switched on. These are the levers Qiva Reach builds in from day one. (Seller-reported figures; not independently verified.)

### Target customers (ideal customer profile at launch)

English-speaking professionals worldwide who post on LinkedIn at least weekly, have 1,000 to 20,000 followers, and sell a B2B service, product or personal brand. Personas: founders, consultants and coaches, B2B marketers, agency owners, job seekers.

Not targeted at launch: large enterprises, mass-outreach recruiters, anyone wanting automated connection requests or messages.

### Product principles (non-negotiable)

1. **Human in the loop.** Every comment, like, reply and post on LinkedIn is triggered by a human click, or published through an official API scope the user granted for posts they approved.
2. **Official APIs first.** LinkedIn login (OpenID Connect) and LinkedIn's sharing API. No headless browsers, no stored LinkedIn passwords or session cookies, no scraping.
3. **Your voice, not generic AI.** Every AI output is conditioned on the user's past posts, tone settings and banned phrases.
4. **Value in 5 minutes.** A new user has a usable draft within 5 minutes of signing up.
5. **One workspace, one bill.**

### LinkedIn compliance gate (every feature must pass all three)

1. Is every action on LinkedIn triggered by a deliberate human click, or done through an official API scope the user granted?
2. Do we avoid reading LinkedIn pages in the background, storing LinkedIn passwords or cookies, and running hidden browsers?
3. Would we be comfortable showing this feature to LinkedIn's developer-partnership team?

If LinkedIn restricts an API scope, the product falls back to "copy and post" mode: drafts, calendar reminders and one-click copy.

## Pricing (public, USD)

| Plan | Monthly | Yearly | For | Key limits |
|---|---|---|---|---|
| Free | $0 | — | Trying the writer | 5 AI posts and 20 AI comment suggestions a month, 1 public Circle, copy-and-post only |
| Starter | $12 | $120 | Consultants, job seekers | 30 AI posts, 300 AI comments, scheduling, 2 Circles |
| Pro | $29 | $290 | Founders and creators | Unlimited drafts (fair use), hook lab, carousels, analytics, 5 Circles, reply assistant |
| Agency | $79 | $790 | Agencies and teams | 5 client profiles, approvals, private Circles; extra profiles $15 each |

All paid plans: 7-day free trial, cancel any time. Yearly = 10× monthly. Founding members (first 200 paying customers) get 40% off yearly plans for as long as they keep the plan. No lifetime deals. Prices exclude taxes. Indian customers will be billed through Razorpay, international customers through a USD provider (the public site shows USD only).

## Key dates

| Date | Milestone |
|---|---|
| 11 Oct 2026 | Waitlist live |
| 12 Oct 2026 | Waitlist launch day; MVP build starts early (D-008) |
| 25 Oct 2026 | Gate G0: 300 signups, 15 written commitments |
| Dec 2026 | Private beta, 50 users |
| 5 Jan 2027 | Public launch |
| 31 Mar 2027 | V1 release (Gate G5) |
| 30 Jun 2027 | V2 release, Scope v1.0 closes |

## Technology (CTO reference)

| Layer | Choice |
|---|---|
| Web app and API | Next.js (TypeScript) on Vercel |
| Database, auth, files | Supabase (Postgres, Auth, Storage, row-level security), Mumbai region |
| Background jobs | Inngest or Trigger.dev (scheduled publishing, retries, alerts) |
| AI | Claude API through the Anthropic SDK; fast model for comments, stronger model for posts. Check current model names on docs.claude.com |
| Chrome extension | Manifest V3, TypeScript, minimal permissions |
| Payments | Razorpay Subscriptions (INR), a USD provider (Stripe or Paddle, CFO to advise) |
| Email | Resend; WhatsApp Business alerts later (feature N2) |
| Analytics and errors | PostHog, Sentry |
| Security checks | Hakscan run on every release |

Existing waitlist: separate public repo `Qivalabstech/QIvareach.coom` (folder `qiva-reach-waitlist/`), Vercel project serving www.qivareach.com, Supabase project `bzkwtanutwbzcdvlqjay` with table `public.waitlist` and functions `join_waitlist`, `waitlist_count`.
