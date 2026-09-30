# Connections and dependencies

| Component | Role | Verification |
| --- | --- | --- |
| Codex and local workspace | Runs the skill, reads source files, writes packets | Create the local profile and check status |
| User’s Logos account | Provides access to their resources | User signs in directly and a relevant book opens |
| Browser or native computer tool available in that Codex session | Reads the actual library and passage, using documented tool APIs | Inspect an accessible resource and its requested section |
| Local file access | Receives permitted source notes/exports if live access is unavailable | Inspect title, locator, contents, and source account |
| Python 3 | Runs the bundled helper | Run `python3 scripts/research.py --help` (Windows may use `py -3`) |
| Word-compatible viewer or document rendering tool | Views and checks the DOCX | Inspect page layout and links |

No official Logos MCP connector, Logos API key, automatic library scanner, Chrome debugging bridge, Google Drive account, Mailchimp account, or paid document API is bundled or required by this skill. The local helper uses the Python standard library. Browser tools are host capabilities, not packages installed by this ZIP.

## Choose the available route

1. Prefer a purpose-built authorized Logos connector if actually available and documented in the target session. Verify its account and resource access; do not assume its existence.
2. Otherwise use an available browser/computer-control tool, follow its documented APIs, and inspect the real signed-in Logos interface. The user signs in themselves. Check relevant library resources and read the requested sections through normal access. Do not bypass an access wall or infer ownership from previews.
3. If no such tool is available, guide the user through their own Logos app and accept source notes or a permitted export with exact bibliographic/section details. Mark access evidence as user-reported. This route still produces the research packet but is not an automated Logos retrieval demo.

The presenter’s earlier Mac implementation used a custom Chrome/Playwright bridge. That machine-specific bridge and its private web endpoints are not part of this portable giveaway. Do not tell attendees that merely installing this skill installs an authenticated connector. Explain the route selected on their machine.

Keep account sessions and raw sources local to that person’s workspace. A new account needs a new profile, access checks, and sources. Never use the presenter’s extract cache as attendee source material.
