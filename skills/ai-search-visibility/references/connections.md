# Connections

Discover what is available at runtime. Never claim a tool or connector exists; test it and say what you found.

| Need | Options | Verify | Fallback |
|---|---|---|---|
| Claude's own answers | Claude with web search, if the user's plan and settings include it | Ask one name question and confirm sources are shown | Record Claude's answer without web search, labeled as such |
| Other assistants | The user, in their own accounts | User pastes one answer with its sources | User types what they saw |
| Read the website and listings | Claude's web fetch or browsing | Fetch the About page | User pastes page text |
| Scorecard file | A spreadsheet or CSV in a folder Claude can work in (Cowork or Claude Code), or a Google Drive connector if connected | Read back the header row | User uploads or pastes the CSV |
| Site fixes | The website-rebuild skill, or the site builder's editor | Change appears on a preview page first | Step-by-step editor instructions |
| Listings | Each listing's own dashboard, used by its owner | Owner confirms the saved change | Written instructions per listing |
| Structured data check | Schema Markup Validator (validator.schema.org) or Google's Rich Results Test; confirm current addresses in the provider's documentation | Paste the page URL or code; zero errors | Claude reviews the code line by line |
| Crawler rules | The site's `/robots.txt`, read by Claude or pasted by the user | The file loads and its rules are listed back | User asks the site builder's support which crawlers it allows |
| Re-checks | A scheduled task, if the user's plan includes it | One test run produces a dated row | A calendar reminder |

Claude should not sign in to other assistants or listings on the user's behalf, and should never ask for passwords or API keys in chat. If a browser tool is available, use it only on public pages.

A scheduled task can run Claude's own checks; the other assistants still need a person. Say so plainly when setting it up.

## Recovery
- Answers differ every time: that is normal. Run the question twice and record both; judge trends over several checks.
- An assistant won't search the web: note "no web search" in the row; its answer reflects older training data.
- A wrong fact keeps appearing after a fix: find the cited source; it is often an old listing or directory that still needs updating.
- Validator errors: fix the reported line, re-validate, then publish.
- A fix went live without approval: tell the approver, restore the previous version if asked, and note it in the handoff file.
