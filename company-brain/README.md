# Qiva Reach Company Brain: the shared memory

This folder is the one shared memory of the Qiva Reach leadership team: the founders and three AI executives. If something is not written here, the other executives do not know it.

| Who | Where they work | How they read the brain | How they write to the brain |
|---|---|---|---|
| Founders: Rajamuddin (Razam Sir, CTO and Designated Partner) and Arman Hussain (Designated Partner, business and sales) | Anywhere | GitHub | Approve decisions; paste BRAIN UPDATE blocks to the CTO |
| CTO, Claude Code | This repository | Directly, every session (imported from `CLAUDE.md`) | Edits the files and commits |
| CMO, Claude Project "Qiva Reach CMO" | claude.ai | GitHub sync into project knowledge (click Sync at the start of a chat) | Ends every working chat with a BRAIN UPDATE block; the founder pastes it to the CTO, who files it |
| CFO, Claude Project "Qiva Reach CFO" | claude.ai | GitHub sync into project knowledge (click Sync at the start of a chat) | Same as CMO |

## Files

| File | What it holds | Who updates it |
|---|---|---|
| `00-company.md` | Company facts, product, positioning, pricing, compliance rules, tech stack | Founders (rarely) |
| `01-plan-and-scope.md` | 7 phases, exit gates, the 59 locked features | Never changed except through an approved exception |
| `02-status-board.md` | Where we are today: phase, gates, numbers, feature status, blockers | Any executive, whenever a number or status changes |
| `03-decisions-log.md` | Decisions a founder approved, newest first | CTO files them; only founder-approved decisions |
| `04-open-questions.md` | Questions from one executive to another or to the founders | Any executive |
| `05-brand.md` | Brand summary for quick reference (full kit: `qiva-reach-brand-kit.html`) | CMO through BRAIN UPDATE |
| `06-finance-baseline.md` | Pricing, unit economics, budget, projections, funding facts | CFO through BRAIN UPDATE |
| `logs/cto.md`, `logs/cmo.md`, `logs/cfo.md` | Each executive's diary, newest entry on top | That executive |

## The BRAIN UPDATE block

Every executive ends each working session with exactly one block in this format. Keep it short and factual. Numbers carry units and dates.

```
### BRAIN UPDATE · <CTO|CMO|CFO> · <DD Mon YYYY>
Done:
- <what was finished, with links or file names>
Decisions proposed (need founder approval):
- <decision> — why
Numbers:
- <metric>: <value> (as of <date>, source)
Status board changes:
- <row>: <old> → <new>
For CTO / For CMO / For CFO:
- <request or information for another executive>
New questions:
- <to whom>: <question>
Next:
- <next 1–3 actions>
```

Leave out any heading that has nothing under it.

## How the CTO files a block (when a founder says "save to brain")

1. Add the block at the top of the matching `logs/<role>.md`, under the `---` line.
2. Apply every "Status board changes" line to `02-status-board.md` and update its "Last updated" line.
3. Add every "New questions" item to `04-open-questions.md` with the next Q number. Mark questions answered in the block as Closed.
4. Add "Decisions proposed" to `03-decisions-log.md` **only** if the founder said in the same message that it is approved. Otherwise add it to `04-open-questions.md` as a question to the founders.
5. Commit with the message `brain: <role> update <date>`.

## Rules for everyone

1. The brain is the truth. If a chat and the brain disagree, the brain wins until a founder changes it.
2. Never write passwords, API keys, bank details, customer emails or personal data into the brain.
3. Never edit another role's log. Use `04-open-questions.md` to ask.
4. Facts from outside sources carry a link. Estimates are labelled "estimate".
5. The scope in `01-plan-and-scope.md` is locked. Proposals to change it go to `04-open-questions.md` addressed to the founders.
