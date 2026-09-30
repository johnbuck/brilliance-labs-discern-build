# Guided onboarding

Start from the user's request. If they want the demo, run it without an interview. Otherwise look for `grant-proposal-profile.json` in their chosen folder and reuse what it says. If there is none, begin: "Which organization is this for, and do you have a funder in mind, or are we setting up for future applications?"

Ask one focused question at a time, say in a sentence why you are asking, and keep working on anything that doesn't depend on the answer. Never show this list as a questionnaire. Setup takes about 20 minutes.

1. Organization basics: legal name, church or 501(c)(3) nonprofit (some funders require an IRS determination letter; a church may or may not have one), fiscal year, annual budget range, region served.
2. Mission in their words: "How would you describe what you do in two sentences, the way you'd tell a neighbor?"
3. Past materials: prior proposals, annual report, current budget, board list, recent financial statements, outcome records, letters of support. Record where each lives and its date, not its contents. If Claude can work in their folder (Cowork, a synced Google Drive folder or Claude Code), nothing needs copy-pasting.
4. Outcomes: "What do you count, and where is it written down?" Note who can confirm each number.
5. Voice: a past proposal or letter they were proud of. Note tone, how much faith language they use, and words to avoid.
6. People: who decides go/no-go, who approves the budget, who reviews drafts, who submits. Record names or roles exactly as given.
7. The data-sensitivity answer from SKILL.md.
8. Workspace: explain the options in plain words and let them choose.
   - A claude.ai Project for each funder relationship, holding the guidelines, materials and project instructions, if their plan includes Projects.
   - A folder Claude can work in directly (Claude Desktop's Cowork, a synced Google Drive folder, or Claude Code).
   - Plain chat with uploads, if neither is available.
   Offer to start a `HANDOFF.md` there (see workflow). Explain why: a new chat, a teammate or another computer can pick up cold.
9. Connectors: check what is actually connected (see [connections](connections.md)) before suggesting exports.

Save `grant-proposal-profile.json` in the chosen folder with these non-secret fields. Leave unknowns empty; never invent them.

- `schema_version`: 1
- `organization`: legal_name, type, determination_letter (yes, no, unknown), fiscal_year_start, budget_range, region
- `mission_short`, `programs` (name, one line, what is counted)
- `materials`: list of type, location, as_of_date
- `voice`: tone, faith_language, words_to_avoid
- `people`: go_no_go, budget_approver, reviewers, submitter
- `data_sensitivity`, `workspace`, `output_folder`
- `funders`: list of name, stage (prospect, LOI, invited, full proposal, awarded, declined), deadline, next_step, reports_due
- `open_questions`

Never store donor names, individual salaries, bank details, portal logins or passwords in the profile. Merge changes into an existing profile rather than overwriting it, and tell the user exactly where it was saved.

Close by summarizing what was saved and offering the next step: the fictional demo first (about 15 minutes, and the safest way to see the whole path), then Step 1 for a real funder.
