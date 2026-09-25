# Installing skills into Claude Desktop

This repo is public, so you don't need a GitHub account or a login to use it. Everything below works through a plain download.

Claude Desktop runs skills in two places, and each one installs them differently:

| Where you use Claude | How skills get installed |
|---|---|
| **Chat** (regular conversations) | Upload a ZIP under **Customize → Skills** |
| **Code tab** (Claude Code inside Desktop) | Copy the skill folder into `~/.claude/skills/` |

## One-time setup for Chat

1. Open **Settings → Capabilities** and turn on **Code execution and file creation**. Skills won't run without it.
2. That's it. You'll upload skills under **Customize → Skills**.

## Example prompts

Paste these into the **Code** tab of Claude Desktop. It runs on your computer, so it can download files and put them where they belong. Replace the `<placeholders>`.

### See what's available

```
Download https://github.com/johnbuck/brilliance-labs-discern-build/archive/refs/heads/main.zip
(it's a public repo, no login needed), unzip it to a temp folder, and list every
skill in skills/ and every workflow in workflows/ with a one-line description of each.
```

### Get a skill ready to upload in Chat

```
Download https://github.com/johnbuck/brilliance-labs-discern-build/archive/refs/heads/main.zip
(public, no login needed) and unzip it to a temp folder. Take skills/<skill-name>
and zip it so the <skill-name> folder itself sits at the root of the ZIP (not its
contents loose at the root). Save it as <skill-name>.zip in my Downloads folder,
then tell me step by step how to upload it under Customize → Skills in Claude Desktop.
```

### Get every skill ready to upload in Chat

```
Download https://github.com/johnbuck/brilliance-labs-discern-build/archive/refs/heads/main.zip
(public, no login needed). For every folder in skills/, make a separate ZIP with that
skill's folder at the root of the ZIP, and put them all in a
"brilliance-labs-skills" folder in my Downloads. Then list them and remind me how
to upload them under Customize → Skills.
```

### Install skills for the Code tab

```
Download https://github.com/johnbuck/brilliance-labs-discern-build/archive/refs/heads/main.zip
(public, no login needed) and copy <skill-name | every skill> from skills/ into my
~/.claude/skills/ folder. If a skill with the same name is already there, ask me before
overwriting it. When you're done, tell me what got installed.
```

### Update skills you already installed

```
Download the latest https://github.com/johnbuck/brilliance-labs-discern-build/archive/refs/heads/main.zip
and compare its skills/ folder with what I have in ~/.claude/skills/. Show me which
ones changed, and update only the ones I approve.
```

## Doing it by hand, without prompts

1. Download the repo ZIP from https://github.com/johnbuck/brilliance-labs-discern-build/archive/refs/heads/main.zip. You can also click **Code → Download ZIP** on the repo page.
2. Unzip it and open the `skills` folder.
3. Right-click the skill's folder (e.g. `meeting-notes`) and compress it. On Mac that's **Compress**; on Windows it's **Send to → Compressed (zipped) folder**. This gives you a ZIP with the folder at its root, which is what Claude expects.
4. In Claude Desktop, go to **Customize → Skills**, click **+**, then **Create skill → Upload a skill**, and pick the ZIP.
5. Toggle the skill on.

Skills you upload in Chat are private to your account. Each person at the event installs their own.
