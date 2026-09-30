# Board packet workflow

Load the profile and `HANDOFF.md`. At each step tell the user which step they are on, what it produces, why the checkpoint exists, and what done looks like. Keep the order; the treasurer's review only means something if the figures were tied first. Invite the user to say what "done" looks like (meeting date, audience, anything the board is worried about) and to have you push back or ask questions.

## Practice run (fictional, no accounts)

Do this before the first real packet. Use the Cedar Hill Community Church files in `assets/`. Run the script (command in [connections](connections.md)), then draft the one-page summary from `demo-quarter-notes.md`. Show the flagged lines, which explanations are confirmed and which are "explanation needed". Then work the treasurer's three fictional comments at the end of `demo-quarter-notes.md` into a v2, reporting what changed. The demo has no transaction detail, so comment 3 stays "explanation needed" with a note back to the treasurer; that is the right answer, not a failure. Label every output "Fictional sample data". About 30 minutes.

## Step 1 of 8: confirm the period and the books

Confirm the period (month, quarter or year to date), the meeting date, and the last month closed and reconciled. If the period isn't closed, stop or label everything "preliminary". Why: a packet built on unreconciled books can mislead the board. Done: the period, the meeting date and the books' status are written in `HANDOFF.md`.

## Step 2 of 8: gather the reports

Collect, for the period and year to date: Profit and Loss, Balance Sheet (this period end and a comparison date), Budget vs Actuals or the budget file, and if useful Profit and Loss by Class and the restricted-fund schedule the treasurer keeps. Use a verified QuickBooks connector or the user's exports. Save them in `Exports/YYYY-MM`. Why: every figure in the packet must trace to a dated report; a missing report becomes a guess later. Done: every report is in the folder with its date range visible.

## Step 3 of 8: map lines and run the comparison

Roll accounts into the saved board lines. Investment dividends, fees and market-value changes roll into one "Investment return, net" line shown below the operating result, so market swings don't blur giving and spending. Write `actuals.csv` and `budget.csv` (formats in [connections](connections.md)), then run `scripts/bva.py` with the profile's thresholds. Check that the actual totals equal the Profit and Loss totals before going on. Why: if the roll-up drops an account, every later number is wrong. Done: the script's totals match the Profit and Loss to the dollar.

## Step 4 of 8: draft variance explanations

For each flagged line, look at the transaction detail or ask the user. Write one or two sentences: what happened, whether it is one-time or ongoing, and whether it is timing (money arriving or leaving in a different month than planned) or trend. Put them in `variance-notes.csv` with "Confirmed by" empty. No evidence means "explanation needed". Why: a plausible guess in a board packet is worse than a blank; the board acts on it. Done: every flagged line has a draft explanation or "explanation needed".

## Step 5 of 8: write the draft packet

Build the parts in [packet parts](packet-parts.md): the one-page summary, budget-vs-actual table, charts, balance sheet and cash position against policy, restricted funds, what the board must decide, preparation notes, and the appendix spreadsheet. If the board is voting on something financial, add a decision-items addendum. Name files `YYYY-MM Board financial packet DRAFT-Claude`. Why: most board members read page one and skim the rest, so page one has to carry the whole picture. Done: a reader can get the state of the ministry from page one alone.

## Step 6 of 8: check the ties

Check that the summary, table, charts, appendix and QuickBooks reports agree on income, expenses, net result, cash and net assets. Offer a second check: a fresh chat or a second model audits the draft against the exports and grades it; fix anything below an A before the treasurer sees it. Why: the treasurer's time is best spent on judgment, not arithmetic. Done: every figure on page one appears, identically, in the appendix and a QuickBooks report.

## Step 7 of 8: treasurer review rounds

The user sends the draft to the reviewer. Comments come back in the document, an email or a comment log (columns: number, where, comment, response, status). Work in every comment, fill in "Confirmed by" for confirmed explanations, re-run the script with `--explanations`, and report what changed, comment by comment. Move the old draft to `_superseded`. Repeat until the reviewer says it is final. Why: the treasurer's written confirmation is what turns your draft into the ministry's report, and a comment worked in silently can't be checked. Done: every comment has a response and the reviewer has said "final" in writing.

## Step 8 of 8: finalize

Remove DRAFT from the name, keep `-Claude`, and save to `Final`. The user or board secretary distributes it; you don't. If the user's plan includes artifacts, offer an interactive review page for the board, kept private and without donor names. Update `HANDOFF.md`. Once the routine is steady, suggest a scheduled reminder a week before each meeting if their plan includes it. Why: one clearly named final file keeps the board from acting on a superseded draft. Done: the final file is in `Final` and `HANDOFF.md` says who is sending it and when.

## Follow-up prompts

- "Build the third-quarter packet. Exports are in the September folder. Same format as last time."
- "Here are the treasurer's comments. Work in every one and show me what changed."
- "Audit this packet against the exports as a skeptical board member would. Grade it."
- "Write a one-paragraph cash update I can read aloud at the meeting."
- "Draft a decision-items addendum for the two votes on the agenda."
- "Explain the difference between our operating result and the change in net assets in two sentences a new board member would follow."
