# Connections and trouble

Check what this session can actually do before promising anything. Tool names vary; never claim a connector or spreadsheet tool exists because this file mentions one. Exports and CSV always work.

| Need | Options, best first | How to verify | Fallback |
|---|---|---|---|
| Past and current actuals | A QuickBooks connector, if connected | Pull one year's total income and compare it with the Profit and Loss on the QuickBooks screen | User exports Profit and Loss by Month to Excel or CSV |
| Files in the ministry's folder | Claude Desktop Cowork on a local or synced folder; a Google Drive connector if the user's plan includes it | Open one source report from the folder | Upload to the chat or a Claude Project |
| Workbook | XLSX with live formulas, if your tools can make spreadsheets | Change one assumption and confirm the totals move | One CSV per tab, which the user imports into Excel or Google Sheets and you explain which formulas to add |
| Public figures such as inflation | Web search, if available | Cite the publisher and date | Treasurer supplies the figure |
| Enter the approved budget | QuickBooks Online budgets, if the ministry's plan includes them | Budget vs. Actuals report runs for one month | Keep the approved budget spreadsheet for board-finance-report |

Never ask for passwords. Reading QuickBooks is fine once verified; you don't change anything in QuickBooks during budgeting unless the user asks after approval.

## Recovery

- **Last year isn't closed:** build from what is closed, label the rest estimated, and list it as an open item. The monthly-books-close skill can help catch up.
- **Formulas broke after editing in another app:** rebuild from the Assumptions tab; keep inputs only there.
- **Totals don't match the Profit and Loss:** an account is missing from the line mapping or counted twice. Compare account by account.
- **Treasurer and leadership disagree on an assumption:** show both versions side by side as scenarios and let the board or finance committee decide. Don't pick.
- **A new chat has lost the thread:** read `HANDOFF.md`, the Questions tab and the latest draft before doing anything else.
- **Workbook too large to review:** give the treasurer the Assumptions, Scenarios and Decisions tabs first; the detail supports them.
