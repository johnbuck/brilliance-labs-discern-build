# Workflow: build, check and use the library (8 steps)

At each step, say "Step N of 8", what done looks like and what comes next. Start with one collection; a working small library teaches more than a half-built big one. Keep `HANDOFF.md` current so another session can pick up cold.

## Step 1 of 8: purpose and tier
Confirm the example questions and choose the tier:
- Project tier (small archives): a claude.ai Project, if the user's plan includes Projects. Files uploaded as project knowledge are searched when Claude answers in that Project. Fast to set up; the files are stored by the provider under the user's plan terms, so say that before anything sensitive is uploaded.
- Local tier (large or private archives): a search index Claude Code builds on the user's computer. The library never leaves it; only short excerpts go to Claude. See [local index](local-index.md).
Done: the tier is recorded in the profile. Why: the tier decides where the files live, which is the main privacy question.

## Step 2 of 8: rights and priorities
List every collection with its rights status. Leave `permission-needed` and `licensed-check` items out until permission or the publisher's terms are confirmed. For the local tier, have the user sort collections into Tier 1, Tier 2 and Skip on a priority-picker page. Done: a short Tier 1 list, all of it cleared to use. Why: indexing takes effort, so start with what will be used most, and never with what may have to be deleted later.

## Step 3 of 8: gather the text
Project tier: collect the files, remove names from pastoral stories if the sensitivity answer requires it, and prefer text files or text-based PDFs. Local tier: capture text as described in [local index](local-index.md). Keep originals untouched. Done: clean text for every Tier 1 item. Why: search is only as good as the text it reads.

## Step 4 of 8: check what you captured
Compare what you expected with what you have: number of sermons, chapters, entries or pages. Open a few samples and compare them with the originals. List gaps and fix or record them. Done: a written gap list. Why: in real use, a gap audit found entries that had silently gone missing; nobody would have noticed from search results alone.

## Step 5 of 8: build the index
Project tier: upload the files to the Project's knowledge and add project instructions: "Answer only from the project files. Cite title, date, speaker and paragraph or page for every point. If the files don't cover it, say so." Local tier: follow [local index](local-index.md). Done: a known-answer test question returns the right source. Why: a test with a known answer proves the index works before anyone trusts it.

## Step 6 of 8: ask, with citations
Answer from retrieved passages only, cite every point, quote exactly and briefly, and say plainly when the library has nothing relevant. Separate "from your library" and "general background" if the user asks for both. For Bible study, confirm verse references against the user's Bible before they are preached. Done: the user has asked their real questions and seen cited answers, including at least one honest "not in the library". Why: an answer without a source cannot be checked.

## Step 7 of 8: review and feedback
The person who will use an answer checks it against the cited sources. Ask them to mark results useful or not useful; in the local tier, save that feedback so future searches favor what helped. Second-model check: before a person relies on a synthesis, ask a fresh chat or a second model to audit every claim against its cited excerpt; grade it, fix anything below an A, and report what changed. Done: the reviewer has checked the citations they will rely on. Why: the preacher or teacher owns what is said from the front; Claude only found it.

## Step 8 of 8: make it a routine
- Add new sermons or notes each week and re-index (the local tier only processes what changed).
- Save study notes as files in the library folder so they are indexed too.
- Turn a repeat task into a skill, for example a "research report for a Bible passage" routine: gather the top passages from each collection, write a cited synthesis, and save a phone-friendly PDF.
- Update `HANDOFF.md`: what is indexed, known gaps, next collection.
Done: the weekly add-and-re-index step is written down and has run once. Why: a library that stops growing is forgotten within a season.

## Useful follow-up prompts
- "What have we preached on forgiveness in the last three years? Cite each sermon."
- "Build a research report on Luke 10:25-37 from my library, with a short synthesis and every source cited."
- "Which collections are still in Tier 2, and what would it take to add the next one?"
- "Run the gap audit again and tell me what's missing."
- "That answer wasn't useful; note it and try again with different passages."
