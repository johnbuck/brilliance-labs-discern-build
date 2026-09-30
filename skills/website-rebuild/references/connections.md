# Connections

Discover what is actually available at runtime. Never claim a connector or tool exists; test it and say what you found. Check the provider's current documentation before giving setup steps, because dashboards change.

| Need | Options | Verify | Fallback |
|---|---|---|---|
| Read the current site | Claude's web fetch or browsing; a browser tool | Fetch the home page and one inner page | User pastes page text or uses the builder's export |
| Planning files | A Claude Project; Google Drive connector if connected | Open one shared document | User uploads files |
| Work in files | Cowork (Claude Desktop) or Claude Code in a user-chosen folder | Create and read back a test file | Copy in chat; user saves it |
| Mockups | HTML file in a browser; an artifact | Open it at phone width | Screenshots or a described layout |
| Static hosting | Host's own command-line tool or connector, if installed | User signs in through the host's flow; deploy a preview only | User uploads the folder on the host's deploy page |
| Forms | Host form feature or a form service | A test entry reaches the right inbox | Link to the ministry's existing form tool |
| Builder edits | The user in the editor; a browser tool with the user watching, if approved | Change one draft page, not the live one | Step-by-step instructions |
| Domain and DNS | The registrar's dashboard, domain owner only | The owner confirms records match the host's instructions | Written steps |

Record each capability as `unverified`, `read_verified`, `preview_verified` or `live_verified`, with the date. A login is not proof that a deploy works.

The user signs in through each service's own sign-in. Never ask for passwords, API keys, tokens or registrar logins in chat, and never save them in the profile or handoff file.

## Recovery
- Preview deploy failed: read the error, fix it, redeploy the preview. Never try the live site to "see if it works".
- Unsure whether a deploy went live: check the host dashboard before retrying.
- Form entries not arriving: check spam, the form's notification settings and the host's form settings; send another test.
- Spam flooding a form: turn on the host's spam protection or add a hidden honeypot field first; add a challenge only if that fails, since challenges also block some real people.
- Broken links after launch: compare with the inventory, fix the redirect list, re-test.
- DNS not updating: wait, then check records against the host's instructions. Don't keep changing records.
- Church email stopped or lands in spam after a DNS change: the domain owner restores the recorded MX and TXT (SPF, DKIM, DMARC) values at once.
- Protected wording changed by mistake: restore it from `HANDOFF.md`, tell the approver, and note it.
