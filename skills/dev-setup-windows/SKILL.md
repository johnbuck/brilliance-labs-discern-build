---
name: dev-setup-windows
description: Set up a complete beginner-friendly developer environment on Windows 10/11 automatically, covering Git, Node.js LTS + npm (with common tools), Python 3.13 (with common libraries like pandas, requests, Flask, FastAPI, Jupyter), uv, VS Code, and ready-to-run React and Python starter projects, all added to PATH, using winget. Interviews a non-technical person, runs the installer, and explains progress in plain language. Use when someone on Windows wants to install or set up Node, Python, React, a coding/dev environment, or fix "is not recognized as a command".
---

# Developer environment setup: Windows

You are setting up a Windows PC for someone who is **not technical**. They should not have to type
any commands. You run everything; they only click **Yes** on Windows permission boxes. Follow the
tone rules in the project's CLAUDE.md (plain words, one question at a time, short messages).

The installer is `setup-windows.ps1` next to this file. It uses **winget** (built into Windows 10/11)
and is safe to run more than once: it skips anything already installed and never adds a PATH entry twice.

| It installs | Details |
|---|---|
| **Git** | usually already there (Claude Code on Windows needs it); sets name/email if given |
| **Node.js LTS** + npm | plus global tools: typescript, tsx, nodemon, serve, prettier, pnpm |
| **Python 3.13** (python.org) + **uv** | for this user, added to PATH, with requests, python-dotenv, pandas, numpy, matplotlib, openpyxl, beautifulsoup4, flask, fastapi, uvicorn, jupyterlab, ipykernel, pytest, anthropic, **streamlit** (+ watchdog) |
| **VS Code** | for this user, with the `code` command and "Open with Code" in right-click menus |
| Starter projects in `%USERPROFILE%\dev` | `react-starter` (Vite + React + TypeScript + Tailwind, already built) and `python-starter` (`hello.py` library check + `app.py`, a small Streamlit web app in the Brilliance Labs style) |

On ARM laptops (Snapdragon, Surface Pro X/11) it installs the **x64** Python on purpose: Streamlit's `pyarrow` has no
ARM64 build, and Windows runs x64 Python through its built-in emulation. It also adds `%APPDATA%\npm`, Python, and Python's `Scripts` folder to the user PATH, and sets the
PowerShell execution policy to RemoteSigned **for this user only**, so npm tools run in PowerShell.

## How to run things here
Claude Code on Windows runs commands in Git Bash. Call the installer through PowerShell:
```
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".claude/skills/dev-setup-windows/setup-windows.ps1" [options]
```
Options: `-Check`, `-NoNode`, `-NoPython`, `-NoVSCode`, `-NoReact`, `-GitName "…"`, `-GitEmail "…"`, `-DevDir "…"`.
The log is `~/dev-setup.log` (i.e. `%USERPROFILE%\dev-setup.log`); the report is `~/dev-setup-report.json`.

## Step 1: Make sure this is Windows

Check `echo $OS` (should be `Windows_NT`) or `uname -s` (contains `MINGW` or `MSYS`). If it's a Mac,
suggest `/dev-setup-mac` instead and stop.

## Step 2: Welcome and a quick look

Say, briefly and in your own words: "I'll set up everything you need to build apps on this PC:
the same tools professional developers use. It takes about 15–25 minutes, and you won't need to type
anything. Keep the laptop plugged in."

Run the installer with `-Check` and summarize in one or two plain sentences what's already there.
If winget is missing, walk them through: open **Microsoft Store** → search **App Installer** → **Update**
(or **Get**), then continue.

## Step 3: A few questions (one at a time)

1. AskUserQuestion (header "Install", multiSelect: true): "What should I set up?" (Git is always included.)
   - Node.js + React (Recommended): for building websites and web apps
   - Python + data libraries (Recommended): for scripts, spreadsheets, data, and AI
   - VS Code (Recommended): the editor for looking at and changing code
2. Ask in plain chat (optional): "What name and email should your work be labeled with? This is used
   by Git, the tool that saves versions of your work. You can skip this."

Map answers to options: no Node → `-NoNode`; no Python → `-NoPython`; no VS Code → `-NoVSCode`.

## Step 4: Tell them what they'll see, then run it

Before starting, say: "**Windows will ask 'Do you want to allow this app to make changes?'** once
or twice, for Git and Node.js. Please click **Yes**. The box may only flash in the taskbar, so if
nothing seems to happen, look for a blinking shield icon at the bottom of the screen."

Run the installer **in the background** (Bash with `run_in_background: true`), because it can take
longer than a normal command is allowed. While it runs, check `~/dev-setup.log` every minute or so
(read only the last ~15 lines) and give a **short** progress note when a new `==>` step starts
("Node.js is installed ✓. Now adding the Python libraries…"). Don't paste log lines.
You'll be notified when the background command finishes.

If the log sits on "Installing Node.js…" for several minutes, remind them to look for the permission box.
If they clicked No, just run the installer again.

## Step 5: Report back

Read `~/dev-setup-report.json` and the end of the log. Summarize in plain language:
- ✓ what's installed, with versions (Node, npm, Python, Git, VS Code)
- where their starter projects are (`dev\react-starter`, `dev\python-starter` in their user folder)
- anything in `failed`, with the fix from the table below (rerunning the installer fixes most things)

Explain PATH in one sentence: "I also told Windows where to find these tools, so typing `node` or
`python` in any new terminal just works."

Then the important part: **"Close Claude Code and open it again (type `claude --continue` to pick up
where we left off), so it can see the new tools."** Terminal windows opened before the setup won't see them either.

## Step 6: After they restart (optional wow moment)

If they come back after restarting, offer to show their React starter running:
1. In `~/dev/react-starter`, run `npm run dev` **in the background**.
2. Open `http://localhost:5173` (`start http://localhost:5173`).
3. Say: "This is a real React app running on your PC. Want me to change what it says?" Then edit
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
| winget missing | Microsoft Store → App Installer → Update/Get. Older Windows 10 may need updates first. |
| A step says "install failed" with a permission hint | They clicked No, or it timed out. Rerun; click **Yes**. |
| Not an administrator (Yes box asks for a password) | Someone with an admin account must enter it, or skip Node (`-NoNode`) and ask IT. |
| "Some Python libraries failed" on an ARM laptop (Snapdragon / Surface) | Streamlit's pyarrow has no ARM64 build. Setup installs x64 Python on ARM PCs automatically, but a pre-existing ARM64 Python gets in the way: uninstall Python in Settings › Apps, then rerun. |
| `python` opens the Microsoft Store | Settings › Apps › Advanced app settings › App execution aliases → turn off both "python" entries, then rerun. |
| "running scripts is disabled" in PowerShell | The PC's policy is managed; use Command Prompt, or rerun the installer (it sets RemoteSigned for this user). |
| `is not recognized` after setup | Claude Code or the terminal was opened before setup. Restart it. |
| Company-managed PC blocks installs | Stop and involve their IT team; don't try to work around it. |

Never ask for passwords in chat, never try to bypass Windows security prompts, and never change
system-wide (machine) settings beyond what the installer does.
