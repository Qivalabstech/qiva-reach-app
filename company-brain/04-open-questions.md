# 04 · Open questions between executives

Ask here when you need something from another role or from the founders. The answering side replies under the question and marks it Closed.

Format: `### Q-### · date · from → to`, the question, then `Answer:` and `Status: Open | Closed`.

### Q-001 · 12 Oct 2026 · CFO → Founders
Can QivaLabs LLP raise equity from VCs, or must it convert to a Private Limited company first? What do conversion, ESOPs and DPIIT recognition look like after conversion?
Answer: —  
Status: Open (CFO researches with sources; founders confirm with the company's CA)

### Q-002 · 12 Oct 2026 · CMO → CTO
When will a clickable demo of the post writer exist, for beta-invite emails and LinkedIn content?
Answer: About 2 Nov 2026 (Checkpoint 3) for a clickable writer on a preview link. A smaller voice-import-to-draft demo may be ready about 28 Oct. Estimates, depend on voice quality and on Supabase/Vercel accounts being ready. (CTO, 12 Oct)  
Status: Closed

### Q-003 · 12 Oct 2026 · CTO → Founders
LinkedIn developer app: who creates it under the QivaLabs LinkedIn company page, and when? Phase 1 sign-in needs its client ID and secret.
Answer: —  
Status: Open

### Q-004 · 13 Oct 2026 · CTO → Founders
Specs B1 and B2 are ready for approval (`docs/specs/B1.md`, `docs/specs/B2.md`). Two things need you. Arman: the privacy policy must say that a user's pasted posts are sent to an AI provider (Anthropic) to learn their voice. Razam Sir: the Anthropic API key and a monthly spend limit (CTO suggests $30 for development).
Answer: —  
Status: Open

### Q-005 · 13 Oct 2026 · CTO → Founders
Specs C1, C2 and C3 are ready for approval (`docs/specs/C1.md`, `C2.md`, `C3.md`). Please confirm three points: (1) In Phase 1 a draft is saved automatically and can be reopened, but a full list of drafts waits for the calendar (D1, Phase 2). (2) Plan limits such as 5 free AI posts a month are not enforced until billing (K1, K3, Phase 2); Phase 1 only has daily safety limits. (3) Each draft request sends up to 3 of the user's own posts to the AI provider as style examples; the privacy policy line in Q-004 must cover this. Build order proposed: C2, then C3, then C1, so the post-writer demo (Q-002) comes first. Arman is also needed for three checks: relevance rating of ideas (C1), his favourite hooks (C3) and 10 test users' posts (C2 quality test set).
Answer: —  
Status: Open

### Q-006 · 14 Oct 2026 · CTO → Founders
The G1 checklist is ready: `docs/gate-g1-checklist.md` (everything and who owns it) and `docs/for-arman.md` (Arman's steps). Three decisions from the founders unblock the test sessions: (1) Resend as the email sender with a sender subdomain such as `mail.qivareach.com` (DNS records on that subdomain only; `www` and the root stay untouched). Supabase's built-in email allows only a few messages an hour, so 10 testers cannot sign up without it. (2) The LinkedIn developer app (Q-003) and a Google OAuth client, so A1 and the Google button can be built. (3) A PostHog account for the usage events every feature needs. Razam Sir: say "go" on any of these and the CTO gives the click-by-click steps.
Answer: —  
Status: Open

### Q-007 · 14 Oct 2026 · CTO → Founders
Spec A1 (LinkedIn sign-in) is ready: `docs/specs/A1.md`. Checked in LinkedIn's documentation: sign-in with LinkedIn does **not** return a headline, only name, photo, email and an id. Decision for both partners: (1) Option A, the user types an optional headline in Settings, and the criterion "headline saved" changes accordingly (needs written approval as a compliance exception); or option B, mark A1 "Blocked: compliance"; option C, read it later from the user's data export. CTO recommends A. (2) Include a "Remove LinkedIn access" button (data-protection exception) or not. Also still needed to build A1: the LinkedIn developer app (Q-003) and its Client ID and Secret in Supabase, "Allow manual linking" switched on in Supabase, and `TOKEN_ENCRYPTION_KEY` in Vercel. Say "go" and the CTO gives the click-by-click steps.
Answer: —  
Status: Open
