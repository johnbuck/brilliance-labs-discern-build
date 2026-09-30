# Guided onboarding

Start with the user's request. If they want the demo, run it without an interview. Otherwise look for `ai-search-visibility-profile.json` in the folder they choose; reuse what is there and ask only for gaps.

Open with: "Which ministry is this for, and what would you most like people to find when they ask an AI assistant about ministries like yours?" Then explain the shape of the work in two sentences: seven steps; first we measure, then we fix, then we re-check on a routine.

Teach the habit early: "Share your website address and any fact sheet or bulletin you have. The more real context I get, the better the questions and fixes." If Claude can work in a folder (Cowork in Claude Desktop, or Claude Code), keep the scorecard and fact sheet there.

Ask one focused question at a time. Say why you're asking. Do useful work between answers (for example, read the About and Contact pages while they think).

1. Website: "What's your web address, and who can make changes to it?"
2. Facts: "Where can I find your confirmed facts: address, phone, service or program times, what you offer?" Draft the fact sheet from the site, then ask a person to confirm each line. Why: you can't judge an answer's accuracy without a confirmed source of truth.
3. Community: "What city or neighborhood do people search from, and what nearby areas do you serve?"
4. Ministry type: "How would a stranger describe you: a church (which tradition, if you say so publicly), a food pantry, a youth program, a recovery group?"
5. Needs: "What do people most often call or email to ask about?" These become the best questions.
6. Listings: "Which listings do you know about: Google Business Profile, map apps, a denominational or network directory, social pages?" Record who owns each.
7. Assistants: "Which AI assistants do you or your neighbors use?" Suggest three or four (for example ChatGPT, Claude, Gemini, Perplexity). The user runs checks in their own accounts; Claude can run its own checks with web search if available.
8. Approver: "Who approves changes to the website and listings?" Record the role.
9. Routine: "Would a weekly check for the first month, then monthly, work?" Offer a scheduled task if their plan includes it, or a calendar reminder.
10. The data-sensitivity answer from SKILL.md, if not already given.

Save `ai-search-visibility-profile.json` (non-secret; unknown values null):
- `schema_version`: 1
- `ministry_name`, `website_url`, `city_area`, `ministry_type`
- `fact_sheet_file`, `fact_sheet_confirmed_by_role`, `fact_sheet_date`
- `questions_file` (or the scorecard's question list)
- `assistants`: list of {`name`, `run_by`: `user` or `claude`, `web_search`}
- `listings`: list of {`name`, `url`, `owner_role`}
- `approver_role`, `website_editor_role`
- `crawler_decision`: {`choice`, `decided_by_role`, `date`} (see fix 7)
- `recheck`: {`frequency`, `next_date`, `method`: `scheduled_task` or `reminder`}
- `data_sensitivity`, `open_questions`

Tell the user where the profile was saved. Keep a short `HANDOFF.md` beside it with the current step, fixes in progress and the next re-check, so a teammate can pick it up.
