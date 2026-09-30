# Thank-yous, updates and a major-donor plan

Seven steps. Steps 1 to 4 and 7 make up a regular thank-you batch; Step 5 is the quarterly update; Step 6 is reviewed each quarter. At each step tell the user "Step N of 7", what you are doing and why, and what done looks like. Load the voice profile before drafting anything. Encourage the user to give you the goal and the files, then let you plan and ask questions. A good opening sounds like: "Goal: this month's thank-yous in Pastor Dana's voice, ready for her review by Friday. Context: the voice profile and HANDOFF.md. File: the September export with only the agreed columns. Segment it, draft one letter per group, and ask me for anything missing." On a first run, rehearse with the demo or a small test batch before the full export.

Terms used throughout: a **first-time** giver made their first gift; a **recurring** giver gives regularly; a **returning** giver gave again after the profile's lapsed window (for example 12 months) with no gift; a **lapsed** giver has passed that window and has not given since, so they never appear in a gift export; a **major** giver is in the profile's major band.

Work in one folder or Project the ministry controls. If Claude can work in that folder (Claude Desktop's Cowork, a synced Google Drive folder or Claude Code), read the export there instead of asking for uploads. Name files Claude drafts with a `-Claude` suffix (`thank-yous-2026-09-Claude.md`) so reviewers can see what was drafted. Keep a short `HANDOFF.md` there: the batch rhythm, decisions about tone, open items with owners, and the next step; it holds no donor names. Update it at the end of each session so a new chat or a teammate can pick up cold.

## Demonstration

Build a quick voice profile from `assets/demo-voice-samples.md` (fictional letters from Pastor Dana Reyes of Cedar Hill Community Church), then run Steps 2 to 4 on `assets/demo-giving-export.csv`: segment counts, one thank-you per segment, and the call list. Show the Strict option too: one merge-field template. Label outputs "Fictional sample data". About 15 minutes.

## Step 1 of 7: prepare a minimal export

Ask the user to export only: a donor reference number, first name, gift date, fund, amount band (for example "under $250"), and a giver-type flag (first-time, recurring or returning). Leave out addresses, emails, phone numbers, notes, exact amounts and full giving history. If the export has extra columns, say so, ignore them and suggest a leaner export next time; don't repeat their contents. Some churches keep giving records away from the pastor on purpose; follow the church's own policy about who runs the export and who sees it. An administrator can run Steps 1 to 4 and hand the leader drafts with first names only.
Done: the file has only the needed columns. Why: data you never share can't leak.

## Step 2 of 7: segment

Group the gifts: first-time, recurring, returning, and major (the profile's band). A gift can be both major and first-time; note both. Report counts by segment in chat, not name lists, unless the user asks. Flag rows with a missing first name or a likely household duplicate.
Done: the user agrees with the counts. Why: the counts are a quick check that the export and the flags are right before any letter is written.

## Step 3 of 7: draft the thank-yous

Write one base letter per segment in the leader's voice, then personalize each with first name, fund and timing only. First-time givers: welcome and what their gift joins. Recurring: thanks for faithfulness. Returning: glad to have them back, with no guilt. Major: a warmer personal note plus a call flag. Check each draft against the profile's avoid list and sniff test. Before people review, run a second-model check: in a fresh chat, or with a different model if the user's plan offers one, ask: "Audit these drafts against the voice samples and the profile's avoid list; grade each one for sounding like the leader; fix anything below an A and list what you changed." Put the drafts in a review sheet with a decision column (send, edit, redo) and a comment column; work in every comment, save the next version and report what changed.
Done: the leader has reviewed the drafts and edited any that feel off. Feed their edits back into the profile. Why: every edit the leader makes teaches the profile, so the next batch needs fewer.

## Step 4 of 7: flag major-donor follow-ups

Make a call list: donor reference, first name, reason (major band, first large gift, a noticeable increase) and two or three talking points (thank them, share one real story the leader supplies, ask what they would like to hear about). A thank-you call carries no request for money.
Done: the person who makes calls has the list. Why: a call within days of a large gift is remembered; a letter alone is not.

## Step 5 of 7: quarterly update

Gather real material from the leader first: two or three stories (with permission from anyone named), a few numbers, prayer needs, what's next. Draft the update in the letter voice. Offer versions by segment: general, a short personal note added for major donors, and, only if the leader wants to reach lapsed givers, a gentle "we miss you" version. The lapsed list comes from a separate export with reference and first name only, never from the gift export. Don't invent anything; missing facts become `[TO CONFIRM]` and block that paragraph.
Done: the leader approves the final text. Why: an update built on real stories is what keeps donors giving; padding is noticed.

## Step 6 of 7: a simple major-donor plan

Moves management means moving each relationship forward on purpose. In plain terms, each major donor sits in one of four stages: know (getting acquainted), grow (visits, updates, invitations to see the ministry), ask (a specific invitation the leader decides to make, when the relationship is ready) and thank (reporting back on what the gift did). For each, record the stage, the next step, its date and who owns it. Keep this plan as its own living file (for example `major-donor-plan.md`) in a folder the ministry controls, or in their donor system, never in the skill profile or `HANDOFF.md`. Use reference numbers or first names as the sensitivity answer allows. Review it each quarter with the leader and update it after every call or visit.
Done: every major donor has a next step with an owner. Why: relationships stall when no one owns the next step.

## Step 7 of 7: send and clean up

The user merges and sends from their own email or mail tool and marks thanks as done in their giving system. When the batch is finished, remind them to delete the working export and any drafts with names from shared folders or chats, if their sensitivity answer calls for it. Once this runs smoothly, offer to save the monthly batch as a routine or scheduled reminder, if their setup allows.
Done: the user confirms letters went out and the export is cleaned up. Why: a forgotten export in a shared folder is the most common way giving data leaks.

## Useful follow-up prompts

- "Make the first-time thank-you shorter and warmer."
- "Rewrite this draft so it sounds more like the leader's samples, and tell me what you changed."
- "Build the call list for major donors from this month's export."
- "Here is the review sheet with my decisions and comments. Work them in and tell me what changed."
- "Draft our quarterly update from these three stories and numbers."
- "Update the major-donor plan after today's calls."
- "Give me a merge-field version of each letter so I can merge it myself."
