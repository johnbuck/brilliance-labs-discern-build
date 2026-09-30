# Onboarding: set up budget season

If the user wants to see how it works, run the practice budget in [workflow](workflow.md) first. Otherwise look for `annual-budget-profile.json` and `HANDOFF.md` in the folder they name, and ask only about gaps. One question at a time; never a questionnaire. Setup takes about 30 minutes.

## Questions, in order (one at a time)

1. "Which ministry is this for, and what are the dates of the fiscal year we're budgeting?"
2. "When does the board vote on the budget, and does a finance committee or the treasurer review it first?" Work backward from the vote to set dates for the draft, the review rounds and the memo. Don't assume titles.
3. The data-sensitivity question from SKILL.md, if not already answered.
4. "Where should we keep the budget files?" Recommend one folder the treasurer can open, for example a synced Google Drive folder that Claude Desktop's Cowork works in directly, with `Source reports`, `Drafts`, `Final` and `_superseded`.
5. "Is last year closed and reconciled, and how far is this year closed?" The budget rests on these numbers; if they are behind, say so and plan around it. Also ask which accounting basis the books use (cash, accrual or modified cash) and record it; the budget uses the same one.
6. "How is the current budget organized: by account, by ministry area, or both?" Reuse the board's existing lines if they work. If the ministry uses the board-finance-report skill, reuse its line mapping so budget and reports match.
7. "Which decisions belong to the board, and which are delegated?" For example compensation set by a committee, or the pastor approving spending within a line. Record what the user says; don't assume.
8. "Does the ministry have a written cash floor, operating reserve target, or rule for drawing on reserves or an endowment?" Record the wording and who adopted it. If none exists, note that the memo can propose one for the board to adopt.
9. "Who can answer questions about giving trends, program plans and staffing?" Record roles, not private details.

## Save the profile

Save `annual-budget-profile.json` in the chosen folder, never inside the installed skill. Leave unknowns empty. Fields: `schema_version` (1), `ministry_name`, `budget_year` (start, end), `board_vote_date`, `reviewers` (roles, order), `data_sensitivity`, `working_folder`, `budget_lines` (line, type, QuickBooks accounts), `accounting_basis`, `delegations`, `policies` (cash floor, reserve target, draw rule, adopted by), `contacts_by_topic` (roles), `timeline` (draft, review rounds, memo), `open_questions`. No passwords, balances or individual pay.

Create `HANDOFF.md` with the timeline, where files are, decisions so far and open questions. Explain that budget work runs over several sessions and this file lets any new chat, or the treasurer, pick up cold. Say where both files were saved and that the next step is the planning conversation.
