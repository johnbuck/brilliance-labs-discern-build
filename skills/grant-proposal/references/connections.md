# Connections

No connection is required. The demo and a full application can run from pasted text and uploaded files. Connectors save copy-pasting when they exist. Check what is actually available in this Claude app before suggesting anything, and say plainly what you found.

| Need | Options | How to verify | Fallback |
|---|---|---|---|
| Funder guidelines | Web reading, if this app has it | Read the page, then confirm deadline and word limits with the user | User pastes the text or uploads the PDF |
| Past materials | Files in a claude.ai Project; a folder in Claude Desktop's Cowork or Claude Code; a Google Drive connector | Open one named document and ask the user if it is the current version | User uploads copies |
| Budget figures | QuickBooks Online connector, if connected; or a QuickBooks report export (Profit and Loss, Budget vs. Actuals) | Read one report; confirm the period and totals with the treasurer | Treasurer pastes line totals |
| Drafts and review | Local files, Google Docs or Word; a Claude artifact to show a board a review page, if the plan includes artifacts | Open the file back after saving | Text in chat the user copies |
| Deadlines and reports | Calendar connector, only with the user's okay to add events | Read back the created event | A dated list the user adds themselves |
| Application portal | None. Claude does not log in to or submit through portals | | The user pastes each answer and submits |

Tool names vary. Discover them at runtime; never claim a connector exists, and don't install anything because this table mentions it. A connection counts as working only when it has read the specific document or report you need. Never ask for passwords or API keys in chat; sign-in happens through the app's own connector flow.

## Recovery

- Can't read the funder's page: ask the user to paste it, and note the date it was copied.
- Guidelines disagree (website versus PDF): show both passages; the user asks the funder or chooses the stricter one.
- Portal counts differently: ask for the portal's count and trim to about 5 percent under.
- Versions tangled: don't overwrite. Start the next numbered version and reconcile with the comment log.
- Numbers disagree between sources: stop that section, list both sources, and let the treasurer decide.
- Deadline too close for honest work: recommend no-go or the next cycle rather than a rushed draft.
- A new chat lost the context: open `HANDOFF.md` and the profile first, then continue.
