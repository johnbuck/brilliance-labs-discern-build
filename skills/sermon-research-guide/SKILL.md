---
name: sermon-research-guide
description: Guide a person through setting up and running cited sermon research from their own Logos library, including account connection, personal commentary selection, source coverage checks, and a research packet. Use for Logos research onboarding or research packets, not sermon manuscript writing.
---

# UNDRSCOR Sermon Research Guide

Help the user build and use a research workflow specific to their own library. End with commentary research and exegesis for their review. Do not generate sermon manuscripts, preaching outlines, illustrations, or voice imitation in this workflow.

## Begin or resume

Read [onboarding.md](references/onboarding.md) for first-time setup or [research.md](references/research.md) for a returning user. Check the selected workspace’s profile and status before repeating questions. Ask one short question or one closely related group at a time. Reuse answers already given. Explain what each connection enables and verify the result before advancing. Do not turn the entire setup into a questionnaire.

Use Python 3 and the bundled `scripts/research.py` for local profile and source records. Resolve this skill’s path and the chosen workspace on the current machine. See [commands.md](references/commands.md) for exact supported commands and input schemas. The helper has no external package dependencies and makes no network calls.

## Account and library boundaries

- The user signs in directly to their own Logos account. Never request passwords, cookies, tokens, or an exported browser profile.
- Use an available authorized browser/computer tool to inspect the signed-in library, or guide the user through providing permitted source notes/exports. Read [connections.md](references/connections.md) before connecting. Do not pretend an official Logos MCP server or automatic library scanner is included.
- Verify each selected resource actually opens in this account and covers the requested biblical book. A resource ID, catalog listing, or preview alone is not proof of access. Save exact author, title, resource ID, access verification date, and evidence.
- Learn the user’s theological tradition, preferred translation/language, and commentary preferences. Do not inherit the presenter’s framework or books. Treat those preferences as research context while representing sources fairly.
- Isolate each person in a separate workspace with a fresh profile. Confirm the active account when resuming; if it changed, start a new workspace and recheck resources. A local profile label is a record, not automatic account authentication.
- Use only retrieved sources with provenance. Mark partial coverage, missing resources, and substitutions. Do not substitute remembered or public-web commentary while describing it as the user’s Logos research.

## Work and output

Select a small passage and one or two accessible sources for the first successful run. Inspect the beginning and ending of each requested section. Content may span headings or be truncated even if retrieval succeeds. With only one source, do not claim comparison or consensus.

Preserve local source files and manifests, then distinguish commentator claims from your synthesis. Cite author, full title, verified passage/section locator, and resource link. Claim page numbers only when observed. Use short quotations only as needed. Do not distribute licensed commentary extracts with the skill or attendee handout.

Prepare structured research JSON following [commands.md](references/commands.md), then run the helper to create Markdown and DOCX. Read [research.md](references/research.md) for the content contract and review. Source coverage and theological accuracy require human/agent review; the helper validates records and file integrity, not truth. When a document rendering tool is available, render and inspect every page. If unavailable, label the DOCX layout as unreviewed and provide Markdown alongside it.

Save the user’s adjustments to preferences. Offer a short returning-user prompt. For login failures, missing books, new resources, incomplete extracts, or changing accounts, read [recovery.md](references/recovery.md).
