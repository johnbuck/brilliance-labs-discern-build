---
name: searchable-library
description: Build a private, searchable archive of a ministry's own sermons, trainings, study notes or licensed resource library that finds passages by meaning, not just keywords, and answers with cited excerpts. Two tiers - a claude.ai Project for small archives, or a local index Claude Code builds on the user's own computer for thousands of documents. Use when someone wants to ask questions of their past sermons or study resources, prepare research on a Bible passage from their own library, or keep a large library private while still searching it with Claude.
---

# Searchable library

A Discern & Build ministry workflow for turning a ministry's own sermons, trainings, notes or licensed resources into a private library Claude can search and quote from, with sources.

## Who this is for

Pastors, teachers, researchers and administrators with years of sermons, study notes or a large study library who want to ask "what have we taught on this?" and get an answer with citations.

The user may be new to AI. Lead them: name the step ("Step 2 of 8: rights and priorities"), say what comes next and what done looks like, and explain briefly why each checkpoint exists. Explain the core idea early in plain words: this is retrieval-augmented generation (RAG). Like a good church librarian, Claude first pulls the few most relevant passages from your own library, then answers from only those passages and shows where each point came from. "Meaning search" finds passages about the same idea even when the words differ (weariness and burnout).

Time: the Project tier takes about 30 minutes to set up. The local tier takes an afternoon for a first pilot on one collection; a large library can take several sessions to capture and hours of unattended processing. After that, questions take seconds.

## Choose the next step

- First use: read [onboarding](references/onboarding.md). One question at a time; save `searchable-library-profile.json` where the user chooses, never in the installed skill.
- Demonstration: use the five fictional Cedar Hill sermons in `assets/demo-sermons/` with [the demo questions](assets/demo-questions.md). Try this: "Run the searchable-library demo: answer the demo questions only from the five sermon files, cite title, date, speaker and paragraph for every point, and say so when the library doesn't cover a question." No accounts needed.
- Build and use the library (both tiers): read [workflow](references/workflow.md).
- The local tier in detail, with the demo script: read [local index](references/local-index.md).
- Tools, connectors or trouble: read [connections](references/connections.md).

## Before you start

Ask: "How careful do we need to be with your ministry's data? No constraints; Some (member, donor or counseling data shouldn't leave our systems); Strict; or Not sure?"
- No constraints: either tier.
- Some or Not sure: remove names from pastoral stories and prayer mentions before indexing; keep counseling notes out. The local tier is safer for anything sensitive.
- Strict: local tier only. Only short excerpts reach Claude; if even that is too much, a local chat model can answer instead, with weaker answers.
Also ask who owns each collection (see boundaries). Record both answers in the profile.

## Operating boundaries

- Answer only from retrieved passages, cite each point (title, date, speaker or author, location), and quote exactly. If nothing relevant comes back, say the library doesn't cover it. Label anything from general knowledge as such. Never invent quotes or Scripture references.
- Index only what the ministry has the right to use. Its own sermons and notes are fine; a guest speaker's sermon needs the speaker's permission. For commercial study software and licensed books, capture text only through the app's own features and within its license. Never reverse-engineer it, decode its files or get around copy protection. Fair use is narrow and does not cover copying a whole licensed library, even for private study; the license terms govern. Check the publisher's terms, in writing if unclear, before bulk indexing; some restrict use with AI tools. When still unsure, leave it out and suggest asking the publisher or a professional.
- Licensed text stays for personal study: send Claude short excerpts, never whole works, and don't publish reports that contain them. Scripture quotations in anything shared stay within the translation's permission statement.
- Files uploaded to a Project or chat are stored by the provider under the user's plan terms; say so before uploading anything sensitive. The local library stays on the user's computer, in a folder that does not sync to a cloud service. Nothing is installed, deleted or re-indexed without the user's yes. Back up before bulk changes.
- Claude finds and drafts; people decide. The preacher or teacher decides what to use.

## Deliver

Say what ran: demo, a Project upload, a pilot index or a full index. Name AI-drafted reports and notes with a `-Claude` suffix. Report collections and passages indexed, known gaps, where the files live, what leaves the computer, and open items (rights questions, gaps, next collection).
