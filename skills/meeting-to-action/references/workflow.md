# From meeting notes to minutes and actions

Seven steps. Tell the user the step number, why it matters, and what done looks like. Keep the order: the confidentiality pass comes before any drafting, and the fact ledger comes before the minutes, because that is what keeps private matters and invented details out of the record.

## Demonstration

Run [the Cedar Hill transcript](../assets/demo-cedar-hill-board-transcript.md) with its [agenda](../assets/demo-cedar-hill-agenda.md) through steps 2 to 6 in short form. Label everything "Fictional sample data". About 15 minutes. The transcript's closing list says what a careful run should catch.

## Step 1 of 7: setup

Run [onboarding](onboarding.md) the first time. Later, load the profile and `open-actions.md`.
Done: you know the body, members, quorum rule and confidentiality rules. Why: the quorum and confidentiality rules shape every draft, so they are settled before any notes are read.

## Step 2 of 7: gather this meeting's notes

Ask for everything at once: agenda, transcript or notes, any handouts, and the date. Teach the habit: "Drop the files into your folder (or this Project) and tell me the outcome you want: minutes, action list and follow-up drafts in one pass." In Cowork, read them from the folder; otherwise accept uploads or paste.
For a photo of handwriting, transcribe it first, mark unreadable words "[illegible]", and show the transcription for the user to correct before you use it. For a transcript, note that speaker labels from recording tools are often wrong.
Done: the user confirms these are all the notes and the meeting date. Why: the agenda tells you what was planned, the notes tell you what happened, and the gaps between them are where errors hide.

## Step 3 of 7: the confidentiality pass

Before drafting anything, scan for executive session, pastoral or counseling matters, prayer requests about named people, personnel, and legal matters. List them by topic and location only (for example "7:42 to 7:58, personnel, executive session"), without repeating the details. For each, ask: hold out, include in general terms, or include. Default is hold out.
Done: every flagged item has the user's decision. Why: this comes first because details that reach a draft tend to get forwarded, and minutes may be read by anyone with a right to see them for years.

## Step 4 of 7: the fact ledger

Build a short ledger, each line with its source location (timestamp, line or page):
- Attendance: present, absent, arrived late or left early, guests and staff present. Only people the notes place there.
- Quorum: compare the count of voting members present to the bylaws rule. If the rule or the count is uncertain, write "quorum: to confirm".
- Times: called to order, adjourned, and any executive session start and end the notes state.
- Each motion: wording as stated, mover, seconder, result, and counts or abstentions if recorded. Missing pieces are "[not in notes: confirm]". A motion with no recorded second, or a vote that isn't clear, is flagged, not resolved.
- Decisions by consensus, items tabled or referred, reports received.
- Action items: task, owner, due date, each only as stated.
Show the flagged lines to the user and ask the ones they can answer from memory.
Done: every open line is answered or stays marked. Why: a motion the body never voted on is far easier to spot in a table than in a paragraph, and the minutes are a legal record.

## Step 5 of 7: draft all three in one pass

- Minutes, following [minutes format](minutes-format.md) and the user's reference minutes, marked DRAFT.
- Action list grouped by owner: task, due date (or "due date: to set"), source, status. An "unassigned" group for tasks with no named owner. Carry forward open items from `open-actions.md` and mark any now done. An action that came out of a confidential matter goes to its owner privately, in general words, not on the shared list.
- Follow-up email drafts in the profile's style. Include only what is in the minutes or action list, never held-out content. Placeholders for missing dates.
Save files with a `-Claude` suffix (for example `2026-10-14-board-minutes-DRAFT-Claude.docx`) so everyone sees what Claude drafted.
Done: three drafts saved, open items listed. Why: the three documents come from the same ledger, so they agree with each other; drafted separately they drift.

## Step 6 of 7: check, then structured review

Before people review, run a second-model check: in a fresh chat, or with a different model if the user's plan offers one, give it the drafts, the notes and the ledger and ask: "Audit these minutes against the notes: trace every motion, vote, attendee and action to its source and search for anything held out; grade them; fix anything below an A and list what you changed." Check names against the roster and dates against the calendar.
Then the people review. Offer a review table: item, draft text, source, decision (OK, fix, cut), comment. The secretary or clerk, then the chair, go through it. Work in every comment and report what changed. If their plan includes artifacts, an interactive review page works well for this.
Done: the reviewers say the draft is ready for the packet. Why: the person who drafted is the worst one to find what they missed, and the two reviewers see different things: the clerk knows the form, the chair knows what the body meant.

## Step 7 of 7: hand off

A person puts the DRAFT minutes in the board packet and sends the follow-ups. If an email connector is connected and the user asks, create drafts there, then say where they are; never send. Update `open-actions.md`. If a task tool is connected and the user asks, add the items and report each one created.
Done: the user knows what is where and what still needs a person. Why: minutes and follow-ups carry the body's authority only when a person sends them.

## After the meeting approves

When the body approves the minutes, the user tells you the date and any corrections. Apply the corrections, replace DRAFT with "Approved [date]", and note the version. Ask about their policy for keeping or deleting recordings and transcripts, and remind them of it.
Once this works for a few meetings, offer to save the steps as a routine (for example "when a new transcript lands in this folder, prepare the three drafts and tell me"), if their setup supports it. Don't turn anything on without a yes.

## Useful follow-up prompts

- "Show me every motion with its source line and anything still marked confirm."
- "Rewrite the minutes with less discussion detail, like our reference minutes."
- "Make one follow-up email per owner with only their items."
- "Compare this meeting's actions with open-actions.md and list what is overdue."
- "Audit these minutes against the transcript; grade them and fix anything below an A."
- "Apply the chair's corrections and mark the minutes approved on the date I give you."
- "Turn the decisions into a one-page memo for staff, leaving out anything held back."
- "Make a simple dashboard of open actions by owner for the next board packet."
