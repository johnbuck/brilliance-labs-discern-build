# Guided onboarding

Start with the user's request. If they want the demo, run it without an interview. Otherwise look for `searchable-library-profile.json` in the folder they choose; reuse what is there and ask only for gaps.

Open with: "What would you most like to be able to ask your library?" Real questions shape everything else. Then explain the shape of the work in two sentences: eight steps; we start small with one collection, check it works, then grow.

Teach the habit early: "Tell me what a good answer looks like for you, for example 'three passages with sources, then a short summary', and I'll aim for that. Push back when an answer misses."

Ask one focused question at a time. Say why you're asking.

1. Contents: "What's in the library: sermons, class notes, trainings, study notes, a licensed study library, or a mix?"
2. Size: "Roughly how many files or pages?" A few dozen to a few hundred documents usually fits the Project tier; thousands of documents or pages points to the local tier. Check the current limits of their plan rather than quoting a number.
3. Location and format: "Where do the files live now, and in what form: text transcripts, PDFs, Word files, audio only, or inside study software?" Audio needs transcripts first.
4. Rights: "Who owns each collection? Are any sermons by guest speakers? For licensed resources, do you know what the license allows?" Record each as `owned`, `permission-needed`, `licensed-ok`, `licensed-check` or `exclude`. `permission-needed` and `licensed-check` items wait until permission or the terms are confirmed. Why: a library is only useful if the ministry can keep using it with a clear conscience.
5. Sensitivity: the data-sensitivity answer from SKILL.md, and "Do any sermons or notes mention people by name in personal stories?"
6. Setup: "Are you using claude.ai, Claude Desktop, or Claude Code? Are you comfortable installing one free app?" The local tier needs Claude Code and a computer with free disk space; ask, don't assume.
7. Priorities: for the local tier, offer a priority picker: a simple page (an artifact) listing every collection, where the user sorts each into Tier 1 (index first), Tier 2 (later) or Skip. In real use this is how the leader chose what to index first.
8. Answer style: "How should answers cite sources: title and date, page numbers, verse references?"
9. Review: "Who checks answers before anything is used in a sermon or class?" Record the role.

Save `searchable-library-profile.json` (non-secret; unknown values null; never file contents):
- `schema_version`: 1
- `ministry_name`, `library_purpose`, `example_questions`
- `tier`: `project` or `local`
- `collections`: list of {`name`, `type`, `approx_size`, `format`, `rights_status`, `priority_tier`}
- `index_folder` (local tier; confirmed not cloud-synced)
- `models`: {`embedding`, `reranker`} (local tier)
- `connector_name` (local tier)
- `citation_style`, `reviewer_role`, `data_sensitivity`
- `open_questions` (for example rights checks pending)

Keep a short `HANDOFF.md` beside the profile: what is indexed, known gaps, the next collection and any pending rights questions, so another session can pick up cold. Tell the user where both files are.
