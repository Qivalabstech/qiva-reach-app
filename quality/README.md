# Voice quality test set

Purpose: Gate G1 needs 7 of 10 test users to rate "voice match" 4 or 5 out of 5. This folder holds the test users and the way we score.

## For Arman: collecting a test user
1. Ask the person for permission. Tell them their posts are used only to test Qiva Reach and are sent to an AI provider.
2. Get 5 to 20 of their real LinkedIn posts (copy and paste is fine) and 3 topics they might write about.
3. Make a file `quality/users/<first-name>.json` (copy `example.json`): `name`, `posts` (list of texts), `notes` (3 topics or rough notes).
4. Do not put names of other people or private client details in the posts.

## Running the test (Razam Sir or the CTO)
```bash
npm run quality
```
It writes `docs/quality/report-<date>.md` with 3 drafts per user: word count, banned phrases found (must be 0), signature phrases used, seconds and cost. Show each user their 3 drafts and ask for a rating:

| Rating | Meaning |
|---|---|
| 1 | Not me |
| 2 | Mostly not me |
| 3 | Somewhat me |
| 4 | Mostly me |
| 5 | Sounds exactly like me |

Write each user's rating (best of their 3 drafts, plus the average) in the report's last column. Gate G1: at least 7 of 10 users rate 4 or 5.

The `example.json` user is made up. It only shows the format and checks the script works.
