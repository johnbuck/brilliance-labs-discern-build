---
name: bsb-scripture-retrieval
description: Retrieve and verify exact BSB passages offline.
version: 0.1.0
author: Ted Hallum, Hermes Agent
license: MIT (helper and instructions); public-domain Bible text
---

# Verified Scripture Lookup and Quotation

Retrieve exact Berean Standard Bible (BSB) text from the included reference JSON instead of reconstructing familiar verses from memory. This is a retrieval and quotation-checking skill, not an interpretation engine or a substitute for a ministry leader's judgment.

## When to use

- Look up a passage for a lesson, handout, devotional, or presentation.
- Verify the reference, range, and wording of a proposed BSB quotation.
- Find candidate passages by keywords, then read those passages in context.
- Inspect the included translation notes and headings separately from verse text.

This skill is BSB-specific. If the user requests another translation, say this package does not contain it. Retrieve that translation from an authorized source; never relabel BSB as another translation or vice versa.

## Setup

Keep this whole skill folder together, including `assets/bsb_smart.json` and `scripts/bsb_retrieve.py`. A lone copy of this Markdown file is not sufficient. The JSON is about 31 MB uncompressed and contains the complete reference data, not a download link or placeholder.

The agent needs a local code-execution tool with Python 3.10 or later and SQLite FTS5 support. No API key, paid service, network call, or external Python package is required. Use `python`, `python3`, or `py -3` as appropriate for the installed Python 3 interpreter; the examples use `python`.

If code execution or file access is unavailable, explain that the helper cannot run in that environment. Do not pretend a lookup succeeded. Ask the user to run it in a supported environment and provide the result, or obtain their agreement to use another verified source.

The first lookup builds a derived SQLite index in the user's cache directory (`LOCALAPPDATA`, otherwise `XDG_CACHE_HOME`, otherwise `~/.cache`). It does not modify the JSON or require writing inside the installed skill. For restricted environments, select a writable cache file with `--db "path/to/bsb.sqlite"`. The index may be regenerated with `--rebuild`; do not distribute the generated cache.

## Run

Resolve the installed skill folder first. These commands run **from that folder**, not necessarily from the repository root. Alternatively, pass the absolute resolved path to the script; its data path is independent of the working directory.

```sh
python scripts/bsb_retrieve.py --stats
python scripts/bsb_retrieve.py --ref "Genesis 1:1" --format compact --no-notes
python scripts/bsb_retrieve.py --ref "John 3:16-18" --format json
python scripts/bsb_retrieve.py --ref "Psalm 23" --format json
python scripts/bsb_retrieve.py --ref "Jude" --format json
python scripts/bsb_retrieve.py --refs "John 3:16; Romans 8:28" --format json
python scripts/bsb_retrieve.py --ref "John 3:35-4:2" --format json
python scripts/bsb_retrieve.py --ref "1 John 1-2" --format json
python scripts/bsb_retrieve.py --search "faith hope love" --limit 5 --format json
python scripts/bsb_retrieve.py --db "bsb-cache.sqlite" --stats
```

Start with one passage and confirm a successful exit status and complete output. Batch multiple references with repeated `--ref` or semicolon-separated `--refs`. Within one range, stay within a single biblical book. Use explicit chapter and verse for verses in single-chapter books (for example, `Jude 1:3`).

## Procedure

1. **Identify the task and translation.** Record the intended reference or search terms. Do not silently correct a questionable reference; flag it and verify what the leader intended.
2. **Retrieve from the included source.** Use `--format json` for cleanly separated `reference`, `text`, `notes`, and `headings`. A failed command is not verified Scripture. Invalid or reversed reference ranges must fail rather than produce a partial passage.
3. **Read the context.** Retrieve surrounding verses or the full chapter before making a teaching claim. A keyword match is a candidate, not proof that the passage supports the proposed meaning. Search covers verse text, notes, and headings; a word may appear in a note rather than in the verse itself.
4. **Preserve exact wording.** Copy the returned `text` for quotations, with the reference and BSB label. Do not blend translations, insert explanatory words as Scripture, or turn a paraphrase into a quotation. Label omissions and excerpts accurately. Translation footnotes and editorial headings are not part of the quoted verse.
5. **Check the final artifact.** Compare every displayed or spoken quotation with the retrieved passage and check that its reference range matches what is actually included. Do not silently replace Scripture inside a quotation from another author; preserve the author's quotation and supply BSB separately when useful.
6. **Report the result and limits.** Distinguish verified quotation wording from your interpretation. For a review, give the reference, mismatch if any, and exact proposed correction. Human review remains necessary for teaching meaning and application.

## Pitfalls

- Empty addressable verse rows are deliberately preserved. Do not fill them from memory or another translation. Consult the associated notes and explain the source's numbering where relevant.
- The helper returns plain-text notes/headings derived from embedded USJ data. It is not a typeset Bible renderer and does not expose every formatting element or every cross-reference as a separate field.
- The included JSON is a contributor-maintained structured dataset, not an official publisher-issued JSON format. Its provenance and preserved source hashes are described in [SOURCE.md](SOURCE.md). It is a bundled snapshot, not an automatically updated Bible edition.
- `--no-notes` affects Markdown and compact output only. JSON always keeps notes in a separate field.
- Simple keyword searches require matching terms; an empty result does not establish that a biblical concept is absent. Explicit FTS syntax is supported, but a malformed search may fall back to plain tokens. Prefer simple words, then inspect the returned references.
- If SQLite reports that FTS5 is unavailable, use a Python installation with FTS5 support; do not silently fall back to remembered quotations.
- Do not load the entire JSON into an AI prompt when a small retrieved passage suffices.

## Verification

From this skill folder:

```sh
python -m unittest discover -s tests -v
```

The offline tests check portable lookups, batch/range handling, invalid-reference rejection, all indexed verse text against the JSON, empty rows, notes, search limits, and rebuild integrity. `--stats` should report 66 books and 31,102 addressable verse rows. Those are data-integrity checks, not a certification of an interpretation or a claim that every addressable row contains text.

Deliver the requested passages or quotation review, with an honest note about any lookup or content-review limitations. Do not publish teaching material simply because a retrieval test passed.
