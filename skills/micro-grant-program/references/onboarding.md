# Guided onboarding

Start from the user's request. If they want the demo, run it without an interview. Otherwise look for `micro-grant-program-profile.json` in their chosen folder and reuse it. If there is none, begin: "Which church or ministry gives these grants, and is this a new fund or one you already run?"

Ask one focused question at a time, say in a sentence why you are asking, and keep working on anything that doesn't depend on the answer. Never show this list as a questionnaire. Setup takes about 20 to 30 minutes of conversation.

1. The fund: its name, purpose in a sentence, and who may apply (for example churches and ministries within a set area).
2. Rhythm and size: rounds per year and when they open and close, grant range, and the usual total per round. Numbers come from the user.
3. Existing records: "Where do past applications, awards and reports live today?" Several spreadsheets, form responses and inbox threads are normal. If records exist, plan to combine them first (Workflow Step 2) and explain why: every later step depends on one trustworthy list.
4. Rubric: "Do you score applications against written criteria?" If not, offer to draft one with four or five criteria on a 1 to 3 scale (see `assets/demo-rubric.md`) for the committee to adopt.
5. People: who coordinates, who reviews, who decides, who signs letters, who pays. Record names or roles exactly as given.
6. Reports: what grantees report (photos, receipts, a short story, numbers served) and when it is due (for example six months after the award).
7. Voice: a past award letter or announcement they liked; faith language they use.
8. The data-sensitivity answer from SKILL.md.
9. Workspace: explain the options and let them choose.
   - A folder Claude can work in directly (Claude Desktop's Cowork, a synced Google Drive folder, or Claude Code).
   - A claude.ai Project holding the rubric, templates and project instructions, if their plan includes Projects.
   - Plain chat with uploaded exports.
   Offer to start a `HANDOFF.md` there with context, decisions and next steps, so a new chat or teammate can pick up cold.
10. Connectors: check what is actually connected (see [connections](connections.md)) before suggesting exports.

Save `micro-grant-program-profile.json` with these non-secret fields. Leave unknowns empty; never invent them.

- `schema_version`: 1
- `fund`: name, purpose, eligibility, area
- `rounds`: per_year, open_close_pattern, grant_range, typical_total
- `rubric`: criteria list with scale, adopted (yes or no), adopted_date
- `people`: coordinator, reviewers, decider, letter_signer, payer
- `reports`: what_to_include, due_rule, report_form_location
- `records`: master_record_location, id_pattern, snapshot_location
- `voice`: tone, faith_language, words_to_avoid
- `data_sensitivity`, `workspace`, `output_folder`
- `open_questions`

The profile holds settings only. Never store applicant contact details, grantee stories, bank details or passwords in it. Merge changes into an existing profile rather than overwriting it, and tell the user where it was saved. Close by offering the demo or Step 1.
