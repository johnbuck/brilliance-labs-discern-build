# Guided onboarding

Start with the user's request. If they want the demo, run it without an interview. For setup, look for `website-rebuild-profile.json` and `HANDOFF.md` in the folder they choose; reuse what is there and ask only for what is missing.

Open with: "Which ministry is this for, and what's the one thing you most want the new site to do better?" Then explain the shape of the work in two sentences: ten steps, drafts first, nothing goes live until they approve a preview.

Teach the best way to work with Claude early: "Give me the goal, the context and your files, then let me plan. Tell me what done looks like, and ask me to push back when something seems off." Offer to set up a workspace:
- A Claude Project (if your plan includes Projects) holding project instructions, the handoff file and key documents, for strategy conversations.
- A folder Claude can work in (Cowork in Claude Desktop, or Claude Code) for drafts, mockups and the site files. A synced Google Drive folder works.

Ask one focused question at a time, in roughly this order. Say why you're asking. Do useful work between answers (for example, read the public site while they think).

1. Current site: "What's the web address, and what is it built on today?" If they don't know, look for clues on the public site and say so tentatively.
2. People: "Who gives final approval on words and design, and who controls the domain account?" These are often different people. Record roles; save names only if the user wants.
3. Email: "Does your ministry email use the same domain as the website?" Why: a domain change done carelessly can stop email. Record yes, no or unsure.
4. Audiences: "Who are the two or three kinds of people the site most needs to serve?" (for example first-time visitors, families, neighbors seeking help, partners). Ask which matters most.
5. Goals: "What should a first-time visitor be able to do within a minute?" Turn the answer into two to four goals (plan a visit, find service times, give, get help).
6. Voice: "Can you share a page, letter or sermon summary that sounds like you at your best, and any words you never want to use?"
7. Protected wording: "Which words must never change without your say-so, such as the mission statement or statement of faith?" Get the exact text.
8. Must-keep items: forms (and which inbox each one sends to today; a former staff address is a common surprise), giving links, sermon archive, event sign-ups, staff pages, files people link to, and whether a privacy notice exists.
9. Constraints: timeline, budget in their own words (don't suggest a figure), who will update the site afterward and how comfortable they are with tools.
10. The data-sensitivity answer from SKILL.md, if not already given.

Save `website-rebuild-profile.json` (non-secret; unknown values null):
- `schema_version`: 1
- `ministry_name`, `website_url`, `current_platform`, `time_zone`
- `approver_role`, `domain_controller_role`, `email_on_domain`
- `audiences` (ranked), `goals`
- `voice`: `tone_words`, `avoid_words`, `reference_material`
- `protected_wording`: list of {`item`, `exact_text`}
- `must_keep`: forms (name, fields, destination inbox), integrations, archives; `privacy_notice_exists`
- `constraints`: timeline, maintainer, comfort_level
- `approach`: null until step 8, then `keep-builder` or `static-site`
- `data_sensitivity`
- `decisions`: list of {`step`, `decision`, `choice`, `approved_by_role`, `date`}
- `open_questions`

Create `HANDOFF.md` beside it: context in five lines, the "Never change without asking" list, decisions so far, the current step and next steps. Explain why: a new chat, a teammate or another computer can pick up cold. Tell the user exactly where both files were saved.
