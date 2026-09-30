# Connections and trouble

Check what this session can actually do before promising anything. Tool names vary by setup; never claim a connector exists because this file mentions one. The CSV path below works with or without connectors, and a person can always type an approved entry by hand.

| Need | Options, best first | How to verify | Fallback |
|---|---|---|---|
| Work in the ministry's folder | Claude Desktop Cowork on a local or synced folder (for example a synced Google Drive folder); a Google Drive connector if the user's plan includes it | List the month folder and open one statement | User uploads files to the chat or a Claude Project |
| Read QuickBooks Online | A QuickBooks connector, if connected | Pull one balance and compare it with the QuickBooks screen before relying on it; reports can differ by date range or fiscal-year setting | User exports Balance Sheet, Profit and Loss and account lists to CSV or Excel |
| Post to QuickBooks Online | A person imports the FINAL CSV (steps below) | Import preview shows every entry balanced | Enter each entry by hand from the checked file, with the user |
| Statements | User downloads PDFs or CSVs from each bank or provider site | You can read the ending balance | Paste figures; scanned PDFs may need a CSV instead |
| Review copy | XLSX with highlights if your tools can make spreadsheets | Opens with flags visible | `...-Claude REVIEW.csv` with Decision and Comment columns |

Never ask for passwords, security codes or API keys in chat, and never log in to a bank. Even with a connector that can write, post only after the treasurer approves that exact file and that route.

## Importing the FINAL file (verified against Intuit's help, August 2026)

In QuickBooks Online: Settings (gear), Import Data, Journal Entries. Browse to the FINAL CSV, Next, map each column to the QuickBooks field, Next, read the preview, Start import, Done. Intuit's sample file uses these columns: Journal No., Journal Date, Account Name, Journal/Description, Debits, Credits. Name is required only on lines that use an Accounts Receivable or Accounts Payable account. Class and Location import only if they are turned on in Account and settings. Every account must already exist, and a sub-account is written `Parent:Sub-account`. Intuit suggests turning account numbers off during the import. Menus and column names change over time; if the screen differs, follow the screen and its sample file. If Journal Entries does not appear under Import Data in the user's region or plan, the checked file is still the approval record: the user enters each entry by hand (+ New, Journal entry) from it.

## The checker

Run from the skill folder with Python 3.9 or later; it uses only the standard library, reads and writes local files, and posts nothing.

```sh
python3 scripts/je_check.py assets/demo-draft-journal-entries.csv --out demo-output/demo-FINAL.csv --period 2026-03
python3 scripts/je_check.py assets/demo-reviewed-journal-entries.csv --out "demo-output/2026-03 Demo JEs-Claude FINAL Upload.csv" --period 2026-03 --accounts assets/demo-qbo-accounts.csv --classes assets/demo-qbo-classes.csv
```

The first stops on the FLAG; the second writes the clean file and a summary. For real work, write the output to the ministry's `Final uploads` folder, never inside the skill. Input needs Journal No, Journal Date, Account, Debits and Credits; Description, Name, Class and Location are optional. Output columns match Intuit's sample: Journal No., Journal Date, Account Name, Debits, Credits, Description, plus Name, Class and Location when used; map Description to the Journal/Description field if it doesn't match automatically. `--accounts` and `--classes` take lists exported from QuickBooks Online and catch a misspelled account before the import does. `--date-style iso` writes YYYY-MM-DD if the company isn't set to US dates.

## Recovery

- **"Line Account invalid" on import:** use the full name with parent and sub-account separated by a colon, spelled exactly as QuickBooks displays it. Re-run the checker with `--accounts`.
- **"Class invalid":** use the full class path and confirm class tracking is on.
- **Duplicate journal number warning:** use a new number, or ask the treasurer before changing the duplicate-number setting.
- **Import blocked by the closing date:** the entry is dated in a locked period. Don't change the closing date to force it; ask the treasurer whether the entry belongs in the open month instead.
- **Imported twice:** a balance will be too high by a recognizable amount. Stop. The user deletes the duplicate entries in QuickBooks with the treasurer's agreement; you don't retry.
- **Reconciliation not 0.00:** look for an unposted feed line, a transfer entered on both sides, a duplicate download, or an entry that hit the wrong account. Uncleared checks are normal.
- **Spreadsheet changed the file:** regenerate the FINAL from the reviewed draft with the checker.
- **Connector figure looks wrong:** trust the QuickBooks screen and dated reports; note the difference in `HANDOFF.md`.
