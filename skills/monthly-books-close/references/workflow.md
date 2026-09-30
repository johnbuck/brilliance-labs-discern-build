# Monthly close workflow

Load the profile, `HANDOFF.md` and the close guides. At each step tell the user which step they are on, what it produces, why the checkpoint exists, and what done looks like. Keep this order even if a shortcut looks possible; each step depends on the one before. Encourage the user to give you the goal and the files ("close March; statements are in the March folder") rather than micro-instructions, and to ask you to push back when something looks off. New terms (journal entry, debit, reconcile, clearing account) are explained in [fund accounting basics](fund-accounting.md) under "Words you'll meet"; explain them the first time they come up.

## Practice run (fictional, no accounts)

Do this before the first real month; it is the rehearsal. Use `assets/demo-month-statements.md` (Cedar Hill Community Church, March 2026). Walk steps 2, 4, 5 and 6 with it: find the unknown card charge and hold it, identify check 1042 from the check image, and read `assets/demo-draft-journal-entries.csv`. Run the checker on the draft to show a FLAG stopping the file, then on `assets/demo-reviewed-journal-entries.csv` to show a clean FINAL (commands in [connections](connections.md)). Draft a short review memo. Steps 3 and 7 need a QuickBooks Online screen, so talk them through instead: say what the user would see and do. Label every output "Fictional sample data". About 45 minutes.

## Step 1 of 8: open the month

Confirm the month and that the prior month is reconciled. Create `Statements/YYYY-MM` and `Working files/YYYY-MM`. Why: a close builds on the last one; if last month is off, this month will be too. Done: the user knows which statements to download and where to put them.

## Step 2 of 8: gather statements

The user downloads each account's statement (PDF, plus CSV where offered) into the month folder. Read them directly; don't ask the user to retype numbers. Check the set against the account list and record each ending balance as a reconciliation target. Missing statement: that account waits; say so. Why: every number you draft must trace to a statement. Done: every account has a statement or is listed as waiting.

## Step 3 of 8: work the bank feeds

Account by account in guide order (checking first, so transfers are in place for the others), coach the user through the QuickBooks Online bank feed review screen. For each line: match a transfer, accept a rule the guide approves (check both account and class), look up checks from the check images in the statement, and hold anything unknown. Keep a running "questions for the treasurer" list with date, amount and description. Why: fixing a wrong guess later costs more than waiting a day for an answer. Done: every feed line is matched, categorized by the guide, or on the questions list.

## Step 4 of 8: draft journal entries

For accounts the bank feed can't cover, draft entries from the statements, following each guide. Common ones:

- Investments: one entry for dividends, interest and fees; a separate entry for unrealized gain or loss (statement ending market value minus the QuickBooks balance after the first entry). Record unrealized gains only if the ministry's accounting basis calls for it (see [fund accounting basics](fund-accounting.md)); a pure cash-basis ministry may leave investments at cost, and the treasurer decides. Don't record transfers again that the bank feed already booked.
- Payroll: if the payroll service syncs wages without classes, reclass them by the approved allocation table: debit each class's share, credit the same account with no class for the full amount. Do the same for employer payroll taxes if they sync without a class. Clear any payroll holding or clearing account to zero.
- Online giving: record gross gifts by fund, the processing fee as an expense, and clear the clearing account the payout landed in.

Write `YYYY-MM <account> JEs-Claude DRAFT.csv`. Put `FLAG-ACCOUNT`, `FLAG-CLASS` or `FLAG-FUND` in any cell you are unsure of, with the reason in the description. Also make a review copy: a spreadsheet with flagged lines highlighted and "Decision" and "Comment" columns if you can make XLSX files, otherwise `...-Claude REVIEW.csv` with those columns. Why: a draft with every doubt marked is quick to review; a draft with hidden guesses is not. Done: every statement figure that needs an entry is in the draft, and every doubt is a FLAG.

## Step 5 of 8: review round

The user and treasurer fill in decisions and comments. Then read the review copy and work in every answer. Report what changed line by line. Anything still unclear is removed from this month's file and carried to next month. Offer a second check: a fresh chat or a second model audits the draft against the statements and grades it; fix anything below an A before the treasurer sees it. Why: the treasurer's time should go to judgment calls, not arithmetic. Done: no FLAG remains and every change is reported.

## Step 6 of 8: build and approve the FINAL file

Regenerate the upload file from the reviewed draft with `scripts/je_check.py`; never upload a file someone edited in a spreadsheet, because spreadsheets can change dates and strip leading zeros. The checker must say READY. Draft the treasurer review memo from the template in [close guides and memo](close-guides.md). The treasurer approves the FINAL file and memo in the way the profile records. Why: the checker proves every entry balances, and the recorded approval is what makes the import a person's decision. Done: the approval is recorded (an email, a comment or a note in `HANDOFF.md` with the date).

## Step 7 of 8: import and reconcile

After approval, the user imports the FINAL file in QuickBooks Online (steps and the exact columns in [connections](connections.md)), or you post it through a connector only if one is verified and the treasurer approved that route. The first time, have the user read the import preview line by line before selecting Start import; that preview is the rehearsal. Re-check account balances so you know it imported exactly once. Then coach the reconciliation for each account against its statement ending balance until the difference is 0.00. Uncleared checks and deposits in transit stay unchecked; they clear next month. Fill in the reconciliation checklist. Why: the preview is the last look before the books change, and a 0.00 difference proves nothing is missing or doubled. Done: every account reconciles to 0.00 or is listed with the reason it doesn't.

## Step 8 of 8: close out

Update the memo with the reconciled balances, and send nothing yourself; the user shares it. After the treasurer signs off, they may set the closing date in QuickBooks Online (Settings, Account and settings, Advanced) so posted months can't change by accident; explain that a closing-date password makes changes deliberate, not impossible. Update `HANDOFF.md`, the profile's `last_reconciled_month` and any guide the month taught you something about. Once two or three months run cleanly, suggest saving the routine as a scheduled monthly reminder if the user's plan includes it. Why: next month starts from what this one recorded, and the closing date keeps it that way. Done: `HANDOFF.md` says the month is closed and what next month starts with.

## Follow-up prompts

- "Close April using the guides. Statements are in the April folder. Hold anything unknown."
- "Show me every line you flagged and why."
- "Audit the FINAL file against the statements as if you were the treasurer. Grade it."
- "We're six months behind. Plan the catch-up, oldest month first."
- "Update the checking guide with the new recurring charge the treasurer approved."
- "Explain this month's journal entries to me in plain words, one at a time."
