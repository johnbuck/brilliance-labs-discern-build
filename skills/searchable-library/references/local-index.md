# The local tier: an index on the user's own computer

Built with Claude Code, which can run programs on the user's computer. Explain each piece in one plain sentence before building it, and get a yes before installing anything. Pilot one Tier 1 collection end to end before adding more.

## Where it lives
Pick a folder outside any cloud-synced location. Many computers sync Desktop and Documents to a cloud service by default; check, and choose a folder that doesn't sync. Suggested layout: `raw/` (captured text plus a note of where each piece came from), `passages/`, `library.db` (one local database file), `notes/` (saved study notes), `logs/`. Back up the folder before bulk changes.

## Capture the text (you must have the right to use it)
- Transcripts, Word files, text-based PDFs: convert to plain text with standard tools. Scanned PDFs need text recognition (OCR) first; spot-check the result.
- Audio only: transcribe first, ideally with a local speech-to-text tool; sending audio to an online service needs the user's OK.
- Your Bible study software: use only the app's own export, copy or documented automation features, within the license. Never read or decode its module files, and never get around copy protection. Capture through the app's interface can be slow; keep the computer awake (a locked screen can stop it) and log progress so a stopped run can resume.
Record for every captured piece: source, author, section or page, and date.

## Gap audit
Compare expected counts (sermons, chapters, entries) with captured counts, re-read a sample of windows, and write `logs/gaps.md`. Fix what can be fixed; record what can't (for example a volume the ministry doesn't own).

## Split into passages
Split at natural units: a sermon section, a dictionary entry, a commentary section on a verse range, a page. Aim for roughly 100 to 300 words. Each passage keeps its source details and any Bible references, written in a standard form (book, chapter, verse). Test the reference reader on tricky abbreviations so, for example, "Jn" and "1 Jn" are never confused.

## Meaning search on the computer
Install a local model runner (for example Ollama, from its official site) and download an open embedding model sized for the computer. An embedding is a list of numbers that captures a passage's meaning, so passages on the same idea sit close together. Record the model name in the profile. Store a fingerprint (hash) of each passage so re-runs only process new or changed text. The first run on a large library can take hours; it can run unattended.

## Hybrid search
Run two searches and merge them: keyword search (for example SQLite's built-in full-text search, which ranks with BM25) catches exact names, rare words and verse references; meaning search catches ideas. Merge the two rankings with reciprocal rank fusion: each passage gets credit for being near the top of either list. Optionally, a local reranker model re-reads the top 30 to 50 results and reorders them; in real use this noticeably improved answers. Add filters by collection, date and Bible passage, and blend in saved useful / not-useful feedback.

## Let Claude search it
Build a small local connector (an MCP server: a standard way to give Claude a tool on your computer) with tools such as `search_library(query, filters, top)` and `get_passage(id)`. Return short excerpts with citations, never whole works. Back up the Claude Desktop or Claude Code configuration file before registering the connector, restart, and test with a known-answer question. If the user's plan and setup allow reaching Claude on this computer from another device, the same connector can answer from a phone while the computer is on; don't promise this without checking.

## Try the demo script first
`scripts/library.py` shows chunking, keyword search and rank fusion on the fictional sermons, using only standard Python and no network. Replace SKILL_ROOT with the installed skill's path, and write output to a folder the user chooses:

```sh
python3 SKILL_ROOT/scripts/library.py chunk SKILL_ROOT/assets/demo-sermons --out library-demo/passages.jsonl
python3 SKILL_ROOT/scripts/library.py search library-demo/passages.jsonl "Who is my neighbor?"
python3 SKILL_ROOT/scripts/library.py search library-demo/passages.jsonl "What have we said about burnout?"
python3 SKILL_ROOT/scripts/library.py search library-demo/passages.jsonl "What have we said about burnout?" --meaning-ranks SKILL_ROOT/assets/demo-meaning-ranks.json
python3 SKILL_ROOT/scripts/library.py search library-demo/passages.jsonl "hospitality" --passage "Romans 12"
```

The burnout question finds nothing by keyword, because the sermon says "running on empty" instead; with the stand-in meaning ranking, rank fusion surfaces "Rest for the Weary". Try `"book of Revelation"` too: keyword search returns a weak match on the word "book" from a sermon about Lamentations. That is the lesson of step 6: read the excerpt, and when it doesn't answer the question, say the library doesn't cover it. The script refuses to overwrite an existing output file. It does not make embeddings; the real index does that with the local model.
