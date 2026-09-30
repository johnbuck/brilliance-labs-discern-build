---
name: dev-setup-mac
description: Set up a complete beginner-friendly developer environment on a Mac automatically, covering Homebrew, Git, Node.js LTS + npm (with common tools), Python 3.13 (with common libraries like pandas, requests, Flask, FastAPI, Jupyter), VS Code, and ready-to-run React and Python starter projects, all added to PATH. Interviews a non-technical person, runs the installer, and explains progress in plain language. Use when someone on macOS wants to install or set up Node, Python, React, a coding/dev environment, or fix "command not found".
---

# Developer environment setup: Mac

You are setting up a Mac for someone who is **not technical**. They should not have to type any
commands. You run everything; they only click a password box if one appears. Follow the tone rules
in the project's CLAUDE.md (plain words, one question at a time, short messages).

The installer is `setup-mac.sh` next to this file. It is safe to run more than once: it skips
anything already installed and never adds a PATH line twice.

| It installs | Details |
|---|---|
| Apple Command Line Tools + **Homebrew** | the standard Mac package manager |
| **Git** | sets their name/email if given, default branch `main` |
| **Node.js LTS** + npm | plus global tools: typescript, tsx, nodemon, serve, prettier, pnpm |
| **Python 3.13** (via **uv**) | an "everyday" environment at `~/.venvs/everyday`, switched on in every new terminal, so `python` and `pip` just work. Includes requests, python-dotenv, pandas, numpy, matplotlib, openpyxl, beautifulsoup4, flask, fastapi, uvicorn, jupyterlab, ipykernel, pytest, anthropic, **streamlit** (+ watchdog) |
| **VS Code** | with the `code` command |
| Starter projects in `~/dev` | `react-starter` (Vite + React + TypeScript + Tailwind, already built) and `python-starter` (`hello.py` library check + `app.py`, a small Streamlit web app in the Brilliance Labs style) |

PATH changes go in `~/.zprofile` / `~/.zshrc` (and bash equivalents), each marked `# added by dev-setup`.

## Step 1: Make sure this is a Mac

Run `uname -s`. If it isn't `Darwin`, say so kindly and suggest `/dev-setup-windows` (on Windows).
Don't continue.

## Step 2: Welcome and a quick look

Say, in your own words and briefly: "I'll set up everything you need to build apps on this Mac:
the same tools professional developers use. It takes about 15–25 minutes, and you won't need to
type anything. Keep the laptop plugged in and awake."

Run `bash .claude/skills/dev-setup-mac/setup-mac.sh --check` and summarize what's already there in
one or two plain sentences (e.g. "You already have Git; everything else is new.").

## Step 3: A few questions (one at a time)

1. AskUserQuestion (header "Install", multiSelect: true): "What should I set up?" Pre-explain that
   Homebrew and Git are always included.
   - Node.js + React (Recommended): for building websites and web apps
   - Python + data libraries (Recommended): for scripts, spreadsheets, data, and AI
   - VS Code (Recommended): the editor for looking at and changing code
2. Ask in plain chat (optional): "What name and email should your work be labeled with? This is used
   by Git, the tool that saves versions of your work. You can skip this." If they skip, leave the flags off.

Map their answers to flags: no Node → `--no-node`; no Python → `--no-python`; no VS Code → `--no-vscode`;
`--git-name "…" --git-email "…"` if given.

## Step 4: Tell them what they'll see, then run it

Before starting, say: "**A password box may pop up.** It's your Mac asking for your login password
so it can install developer tools. It might be hidden behind this window, so check the Dock if
nothing seems to happen. It can appear more than once. Your password isn't shown to me or stored."
Also: "The first part installs Apple's developer tools, which can take 10 minutes on its own."

Run the installer **in the background** (Bash with `run_in_background: true`), because it can take
longer than a normal command is allowed:
```
bash .claude/skills/dev-setup-mac/setup-mac.sh [flags]
```
While it runs, check `~/dev-setup.log` every minute or so (read only the last ~15 lines) and give a
**short** progress note when a new `==>` step starts ("Homebrew is installed ✓. Now installing Node.js…").
Don't paste log lines. You'll be notified when the background command finishes.

If the log shows it waiting on the password for more than a couple of minutes, remind them to look
for the password box. If they clicked Cancel, just run the installer again.

## Step 5: Report back

Read `~/dev-setup-report.json` and the end of the log. Summarize in plain language:
- ✓ what's installed, with versions (Node, npm, Python, Git, VS Code)
- where their starter projects are (`~/dev/react-starter`, `~/dev/python-starter`)
- anything in `failed`, with the fix from the table below (retrying the installer fixes most things)

Explain PATH in one sentence: "I also told your Mac where to find these tools, so typing `node` or
`python` in any new Terminal window just works."

Then the important part: **"Close Claude Code and open it again (type `claude --continue` to pick up
where we left off), so it can see the new tools."** Terminal windows opened before the setup won't see them either.

## Step 6: After they restart (optional wow moment)

If they come back after restarting, offer to show their React starter running:
1. In `~/dev/react-starter`, run `npm run dev` **in the background**.
2. Open `http://localhost:5173` in their browser (`open http://localhost:5173`).
3. Say: "This is a real React app running on your Mac. Want me to change what it says?" Then edit
   `src/App.tsx` live so they see it update instantly.
Also offer:
- **A Python web app:** in `~/dev/python-starter`, run `streamlit run app.py --server.headless true` **in the
  background**, then open `http://localhost:8501`. It's a small giving dashboard with a fund filter, built
  from `giving.csv`, in the same Brilliance Labs look as the class's first web page (the theme lives in
  `.streamlit/config.toml` and `brand.py`). Then change something live (the title, or add a chart) so they see how a few lines of
  Python become a web page. Stop it when done.
- `python ~/dev/python-starter/hello.py` to show every Python library checking in, or `jupyter lab` for a notebook.

## Troubleshooting
| Problem | What to do |
|---|---|
| "isn't an administrator" | The Mac account needs admin rights (System Settings › Users & Groups). Someone who manages the Mac must change it. |
| Stuck on Command Line Tools for > 20 min | Check Wi-Fi. Optionally run `xcode-select --install` and click Install in the dialog, then rerun. |
| Password box never appeared | Look behind windows / in the Dock for "Script Editor" or "osascript". Rerun the installer if cancelled. |
| `command not found` after setup | Claude Code or Terminal was opened before setup. Restart it. |
| "Some Python libraries failed" | Usually a network hiccup, so rerun. Setup never compiles pyarrow/numpy/pandas from source, so a missing prebuilt package fails fast; check the log for the package name. |
| A single step failed (npm tools, Python libraries, React starter) | Usually a network hiccup. Rerun the installer; it only redoes what's missing. |
| Company-managed Mac blocks installs | Stop and involve their IT team; don't try to work around it. |

Never ask for their password in chat, never use `sudo` yourself, and never disable security settings.
