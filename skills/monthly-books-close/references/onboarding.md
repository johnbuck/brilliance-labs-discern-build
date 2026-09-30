# Onboarding: set up the monthly close

Start with the user's request. If they want to see how it works, run the practice month in [workflow](workflow.md) first and come back. Otherwise look for `monthly-books-close-profile.json` and `HANDOFF.md` in the folder they name, reuse what is there, and ask only about gaps. Ask one question, wait, then continue. Never hand over a list of questions.

Tell the user up front: "Setup takes about 1 to 2 hours. We'll list every account the ministry has, then write a short close guide for each one. After that, each month mostly follows the guides."

## Questions, in order (one at a time)

1. "Which ministry is this for, and when does your fiscal year start?"
2. "Where should we keep the close files?" Recommend one shared folder the treasurer can also open (for example a synced Google Drive folder that Claude Desktop's Cowork can work in directly, or a Claude Project if files must stay in chat). Suggest subfolders: `Close guides`, `Statements/YYYY-MM`, `Working files`, `Final uploads`.
3. The data-sensitivity question from SKILL.md, if not already answered.
4. "Who reviews the close, and how do they like to approve things: a reply by email, a comment in the memo, or a meeting?" Don't assume the title. Record role and approval method.
5. "Are the books current? What was the last month fully reconciled in QuickBooks Online?" If months are behind, plan a catch-up: oldest month first, one month at a time, same steps.
6. "Are the books kept on a cash basis, accrual, or a modified cash basis (for example, investments shown at market value)?" Explain the difference in a sentence (see [fund accounting basics](fund-accounting.md)). If the user doesn't know, record it as an open question for the treasurer or CPA; it decides whether the monthly investment entries include unrealized gains.
7. Build the account list, one account at a time: "What's the next account the ministry has money in or owes money on?" Prompt through checking, savings, credit cards, payroll, investment accounts, online giving or payment processors, loans, and, if the ministry holds any, digital-asset accounts. For each, record: a nickname (last four digits at most, never a full account number), its exact QuickBooks Online account name, whether it has a bank feed, how the statement arrives (PDF, CSV or both), and who can download it.
8. "Which classes do you use in QuickBooks Online?" Explain: classes tag each line by purpose, such as ministry areas, administration and fundraising. If none exist, note that and suggest a CPA or the treasurer decide before adding them.
9. "Do you track restricted or designated funds? How?" See [fund accounting basics](fund-accounting.md). Record fund names only, never donor names.
10. "Is there a written payroll allocation (what share of each role goes to each class)?" If not, record it as an open question for the treasurer. Don't propose percentages as decisions.
11. "Should routine items the guide covers (a known utility bill, a recurring software charge) be posted from the bank feed without separate approval, or should the treasurer see everything first?" Record the answer.

## Write the close guides

For each account, draft a one-page guide from the template in [close guides and memo](close-guides.md), numbered in the order the close runs: bank accounts with feeds first (so transfers are already recorded), then credit cards, payroll, online giving, and investments. Name them like `1. Checking close guide-Claude.md`. Ask the treasurer to read and approve each guide; the approved guide is the standing instruction for that account.

## Save the profile

Save `monthly-books-close-profile.json` in the chosen folder, never inside the installed skill. Leave unknowns empty; don't invent them. Fields: `schema_version` (1), `ministry_name`, `fiscal_year_start_month`, `accounting_basis` (as the treasurer or CPA confirms), `working_folder`, `data_sensitivity`, `reviewer` (role, approval method), `routine_feed_items` (`guide-approved` or `review-first`), `accounts` (nickname, qbo_account_name, type, bank_feed, statement_format, guide_file, order), `classes`, `funds`, `payroll_allocation_status`, `last_reconciled_month`, `flag_threshold` (amount above which any single item goes to the treasurer), `open_questions`. No passwords, account numbers, balances or donor names.

Also create `HANDOFF.md` with: what the ministry is, where files live, the last closed month, decisions made, and open questions. Explain that it lets a new chat, the treasurer or another computer pick up cold. Close by saying exactly where both files were saved and that the next step is the practice run in [workflow](workflow.md), then the oldest open month.
