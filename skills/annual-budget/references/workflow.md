# Budget workflow

Load the profile and `HANDOFF.md`. At each step tell the user which step they are on, what it produces, why the checkpoint exists, and what done looks like. Keep the order: plan in conversation first, then build, then write, then review. Building a workbook before the plan is agreed usually means rebuilding it. Encourage the user to give you the goal and context in their own words and to ask you to push back on anything that looks unrealistic.

## Practice run (fictional, no accounts)

Do this before the first real budget. Use `assets/demo-actuals-and-forecast.csv` and `assets/demo-planning-notes.md` (Cedar Hill Community Church, 2027). Build the workbook tabs in [workbook and memo](workbook-and-memo.md), find the lowest cash month in each scenario, write the one-page memo, then answer the treasurer's three fictional questions as a second round and log what changed. For question 2, if you have no web search, say so and leave the inflation assumption a placeholder for the treasurer; never state a figure you didn't look up. Label every output "Fictional sample data". About an hour.

## Step 1 of 7: plan the year in conversation

Before any spreadsheet, talk it through with leadership: what the ministry hopes the year will do, what is changing (staff, programs, buildings, a major gift ending), what worries them, and the calendar to the board vote. Ask one question at a time. Summarize the plan in `HANDOFF.md` and read it back. Why: numbers without an agreed plan get rebuilt. Done: the user agrees the summary is right.

## Step 2 of 7: gather the numbers

Collect last fiscal year's actuals by month, this year's actuals to date by month, and the current budget, from a verified QuickBooks connector or the user's exports (Profit and Loss by Month). Ask the treasurer for this year's forecast for the remaining months, or draft one from last year's pattern and label it a draft. Why: the forecast, not last year, is usually the best starting point. Done: each budget line has last year, this year to date and a forecast beside it, with the source named.

## Step 3 of 7: set the assumptions

One row per assumption: ID, what it is, proposed value, basis or source, who decides, and status (confirmed, proposed or placeholder). Cover giving (and its monthly pattern, which is often heavy in December), designated and restricted gifts (budget the gifts and their spending together, so restricted money never props up the operating result), programs and one-time or capital items on their own lines, staff costs, inflation, and any conditional project (include it only if leaders confirm it). Budget on the same basis the books use (cash, accrual or modified cash), so budget-vs-actual reports compare like with like. Staff costs are placeholders built by a stated rule, such as "this year plus the inflation assumption"; the board or its committee sets real pay. Clergy housing allowance must be designated by the board in advance; flag it if it applies. Why: a number without a named source and owner can't be defended at the board meeting. Done: every number the workbook will use has an assumption row and an owner.

## Step 4 of 7: build the workbook

In one focused working session, build the tabs in [workbook and memo](workbook-and-memo.md) with formulas tied to the assumptions, so changing one assumption updates everything. Check that the line totals equal the income and expense totals and that each month's ending cash equals the next month's starting cash. Save as `YYYY Budget DRAFT-Claude.xlsx`, or one CSV per tab if you can't make spreadsheets. Why: formulas tied to assumptions let a treasurer's question change one cell instead of rebuilding the workbook. Done: changing one assumption moves every dependent total and the checks pass.

## Step 5 of 7: test it

Run the scenarios. For each, find the lowest month-end cash and whether it stays above the floor, how much reserve draw it would need, and the break-even giving level. Offer a second check: a fresh chat or a second model audits the workbook against the assumptions and grades it; fix anything below an A before the treasurer sees it. Why: a formula error found by the board costs trust; found here, it costs a minute. Done: each scenario has its lowest month, draw and break-even written down.

## Step 6 of 7: write the board memo

One page, following [workbook and memo](workbook-and-memo.md): what the board approves first, then headlines, scenarios, what changed and why, placeholders and open items, and suggested motion wording for the chair or secretary to finalize. Why: a board that can't see what it is approving either delays the vote or approves assumptions it never meant to. Done: a board member can see in ten seconds what a yes vote commits the ministry to.

## Step 7 of 7: review rounds and approval

The user sends the draft to the treasurer or finance committee. Log each question in the workbook's Questions tab, answer it with the figures, change the workbook where needed, and report what changed. Move old drafts to `_superseded`. Before the vote, confirm the approval plan: who presents, when, where the motion wording lives (the agenda) and who records the vote in the minutes. After approval, true up placeholders to the board's decisions, and if the ministry's QuickBooks Online plan includes budgets, help the user enter the approved budget by month so budget-vs-actual reports work all year. Why: the vote, the minutes and the file must match, or next year's comparisons start from the wrong budget. Done: the approved budget is saved in `Final`, matches the minutes, and `HANDOFF.md` records the vote date.

## Follow-up prompts

- "Here are the treasurer's questions. Answer each with the numbers and update the workbook."
- "Show me the year without the new position."
- "Which month is cash lowest in the downside case? What would we do?"
- "Audit this workbook as a skeptical finance committee member. Grade it."
- "The board approved it. Make the final version and a monthly budget I can enter in QuickBooks Online."
- "Explain our budget to a new board member in five plain sentences."
