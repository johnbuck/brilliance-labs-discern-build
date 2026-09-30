# Guided onboarding

Start from the user's request. If they want the sample, run the demo without an interview. Otherwise look for `church-ai-policy-profile.json` in the folder they name, and ask only for what is missing or changed.

Say at the start: "I'll ask about ten short questions, one at a time. This takes about 15 minutes. Nothing is shared or published; you'll see everything I save." Ask one question, wait, and adapt. Never paste this list as a questionnaire. Skip questions already answered in the conversation or the documents.

1. "Which church or ministry is this for, and do you want to try a fictional example first or start on your own policy?"
2. The data-sensitivity check from SKILL.md. Record the answer.
3. "Where should I keep your work?" In Claude Desktop with Cowork, suggest a folder in their own files (a synced shared drive folder works). In a claude.ai Project, you can't write files: show the profile as a JSON block and ask them to add it to the Project's files. Explain why: next time, nothing has to be asked again.
4. "What tradition or denomination are you part of, and who formally approves policies: elders, a board, a session, a council, or someone else?" Use their exact words for the approving body from then on.
5. "What already says who you are? For example a statement of faith, mission and values, a staff handbook, or a technology or social media policy." In Cowork, ask them to point you to the folder rather than copy-paste. Read these as the source of convictions and voice. Teach the habit: giving Claude the real documents beats describing them.
6. "How is AI being used around your ministry now, and is there anything that worries you or has already gone wrong?" Ask for general terms, no names. This shapes which rules matter most.
7. "Who should the policy cover: paid staff, volunteers, ministry leaders, contractors? Do any ministries work with children or youth?" Children's ministry raises the bar on privacy and review.
8. "Which Bible translation should any quotations use?" If unsure, cite references only, with no quoted text.
9. "Who is helping draft this, and who will own the policy after it is approved?" Record roles, not personal contact details.
10. "Which month should the yearly review happen?" Suggest a month away from the busiest seasons.

Save `church-ai-policy-profile.json` in the chosen folder, never inside the installed skill. Fields (leave unknowns null; never invent):

- `schema_version`: 1
- `ministry_name`, `tradition`, `approving_body`, `policy_owner_role`, `drafting_team_roles`
- `data_sensitivity`: one of `none`, `some`, `strict`, `not_sure`
- `source_documents`: names and locations of the documents read
- `current_ai_use`, `concerns` (general terms only)
- `scope`: groups covered; `serves_minors`: true or false
- `bible_translation`
- `output_format`: for example Word, Google Doc or Markdown
- `current_version`, `approval_date`, `review_month`, `next_review_date`
- `open_questions`

Also start a short `HANDOFF.md` in the same folder: where things stand, decisions made, next step. Explain it lets a teammate, a new chat or another computer pick up cold. Update it at the end of each sitting.

Close by summarizing what was saved and where, and name the next step: "Step 2 of 8: convictions and promise. About 20 minutes. Ready?"
