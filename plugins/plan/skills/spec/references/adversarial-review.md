# Adversarial review of a finished spec

Run this after the spec file is written and before it is handed to a human or to baton.

The reviewers are **independent**. They get the spec path and the repo, and nothing else — no
transcript, no rationale, no "here's what I was going for". That blindness is the whole point:
the author cannot re-check their own work, because the same wrong assumption that produced the
claim will pass the re-read. A fresh reader opening the same file sees what the author cannot.

Spawn them with the Agent tool, in one message so they run concurrently. Read-only agents; they
must not edit the spec. If subagents are unavailable in the harness, do the passes yourself in
sequence, one lens at a time — weaker, but far better than skipping the step.

## The three lenses

Use all three by default. For a small, single-file spec, the verification lens alone is
acceptable; say so rather than silently dropping the others.

### Lens 1 — verification: is every factual claim true?

```
You are an adversarial reviewer of a SPEC (not code). Repo: <repo path>.
Spec: <absolute path to spec file>.

Read the spec, then OPEN THE ACTUAL FILES and verify every factual claim in it.

Check every one of these, individually:
- Every file:line reference. Open it. Does that line contain what the spec says it does?
  Line numbers drift; a spec written against a stale read is a broken spec.
- Every function signature the spec's proposed code calls. Does the function accept those
  arguments TODAY? Grep the def.
- Every function or symbol the spec calls "existing" or "reuse". Does it exist? Grep it.
- Every claim about what a function returns, and the range/units/normalization of that value.
- Every quoted rule from canon (NORTH_STAR.md, references/*, CLAUDE.md). Open the file and
  confirm the quote is VERBATIM and the cited line is right. Flag any rule that appears in the
  spec but not in the source file — an invented rule is the most expensive defect here.
- Every number: counts, rates, thresholds, percentages. Where did it come from? Is it stated
  as measured, and is the measurement reproducible from what the spec says?

Report a table: Claim | Verdict (VERIFIED / WRONG / UNVERIFIABLE) | Evidence (file:line or the
actual text you found).

Rules: default to WRONG when you cannot confirm. Do not give the spec the benefit of the doubt.
Do not report style opinions. Only report claims you personally opened a file to check.
End with a count: N verified, N wrong, N unverifiable.
```

### Lens 2 — blast radius: what does this change that the spec does not mention?

```
You are an adversarial reviewer of a SPEC (not code). Repo: <repo path>.
Spec: <absolute path to spec file>.

Your job is to find what this change BREAKS that the spec never mentions. Read the spec, then
investigate the code.

For every function, field, key or record the spec changes:
- Grep EVERY caller of every function the spec modifies. Name each one. Does the spec account
  for it? A helper shared between a "fallback" path and a primary path changes both.
- If the spec re-keys anything (a node, an id, a name, a record), grep every downstream write
  or read that matches on the OLD key. Those silently stop matching.
- If the spec moves or reorders code, check whether it still works in the new position — does
  it depend on state that does not exist yet at the new location?
- Check the conventions sibling code applies to the same surface (filters, guards, soft-delete
  flags, normalization). Does the spec's new code apply them too?
- If the spec touches persisted data, is the change reversible, and does the spec say how?

Report a table: Risk | Where (file:line) | Does the spec cover it? (YES / NO / PARTIAL) | What
would actually happen.

Rules: report only risks you traced in the code, with file:line. Rank most-severe first. If you
find nothing, say so plainly — do not manufacture findings.
```

### Lens 3 — buildability: could a builder who has never seen this conversation build it?

```
You are an adversarial reviewer of a SPEC (not code). Repo: <repo path>.
Spec: <absolute path to spec file>.

Judge ONLY whether this spec is complete and unambiguous enough to build from. You have no
context beyond the spec and the repo — that is exactly the position the builder is in.

CHECK THIS FIRST, and treat every failure as BLOCKING — it is the most common reason a spec
halts a build:
- Does EVERY quoted rule in the North Star / canon check carry a concrete `testable:` condition
  a test or command could actually check? A quote followed by prose reasoning ("→ therefore
  this complies") is a FAILURE, not a pass. The builder's planner does not leave a missing
  condition blank; it invents one, and it invents it wrong.
- Where the same behavior is worded or implemented differently at two call sites, does the spec
  pin the condition PER PATH with each file:line? Grep both paths and compare their actual
  wording. One condition asserted over two divergent paths is a failure — report the exact
  divergence you found.

Then check:
- Does the change map (KEEP/CHANGE/REMOVE) cover EVERY change the approach section describes?
  List anything described in prose but missing from the map.
- Is every acceptance criterion testable, and does it name how it is verified? Flag any
  criterion that is an aspiration rather than a check.
- Does the spec present multiple selectable options anywhere? That makes the builder choose.
  Flag it.
- Is anything left to "later" without being a stated, deliberate out-of-scope decision?
- Are there ambiguous terms a builder could read two ways?

Report a table: Gap | Section | Why a builder would get it wrong | Severity (blocking / minor).

Rules: assume nothing that is not written. Do not infer intent. If you had to guess to answer a
question, that guess is a finding.
```

## Acting on the findings

The author's job is to be corrected, not to defend the spec.

1. **Never rebut a finding from memory.** Open the file it cites. Today's most expensive spec
   errors all felt correct when written.
2. **Fix every CONFIRMED finding in the spec**, then say in one line what changed.
3. **A finding that turns out wrong still gets a line in the spec** where it was ambiguous
   enough to mislead a careful reader — the builder will misread it the same way.
4. **A structural finding usually means a section is missing, not a sentence.** If the reviewer
   says the change map does not cover the approach, add the entries; do not soften the approach.
5. **If a finding exposes a question only the operator can answer** (a threshold, a scope
   boundary, a cost trade-off), stop and ask with AskUserQuestion. Do not resolve it by picking.
6. **Re-run the verification lens only** if the fixes introduced new file:line claims,
   signatures, or quotes. A second full round is rarely worth it.

## When to stop

Ship the spec when the verification lens reports zero WRONG and zero UNVERIFIABLE claims, and
lenses 2 and 3 report no blocking findings. Minor findings can be accepted explicitly — write
the acceptance into the spec rather than leaving it silent.
