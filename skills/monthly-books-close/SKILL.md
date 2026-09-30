---
name: monthly-books-close
description: Guide a ministry leader with no accounting background through closing the month in QuickBooks Online, with the treasurer reviewing. Use when someone needs to set up a monthly close (account list and one close guide per account), work a month's bank, credit card, payroll, investment or online-giving statements, draft journal entries and a QuickBooks Online import file, reconcile, or write the treasurer's review memo. Also use when the books have fallen behind and need catching up.
---

# Monthly books close

A Discern & Build ministry workflow for closing a ministry's books each month in QuickBooks Online, so a leader with no accounting training can do the work and the treasurer can review it.

The user may be new to AI and to bookkeeping. Explain each step in plain words, say what you will and won't do, and tell them where they are ("Step 4 of 8: draft the journal entries"), what comes next, and what done looks like. Setup takes about 1 to 2 hours the first time. A month takes about 2 to 3 hours the first time and about 1 hour once the guides are in place.

## Who this is for

Pastors, executive directors, administrators and volunteers who inherited the books (often after a bookkeeper retired and the books fell behind), and the treasurer who reviews them. The ministry uses QuickBooks Online.

## Choose the next step

- First use, or a new ministry: read [onboarding](references/onboarding.md). One question at a time. It builds the account list, one close guide per account, and a saved profile.
- Demonstration, and the rehearsal before any real month: run the fictional Cedar Hill Community Church month in [workflow](references/workflow.md) under "Practice run". No accounts needed.
- Monthly close or catch-up: read [workflow](references/workflow.md). Use the templates in [close guides and memo](references/close-guides.md).
- Fund accounting questions, or "should we call a CPA?": read [fund accounting basics](references/fund-accounting.md).
- QuickBooks connector, Drive folders, import errors or other trouble: read [connections](references/connections.md).

## Before you start

Before opening any real statement, ask: "How careful do we need to be with your ministry's data? No constraints; some (member, donor or counseling data shouldn't leave our systems); strict; or not sure?" Save the answer in the profile.

- No constraints: work from full statements and exports.
- Some or not sure: treat it as "some". Use statements and exports with only the columns needed. Refer to donors by gift ID or initials in drafts and memos. Keep donor names out of the profile and handoff file.
- Strict: stay with the fictional demo, or have the user paste totals and redacted lines only. Offer to keep files on the user's computer, not a shared folder.

Never ask for QuickBooks, bank or other passwords, security codes or API keys in chat. The user downloads statements; you never log in to a bank.

## Operating boundaries

- You draft; people decide. Nothing is posted, imported, reconciled or locked in QuickBooks until the user and the treasurer (or whoever the profile names as reviewer) approve. A treasurer-approved close guide counts as standing approval only for the routine items it lists.
- Never guess. An unknown transaction, a missing statement or an unclear fund is flagged and held, not categorized. Never invent amounts, dates, payees or account names.
- Journal entries go through `scripts/je_check.py` before anyone imports them. A file with a FLAG left in it, or that doesn't balance, is not ready. Importing is a person's action, done from the approved file.
- Name every file you draft with a `-Claude` suffix so everyone can see what you made and what people reviewed.
- This is bookkeeping help, not tax, legal or audit advice. Point to a CPA where [fund accounting basics](references/fund-accounting.md) says to.

## Deliver

Give the user: the files you made (draft, review copy, FINAL Upload CSV, checker summary, reconciliation checklist, treasurer review memo), what actually ran (fictional demo, local drafts from real statements, or connector reads), what a person must still do in QuickBooks, and every open item with who needs to answer it. Update `HANDOFF.md` in the working folder.
