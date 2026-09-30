# From fit check to submitted proposal

Eight steps. At each one, tell the user "Step N of 8", what you are doing and why, and what done looks like. Keep the order even when a shortcut looks possible; each checkpoint prevents a common, costly mistake. Encourage the user to give you the goal, the context and the files up front, then let you plan and ask questions, rather than feeding one small prompt at a time. A good opening sounds like: "Goal: an LOI to this funder by its deadline that our director can approve. Context: our profile and HANDOFF.md. Files: the guidelines, last year's proposal, our budget. Plan the steps, ask me what you need, and push back if the fit looks weak."

Work in one folder or Project per funder and cycle (for example `lantern-rock-2026/`). If Claude can work in the ministry's own folder (Claude Desktop's Cowork, a synced Google Drive folder or Claude Code), read the files there instead of asking for uploads. Name every file Claude drafts with a `-Claude` suffix and a version (`loi-v1-Claude.md`), so everyone can see what was drafted and what people reviewed. Keep a short `HANDOFF.md` there: context, decisions made, positions not to revisit, open items with owners, and the next step. Update it at the end of every session; a new chat, a teammate or another computer can then pick up cold.

## Demonstration

Use `assets/demo-funder-guidelines.md` (the fictional Lantern Rock Foundation), `assets/demo-juniper-street-materials.md` (fictional Juniper Street Ministries) and `assets/demo-comment-log.csv`. Run Steps 1 to 7 in short form: guidelines summary, go/no-go, fact sheet, the form fields plus two drafted answers with word counts, a budget and narrative, the sample comment log worked into a v2, and the checklist. The materials leave a partner commitment unconfirmed on purpose; show it as a placeholder, not a fact. Label every output "Fictional sample data". About 15 minutes. Rehearsing here first means the first real application starts with a pattern the user has already seen.

## Step 1 of 8: gather the funder's guidelines

Ask for the guidelines or RFP as pasted text, a file or a link; read the page if you can. Save `guidelines-summary-Claude.md`: priorities in the funder's words, eligibility, amount range, deadline with time zone, stage (LOI or full proposal), every question with its exact word or character limit, attachments, budget rules (indirect costs, match, multi-year shares), reporting duties, contact rules, and any rule about AI-assisted writing (if the funder asks, the user discloses honestly). List unclear points as questions the user may ask the funder.
Done: the user confirms the summary matches the source. Why: every later step is measured against this.

## Step 2 of 8: go/no-go

Rate five areas as fit, partial or no, with one line of evidence each: mission fit, eligibility, deadline (working days available against days needed), capacity (who writes, who would run the project, can we meet the reporting), and amount (in range and sensible against the project and annual budget). Note any relationship with the funder the user describes. A hard eligibility "no" ends the application. Recommend go, go with conditions, or no-go; the person named in the profile decides. Record it in the profile and `HANDOFF.md`.
Done: a person has decided. Why: a no-go now saves weeks. Many strong proposals grow from a relationship built over months (a visit, an event, updates), not a cold ask; if there is no relationship, say so and suggest how to begin one.

## Step 3 of 8: assemble materials and a fact sheet

Compare what the funder asks for with what exists. Pull every fact the drafts may use into `fact-sheet-Claude.md`, each with its source, as-of date and who confirmed it. Flag facts older than about a year to reconfirm.
Done: every number the drafts will need has a source or a `[TO CONFIRM]` owner. Why: only sourced facts go in drafts, and a funder may ask later where a number came from.

## Step 4 of 8: draft the answers, form fields first

Start with the short form fields (amount, dates, project type, staff added, other funding), because the narrative must agree with them. Then draft each question in the funder's order: the question and limit, the paste-ready answer, and its count ("214 of 300 words"). Write plain prose; most portals don't accept tables, so no tables in submitted answers. Keep sources and working tables in an "Internal notes, do not paste" block under each answer. Lead with the answer, use the funder's language where it honestly fits, one clear ask, specifics over adjectives. Stay about 5 percent under each limit in case the portal counts differently.
Done: every field has an answer within its limit or a named placeholder. Why: fixing the numbers first keeps the story and the form from drifting apart during review.

## Step 5 of 8: budget and budget narrative

Build the budget only from numbers the treasurer or finance lead supplies; never estimate a salary or cost. Show total project cost, amount requested and other sources (committed and pending, labeled). Follow the funder's rules on indirect costs, match and multi-year shares. Write a one-sentence narrative per line tied to the story. Check that every number in the answers matches the budget.
Done: the budget approver signs off. Why: a mismatch between narrative and budget is one of the fastest ways to lose a reviewer's trust.

## Step 6 of 8: review rounds and the comment log

Before people review, run a second-model check: in a fresh chat, or with a different model if the user's plan offers one, ask: "Audit this draft against the guidelines summary; grade each answer; fix anything below an A and list what you changed." Then send the draft to the human reviewers. Log every comment in `comment-log.csv` (id, version, reviewer, section, comment, response, status: open, resolved or declined with reason). Work in every comment, save the next version, and put a note at the top: "v3 integrates all 12 comments on v2; 1 declined, see log." Never drop a comment silently. Expect two to four rounds.
Done: the log has no open items and the decider approves the final version. Why: reviewers trust a draft when they can see what happened to each comment.

## Step 7 of 8: final checklist

Confirm with the user: every field answered and within limit; numbers consistent across fields, answers and budget; no placeholders left; attachments ready (determination letter or church documentation, board list, recent financial statements or audit, budget, letters of support, annual report); correct contact and signer; deadline and time zone; portal preview checked. The user submits and saves a copy of exactly what was submitted.
Done: the user reports it submitted. Record the date and any confirmation number in `HANDOFF.md`. Why: the saved copy is what the reports and any follow-up will be measured against.

## Step 8 of 8: after submission

List obligations in `reporting-calendar-Claude.md`: decision date, site visit, interim and final reports, spending period, restrictions, recognition rules, each with an owner and the records that will feed it. With a connected calendar and the user's okay, add reminders; otherwise hand over the list. An invitation to a full proposal starts again at Step 1 and reuses the fact sheet and answers. For an award: the signer reads the grant agreement's restrictions before signing, and the treasurer records the grant as a restricted gift in the books (in QuickBooks Online, for example) so spending is tracked against it; ask them to check with the ministry's accountant if they are unsure how. Draft reports from actual records only. For a decline, draft a gracious thank-you and note any feedback. Update the profile's funder stage. Once this works, offer to save a monthly check of reporting dates as a routine or scheduled task, if their setup allows.
Done: every obligation has an owner and a date. Why: a late or thin report costs the next grant.

## Useful follow-up prompts

- "Shorten the project description to 250 words without dropping any numbers."
- "List every fact in this draft and where it came from."
- "Here are the board chair's comments. Add them to the log, work them in and tell me what changed."
- "Audit v3 against the guidelines and grade each answer."
- "What is still open before we can submit, and who owns each item?"
- "Update HANDOFF.md with today's decisions."
- "Draft our interim report from these program records."
