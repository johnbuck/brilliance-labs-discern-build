# Adding skills and workflows

Contributions come in as pull requests from your own fork. You don't need to clone this repo by hand: point Claude Code at the skill or workflow you already have, and it will fork, copy, commit, and open the PR for you.

## Before you start

- You need a GitHub account.
- You need Claude Code. The terminal CLI works, and so does the **Code** tab in Claude Desktop.
- Install the GitHub CLI (`gh`) and sign in once with `gh auth login`. If `gh` is missing, Claude can walk you through installing it.

## Layout

```
skills/
  <skill-name>/
    SKILL.md          # required
    ...               # optional scripts, references, assets
workflows/
  <workflow-name>/
    README.md         # required: what it does, what it needs, how to run it
    ...               # the workflow files themselves
```

Skills in this repo need to work in Claude Desktop as well as Claude Code, so follow these rules:

- Folder names are lowercase kebab-case, e.g. `meeting-notes`.
- The `name` in the `SKILL.md` frontmatter matches the folder name.
- The `description` is 200 characters or fewer. Claude Desktop rejects longer descriptions.
- Leave out secrets, API keys, personal file paths, and anything tied to your own machine.

## Example prompts

Paste one of these into Claude Code, then replace the `<placeholders>`.

### Submit a skill you already have

```
Submit the skill at <path/to/my-skill> as a pull request to
https://github.com/johnbuck/brilliance-labs-discern-build.

- Fork the repo with gh if I don't have a fork yet, and clone it to a temp directory.
- Copy the skill into skills/<skill-name>/ on a new branch named add-skill-<skill-name>.
- Check it against the rules in CONTRIBUTING.md (kebab-case folder, name matches
  folder, description <= 200 chars, no secrets or machine-specific paths). Fix what
  you can and tell me about anything you changed.
- Commit, push to my fork, and open a PR with a short summary of what the skill does
  and when it triggers. Give me the PR link.
```

### Submit a skill from your Claude Code skills folder

```
Look in ~/.claude/skills and show me what's there. I want to contribute
<skill-name> to https://github.com/johnbuck/brilliance-labs-discern-build.
Follow that repo's CONTRIBUTING.md: fork, branch, copy into skills/<skill-name>/,
check it against the rules, and open a PR. Give me the link.
```

### Submit a workflow

```
Submit the workflow at <path/to/workflow> as a pull request to
https://github.com/johnbuck/brilliance-labs-discern-build.

- Fork and clone it to a temp directory, and create a branch named add-workflow-<workflow-name>.
- Put everything under workflows/<workflow-name>/.
- If there's no README.md, write one covering what the workflow does, what it needs
  (tools, accounts, MCP servers, API keys by name only), and how to run it.
- Strip any secrets or machine-specific paths and tell me what you removed.
- Commit, push to my fork, open the PR, and give me the link.
```

### Write a new skill and submit it

```
Help me write a new skill called <skill-name> that <what it should do>.
Interview me until you understand when it should trigger and what it should do,
then draft skills/<skill-name>/SKILL.md following the rules in
https://github.com/johnbuck/brilliance-labs-discern-build/blob/main/CONTRIBUTING.md.
Show me the draft. Once I approve it, fork the repo, commit it on a new branch,
and open a PR.
```

### Update a skill that's already in the repo

```
In https://github.com/johnbuck/brilliance-labs-discern-build, update
skills/<skill-name> so that <the change>. Sync my fork (or create one), make the
change on a new branch, keep it within the CONTRIBUTING.md rules, and open a PR
that explains what changed and why.
```

### Upload files through the browser instead

If you'd rather skip the CLI, open the repo on GitHub, go into `skills/` or `workflows/`, and choose **Add file → Upload files**. Drag in your folder, then pick **Create a new branch … and start a pull request**. GitHub makes the fork for you.
