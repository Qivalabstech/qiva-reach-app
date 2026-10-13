# For Arman: what to do for Gate G1

Short version: find 10 test users, run a timed session with each, and do five small checks. Everything is in plain steps. The app is live at **https://qiva-reach-app.vercel.app**. Ask the CTO for help at any point.

## 0. First, two approvals (15 minutes)
1. Read `company-brain/03-decisions-log.md`, line **D-008** (build started early). Tell Razam Sir "approved" or ask a question.
2. Skim the feature specs in `docs/specs/` (A2, A3, A4, B1, B2, C1, C2, C3). Each is one page. Tell the CTO "approved" or what to change.
3. Privacy policy: add one line before real users try the app: "To learn your writing voice and write drafts, we send the posts you paste and your notes to an AI provider (Anthropic). We do not show your posts to other users." (Question Q-004.)

## 1. Find 10 test users
Who: people who post on LinkedIn at least weekly. A mix: founders, consultants or coaches, marketers, an agency owner. At least 3 who are not friends.
Ask each person with a message like this:

> Hi <name>, I'm testing a tool that writes LinkedIn posts in your own voice. Can you give me 20 minutes? You paste a few of your old posts, the tool writes a new draft, and you tell me if it sounds like you. Your posts are used only for this test, are sent to an AI provider to write the draft, and are never shown to anyone else. OK?

Keep their "yes" in writing (a chat message is enough). For each person get:
- **5 to 20 of their real past posts** (copy and paste into a text file). No posts with private client details.
- **3 topics** they might write about.

## 2. The timed session (about 20 minutes each, one person at a time)
Before the session, have the person's posts ready in a text file, separated by a line with three dashes (`---`). Use a stopwatch.

1. Say: "Open the link, sign up, and set up your account. Go as fast as you like."
2. Start the stopwatch when they open **https://qiva-reach-app.vercel.app/sign-in**.
3. They sign up with their email, pick a goal and a niche, paste their posts and click "Learn my voice".
4. On "Your voice", ask: "Does this describe how you write?" (yes, mostly, no). Write the answer down (this is the B1 tone check, section 6).
5. They go to "Write a post", type one of their 3 topics, and click "Write my post".
6. **Stop the stopwatch when the first draft appears on screen.** Write the time down. Target: under 5 minutes.
7. Ask them to read the draft and rate **voice match, 1 to 5**: 1 not me, 2 mostly not me, 3 somewhat me, 4 mostly me, 5 sounds exactly like me. Do this for 3 drafts (3 topics). Write down all three ratings and any comment in their own words.
8. Record everything in `docs/g1-test-log.md` (the CTO creates it; or use any spreadsheet and send it).

Gate G1 needs: all 10 reach a draft in under 5 minutes, and **7 of 10 rate 4 or 5** (use each person's best draft).

If a person gets stuck, note exactly where. Do not help until they have been stuck for a minute; that is the finding.

## 3. B2 blind test (20 minutes each, you and 2 other people)
1. Open `docs/blind-test/b2-samples.md`. Do not open `b2-answer-key.md` yet.
2. Read the 10 posts. For each, write which style it is: Professional, Story-led, Contrarian, Hinglish-friendly or Data-driven. Each style appears twice.
3. Then open the answer key and count correct answers. **Pass: at least 8 of 10 for each person.**
4. Send the CTO the three scores and which styles were confused.

## 4. C1 relevance rating (15 minutes)
Open `docs/quality/c1-relevance-sheet.md`. For each of the 60 ideas, write yes (relevant to that niche and goal, and a real person in that niche could post it) or no. **Pass: at least 16 of 20 yes in each of the 3 niches.**

## 5. C3 favourite-hook check (20 minutes)
1. Take 10 drafts: use the drafts the test users get in section 2 (or ask the CTO for 10 sample drafts).
2. Open a draft, click "Improve the hook". Read the 10 options. **Pick your favourite before you look at the scores.** Write it down.
3. Check whether your favourite is in the top 3 by score. **Pass: yes for at least 6 of the 10 drafts.**

## 6. B1 tone check (inside the 3 first sessions)
For 3 test users, ask: "Does this tone describe how you write?" Record yes, mostly or no. **Pass: at least 2 of 3 say yes or mostly.**

## 7. Safari check (20 minutes)
On an iPhone (Safari) and on a Mac (Safari), open the live link and do: sign in with email, set goal and niche, paste 5 posts, learn voice, write a post, improve the hook, get 20 ideas. Write down anything that looks broken (screenshot it) and send it to the CTO.

## What to send the CTO when done
The test log, the blind-test scores, the relevance sheet with your yes/no marks, the hook check, the tone check answers and any Safari screenshots. The CTO updates `docs/gate-g1-checklist.md` and the status board.
