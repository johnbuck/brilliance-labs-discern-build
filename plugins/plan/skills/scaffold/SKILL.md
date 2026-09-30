---
name: scaffold
description: Use this skill to turn a spec into a working greenfield project skeleton. Triggers when the user wants to "scaffold a project", "set up the project", "bootstrap the app", "initialize the codebase", "create the project structure", or is ready to start coding a NEW project after specs/roadmap exist. Produces an opinionated, repo-ready skeleton (git, framework wired, test harness, lint/format, Docker/compose) with at least one passing test. For existing repos, baton adds features instead. For specs/roadmap, see spec / roadmap.
---

# scaffold — spec to a working greenfield skeleton

This skill bootstraps a **new** project into a repo-ready, opinionated skeleton: the chosen
stack wired up, a test harness with at least one passing test, lint/format configured, and a
sandboxed (Docker/compose) run path by default. It is for greenfield only — for an existing
repo, baton builds features against the existing structure.

The goal is a skeleton you can immediately run, test, and then hand to baton to build the
first real feature against.

## Read the plan first

Look for the backlog spec(s) in `backlog/` and the `ROADMAP.md`. The spec's technical approach
section names the stack, data, and deployment; the roadmap says what the first milestone is.
- **If specs exist:** read them; confirm the stack with the user before generating (they may
  have changed their mind since writing).
- **If no spec exists:** ask a brief discovery round (what is it, stack, app type, deployment) —
  enough to scaffold, not a full spec. Suggest running spec first for anything non-trivial.

## Defaults (operator standing rules)

- **Sandboxed by default.** Prefer Docker / a sandbox over installing app dependencies on the
  host. Not every project needs Docker (a small CLI or static site may not) — choose the right
  tool and discuss the tradeoff, but default to isolation.
- **Git from the start.** Initialize the repo; add a `.gitignore` for the stack (always ignore
  `.env`).
- **Secrets never committed.** Ship `.env.example` listing required variables; never a real
  `.env`.
- **Quality gates from line one.** Linter + formatter + type checking configured, not optional.

## Generate the skeleton (opinionated)

Build a fuller working skeleton, driven by the spec's choices:
- **Directory structure** appropriate to the stack.
- **Dependency manifest** (package.json / requirements.txt / pyproject.toml / go.mod / etc.),
  pinned. Vet every dependency for supply-chain safety before adding it (canonical package,
  known maintainer, no known vulns).
- **Framework wired** to a minimal running "hello world" (the chosen frontend/backend actually
  boots).
- **Test harness** with at least one passing test, and the test command documented.
- **Lint/format/type-check** configs for the stack.
- **Docker / compose** for the run + (where relevant) the test path, unless a lighter approach
  was deliberately chosen.
- **README** with how to run, test, and lint.

## After scaffolding

1. Verify it actually runs and the one test passes; report the exact commands.
2. Initialize git and make the first commit.
3. Offer to hand the first roadmap milestone's spec to **baton** to build it.
