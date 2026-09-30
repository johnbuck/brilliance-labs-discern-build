# Guided onboarding

Start from the user's request. If they have notes in hand, do setup only as far as that meeting needs and finish the rest later. If they want the sample, run the demo with no interview. Look for `meeting-to-action-profile.json` in the folder they name; ask only for what is missing or changed.

Say: "I'll ask about ten short questions, one at a time, about 10 minutes. I'll save your answers so next time is quick." Ask one question, wait, adapt. Never paste this list as a questionnaire.

1. "Which ministry and which meeting is this for: a board, elders, a committee, or staff? Want to try the fictional sample first?"
2. The data-sensitivity check from SKILL.md. Record the answer.
3. "Where should I keep minutes and action lists?" In Claude Desktop with Cowork, suggest their own meetings folder (a synced shared drive folder works) so they can drop in notes instead of pasting. In a claude.ai Project, show the profile as a JSON block for them to add to the Project's files.
4. "Who are the voting members, and who chairs and who takes minutes?" Names and roles only; no contact details unless they want email drafts addressed. Ask whether to keep the list in the profile.
5. "What do your bylaws say about quorum, and do you follow Robert's Rules of Order or something simpler?" If they don't know, record "to confirm" and keep quorum marked unconfirmed in every draft. Why: a quorum claim in minutes is a legal record.
6. "Can you share one set of approved minutes you like?" Use it for format and level of detail, not content. Minutes record what was done, not everything that was said; ask how much discussion they summarize.
7. "How do your notes usually arrive?" A transcript or notes export from a recording or note tool, a typed document, an agenda with handwritten notes, or a photo. Check [connections](connections.md) for what is actually available.
8. "How do you handle confidential matters?" Executive session practice, pastoral and prayer items, personnel, legal matters. Ask whether minutes should note that an executive session happened, and in what words.
9. "Where do action items go, and how do follow-ups get sent?" For example a shared spreadsheet, a task tool, or an email from the secretary. Ask whether they want one summary email or one per owner, and who sends them.
10. "Who reviews the draft minutes before they go out, and when is your board packet due?"

Save `meeting-to-action-profile.json` in the chosen folder, never inside the installed skill. Fields (unknowns null; never invent):

- `schema_version`: 1
- `ministry_name`, `body_name` (their exact words), `timezone`
- `data_sensitivity`: `none`, `some`, `strict` or `not_sure`
- `members`: name and role list, if the user agreed; `chair_role`, `secretary_role`
- `quorum_rule` (as the bylaws word it, or null), `procedure`
- `minutes_style`: reference document, discussion detail level, executive-session wording
- `confidential_categories`: what is always held out
- `notes_source`: tool or format, where files arrive
- `actions_destination`, `followup_style`, `sender_role`
- `reviewers`, `packet_deadline_rule`
- `open_questions`

Also start an `open-actions.md` (or a sheet) in that folder: the running list of action items across meetings, so each new meeting can check what was due. Explain it doubles as a handoff file for a new secretary or a new chat.

Close by saying what was saved and where, and the next step: "Step 2 of 7: gather this meeting's notes."
