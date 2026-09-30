---
name: finance-dashboard
description: Build a simple finance dashboard for a church or ministry from every spreadsheet (.xlsx/.csv) in a folder, covering giving, expenses, budget vs actual, and trends, with plain-English takeaways. Interviews a non-technical person step by step. Use when someone wants to see, analyze, summarize, or chart their ministry's finances, donations, giving, budget, or spreadsheets.
---

# Build a finance dashboard from a folder of spreadsheets

You are helping someone who is **not technical** turn a folder of spreadsheets into a one-page
dashboard, usually in a 30-minute hands-on class. Follow the tone rules in the project's CLAUDE.md.
Many people find money stressful. Be calm and matter-of-fact, and never alarming.

Tools (run from the workspace root, after `npm install` if `node_modules/` is missing):
- `node .claude/skills/finance-dashboard/scripts/scan.mjs <folder>`: lists every file, sheet, and
  column, with the kind of values in each (date, money, number, id, text) and examples.
- `node .claude/skills/finance-dashboard/scripts/build.mjs <project>/dashboard.config.json`: builds
  `dashboard.html` and `summary.json` next to the config, and includes `insights.json` if present.

## Step 1: Welcome + which folder

One short message: "Let's build a dashboard from your spreadsheets. I'll look through the files,
check with you what they are, and then build a page with charts and a plain-English summary."

Ask (AskUserQuestion, header "Folder"):
- Use the practice church spreadsheets (Recommended): `sample-data/finances` (a fictional church, Cedar Creek)
- Use a folder on my computer

If they pick their own folder: explain they can **drag the folder onto this window** to paste its
location, or type it. Remind them gently to use only data they're allowed to use on this laptop.

## Step 2: Look through the files (scan)

Run `scan.mjs` on the folder. Then tell them **in plain English** what you found. One line per file,
no column jargon. For example:
- "**Giving 2025.xlsx**: every gift in 2025 (6,177 gifts), with the date, the fund, the amount, and how it was given."
- "**Expenses 2025.xlsx**: the 2025 bills, one tab per quarter."
- "**Budget 2026.xlsx**: this year's budget, by category and month."
- "**Special Events.xlsx**: a list of events with revenue and costs. I'll show it as a table."

Then ask (AskUserQuestion, header "Check"): "Did I read these right?"
- Yes, that's right (Recommended)
- Something's off, let me explain

Decide each file's role yourself from the scan (don't ask about column names):
| role | use for | needs |
|---|---|---|
| `income` | gifts, donations, offerings, revenue | `date`, `amount`; optional `category` (fund), `person` (donor/envelope ID), `method` |
| `expense` | bills, payments, ledger of spending | `date`, `amount`; optional `category`, `payee` |
| `ledger` | one sheet with both money in and out | `date`, `amount`, plus `type` (column saying income/expense) **or** signed amounts (negative = expense) |
| `budget` | budget by category | `category`, `annual` and/or `months` (12 column names), optional `type` (Income/Expense column), `year` |
| `table` | anything else worth showing | `title` |

Files split over several tabs with the same columns: use `"sheet": "*"`. Files with a title row
above the headers are handled automatically.

## Step 3: What matters to them

Ask (AskUserQuestion, header "Questions", multiSelect: true): "What do you most want to know?"
- Are we on budget?
- Is giving up or down from last year?
- Where does our money go?
- How do people give (check, online, …)?
- Are there seasonal patterns?

Then (AskUserQuestion, header "Look"): "How should it look?"
- Brilliance Labs style (Recommended)
- A style I captured earlier: only offer this if `my-projects/*-style/style.css` exists; use its path as `style`
- (Other lets them describe something)

If you don't know the organization's name yet, ask for it in plain chat (the sample is "Cedar Creek Community Church").

## Step 4: Build

1. Create `my-projects/<org-short-name>-dashboard/` (e.g. `my-projects/cedar-creek-dashboard/`).
2. Write `dashboard.config.json` there. `folder` is relative to the config file:
   ```json
   {
     "organization": "Cedar Creek Community Church",
     "title": "Church Finances",
     "subtitle": "Finance Dashboard · 2026",
     "folder": "../../sample-data/finances",
     "currency": "USD",
     "style": "brilliance",
     "sources": [
       { "file": "Giving 2025.xlsx", "sheet": "Donations", "role": "income", "date": "Date", "amount": "Amount", "category": "Fund", "person": "Donor ID", "method": "Method" },
       { "file": "giving_2026_jan-sep.csv", "role": "income", "date": "Gift Date", "amount": "Gift Amount", "category": "Designation", "person": "Envelope #", "method": "Payment Type" },
       { "file": "Expenses 2025.xlsx", "sheet": "*", "role": "expense", "date": "Date", "amount": "Amount", "category": "Category", "payee": "Vendor" },
       { "file": "expenses-2026.csv", "role": "expense", "date": "Date", "amount": "Amount", "category": "Category", "payee": "Payee" },
       { "file": "Budget 2026.xlsx", "role": "budget", "year": 2026, "category": "Category", "type": "Type", "annual": "Annual Budget", "months": ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"] },
       { "file": "Special Events.xlsx", "role": "table", "title": "Special Events" }
     ]
   }
   ```
   (That is the correct config for the practice folder. For other folders, build it from the scan.)
   Budget categories are matched to income/expense categories by name, ignoring upper/lower case.
   If the names differ slightly, mention it and suggest renaming in the spreadsheet, or leave it.
3. Run `build.mjs`. If it prints notes (missing columns, skipped rows), fix the config and rerun.
4. **Read `summary.json`** and write `insights.json` in the same folder: 3–5 takeaways that answer the
   questions they picked, in this shape:
   ```json
   [ { "title": "Giving is up 8%", "text": "…two or three plain sentences with specific numbers…", "tone": "good" } ]
   ```
   `tone` is `good`, `watch`, or `info`. Rules for insights:
   - Use specific numbers from summary.json, rounded kindly ("about $580,000", "up 8%").
   - Explain *why* when the data shows it (e.g. one large one-time expense, like a roof repair, explains
     most of an over-budget category; seasonal items like Christmas or summer camp aren't "behind").
   - Note that the current month is partial if the last date is mid-month.
   - Describe; don't prescribe. No financial advice, no blame, no alarm. "Worth a look" beats "problem".
   - Never single out individual donors.
5. Run `build.mjs` again so the takeaways appear, then open `dashboard.html` in their browser.
6. In chat, give a 3-line tour: the numbers at the top, the charts (hover for exact amounts, and
   "Show as a table" under each), and the takeaways.

## Step 5: Keep going

Offer 2–3 next things they could say:
- "Why is building maintenance over budget?" (answer from the data, e.g. `summary.json` topExpenses)
- "Add a chart showing just the Building Fund each month"
- "Make a one-page summary I can print for the finance committee"
- "Use my own spreadsheets instead"

For changes the builder doesn't support (new charts, different sections), copy `build.mjs` and
`lib.mjs` into their project folder, edit the copy, and run the copy. Never edit the class originals.
Keep new charts consistent: same colors (income `--series-1`, expenses `--series-2`), thin bars
with rounded ends, hover tooltips, a "Show as a table" view, one y-axis only.
