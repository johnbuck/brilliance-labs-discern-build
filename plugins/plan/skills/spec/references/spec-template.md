# Backlog spec template

The structure for a `spec` backlog spec. One markdown file in the repo's `backlog/`.
Keep the headings; fill from the interview; delete guidance text. Use clear, human-readable
names throughout — never cryptic codes (`C1`, `M2`, `Step0`). Exclude these instructions from
the output.

The template's job is to force the decisions a downstream automated builder would otherwise
GUESS, and to stay reviewable by a human. Each section says how deep to go; scale depth to the
work (a one-line fix doesn't need the full technical section — say so and keep it short).

```markdown
---
title: <plain one-line title of the work>
status: draft             # draft (open blocking questions) | specced (ready to build) | in-progress | done
priority: P2              # match the repo's scheme if it has one
epic: <readable-epic-name># the epic this belongs to (defined in the roadmap)
area: [<area>, <area>]    # pick from the repo's existing areas (grep prior specs); don't invent one without reason
created: <YYYY-MM-DD>      # today's real date
tags: [backlog]
---

# <Title>

**One sentence:** what changes and why, in plain language.

## Why this exists
The problem, and who has it. One or two short paragraphs. (Skip "What we're building" below if
this plus the one-sentence summary already make it obvious — don't restate four times.)

## What we're building
A short, concrete description of the feature/work from the user's point of view.

## Current behavior (as-is)
REQUIRED whenever the work modifies an existing surface (omit only for a brand-new, from-scratch
surface — and say so). An inventory of what the touched code path does TODAY, written by READING
the code at spec time — never from memory or conversation. List every behavior-shaping element on
the path: each filter, limit, cap, guard, gate, fallback, branch, ordering rule, and cache, with
its file:line. This is the list the change map below dispositions; anything doing something on
this path that isn't listed here is a spec defect.
- <element> — <what it does> (`path/to/file.py:123`)
- <element> — <what it does> (`path/to/file.py:145`)

## Change map
Every as-is element gets an explicit disposition. **Anything not listed as CHANGE or REMOVE is
KEEP — the build may not alter it.** REMOVE lines are the ONLY authorized deletions; a build that
removes a guard/filter/behavior with no REMOVE line here is drift, full stop.

| As-is element | Disposition | Detail |
|---|---|---|
| <element> | KEEP | unchanged |
| <element> | CHANGE | <exact new behavior> |
| <element> | REMOVE | <why it is safe to remove> |

## North Star check (must not violate)
Check the spec against the North Star (and the repo's canonical reference docs) at WRITE time, not
build time. Quote each rule that governs the touched surface **verbatim with its file path**
(verified by reading the file — a paraphrase from memory is not a citation), and state how the
change complies. Each testable rule becomes a regression test in the red phase and a live check in
validation, so violating the North Star turns a test red.
Hard rules for this section:
- Only rules that EXIST in the North Star / canonical reference docs belong here. Never invent a
  rule locally — a spec-invented "rule" has no authority and can enshrine a bug.
- If no North Star rule governs this surface, write "none — no North Star rule governs this
  surface" and move on. If you believe a rule SHOULD exist, that is a North Star update for the
  operator to make deliberately — not something this spec declares.
- Non-canonical hard lines (performance bounds, "don't touch X") belong in Constraints below, not
  here.
- **Every quoted rule carries a `testable:` condition. No exceptions.** A quote followed only by
  prose reasoning ("→ therefore this complies") is an incomplete entry. The planner does not skip
  a missing condition — it invents one, and it invents it wrong, which reads as drift and halts
  the gate. If a rule truly cannot be made testable, write `testable: none — <why>`.
- **Pin the condition per code path when paths differ.** If two call sites word or implement the
  same thing differently, state the requirement for each with its own file:line. One condition
  asserted over two divergent paths is a halt waiting to happen.
- **<rule-handle>** — "<verbatim quote>" (`NORTH_STAR.md § <section>`); complies by: <how>;
  testable: <condition a test or command can check, with file:line per path>

## Behavior
- **Actors / systems:** who or what triggers this, and which external systems/services it touches.
- **Preconditions:** the state, data, or services that must already exist for this to run.
- **Main flow:** the primary path, step by step. Plain language — "should", not "must";
  "interact", not "click".
- **Alternate & error flows:** what happens on bad input, a dependency being down, or a step
  failing. At least one error flow is required unless the work genuinely cannot fail (say why).
- **Postconditions:** the observable end state after success.

## Acceptance criteria
A list of testable conditions. These ARE baton's contract — the planner turns each into a
test. Rules:
- Each criterion has a short readable **handle** (kebab-case, describes the criterion, e.g.
  `rejects-expired-token`) that tests and the as-built record cite. Handles stay stable if you
  reorder or insert criteria. Never a cryptic code (`AC1`, `C2`).
- One assertion per criterion. Split "X and Y" into two.
- Each criterion names HOW it is verified: a test, a command + expected output/exit code, an
  HTTP status, a file that should exist, or a log line. If you can't name the check, it isn't an
  acceptance criterion — move it to Behavior or cut it.
- At least one criterion covers a failure/error path. Happy-path-only is rejected.
- If the work has performance / resource (CPU/RAM/VRAM) / latency / uptime limits, state them
  here as criteria with the limit and how it's measured — not as prose elsewhere.

- **<readable-handle>** — <condition>; verified by: <test name / command + expected result>
- **<readable-handle>** — <condition>; verified by: <…>

## Technical approach
The chosen design and the exact surface it touches. **Write this at plan-mode specificity** —
an implementation plan a builder can execute without inventing anything, grounded in the actual
code (read it first): **concise enough to scan quickly, detailed enough to execute effectively.**
It contains the RECOMMENDED approach only — alternatives considered get at most a one-line
"chosen over X because Y":
- **Exact locations:** file:line / function names for every touch point, from reading the code.
  For a pattern repeated across many files, describe the pattern once with a few representative
  paths.
- **The actual code:** for any non-trivial change, include the code to write — the exact query,
  the function body, the config block — as a build-ready appendix if long. A spec that says
  "add a filter" drifts; a spec that shows the filter does not.
- **Reuse ledger:** the existing functions, utilities, and patterns this work calls instead of
  reinventing, each with its file path. New code appears only where this ledger has no suitable
  entry.
- **Implementation order:** the ordered steps — which files are created/modified in which
  sequence, and where migrations/flags/deploys fall.
- **Prototype as contract:** when the work comes from a dialed-in prototype, embed the
  prototype's real code and interaction mechanics verbatim — the builder PORTS them faithfully,
  never re-derives from a description. The prototype IS the spec's technical content.
- **Risks & mitigations:** what could go wrong in the build or at runtime, and the mitigation
  for each — scaled to the work.
- **Deploy target:** host, deploy path, compose project, ports. State it even if "same as
  existing service X". (Omit for non-deployed/pure-logic work.)
- **Files:** each path, marked (new) or (modified), one line on what changes in each.
- **Tech choices:** any library/framework/tool gets a one-line rationale (why this over the
  obvious alternative).
- **Schemas / APIs:** show a concrete example record / request / response in JSON, not field
  names alone.
- For non-trivial technical work, follow `references/technical-depth.md` (architecture
  request-flow trace, data/store shapes, error schemas, annotated file tree, env-var table,
  risk table). Scale to the work — don't manufacture depth a small change doesn't need.

## Constraints (must-not)
Hard red lines for this work — things the build must not do even to make a test pass. Inherit
the repo's CLAUDE.md forbidden-actions and restate any this work could plausibly trip.
- <e.g. do not remove or weaken existing service dependencies (`depends_on`)>
- <e.g. do not modify DNS / Pi-hole / firewall config>
- <e.g. no destructive DB operations; additive migrations only>

## Data and safety
Does this touch persisted data? If so: additive/reversible, no silent destruction, validate on
staging first, state the blast radius of any destructive step.

**Security (address each, or write "n/a — <why>"):**
- Authentication AND authorization model (who can do what).
- Input validation / sanitization at trust boundaries.
- Encryption in transit and at rest where applicable.
- Secrets: which ones, stored where (your secrets manager), injected how — never in the repo.
- If this collects/processes/shares personal or external data, add a short table:
  Data type | Collected | Processed | Shared externally.

## Scope
### In scope (now)
- <deliverable>
### Out of scope (deliberately deferred)
- <deliberately-deferred item> — stated, not silently omitted.

## Testing
What proves it works: unit / integration / end-to-end, the frameworks, and lint/format/type
gates. Tie each back to the acceptance criteria above — AND to the North Star check: every quoted
testable rule gets a regression test (red phase) so violating the North Star turns a test red,
not a doc stale. Include how to verify the change **end-to-end on the real thing** — the exact
command / endpoint / job to run against real infrastructure and what its output should show.

## Dependencies
What this work depends on, and what depends on it.

## Observability & done-in-production
How we'll know it's working AFTER it ships: the runtime signal (monitor, log line, metric,
healthcheck) and where it's observed. If this adds or changes a service, state the Uptime Kuma
monitor / ntfy alert it should have. If there's genuinely nothing to observe at runtime, say so.

## Open questions
Anything undecided; mark human decisions `[@humanUser …]`. A question whose answer changes the
design, acceptance criteria, or scope is BLOCKING — keep `status: draft` until it's resolved.
Only non-blocking nits may remain at `status: specced`. baton should not build a spec with
open blocking questions.
```
