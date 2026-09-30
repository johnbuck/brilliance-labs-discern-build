# Local review packet

The helper validates and renders supplied text. Codex performs editorial work; a selected transcription tool performs transcription. The helper itself never calls an AI service or publishes anything.

From any working folder, replace SKILL_ROOT with the actual installed skill path:

```sh
python3 "SKILL_ROOT/scripts/prepare.py" --input "SKILL_ROOT/assets/demo.json" --out "sermon-publisher-demo-01"
```

Use a new output directory for each version. The helper refuses an existing output path. The demo is a fictional, short teaching excerpt with no audio file; it does not test transcription, hosting, or live publication.

For a real packet, create input JSON in the user's project using the same structure as `assets/demo.json`, with `demo: false`. Paths are relative to that input file. Required fields: `church`, `title`, `date` (YYYY-MM-DD service date), `preacher`, `passage`, `description`, `transcript_file`, `transcript_status` (`unreviewed` or `reviewed`), and `sources`. `series` is optional. `audio_url` is optional and must be a plain HTTPS media URL without embedded credentials or query parameters; keep private/signed links out of the review packet and handle them through the chosen host instead.

`sources` must identify evidence for title, date, preacher, passage, description, and transcript; add series/audio_url evidence when included. These labels help a reviewer find the records. They do not validate factual accuracy. Do not mark a transcript reviewed solely because the JSON is valid.

Output:

- `preview.html`: escaped HTML with a local-draft banner, description, transcript, and any supplied media link. No remote scripts, fonts, or automatic media loads.
- `sermon.md`: generic draft Markdown with JSON-quoted YAML scalar fields. Adapt to the actual website schema before use. Treat transcript Markdown as untrusted input; do not enable raw HTML execution in the target renderer.
- `metadata.json`: normalized supplied fields, draft status, stable record key.
- `transcript.txt`: original text retained.
- `review.json`: file hashes, source labels, issues, and explicit local-only status.

Missing media creates a review issue; no URL is fabricated. Unreviewed transcripts and demo packets are explicitly marked. Even a reviewed input produces a local draft and no publication authorization.
