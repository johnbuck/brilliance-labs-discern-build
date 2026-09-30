# Connections

No connection is required. The demo and every batch can run from a minimal CSV export. For donor data, an export with chosen columns is usually safer than a live connection, because Claude then sees only what the task needs. Check what is actually available in this Claude app before suggesting anything, and say plainly what you found.

| Need | Options | How to verify | Fallback |
|---|---|---|---|
| Giving data | A CSV export from the church management or donor system (for example Planning Center, Breeze or Bloomerang), or from QuickBooks Online | Open the export and confirm the header row has only the needed columns | The user types first names, funds and bands into a short list |
| Live donor system | A connector for their system, if one exists and the user chooses it | Read only the fields in Workflow Step 1 for one recent gift | Use an export instead |
| Past letters for the voice profile | Uploaded files, a folder Claude can work in (Claude Desktop's Cowork or Claude Code), or a Google Drive connector | Open one sample and confirm with the user that the leader wrote it | The user pastes samples with names removed |
| Letters and emails | A Gmail or Outlook connector, for drafts only and only when asked | Open the draft in the mailbox; confirm nothing was sent | The user copies drafts or merges them in Word, Google Docs or their email tool |
| Call reminders | A calendar connector, only with the user's okay to add events | Read back the created event | A dated list for the caller |

Tool names vary. Discover them at runtime; never claim a connector exists, and don't install anything because this table mentions it. A connection counts as working only when it has read the specific file or record you need. Never ask for passwords or API keys in chat.

## Recovery

- The export has extra columns (addresses, notes, exact amounts): stop, don't echo them, and ask for a leaner export or drop those columns before continuing.
- Missing first names: flag the rows; the leader chooses a greeting such as "Dear friends".
- Household duplicates: combine into one letter only if the user confirms they are the same household.
- The drafts drift from the leader's voice: re-read the profile and samples, rerun the sniff test, and ask the leader for one example of what's wrong.
- A donor asked not to be contacted or thanked publicly: honor it, and remind the user to record it in their own system.
- A new chat lost the context: open the profile, `HANDOFF.md` and the major-donor plan first.
