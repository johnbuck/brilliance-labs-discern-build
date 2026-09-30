---
name: roadmap
description: Use this skill to create or maintain a project's roadmap — the canonical, human-readable plan of what's being built, in what order, grouped by epic. Triggers when the user wants to "create a roadmap", "update the roadmap", "what's next", "plan the milestones", "organize the backlog into epics", or when baton reports a missing roadmap. The roadmap is also the epic index (each epic is a roadmap section). Writes ROADMAP.md where baton's drift-checker looks. For writing an individual spec, see spec.
---

# roadmap — create and maintain the living roadmap

The roadmap is the canonical answer to "what are we building, in what order, and why." It is a
**living document**: this skill both **creates** it when none exists and **updates** it as work
lands. It must stay current, because `baton`'s drift-checker reads it to decide whether a
piece of work is actually on the plan (and, after a build, whether the finished work delivered a
roadmap item).

**The roadmap is also the epic index.** There are no separate epic files. Each epic is a
section of the roadmap with a short charter and the list of specs under it.

## The two rules that matter most

1. **Clarity over ceremony.** Plain words, short sentences, tables. A reader new to the project
   should understand the shape of the work on one read.
2. **No cryptic identifiers.** Epics, milestones, and items are named by what they ARE
   (`live-roadmap-maintenance`), never coded (`M2`, `C1`, `Step0`). This is non-negotiable.

(No emoji before headings. Exclude these instructions from the roadmap itself.)

## Locate or create

The drift-checker auto-discovers the roadmap as `ROADMAP.md` at the repo root (or a backlog
index). Use that location. If a roadmap already exists, **read it and update in place** — do not
rewrite from scratch.

## Create (no roadmap yet)

Use **AskUserQuestion** to interview for structure:
- What are the major epics (themes of work)? Name each in plain language.
- For each epic: a one-line charter (what it's for), and what's explicitly out of scope.
- What's the sequence — what comes first, what depends on what?
- What's the current state — what's already done, in progress, not started?

Then write `ROADMAP.md` from `references/roadmap-template.md`.

## Maintain (roadmap exists)

Run anytime to keep it true:
- Mark items done / in-progress / not-started as work lands.
- Add new specs under the right epic (spec calls this when it writes a spec).
- Re-sequence when priorities change.
- Add or retire epics as the project's shape changes.
Confirm non-trivial changes with AskUserQuestion. Keep the prose tight; prune stale detail.

## Tie specs to epics

Every backlog spec carries an `epic: <readable-name>` in its frontmatter. The matching epic
section in the roadmap lists that spec. When spec adds a spec, place it under its epic here
and set the spec's `epic` field to match. This is what lets the drift-checker answer "does this
work map to a roadmap item?"

## After updating

If the roadmap was created/updated because baton reported `ROADMAP-MISSING`, tell the user
they can re-run `/baton <spec>` now (it will re-integrate and re-check). If a freshly placed
spec is ready to build, offer to hand it to baton.
