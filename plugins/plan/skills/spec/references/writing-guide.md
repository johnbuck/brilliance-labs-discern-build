# Writing guide — the discipline carried over from PRD/TRD work

How to write a backlog spec well. These are the keepers from years of PRD/TRD practice, minus
the heavy two-document ceremony.

## Voice
- Write plainly and clearly, as if you want to be understood. Casual but precise.
- Short sentences. Plain words. No flowery language, no filler.
- Define a technical term in plain language the first time it appears.
- Avoid em-dash-heavy prose. Avoid emoji before headings.
- Jargon only where it is the genuinely precise term — never as decoration.

## Names and identifiers (the hard rule)
- Name everything by what it IS. A milestone is `live-roadmap-maintenance`, not `M2`. A
  workstream is `warehouse-migration`, not `C1`. A phase is `red-tests-first`, not `Step0`.
- Cryptic codes ossify into permanent, unreadable identifiers. Never create them.

## Ground truth before prose (the discipline that prevents drift)
- **Inventory before you change.** A spec that modifies an existing surface starts by READING the
  actual code and listing what the path does today (every filter, limit, guard, gate, fallback,
  branch — with file:line). You cannot correctly scope a change to a surface you haven't
  inventoried; the gaps in the inventory become the builder's silent guesses.
- **Disposition everything.** Every inventoried element is explicitly KEEP / CHANGE / REMOVE in
  the change map. Unlisted = KEEP. REMOVE lines are the only deletions the build is authorized to
  make — "the builder needed to drop it for performance" is drift, not a decision.
- **Canon is quoted, never recalled.** Any sentence citing a canonical doc (North Star, schema
  reference, standing rule) quotes it verbatim with the file path, verified by reading the file at
  write time. If you can't point at the line, don't write "canonical" — go read it or ask. A
  from-memory paraphrase labeled canonical is how fabricated rules enter specs.
- **Check the North Star while writing, not after shipping.** Read the North Star section for the
  touched surface at spec time; quote the governing rules verbatim (file-verified) and state how
  the change complies — each testable rule becomes a regression test. Only rules that exist in the
  North Star / canonical references count: never invent a spec-local rule (it has no authority and
  can enshrine a bug). If a needed rule is missing from the North Star, surface it as a deliberate
  North Star update for the operator — the North Star is strengthened; parallel rule systems are
  not created.

## Requirements
- Use "should", not "must".
- Use "interact" / "interaction", not "click" / "tap" (standard terms like "click-through
  rate" are fine).
- Every acceptance criterion states HOW it is verified (a test, a command + expected
  output/exit code, an HTTP status, a file, or a log line). A criterion with no named
  verification is not acceptable — move it to Behavior or cut it.
- One assertion per criterion — no compound "X and Y" criteria.
- Give each criterion a short readable kebab-case handle (e.g. `rejects-expired-token`) that
  tests and the as-built record cite — stable across reorder, and never a cryptic code.
- At least one acceptance criterion covers a failure/error path. Happy-path-only is rejected.
- Given/When/Then scenarios are good for clarifying behavior. Cover the happy path and the
  edge/error cases. Don't write them where a plain sentence is clearer.

## Technical choices
- Every library / framework / tool choice gets a one-line rationale: why this over the obvious
  alternative.
- For any data schema or API, show a concrete example — an actual JSON record, request, and
  response — not just a list of field names.

## Plan-mode specificity (the bar for the technical section)
Aligned with Claude Code plan mode's own final-plan requirements: a clear summary of the
approach; ordered files-to-modify with specific changes; step-by-step implementation order;
testing and verification; risks and mitigations.
- The technical approach is an implementation plan, not a description: exact file:line touch
  points from reading the code, and the actual code to write for anything non-trivial (a
  build-ready appendix for long code). History is unambiguous here: the specs that carried exact
  queries/code built cleanly; the specs that described behavior in prose drifted.
- **Concise enough to scan quickly, detailed enough to execute effectively** — both halves are
  the bar. For a pattern repeated across many files, describe the pattern once and list a few
  representative paths.
- **Recommended approach only.** The written spec carries the one chosen design; alternatives
  considered get a one-line "chosen over X because Y" at most.
- **Reuse before invention.** Search the codebase for existing functions, utilities, and patterns
  first; the spec names what it reuses (with paths) and proposes new code only where nothing
  suitable exists.
- When the work comes from a prototype, the prototype's dialed-in code and interaction mechanics
  are embedded verbatim as the build contract — the builder ports faithfully, never re-derives.

## Scope and completeness
- Scope the COMPLETE feature. Necessary work is not punted to an unscoped "later".
- Anything deferred is a deliberate, stated decision in "Out of scope", never a silent gap.
- Simplicity is the other half: scope the whole thing, and nothing beyond it. No speculative
  abstractions or unrequested configurability.
- **Right-size to one mergeable change.** One spec = one epic, one coherent diff. If acceptance
  criteria run well past ~10, or the work spans multiple epics, split it into separate specs and
  let the roadmap sequence them. "Also, we should…" is the signal for a second spec.

## Blocking questions gate the status
- A question whose answer changes the design, acceptance criteria, or scope is BLOCKING. Keep
  `status: draft` while one is open; only move to `specced` once they're resolved. baton
  should not build a spec with open blocking questions.

## Success metrics
- Identify what to measure, not prescriptive targets.

## Human follow-ups
- Mark anything that needs a human decision or asset with `[@humanUser description]`.

## Data stewardship (operator standing rules)
If the work touches persisted data or infrastructure, the spec must reflect: additive /
reversible / idempotent operations; overwrite in place over delete; snapshot before any
unavoidable destruction; state the blast radius before a destructive/bulk step; never discard
data or assume it's worthless without full context and explicit permission; validate on staging
or non-prod before touching production. The repo's CLAUDE.md / NORTH_STAR may add stricter
rules — those win.
