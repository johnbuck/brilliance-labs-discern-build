# Connections

No connection is required. The demo and a full round can run from spreadsheet exports (CSV) and pasted text. Connectors save copying when they exist. Check what is actually available in this Claude app before suggesting anything, and say plainly what you found.

| Need | Options | How to verify | Fallback |
|---|---|---|---|
| Intake form | A Google Form linked to a sheet, Microsoft Forms, or the church website's form builder (neutral examples) | Submit one fictional test entry and find it in the sheet | Applicants email a fill-in document; the coordinator enters rows |
| Master record | A spreadsheet in a folder Claude can work in (Claude Desktop's Cowork, a synced Google Drive folder, Claude Code) or a Google Drive connector | Read the header row and the row count; confirm with the user it is the live copy | User exports CSV and uploads it |
| Impact reports | A report form feeding its own sheet tab; an email inbox; a shared folder for photos and receipts | Match one known report to its grant | User uploads or pastes reports |
| Letters and reminders | A Gmail or Outlook connector, for drafts only and only when asked | Open the draft in the mailbox; confirm nothing was sent | Text the user copies into their own email |
| Snapshot | Spreadsheet tabs, a PDF, or an interactive Claude artifact if the plan includes artifacts | Totals match the master record and the treasurer's books | A one-page summary in chat |
| Optional database | A simple database tool (for example Airtable), only when several forms or people feed the record | Row counts match the spreadsheet it replaced | Keep the spreadsheet |

Tool names vary. Discover them at runtime; never claim a connector exists, and don't install anything because this table mentions it. A connection counts as working only when it has read the specific sheet or folder you need. Never ask for passwords, API keys or form access keys in chat. If an automation uses a key, keep it where only administrators can see it.

## Recovery

- Duplicate submissions: keep the latest complete one, mark the other withdrawn with a note, and tell the coordinator.
- A report won't match: list the closest candidates; the coordinator decides. Never guess.
- The form changed and columns shifted: stop, show the old and new headers, and map them together with the user before adding rows.
- Stale statuses: list every row still "received" or "in review" from a closed round and ask the coordinator for each final status.
- Totals differ from the treasurer's books: the books win. List the differences for the treasurer to reconcile.
- A bulk change went wrong: restore from the backup made before Step 2 and redo it on a fresh copy.
- A new chat lost the context: open `HANDOFF.md` and the profile first.
