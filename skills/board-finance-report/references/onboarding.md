# Onboarding: set up board reporting

If the user just wants to see it, run the practice quarter in [workflow](workflow.md) first. Otherwise look for `board-finance-report-profile.json` and `HANDOFF.md` in the folder they name, and ask only about gaps. One question at a time; never a questionnaire. Setup takes about 30 minutes.

## Questions, in order (one at a time)

1. "Which ministry is this for, and when does the fiscal year start?"
2. "Who receives the packet (full board, finance committee, elders), and how often: monthly or quarterly?"
3. "Who reviews the draft before the board sees it, and how do they like to comment: comments in a Word or Google Doc, a reply by email, or a comment sheet?" Don't assume the title. Record role and method.
4. The data-sensitivity question from SKILL.md, if not already answered.
5. "Where should we keep the packet files?" Recommend one folder the reviewer can open, for example a synced Google Drive folder that Claude Desktop's Cowork works in directly, with subfolders `Exports/YYYY-MM`, `Drafts`, `Final`, and `_superseded` for old drafts.
6. "Is the board's budget in QuickBooks Online, or in a spreadsheet?" This decides whether you use the Budget vs Actuals report or a Profit and Loss plus a budget file. Ask whether the budget was set month by month or spread evenly; the comparison should use the board's own monthly timing.
7. "Can you share one past board report the board liked?" Use it for tone, length and order, not as authority for any number.
8. Build the line mapping with the user: QuickBooks Online has many accounts; the board needs about 8 to 15 lines. Propose groupings from the chart of accounts ("Tithes and offerings" gathers these income accounts; dividends, investment fees and unrealized gains become one "Investment return, net" line below the operating result) and ask the user to confirm each group. Keep the same mapping every period so the board can compare. Ask which accounting basis the books use and record it; if the user isn't sure, note it for the treasurer.
9. "What policies should the packet report against?" For example a minimum cash balance, an operating reserve target, or a limit on reserve draws. Record the policy wording and who adopted it; don't invent a policy.
10. "What counts as a variance worth explaining?" Suggest a percent and a dollar floor together (for example 10 percent and 500 dollars for a small church); the treasurer decides.

## Save the profile

Save `board-finance-report-profile.json` in the chosen folder, never inside the installed skill. Leave unknowns empty. Fields: `schema_version` (1), `ministry_name`, `fiscal_year_start_month`, `audience`, `frequency`, `reviewer` (role, comment method), `data_sensitivity`, `working_folder`, `budget_source` (`qbo` or `file`), `budget_phasing` (`monthly` or `even`), `line_mapping` (board line, type, QuickBooks accounts), `policies` (name, wording, adopted by), `variance_threshold` (percent, dollars), `name_donors` (true or false), `accounting_basis`, `open_questions`. No passwords, balances or donor names.

Create or update `HANDOFF.md`: last packet, where files are, decisions, open questions. Explain that it lets a new chat or the treasurer pick up cold. Say where both files were saved and what comes next.
