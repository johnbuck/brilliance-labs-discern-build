# Take-home skills (standalone versions)

These are the class skills as they were before the token optimizations: mostly plain Markdown
instructions that Claude follows, with as few extra files as possible. Use them if you want skills
you can read, change, and carry anywhere.

## What each one needs

| Skill | Needs | Notes |
|---|---|---|
| `brilliance-ui` | nothing extra | Instructions plus the style files in `brand/`. Claude writes the page itself. |
| `prompt-coach` | nothing extra | Instructions plus `prompts.json` (the Ministry Prompt Library). |
| `ui-scraper` | Node.js, `playwright-core`, Chrome/Edge (optional) | Uses `scripts/capture.mjs` to measure a site. |
| `finance-dashboard` | Node.js, `xlsx` | Uses its scripts to read spreadsheets and draw the dashboard. |
| `ministry-email` | Node.js, `xlsx` | Uses `mailer.mjs` (demo mode, nothing is sent). |
| `dev-setup-mac` / `dev-setup-windows` | nothing extra | They install everything else. |

## Using them outside the class folder

Copy a skill's folder into `~/.claude/skills/` (your personal skills, available in every project)
or into any project's `.claude/skills/`. Then start Claude Code and type `/` plus the skill's name.

The instructions mention the class folder layout (`my-projects/`, `.claude/skills/...` paths). In another
folder Claude adapts: it creates the output folder and finds the helper files next to the `SKILL.md`.
The two dependency-free skills, `brilliance-ui` and `prompt-coach`, work anywhere as-is.

The optimized versions in `.claude/skills/` do the same jobs with fewer tokens: helper scripts
assemble the large files, and Claude writes only the short parts that need judgment.
