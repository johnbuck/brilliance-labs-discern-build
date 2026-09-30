# From a recorded sermon to publication

## Intake and transcription

Load the local profile if present. Resolve the exact sermon and requested action. Confirm the service date, title, preacher, passage, and series from approved metadata; distinguish service date from release date. If a title is proposed by Codex, label it a proposal until accepted.

Identify the final recording and retain the original. With an existing transcript, record its source and review status. With audio/video only, use the selected available transcription method. If that would send media to an external service beyond the user's authorization, explain the destination and obtain that authorization before upload. Check actual tool support and service limits rather than guessing them.

For long recordings, preserve segment order and offsets and assemble each segment once. A failed segment leaves an incomplete transcript. Do not fill gaps from the passage, other sermons, or an imagined manuscript. Review a sample against the audio, including the start, a middle portion, the ending, uncertain names, and Scripture references. Keep uncertain text marked for review. If transcription cannot run, provide the concrete blocker and continue with metadata; do not label the sermon complete.

## Editorial preparation

Write the description from the actual sermon transcript, following the church's reference examples. Preserve the preacher's argument and distinguish a paraphrase from a direct quotation. A theological explanation of the passage is not a substitute for a description of this sermon. Avoid unsupported promotional claims. Record the transcript sections supporting the description.

Prepare required metadata and actual media references. Do not pretend that a local path is a public player URL. Optional podcast/video fields are prepared only for chosen destinations. Do not derive video chapters from an untimed text transcript.

Use [local packet](local-packet.md) for a portable preview. For a real site, inspect the target schema/template and transform the packet accordingly; the generic Markdown file is not guaranteed to match any particular CMS. Preserve transcript text independently of its rendered format.

## Review and external work

Return the reviewable packet and list unresolved issues. Setup/demo/draft-only requests stop here unless the user also requested an external draft. For a publication request already authorized, continue once the exact content, target, visibility, and timing are clear. Ask only for missing material choices or authorization not already provided.

Before writing externally:

- Match existing records using the church's recorded rule (for example date + preacher + title) and inspect matches. Clarify ambiguous matches. Do not create another copy after a timeout without checking whether the first attempt succeeded.
- Preserve the remote record ID once created. Update that record for revisions. Keep a local `publication-receipt.json` with packet hash, target, remote ID, action, returned status, URL, and verification outcome, excluding secrets.
- For Git sites, inspect the working tree and use an isolated checkout where needed. Never clear locks, stash others' changes, reset, force-push, or deploy simply to recover from a routine publishing failure. Commit only the intended sermon changes. Draft fields and hosting behavior must be checked in the target schema.
- Validate the selected audio/video asset and public URL when applicable. If no real media URL exists, report that dependency. Website publication does not imply the podcast or video has published.
- For scheduling, confirm date, time, timezone, and provider support; inspect the stored scheduled state after submission.

After an uncertain mutation, inspect remote state first. If the state cannot be established, report “unknown” and stop automatic retries. For multiple destinations, report each result and retry only the incomplete step after reconciling state. Do not delete successful publications as an automatic rollback.

After publishing, read back the live record/page and verify title, date, preacher, passage, media playback/link, transcript visibility, and intended status. A local build or accepted API request alone is insufficient evidence of live publication. If read-back is blocked, say “submitted; live verification unavailable.”
