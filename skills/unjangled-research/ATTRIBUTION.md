# Attribution and Provenance

The unjangled-research skill combines three skills reviewed in this project's skills survey, under workflow-skill conventions taken from a fourth. Each layer, its source repository, its license as found in the staged copies, and what was taken. The schema adaptation log (AD-8) follows.

## Process core — 01 mattpocock research

- **Source repo:** https://github.com/mattpocock/skills (the `research` skill)
- **Staged copy:** `skills/01-mattpocock-research/`
- **License:** the staged copy ships no license file (only `SKILL.md` and `agents/openai.yaml`). The source repository's root carries an MIT LICENSE ("Copyright (c) 2026 Matt Pocock"), which covers the skill as part of that repository.
- **What was taken:** the process philosophy, not text (the source SKILL.md is 12 lines): hand the whole job to one background agent that reads primary sources itself, primary sources only, follow every claim to the source that owns it, one cited markdown file saved where the project keeps notes — the whole-run handoff shape. Also its `agents/` directory precedent (skill instructions defining a separate agent file, `agents/openai.yaml` in the staged copy), which became this package's `agents/research-agent.md`.

## Evidence layer — 07 199-bio deep-research

- **Source repo:** https://github.com/199-biotechnologies/claude-deep-research-skill (shallow clone at commit f2f2c0f, 2026-04-11)
- **Staged copy:** `skills/07-199bio-deep-research/`
- **License:** the repository ships no standalone LICENSE file (neither in the staged copy nor in the clone). Its README.md "License" section declares, verbatim: "MIT - modify as needed for your workflow." That declaration is recorded here rather than copying a license text that does not exist.
- **What was taken:**
  - `schemas/source.schema.json`, `schemas/evidence.schema.json`, `schemas/claim.schema.json`, `schemas/run_manifest.schema.json` — vendored with the AD-8 adaptations logged below; everything else verbatim.
  - `scripts/evidence_store.py` — vendored unchanged except a header comment block crediting the origin, commit, and license; v3.3 (2026-09-30) added a `check` subcommand (first-use interpreter guard, exits 1 below Python 3.10), no existing subcommand's behavior changed. Append-only JSONL, sha256 content-hash IDs, duplicate detection verified working in this project.
  - The rule that evidence must be persisted before synthesis begins (from `reference/methodology.md`, Phase 3).
  - Not vendored (v1): 07's other scripts (`citation_manager.py`, `verify_citations.py`, `verify_claim_support.py`, `extract_claims.py`, `validate_report.py`, `source_evaluator.py`, `research_engine.py`) — agent-authored registration and the research agent's inline final-pass verification replace them.

## Output layer — 09 openai Notion research documentation

- **Source repo:** https://github.com/openai/skills (the Notion research documentation skill)
- **Staged copy:** `skills/09-openai-notion-research-documentation/` in this project (the path name is provenance only; no Notion functionality is invoked anywhere in this skill)
- **License:** ships `LICENSE.txt` — MIT-style permission grant, "Copyright 2025 Notion Labs, Inc."
- **What was taken:** `reference/format-selection-guide.md` (ported as `references/format-selection.md`), the four templates (`quick-brief-template.md`, `research-summary-template.md`, `comparison-template.md`, `comprehensive-report-template.md`, ported as `references/templates/*.md`), and `reference/citations.md` (ported as `references/citations.md`) — structure intact and **de-Notioned**: Notion page/database/user mention tags replaced by plain markdown links plus `[E:id]` evidence tags, Notion MCP workflow steps and the Codex/OAuth fallback deleted, the Notion pages-across-workspaces methodology wording replaced by "N registered sources", Citation Validation retargeted to local/structural resolution against the Run Folder's stores, database and user citation sections dropped, the per-run citation-style choice replaced by the fixed FR-14 default. `advanced-search.md` was not ported verbatim in v1 (Notion-only filter payloads). v3.1 (2026-09-30) additions from the same staged copy: `advanced-search.md`'s techniques re-authored harness-agnostic as `references/search-techniques.md` — the Notion filter payloads (`created_date_range`, `created_by_user_ids`, teamspace/page/database scoping) dropped in full and replaced by web-engine operator craft, source-class targeting, and query-iteration method; and the four `*-format.md` guidance docs (`quick-brief-format.md`, `research-summary-format.md`, `comparison-format.md`, `comprehensive-report-format.md`) merged as a format-guidance section at the top of the corresponding `references/templates/*.md`, above the ported skeletons, with any page/database wording adapted to markdown report/filesystem.

## Method layer — Pinkleberry web-research skill (Lily)

- **Source:** the live `web-research` skill in the homelab's hermes-lily agent (`/opt/data/skills/research/web-research/`, retrieved 2026-09-30, 311 lines) — an internally authored operational skill, not an external repository; no external license applies.
- **What was taken (v3.2, 2026-09-30), re-authored harness-agnostic:** the blocked-source access ladder and the zero-results-vs-failed-request distinction (`references/source-access.md`); domain-matrix and terminology-matrix sweep planning, evidence-design weighting, debate mapping, the claims-vs-evidence audit, and the contested-topic neutrality discipline (`references/contested-topics.md`); the terminology-variant sweep, the errata chaining line, and the read-before-citing rule in `references/search-techniques.md`; trigger phrases ("look up", "find information about", "get the latest on", "evidence review", "web research", "both sides").
- **Deliberately not taken:** the source skill's harness-bound content — named MCP tool call sequences, container and vault paths, its PubMed E-utilities and state-court pipelines with their worked-example indexes, municipal-code and sports-schedule specifics. Those are operational memory of that agent's environment, not portable method; they remain in the source skill.

## Conventions — BMAD-METHOD

- **Source repo:** https://github.com/bmad-code-org/BMAD-METHOD
- **License:** MIT, Copyright (c) 2025 BMad Code, LLC
- **What was taken:** no text. Structural conventions only — YAML frontmatter fields, trigger phrasing in the description, phase gates with entry/exit conditions, references loaded only when a phase names them, standing rules, a numbered law checklist, and the confident imperative voice.

## AD-8 Schema Adaptation Log

The four schemas vendor from 199-bio @ f2f2c0f and adapt only where fields contradicted v1 reality. Every adaptation, entry by entry (spine: architecture AD-8; all other schema content verbatim from upstream):

| # | File | Adaptation | Reason |
|---|------|-----------|--------|
| 1 | `run_manifest.schema.json` | Removed the `provider_config` property (search-cli/openalex provider wiring) | Contradicts the no-vendor constraint (AD-5, NFR-2): no vendor APIs, search comes unnamed from the host harness |
| 2 | `run_manifest.schema.json` | `version` const `"3.0.0"` → `"1.0.0"` | This artifact is v1 of a different lineage than 07's 3.x series |
| 3 | `run_manifest.schema.json` | `artifact_paths.report` default `"report.md"` → `"<slug>.md"` | Reports are named `<slug>.md` in the Run Folder (naming convention) |
| 4 | `run_manifest.schema.json` | `continuation.sections_completed` items constrained from free strings to the enum `["scope", "gather", "synthesize", "verify"]` (re-pointed 2026-09-29 from the earlier five-phase vocabulary `["Scope", "Plan", "Evidence", "Synthesize", "Verify"]`) | The v2 rebuild replaced the five-phase pipeline with a four-step working sequence; the continuation vocabulary names exactly those four steps — plan.md is no longer a Run artifact (FR-3), so no "Plan" value exists to complete |
| 5 | `source.schema.json` | Nullable `year` (free string) replaced by `published_at` (ISO date, nullable) | Research Law 5 ("sources carry freshness dates") needs a real date field; access date stays `registered_at` |
| 6 | `source.schema.json`, `evidence.schema.json`, `claim.schema.json` | Added optional `supersedes` (`^[0-9a-f]{16}$`) to the three row schemas | Append-only corrections by re-append need a legal home; the schemas' `additionalProperties: false` left the supersession note nowhere to live (on evidence rows the field is schema-reserved only in v1 — the vendored CLI does not accept it, evidence corrections are new rows) |
| 7 | `source.schema.json` | `canonical_locator` description aligned to the AD-7 normalization: lowercase scheme and host, no fragment or trailing slash, tracking params removed, remaining query params sorted by key and kept | Upstream's description dropped the query entirely, contradicting the adopted normalization rule |
| 8 | `claim.schema.json` | Description hash drift fixed: top-level description `sha256(section_id + sentence_text)` → `sha256(section_id + normalized_text)`; `claim_id` property description spelled as whitespace-normalized lowercase text; `support_status` description no longer references `verify_claim_support.py (PR5)` | The referenced script is not shipped in v1; the two descriptions disagreed on the hash input |
| 9 | `run_manifest.schema.json` | `mode` enum **unchanged** (`quick/standard/deep/ultradeep`) — recorded here as deliberately kept | Stakes Tier maps onto it by fixed rule (time-boxed→`quick`, default→`standard`, decision-grade→`deep`, `ultradeep` reserved); no adaptation made |
| 10 | `claim.schema.json` | `section_id` description rewritten from upstream report-section examples (`executive_summary`, `finding_1`, `synthesis`) to the AD-7 definition: kebab-case slug of the `scope.md` sub-question the claim answers (`general` if none) | Upstream's examples contradicted the adopted `claim_id` hash-input rule — two authoritative texts would produce different `claim_id`s for the same claim |
| 11 | `source.schema.json` | `registered_at` description gained "(access date)" | Matches the spine's freshness convention: publication date in `published_at`, access date in `registered_at` |

`evidence_store.py` is vendored verbatim (attribution header prepended; shebang preserved) except for the v3.3 `check` subcommand noted above — see the Evidence layer section. `scripts/final_pass.py` (v3.4) is original work for this skill — no upstream.

## v3.4 note

`scripts/final_pass.py` is locally authored (2026-10-01), stdlib only. It exists because two independent smoke runs (hermes/DeepSeek-v4-pro) self-declared Final-Pass PASS on runs an independent verifier failed; its checks are exactly the mechanically-decidable classes that recurred. Validated against both smoke runs: it reproduces every relevant finding from both verifier reports with no false positives after tuning (schema-optional keys, year tokens, dict-shaped artifact_paths).
