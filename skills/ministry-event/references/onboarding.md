# Guided onboarding

Start from the user's request. If they want the sample, run the demo with no interview. Otherwise look for `ministry-event-profile.json` in the folder they name; ask only for what is missing or changed. One profile per event.

Say: "I'll ask about ten short questions, one at a time, about 15 minutes. Then we'll build the plan together. Nothing gets published or sent." Ask one question, wait, adapt. Never paste this list as a questionnaire. If the user already has a proposal or past event files, ask for those first and skip what they answer.

1. "Which ministry is this for, and what's the event idea in a sentence or two? Want to see a fictional example first?"
2. The data-sensitivity check from SKILL.md. Record the answer.
3. "Where should I keep the plan?" In Claude Desktop with Cowork, suggest an event folder in their own files (a synced shared drive folder works) so exports and drafts live together. In a claude.ai Project, show the profile as a JSON block for them to add to the Project's files. Start a `HANDOFF.md` there: the plan's status, decisions and next checkpoint, so any teammate or new chat can pick up.
4. "Who is it for, and what should be different for them afterward?" Push for a concrete outcome ("leave with a plan for their first month of mentoring"), not a topic. Why: a clear promise is what people register for.
5. "When and where? A fixed date, or a window you're choosing within?" Record only venues they name or have confirmed. If a venue is booked, ask for its deposit, cancellation deadline and final-count date; the checkpoints will be set around them.
6. "Who approves the budget, and who makes the GO/NO-GO call at each checkpoint?" Use roles they confirm.
7. "What do you know about costs and price?" Known quotes, what is donated, whether it is free, a suggested donation or a ticket, and whether scholarships are offered.
8. "What tools do you use for registration, payments and email, and where do you post?" Check [connections](connections.md) for what is actually available; never assume.
9. "Have you run something like this before? Roughly how many came, and when did most register?" Past numbers set realistic checkpoint thresholds. If none, say you'll suggest starting thresholds to adjust.
10. "Who's on the team, and who does what?" Roles, not contact details. Ask whether children or youth will attend and whether childcare is offered.

Save `ministry-event-profile.json` in the chosen folder, never inside the installed skill. Fields (unknowns null; never invent):

- `schema_version`: 1
- `ministry_name`, `event_name`, `timezone`
- `data_sensitivity`: `none`, `some`, `strict` or `not_sure`
- `audience`, `promise`, `success_measures`
- `date_or_window`, `venue` (confirmed only), `venue_terms`: deposit, cancellation deadline, final-count date; `format`
- `budget_approver_role`, `go_no_go_decider_role`
- `costs`: list of item, amount, fixed or per person, source (quote, estimate, donated)
- `pricing`: price points, scholarships, free option
- `target_attendance`, `capacity`, `checkpoints`: list of date, threshold, measure
- `tools`: registration, payment (say "payment processor" unless they name it), email, social
- `team_roles`, `serves_minors`, `child_safety_policy_location`
- `past_events`: attendance and registration timing, if known
- `open_questions`

Close by saying what was saved and where, and the next step: "Step 2 of 9: purpose and promise."
