# Workflow: measure, fix, re-check (7 steps)

At each step, say "Step N of 7", what done looks like and what comes next. Keep every result in one scorecard CSV (copy [the template](../assets/scorecard-template.csv)); add rows on each re-check and never overwrite old ones. If Claude can work in a folder (Cowork or Claude Code), keep the scorecard, fact sheet and `HANDOFF.md` there.

## Step 1 of 7: confirm the fact sheet
Draft a one-page fact sheet from the website: official name, address, phone, email, service or program times, what you offer and for whom, languages, accessibility, public leadership roles. A person confirms every line. Done: a dated, confirmed fact sheet. Why: accuracy is judged against it, and every fix is written from it.

## Step 2 of 7: write 10 to 15 real questions
Mix four kinds, in the words a neighbor would use:
- By city: "What churches in [city] have programs for teenagers?"
- By need: "Where can I get free groceries in [city] on a Saturday?"
- By ministry type: "Is there a Spanish-language church near [neighborhood]?"
- By name: "What time are services at [ministry name]?" and "What is [ministry name] known for?"
Draw on what people actually call or email about. In real use, about 13 questions was enough. Done: the user agrees these are questions real people ask. Why: the same questions, asked the same way every time, are what make later checks comparable.

## Step 3 of 7: run the baseline
For each assistant: start a new chat (so earlier conversations don't color the answer), turn web search on if the assistant offers it, and note whether it was on. Ask each question exactly as written; assistants often guess your location, so keep the city in the question. The user runs assistants in their own accounts and pastes the answers; Claude can answer the questions itself with web search, if available, and label those rows as Claude's. Record in the scorecard: mentioned (yes/no), accurate (yes, partly, no, or n/a), what was wrong, sources cited, who checked. Run the name questions twice if time allows; answers vary. Done: every question has a row for each assistant. Why: a written baseline is the only way to know later whether anything changed.

## Step 4 of 7: read the results and choose fixes
Summarize in plain language: how often you were mentioned, per assistant; every wrong fact and where it seems to come from; which sources assistants cite (those are where they learn about you); which similar ministries are mentioned and what their pages do well. Then list fixes from [fixes](fixes.md), highest impact first, each with an owner. Put the list in a review sheet (fix, owner, decision, comment) for the approver. Done: approved fix list. Why: the cited sources tell you which page or listing to fix first.

## Step 5 of 7: apply the fixes
Wrong facts first, then missing pages, then structured data and extras. Site changes go through the website-rebuild skill or the ministry's site editor, with a preview before anything goes live. Listing owners update their own listings. Page fixes can often ship the same day; listings can take days to update. Done: each fix marked published, with the date. Why: a wrong fact on your own site is the one thing you can correct today, and assistants copy it.

## Step 6 of 7: check the fixes
Second-model check: before a person calls it finished, ask a fresh chat or a second model to audit the published pages against the fact sheet: the same name, address and phone everywhere, structured data passing a validator, the FAQ answering the real questions; grade it, fix anything below an A, and report what changed. Done: the audit reports no differences from the fact sheet. Why: a second reader catches the typo the first one made.

## Step 7 of 7: re-check on a routine
Re-run the same questions the same way: weekly for the first month after fixes, then monthly. Assistants refresh at different speeds, so changes can take weeks to appear, or may not appear at all. If the user's plan includes scheduled tasks, set one to run Claude's own checks and remind the user to run the others; otherwise set a calendar reminder. Report changes since the last check, not just totals. Done: a dated re-check in the scorecard and a two-line summary for leadership. Why: one check is a snapshot; the trend is what tells you whether the fixes worked.

## Useful follow-up prompts
- "Summarize our scorecard: what changed since last month, and what's still wrong?"
- "Draft an FAQ page from our 13 questions, using only facts from our fact sheet."
- "Write Church structured data for our homepage from the fact sheet, and tell me how to validate it."
- "List every place our old service time still appears online."
- "Explain the robots.txt choices in plain words so our leaders can decide."
- "Set up a monthly re-check and remind me which assistants I need to run myself."
- "Make a one-page dashboard of our scorecard that I can show the board."
