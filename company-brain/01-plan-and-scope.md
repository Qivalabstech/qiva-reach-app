# 01 · Plan and locked scope (Scope v1.0, locked 11 Oct 2026)

Source of truth for what gets built and when. Status of each feature lives in `02-status-board.md`, not here.

## Scope lock rules

1. No feature is added to any phase.
2. No feature is removed, split or cut down.
3. No feature moves between phases.
4. No acceptance criterion is weakened.
5. New ideas go to the parking lot (bottom of this file) and are reviewed after 30 Jun 2027.

Only exceptions, each needing written approval from both Designated Partners (Rajamuddin and Arman Hussain) in `03-decisions-log.md`: **compliance** (LinkedIn, Chrome Web Store, payments, tax or data-protection rules require it), **security** (fixes a vulnerability or data exposure), **bug fix** (makes a locked feature meet its own criteria). If a phase runs late, the date moves; the scope does not.

## Definition of done (every feature)

- Meets every acceptance criterion in the register below
- Passes the LinkedIn compliance gate (see `00-company.md`)
- Works on Chrome, Safari and a 390 px phone screen
- Row-level security on every new table and a clean Hakscan run
- Tracked in PostHog with at least one usage event
- One-paragraph help note written
- Demoed to 3 beta users or both partners

## Phases and exit gates

### Phase 0: Validation and setup · 12–25 Oct 2026 (2 weeks)

Goal: Prove people want it, start every account and approval, and write the specs Phase 1 builds from. No product features are built.

Owners: Razam Sir: specs, LinkedIn app, accounts. Arman Hussain: interviews, waitlist outreach, legal pages.  
Budget: ≈ ₹35,000 · Depends on: Nothing  
Features: none

Work packages:
- Trademark search for "Qiva Reach" (classes 9 and 42), buy the domain, set up business email
- Deploy the waitlist page, connect it to Google Sheets or Supabase, add PostHog
- 20 customer interviews (8 founders, 6 consultants, 4 agencies, 2 marketers) with one fixed script
- Create the LinkedIn developer app under QivaLabs LLP; enable Sign In and Share; apply for the Community Management API
- Write one-page specs for the 28 Phase 1–2 features and wireframes for 12 core screens
- Publish privacy policy, terms, refund policy, cookie notice and DPDP notice
- Open Razorpay (LLP KYC), USD payment provider, GitHub, Vercel, Supabase, PostHog, Sentry, Resend and Chrome Web Store accounts
- Both partners start daily build-in-public posts on LinkedIn

Exit gate G0:
- 300 waitlist signups
- 15 people commit in writing to a founding plan
- All 28 Phase 1–2 specs signed by both partners
- LinkedIn app live with Sign In and Share enabled

Main risk: Fewer than 300 signups. Extend Phase 0 by a week and rework the headline and posts; do not start Phase 1 without the gate.

### Phase 1: Foundation build · 26 Oct–8 Nov 2026 (2 weeks)

Goal: Build the app skeleton, sign-in, onboarding and the writing engine so a new user gets a draft in their own voice.

Owners: Razam Sir: build. Arman Hussain: recruits 10 test users and collects voice samples.  
Budget: ≈ ₹15,000 · Depends on: Gate G0; LinkedIn Sign In enabled  
Features: A1, A2, A3, A4, B1, B2, C1, C2, C3

Work packages:
- Next.js and Supabase projects; development, staging and production environments; GitHub branch rules
- 14 core tables with row-level security on every table; audit_log and ai_usage logging from day one
- Sign-in (A1, A2) with encrypted LinkedIn token storage
- Onboarding screens (A3, A4) and LinkedIn data-export parser
- Voice Engine (B1, B2) with the prompt library under version control
- Writer (C1, C2, C3) with a banned-phrase check on every output
- Quality test set: 10 users' real posts, a 5-point voice rubric and a scoring script

Exit gate G1:
- All 9 features meet their acceptance criteria
- 10 test users each reach a draft in under 5 minutes
- 7 of 10 test users rate voice match 4 or 5 out of 5
- Row-level security verified on every table

Main risk: Drafts sound generic. Spend up to 3 extra days on prompts and the voice profile; scope does not change.

### Phase 2: Core product · 9–29 Nov 2026 (3 weeks)

Goal: Finish the writer, add scheduling, Circles, the Chrome extension, billing and admin, then pass a security review.

Owners: Razam Sir: build, extension, security. Arman Hussain: Razorpay activation, GST invoice format with the CA, Circle rules.  
Budget: ≈ ₹45,000 · Depends on: Gate G1; LinkedIn Share scope working  
Features: A5, C4, C5, C6, D1, D2, E1, E2, E3, E4, F1, F2, K1, K2, K3, K4, L1, L2, N1

Work packages:
- Week 1: writer complete (A5, C4, C5, C6)
- Week 1: calendar and publishing job with retries (D1, D2), tested on 2 internal accounts
- Week 2: Circles (E1–E4) and 3 starter Circles
- Week 2: Chrome extension (F1, F2) loaded unpacked for testing
- Week 3: billing (K1–K4) in test mode, then live ₹1 and $1 payment and refund
- Week 3: admin and safety (L1, L2, N1); rate limits on every route
- Week 3: external security review; fix all high and critical findings; clean Hakscan run
- Regression pass on all 9 Phase 1 features

Exit gate G2:
- All 19 features accepted and Phase 1 still passes
- 100 scheduled test posts publish with ≥ 99% success
- Live payments and refunds work in INR and USD
- Zero open high or critical security findings

Main risk: The tightest phase. The end date can move by up to a week; nothing is cut.

### Phase 3: Private beta · 30 Nov–27 Dec 2026 (4 weeks)

Goal: Put the product in the hands of 50 real users, fix what breaks, get the extension approved and build the free SEO tools.

Owners: Arman Hussain: recruitment, onboarding calls, support. Razam Sir: fixes, M3, store submission.  
Budget: ≈ ₹30,000 · Depends on: Gate G2  
Features: M3

Work packages:
- Invite 50 users into 3 starter Circles (about 17 each)
- 20-minute onboarding call per Circle; publish a WhatsApp support number
- Weekly Friday releases with bug fixes only
- Weekly 5-question survey and 10 one-to-one calls; log every issue
- Submit the extension to the Chrome Web Store in week 1
- Build M3: 5 free tools and 50 programmatic pages; submit the sitemap
- Help centre: one note per launch feature, FAQ, account-safety page
- Launch kit: Product Hunt page, launch posts, 3 waitlist emails, founding code for 200 uses

Exit gate G3:
- 50 beta users onboarded
- 60% of beta users publish 2+ posts a week for the last 2 weeks
- Chrome extension approved and listed
- M3 accepted; zero open critical bugs; no account restrictions reported
- 20 beta users agree to pay at launch

Main risk: Users try it once and stop. Fix onboarding and voice quality inside existing features; extend beta by up to 2 weeks.

### Phase 4: Public launch · 28 Dec 2026–5 Jan 2027 (Launch 5 Jan)

Goal: Switch everything to production, open sign-ups and run the launch. No new features.

Owners: Razam Sir: systems and monitoring. Arman Hussain: launch outreach and support.  
Budget: ≈ ₹20,000 · Depends on: Gate G3  
Features: none

Work packages:
- Production readiness: tested backup restore, uptime monitoring, error alerts to both phones, status page
- Payments live; founding-member code active for the first 200 yearly plans
- Launch day 5 Jan: founder posts, Product Hunt, founder communities, waitlist emails in 3 batches
- Support rota: replies within 4 business hours; daily bug triage at 7 PM IST
- Day-1 and day-7 review notes

Exit gate G4:
- Product public and billing live
- 10 paying accounts in the first 7 days
- Zero open critical bugs for 7 days
- No account restriction caused by the product

Main risk: Launch-day outage. Batched emails keep load gradual; founder posts can slip a day.

### Phase 5: V1 growth release · 6 Jan–31 Mar 2027 (12 weeks)

Goal: Improve quality, open the agency market and switch on referral growth while supporting paying customers.

Owners: Razam Sir: build. Arman Hussain: agency sales, affiliates, support.  
Budget: ≈ ₹1,20,000 · Depends on: Gate G4; G1 also needs API approval  
Features: B3, B4, C7, C8, D3, D4, D5, E5, E6, F3, F4, G1, H1, H2, H4, I1, I2, J1, J2, J4, M1, M2, N2

Work packages:
- Sprint 5A (6 Jan–2 Feb): B3, B4, C7, C8, I1, I2
- Sprint 5B (3 Feb–2 Mar): J1, J2, J4, E5, E6, F3, F4, N2
- Sprint 5C (3–31 Mar): H1, H2, H4, D3, D4, D5, G1, M1, M2
- Support within 4 business hours; monthly top-10 issue review
- Onboard 5 pilot agencies, including QivaLabs clients
- Sign 20 affiliates
- 100 more programmatic pages and 4 comparison pages
- In-app annual-plan offer in month 2 of every monthly plan

Exit gate G5:
- All 23 features accepted (G1 may be "Blocked: compliance")
- 30 paying accounts
- Monthly logo churn under 8%
- 3 agencies on the Agency plan

Main risk: Support load slows the build. Arman takes first-line support; sprint dates move, scope does not.

### Phase 6: V2 scale release · 1 Apr–30 Jun 2027 (13 weeks)

Goal: Finish company-page and agency reporting, add deeper analytics and harden for scale. Closes Scope v1.0.

Owners: Razam Sir: build. Arman Hussain: company-page sales, agency reports, support hire.  
Budget: ≈ ₹2,00,000 · Depends on: Gate G5; G2 and G3 need API approval  
Features: C9, D6, F5, G2, G3, H3, J3

Work packages:
- Sprint 6A (April): H3, C9, F5
- Sprint 6B (May): G2, G3, J3
- Sprint 6C (June): D6, performance tuning, load test at 5× users, security re-review
- Hire part-time customer success once MRR passes ₹2 lakh
- Marketing ₹50,000 a month from June; ads only if payback is under 3 months
- Scope v1.0 close-out report; open the parking lot; draft Scope v2.0

Exit gate G6:
- All 7 features accepted (G2, G3 may be "Blocked: compliance")
- 120 paying accounts
- MRR at least ₹2.2 lakh
- Gross margin at least 80%

Main risk: Company-page API approval never arrives. G2 and G3 are recorded as blocked; no substitute feature is added.

## Locked feature register (59 features)

| ID | Phase | Module | Feature | Acceptance criteria |
|---|---|---|---|---|
| A1 | 1 | Onboarding | Sign in with LinkedIn | LinkedIn OpenID Connect login works; name, photo and headline saved; no password or session cookie stored; token encrypted at rest |
| A2 | 1 | Onboarding | Email and Google sign-up | Email magic link and Google login both work; the account can connect LinkedIn later |
| A3 | 1 | Onboarding | Goal and niche setup | User picks 1 of 4 goals and a niche (list or free text); both editable in settings |
| A4 | 1 | Onboarding | Voice import | Accepts 5–20 pasted posts or the LinkedIn data-export file; fewer than 3 posts shows a clear message |
| B1 | 1 | AI Voice Engine | Voice profile | Stores tone, average length, emoji use, banned and signature phrases; user can view and edit each field |
| B2 | 1 | AI Voice Engine | Tone presets | 5 presets (Professional, Story-led, Contrarian, Hinglish-friendly, Data-driven) give visibly different output in a side-by-side test |
| C1 | 1 | Content Studio | Idea generator | 20 niche-relevant ideas per click in under 10 seconds; no duplicates within a session |
| C2 | 1 | Content Studio | Post writer | Topic or notes become a 120–250 word post in under 20 seconds in the user's voice; automated banned-phrase check passes |
| C3 | 1 | Content Studio | Hook lab | 10 hook options per post, each with a 1–10 strength score and one-click swap |
| A5 | 2 | Onboarding | First draft in 5 minutes | Median time from sign-up to first saved draft is under 5 minutes in PostHog |
| C4 | 2 | Content Studio | Rewrite tools | Shorten, expand, make punchier, add story and add CTA each return in under 10 seconds; undo works |
| C5 | 2 | Content Studio | LinkedIn preview | Mobile and desktop preview; "see more" cut-off marked at LinkedIn's current truncation, re-checked monthly |
| C6 | 2 | Content Studio | Formatting toolbar | Unicode bold and italic, line breaks, bullets, emoji; counter warns at LinkedIn's 3,000-character limit |
| D1 | 2 | Scheduler | Content calendar | Week and month views; drag to reschedule; draft, scheduled, published and failed states; times in the user's time zone |
| D2 | 2 | Scheduler | Publish via official API | Text and single-image posts publish within 2 minutes of schedule; post ID stored; 3 retries then email with copy-and-post fallback; 99% success over 100 tests |
| E1 | 2 | Community (Circles) | Join Circles | Browse and join up to the plan limit; Circle size 20–50; leave at any time |
| E2 | 2 | Community (Circles) | Post alerts | Members get an email alert within 5 minutes of a member's post going live; daily-digest option |
| E3 | 2 | Community (Circles) | Engage queue | Shows Circle posts from the last 48 hours; each opens on linkedin.com in a new tab; mark as done |
| E4 | 2 | Community (Circles) | Reciprocity score | Given-to-received ratio updated daily and visible to the member; below 0.5 for 14 days means fewer alerts on their own posts |
| F1 | 2 | Comment Co-pilot | Chrome extension | Manifest V3; "AI suggest" button under posts on linkedin.com; minimal permissions; never clicks Post; approved on the Chrome Web Store |
| F2 | 2 | Comment Co-pilot | Comment suggestions | 3 suggestions in the user's voice in under 5 seconds; chosen one inserted into the comment box; user submits manually |
| K1 | 2 | Billing | Plans and trials | Free, Starter, Pro, Agency as priced in the blueprint; 7-day trial; self-serve upgrade, downgrade and cancel; limits enforced |
| K2 | 2 | Billing | Razorpay and USD payments | INR through Razorpay subscriptions (UPI autopay and cards); USD through the chosen provider; webhooks update plan state within 1 minute |
| K3 | 2 | Billing | AI credit metering | Every AI call logged with tokens and cost; per-plan limits; top-up packs purchasable; user sees remaining usage |
| K4 | 2 | Billing | GST invoices | Invoice with QivaLabs GSTIN and CA-confirmed tax code generated per payment, emailed and downloadable |
| L1 | 2 | Admin | Admin console | Search users; view plan and usage; issue refunds; move Circle members; shows the 9 KPI numbers |
| L2 | 2 | Admin | Abuse controls | Rate limits per user and IP; spam flags; suspend user; remove from Circle; every action written to audit_log |
| N1 | 2 | Notifications | Email notifications | Welcome, published, failed, trial-ending and invoice emails sent through Resend; unsubscribe on non-transactional emails |
| M3 | 3 | Growth | Free SEO tools | 5 tools live (hook generator, post formatter, character counter, headline generator, carousel templates) plus 50 programmatic pages, each with a sign-up call to action, indexed in Search Console |
| B3 | 5 | AI Voice Engine | Brand knowledge base | Up to 10 documents or links (offer, case studies, bio); drafts use their facts correctly in 9 of 10 tests |
| B4 | 5 | AI Voice Engine | Learning from edits | User edits update the voice profile weekly; average edit share per draft falls over 4 weeks for active users |
| C7 | 5 | Content Studio | Carousel maker | Post becomes a 5–10 slide PDF at 1080×1350 in 3 brand templates; downloadable |
| C8 | 5 | Content Studio | Repurpose | Blog URL, pasted transcript or voice note becomes 3–5 draft posts |
| D3 | 5 | Scheduler | Best-time suggestions | 3 suggested slots a week from the user's own engagement data; labelled niche defaults when data is thin |
| D4 | 5 | Scheduler | Queue and evergreen recycle | Empty slots fill only from approved drafts; evergreen posts re-queue no sooner than 90 days |
| D5 | 5 | Scheduler | First comment | User's own first comment posts with the post through an approved API scope; if no scope allows it, a one-click copy reminder at publish time |
| E5 | 5 | Community (Circles) | Private Circles | Invite-only Circles with invite link; owner can add and remove members |
| E6 | 5 | Community (Circles) | Quality moderation | Members report low-effort comments; AI flags generic ones; 3 confirmed reports give a warning, 5 remove the member |
| F3 | 5 | Comment Co-pilot | Reply assistant | Reply suggestions for comments on the user's own posts inside the extension; user posts manually |
| F4 | 5 | Comment Co-pilot | Daily comment goals | User sets a daily target; streak counter; reminder by email or push |
| G1 | 5 | Company Page | Company page publishing | Schedule posts to pages the user administers via the Community Management API; marked Blocked if LinkedIn has not approved access |
| H1 | 5 | Analytics | Post performance | Impressions, reactions and comments per post from granted API scopes or the uploaded LinkedIn export; refreshed daily |
| H2 | 5 | Analytics | Weekly insight email | Every Friday at 6 PM IST: best post, best hook type, best time, posting streak |
| H4 | 5 | Analytics | Follower growth tracker | Weekly follower count from API or manual entry; 12-week trend chart |
| I1 | 5 | Inspiration | Hook and post template library | 500+ original hook and post-structure templates written by QivaLabs, tagged by niche and format; no copied third-party posts |
| I2 | 5 | Inspiration | Swipe file | Save hooks, posts and ideas with tags; searchable |
| J1 | 5 | Agency and Team | Multi-profile workspace | One login manages profiles up to the plan limit; each has its own voice, calendar and Circles |
| J2 | 5 | Agency and Team | Approval workflow | Draft, client review link (no login), approve or request changes, then scheduled; comments on drafts; email at each step |
| J4 | 5 | Agency and Team | Roles and seats | Owner, editor and client-viewer roles enforced on the server |
| M1 | 5 | Growth | Referral programme | Unique link; give one month, get one month; credit applied automatically after the referred user's first payment |
| M2 | 5 | Growth | Affiliate programme | 30% recurring for 12 months; affiliate dashboard; monthly payout report; published terms |
| N2 | 5 | Notifications | WhatsApp and browser push alerts | Circle alerts through an approved WhatsApp Business template and browser push; opt-in per channel with an off switch |
| C9 | 6 | Content Studio | Image generator | Quote cards and simple visuals in brand colours at 1080×1080 and 1200×627 |
| D6 | 6 | Scheduler | Document and video posts | PDF carousels and native video publish through the API where scopes allow |
| F5 | 6 | Comment Co-pilot | Target list | Saved list of up to 100 people to engage with, added by the user; daily reminder with links; no data fetched from LinkedIn |
| G2 | 6 | Company Page | Employee advocacy | Page admin notifies team members of new page posts; members engage manually; participation leaderboard |
| G3 | 6 | Company Page | Page analytics | Follower growth and post performance for company pages through the Community Management API |
| H3 | 6 | Analytics | Content scoring | Ranks the user's topics, formats and hooks by engagement once 20 or more posts are tracked |
| J3 | 6 | Agency and Team | Client report PDF | Monthly white-label PDF per client: posts, engagement, follower growth, top posts |

Launch product (public launch 5 Jan 2027) = the 29 features in Phases 1–3.

## Never built

- Auto-likes, auto-comments, auto-reshares, auto-follows
- Automated connection requests or messages
- Scraping profiles, feeds, search or analytics
- Hidden or headless browsers acting on a user's account
- Storing LinkedIn passwords or session cookies
- Lifetime deals

## Parking lot (review after 30 Jun 2027)

- iOS and Android apps
- X, Instagram, Threads, YouTube
- Hindi and regional-language interface
- CRM, Slack and Teams integrations
- LinkedIn Ads, AI video, public API, enterprise SSO
- Agency white-label on a custom domain
