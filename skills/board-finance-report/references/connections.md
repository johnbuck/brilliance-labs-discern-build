# Connections and trouble

Check what this session can actually do before promising anything. Tool names vary; never claim a connector exists because this file mentions one. Exports always work.

| Need | Options, best first | How to verify | Fallback |
|---|---|---|---|
| QuickBooks Online reports | A QuickBooks connector, if connected | Pull one total and compare it with the same report on the QuickBooks screen; check the date range and fiscal-year setting | User runs the report and exports it to Excel or CSV |
| Files in the ministry's folder | Claude Desktop Cowork on a local or synced folder; a Google Drive connector if the user's plan includes it | Open one export from the folder | Upload files to the chat or a Claude Project |
| Packet document | Word or Google Docs file if your tools can make one | Opens with headings and table intact | Markdown or HTML the user pastes into their template |
| Appendix | XLSX with live formulas if your tools can make one | Totals recalculate | One CSV per tab |
| Treasurer comments | Comments in the document, an email the user pastes, or a comment log sheet | Every comment has a number | User pastes comments into the chat |

In QuickBooks Online, reports are under Reports; Profit and Loss, Balance Sheet and Budget vs. Actuals (in plans that include budgets) each have an export option. Never ask for passwords.

## The comparison script

Python 3.9 or later, standard library only, no network calls. From the skill folder:

```sh
python3 scripts/bva.py --actuals assets/demo-actuals.csv --budget assets/demo-budget.csv \
  --explanations assets/demo-variance-notes.csv --pct 5 --min-amount 500 \
  --title "Cedar Hill Community Church" --period "First quarter 2026" --out demo-output
```

For real work, write to the ministry's `Drafts` folder, never inside the skill.

- `budget.csv`: `Category,Type,Amount`, where Type is `income` or `expense`.
- `actuals.csv`: `Category,Amount`; add `Type` for any line not in the budget.
- `variance-notes.csv` (optional): `Category,Explanation,Confirmed by`.
- Category names must match between files (case and spacing don't matter). Amounts may use `$`, commas and `(100)` for negatives. Lines starting with `#` are comments.
- A line is flagged when its variance is at least `--min-amount` dollars and at least `--pct` percent of budget; an unbudgeted line is flagged at `--min-amount`.

Outputs: `budget-vs-actual.csv` and `budget-vs-actual.html` (one self-contained page, charts drawn inline, no outside scripts or fonts). The page is marked as a draft for treasurer review.

## Recovery

- **Totals don't match the Profit and Loss:** an account was left out of the mapping or counted twice. Compare account by account.
- **Connector and screen disagree:** trust the dated report on screen; note it in `HANDOFF.md`.
- **Budget vs Actuals report not available in the user's plan:** export the Profit and Loss and use the budget spreadsheet.
- **Budget spread evenly but giving is seasonal:** say so beside the table, or rebuild the budget column from the board's monthly plan.
- **Script says a line has no Type:** add a Type column to the actuals file for that line.
- **Output exists:** use a new folder for each draft, or `--overwrite` on purpose.
