---
name: unjangled-research
description: 'Research a question against primary sources and write the findings as one cited markdown report, recording every source, quote, and claim in an append-only store as you go. Use when the user says "research", "research this", "research thoroughly", "deep research", "web research", "look into", "look up", "check into", "dig into", "find information about", "get the latest on", "can we take a look at", "compare X vs Y", "state of the art", "literature review", "evidence review", "investigate this claim", "both sides", or wants reading legwork done with citations out.'
---

# Unjangled Research

Load a reference file only when a step below names it. Six steps: **scope, search and read, record as you go, pick the format, write it, verify** — the manifest's continuation `sections_completed` enum uses the four underlying names `scope`, `gather`, `synthesize`, `verify`. Three things always hold: evidence is persisted before synthesis begins; `run_manifest.json` is finalized last; citation coverage is checked before the report counts as done.

## Rules

1. Primary sources only: official docs, source code, specs, papers, standards, filings, first-party APIs — never a secondary write-up of them. A secondary source may point; it may not testify. Follow every claim back to the source that owns it; if the owner cannot be reached, label the claim unverified or drop it. Read the sources yourself; raw pages stay in your own context, never persisted as run artifacts.
2. Never conclude from training data alone. What you already know proposes queries and structure; conclusions require evidence captured this run. Report recall as belief, not fact.
3. Evidence precedes synthesis. Every source, quote, and claim lands in the run folder the moment you capture it. Persist the quote first, write the report sentence second.
4. A claim is a sentence with a source — publisher, publication date, access date, locator; no naked numbers. Publication date goes in `published_at`, access date in `registered_at`; a number from three years ago is history, labeled as such.
5. The stores are append-only and nothing is fabricated: no edited rows, no invented citations, no placeholder sources, no smoothing over contradictions.
6. Report what is real: single-source findings flagged as single-source, contradictions surfaced and never averaged, absence of evidence reported as a finding. The report is the synthesis, not the dump — what changes for the user's decision leads, raw findings follow.

## Conventions

- `{skill-root}` is this skill's installed directory; bare paths here (e.g. `references/citations.md`) resolve from it. `{run-dir}` is the run folder `<notes-dir>/<slug>-<YYYYMMDD>/`, where `<notes-dir>` is wherever the project keeps research notes (fallback `./research/` — and say where the run landed). Every artifact lands inside it.
- The **slug** is the kebab-case normalization of the scope question (lowercase, `[a-z0-9-]`, at most 6 words), derived once during scope and recorded in `scope.md`. The report is `<slug>.md`.
- The evidence store is the only mutable run state; the JSON schemas in `{skill-root}/schemas/` are the sole row authority — where this file restates row fields, the schema wins. Everything is stdlib Python 3.10+; timestamps are ISO-8601 UTC.
- **Tooling guard, once per session before the first CLI call:** run `python3 {skill-root}/scripts/evidence_store.py check` (substitute `python` for `python3` where the bare name is what exists). `status: ok` → proceed with the CLI. A failed or crashing check means no Python 3.10+ on this machine — the skill never installs an interpreter or any package; switch to No-Python mode (below) and record the switch as an assumption row.
- Provenance and licenses: `ATTRIBUTION.md`.

## 1. Scope

- Brain dump first, one turn, up front: ask what the user already has (links, prior reports, named suspects, hard constraints like geography, time horizon, budget) and what decision or learning goal the research serves. Do not probe past this. When no user is available, skip the asking turns, derive constraints from the question alone, and record them as assumptions with status `implicit`.
- Pull the question into focus with open prompts ("what would change for you depending on the answer?") and infer-and-confirm ("I'm assuming X is in scope — right?"). When you find yourself framing the answer, stop and hand the pen back.
- Calibrate stakes — time-boxed / default / decision-grade; stakes set depth (source count, verification effort, report length). Decompose into 3–8 sub-questions, define success criteria and exclusions, derive the slug and record it.
- For contested topics or decision-grade stakes, plan the domain matrix and the terminology matrix before any search — `references/contested-topics.md` carries the discipline.

Done when `{run-dir}/scope.md` is written with exactly these fields — one-sentence research question, the decision it serves, 3–8 sub-questions, success criteria, exclusions, Stakes Tier, slug — and the user would recognize the sentence as their own. Then create `{run-dir}`, the initial `run_manifest.json` (see *The Evidence Store*), and empty `sources.jsonl` and `claims.jsonl` alongside the CLI's `init`. If a run folder for this topic already exists, create nothing — the continue rule in step 3 governs; append `-2`, `-3`, … to the slug only for an unrelated folder that merely shares it.

## 2. Search and read

Plan per sub-question in `scope.md`: name the primary-source classes that own the answer (official docs, source repos, papers, standards, filings, benchmarks) and 2–3 search angles each, then work them with your harness's search tools; `references/search-techniques.md` carries the operator craft, per-source-class targeting, and query-iteration moves for this step. When a source blocks you or results thin to zero, `references/source-access.md` carries the fallback ladder and the zero-results-vs-failed-request rule. Secondary sources are leads to primaries, never evidence. Read sources directly. Get today's date once (`date +%Y-%m-%d`) and use it for recency windows — never assume a year from training data. Keep raw pages in your own context; whatever you intend to use goes into the store in the next step, before you reason about it.

## 3. Record as you go

If a run folder for this topic already exists, **continue it rather than start a duplicate** — read its `scope.md`, stores, and `run_manifest.json` first, continue the sequence from where the evidence stands, never rewrite or reorder existing rows, and record continuation facts in the manifest's continuation block. For every source you open, the store comes first, in this order:

1. **Register the source** the moment you open it: append one row to `{run-dir}/sources.jsonl`, conforming to `schemas/source.schema.json`. Row fields, exactly as the schema defines them:
   - Required: `source_id` (16-hex), `canonical_locator`, `raw_url`, `title`, `source_type`, `metadata_status`, `registered_at` (ISO timestamp — the access date).
   - Optional: `authors` (array of strings or null), `published_at` (ISO date `YYYY-MM-DD` or null — the publication date), `supersedes` (16-hex).
   - `source_type` enum: `web` | `academic` | `documentation` | `code` | `news` | `government` | `book`. `metadata_status` enum: `unverified` | `doi_verified` | `url_verified` | `title_matched` — record `unverified` at registration; move to a verified value only when you actually verified that aspect this run.
   - Compute `source_id` with the one-liner under *IDs and URL Normalization*. Re-encountering the same canonical locator dedups by `source_id` — do not append twice. Corrected metadata is a new row (same `source_id`, `supersedes` naming the prior row's `source_id`); readers take the last row; mere re-encounters never append.
2. **Persist every load-bearing quote through the CLI — and only through the CLI.** You never write `evidence.jsonl` by hand; No-Python mode is the single exception:
   ```bash
   python3 {skill-root}/scripts/evidence_store.py init --dir {run-dir}
   python3 {skill-root}/scripts/evidence_store.py add --dir {run-dir} --json "$(cat <<'JSON'
   {"source_id": "...", "quote": "exact text", "locator": "section 3.2", "evidence_type": "direct_quote", "retrieval_query": "..."}
   JSON
   )"
   python3 {skill-root}/scripts/evidence_store.py list --dir {run-dir}
   ```
   The JSON is heredoc-built because quotes contain apostrophes — never embed quote text in the command line. `evidence_type` enum: `direct_quote` | `paraphrase` | `data_point` | `figure_reference` | `methodology`; the CLI records any other value as `direct_quote`, so always pass an explicit enum value. The script computes `evidence_id`, returns `status: duplicate` on re-add, and only ever appends. A corrected quote is a new row with a new ID.
3. **Log claims** as they crystallize: one row per atomic claim in `{run-dir}/claims.jsonl`, conforming to `schemas/claim.schema.json`. Row fields, exactly as the schema defines them:
   - Required: `claim_id` (16-hex), `section_id`, `text`, `claim_type`, `support_status`.
   - Optional: `cited_source_ids` (array of 16-hex), `evidence_ids` (array of 16-hex), `extracted_at` (ISO timestamp), `supersedes` (16-hex).
   - `claim_type` enum: `factual` | `synthesis` | `recommendation` | `speculation`. `support_status` enum: `unverified` | `supported` | `partial` | `unsupported` | `needs_review` — start `unverified`, move only toward `supported`/`partial`/`unsupported` as evidence accumulates; conflicting or mutually undercutting evidence sets `needs_review` until resolved. A corrected claim is a re-appended row whose `supersedes` names the old `claim_id`; if the normalized text is unchanged, no re-append is needed.
4. **Prior runs are a library.** Consult their reports, sources, and evidence freely. To cite anything from them, re-register the source and re-capture the quote into this run's stores during this step, before synthesis begins.

Done when `sources.jsonl` is non-empty, every opened source is registered, and every quote you intend to use is already in `evidence.jsonl`. **No synthesis begins until every captured quote is persisted** — a run that dies mid-flight resumes from disk with nothing lost.

## 4. Pick the format

Walk the decision tree in `references/format-selection.md`: comparison (choosing between options) → quick brief (time-sensitive, simple) → comprehensive report (formal, strategic) → research summary (default).

## 5. Write it

- Fill the matching template from `references/templates/` — each template file carries its own format guidance (when to use, length, structure) above its fill-in skeleton. Adapt sections to the question; never include a section just because the template has it — but each template's mandatory sections stay.
- Cite as you write, per `references/citations.md`: inline `[Title](url)` immediately after the supported sentence; add `[E:id]` wherever support is not evident from the link alone; group citations; end with a Sources section.
- On contested topics, apply the voice discipline in `references/contested-topics.md` — the report documents the dispute; it does not referee it.

Done when the draft is complete at `{run-dir}/<slug>.md` and every factual sentence carries at least one citation that resolves to a registered source.

## 6. Verify

Run the Final Pass checklist below on your own output, then finalize the manifest. Local and structural checks only — no network checks, no validation libraries. On contested topics the pass includes the verdict-word check from `references/contested-topics.md`. No report counts as done without this pass, and the manifest is finalized only after it clears. When it clears, return the report path (`{run-dir}/<slug>.md`) and the artifact paths (`scope.md`, the three stores, `run_manifest.json`); the run folder is the record.

## IDs and URL Normalization

All IDs are sha256 16-hex prefixes — identical inputs give identical IDs on any harness. Compute every ID with the shell one-liner. Text goes in on stdin, never on the command line (quoting breaks on apostrophes and metacharacters), and stdin is stripped, so the heredoc's trailing newline never enters the hash:

```bash
python3 -c "import sys,hashlib;print(hashlib.sha256(sys.stdin.read().strip().encode()).hexdigest()[:16])" <<'EOF'
<text to hash>
EOF
```

`claim_id` hashes the concatenation `section_id + normalized text` with no separator — the first heredoc line is the `section_id`, the rest is the claim text, normalized before hashing (stripped, whitespace collapsed to single spaces, lowercased):

```bash
python3 -c "import sys,hashlib,re
sid, _, text = sys.stdin.read().strip('\n').partition('\n')
print(hashlib.sha256((sid.strip() + re.sub(r'\s+', ' ', text.strip()).lower()).encode()).hexdigest()[:16])" <<'EOF'
<section_id>
<claim text>
EOF
```

- `source_id = sha256(canonical_locator)[:16]` — hash the raw canonical locator exactly as written, with the first one-liner. Canonical locator priority: `doi:10.1038/...` > `arxiv:2305.14251` > normalized URL.
- `evidence_id = sha256(source_id + whitespace-normalized lowercase quote + locator)[:16]` — computed by `evidence_store.py`, never by hand.
- `claim_id = sha256(section_id + whitespace-normalized lowercase text)[:16]` — the second one-liner, where `section_id` is the kebab-case slug of the `scope.md` sub-question the claim answers (`general` if none).
- URL normalization: lowercase the scheme and host; strip the fragment and the trailing slash; drop a param when its key equals one of `fbclid`/`gclid`/`mc_cid`/`mc_eid`/`igshid`/`ref` exactly or starts with `utm_`; sort the remaining query params by key; keep the sorted query. `raw_url` preserves the URL as retrieved, before normalization. Display numbers are assigned in registration order and never stored in state.

## No-Python mode

When the tooling guard fails, the method runs unchanged and only the tooling degrades. The skill never installs anything on the host. All three ID kinds compute with `sha256sum` (macOS: `shasum -a 256`); the shell formulas are byte-identical to the Python ones for ASCII text — non-ASCII uppercase letters (Ü, É) do not lowercase in `tr`, so such quotes hash differently than the CLI would. That divergence is contained: within No-Python mode the formula is self-consistent (dedup greps the shell-computed ID), and a later mode switch can at worst append one redundant row for such a quote — append-only stores tolerate it, references never break.

- Normalize text once (strip, collapse whitespace runs to single spaces, lowercase):
  ```bash
  qn=$(printf '%s' "$text" | tr '[:upper:]' '[:lower:]' | sed 's/[[:space:]]\{1,\}/ /g; s/^ //; s/ $//')
  ```
- `source_id`: `printf '%s' "$canonical_locator" | sha256sum | cut -c1-16`
- `evidence_id`: `printf '%s' "${source_id}${qn}${locator}" | sha256sum | cut -c1-16` — empty `$locator` when null.
- `claim_id`: `printf '%s' "${section_id}${qn}" | sha256sum | cut -c1-16` — `$qn` from the claim text, not the raw quote.
- Append `evidence.jsonl` rows by hand, exactly per `schemas/evidence.schema.json` (`captured_at` from `date -u +%Y-%m-%dT%H:%M:%SZ`); before appending, `grep -c "$evidence_id" evidence.jsonl` — a nonzero count is the duplicate the CLI would have reported. All other steps, stores, and Final Pass checks run unchanged; record the mode as an assumption row (`materiality: medium`, text naming No-Python fallback) so the manifest carries it.

## The Evidence Store

```
{run-dir}/
  scope.md             ← first artifact of every run
  sources.jsonl        ← you append these rows directly
  evidence.jsonl       ← written only via scripts/evidence_store.py
  claims.jsonl         ← you append these rows directly
  run_manifest.json    ← singleton; finalized last, after the Final Pass clears
  <slug>.md            ← the report
```

- The three JSONL stores are **append-only**: rows are never edited or deleted after capture. A correction is a re-appended row whose optional `supersedes` names the superseded row's ID. Re-running checks on an unchanged run leaves byte-identical files.
- `run_manifest.json` is a rewritten singleton, not a JSONL store: created at run start (`version: "1.0.0"`, initial mode `standard`), rewritten as steps complete (mode fixed from the Stakes Tier when scope completes), finalized after the Final Pass clears, and rewritten on resume with its continuation block. Required keys: `version`, `query`, `mode`, `started_at`, `report_dir`, `artifact_paths`. Record `report_dir` as an absolute path (resolve the run folder to absolute at init); `artifact_paths` are filenames relative to the run folder. Stakes Tier → mode, fixed rule: time-boxed → `quick`; default (unmarked) → `standard`; decision-grade → `deep`; `ultradeep` is reserved — this map never assigns it.
- Assumption rows (the manifest's `assumptions` array): required fields `assumption_id`, `text`, `materiality`, `status`. `assumption_id` is `"asm_" +` the first 8 hex of `sha256(text)`, computed with the first one-liner; `materiality` enum: `low` | `medium` | `high`; `status` enum: `implicit` | `user_confirmed` | `evidence_validated`.
- Continuation block (resume only): `previous_run_manifest` (path to the prior manifest), `resumed_at` (timestamp), `sections_completed` (only the step names `scope`, `gather`, `synthesize`, `verify`). A resumed run always carries a non-empty continuation block.

## Final Pass

**Mechanical gate first, every time:** run `python3 {skill-root}/scripts/final_pass.py --dir {run-dir}`. It enforces the classes agents have repeatedly self-certified wrongly: artifact completeness, schema conformance, ID recomputation (source/evidence/claim/assumption), canonical-locator case normalization, every numeral in a cited sentence present in its cited evidence rows, reference resolution, manifest timestamp ordering and non-placeholder values, factual-claim evidence coverage. Fix every violation by re-append (never in-place edits) until it exits 0 — a run whose gate does not exit 0 is not done, whatever your own reading says. The agent-judged checks below then cover what no script can: honest-uncertainty labels, synthesis arithmetic sanity, attribution faithfulness, prose quality.

1. **Citation coverage.** Every factual claim resolves to at least one evidence row (`evidence_ids` non-empty on every `factual` row in `claims.jsonl`); zero orphan `[E:id]` tags or inline citations. Any uncovered claim: add evidence or cut the sentence.
2. **Schema validation.** Walk every row in `sources.jsonl`, `evidence.jsonl`, `claims.jsonl` against the required fields and enums in `schemas/`. Fix a malformed row by re-appending a corrected row, never by editing in place. `supersedes` applies to `sources.jsonl` and `claims.jsonl` only; an evidence correction is a new row with a new `evidence_id` through the CLI — the schema's evidence `supersedes` field is reserved but not CLI-writable in v1.
3. **Reference integrity.** Every inline link in the report resolves to a row in `sources.jsonl` — except cross-reference links to prior runs' reports per `references/citations.md`; every `[E:id]` in the report exists in `evidence.jsonl`; every evidence row's `source_id` resolves to a row in `sources.jsonl`; the Sources section and the inline citations mirror each other; the report carries its template's mandatory sections (`references/format-selection.md`).
4. **Honest uncertainty.** Speculation- and recommendation-typed claims are visibly labeled in the report, never presented naked as findings; `needs_review` claims are resolved or explicitly flagged, never silently presented as supported; stale numbers carry their publication date (`references/citations.md`).
5. **Finalize `run_manifest.json` last**, after all checks pass: query, mode, `started_at` (preserved from the original on resume), `finished_at` (set now, the first and only time), `report_dir`, `artifact_paths` (all paths must exist at this moment), assumptions. Then walk the manifest against `schemas/run_manifest.schema.json` (required keys, enums, continuation values) exactly as check 2 walks the row stores. Never before.
