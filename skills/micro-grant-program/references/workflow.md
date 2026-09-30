# Running a micro-grant program

Seven steps. Steps 1 and 2 happen once (and whenever records drift); Steps 3 to 5 repeat every round; Steps 6 and 7 come when someone needs the big picture. At each step tell the user "Step N of 7", what you are doing and why, and what done looks like. Encourage them to give you the goal and the files, then let you plan and ask questions. A good opening sounds like: "Goal: a fair review packet for the fall round that our committee can score next Tuesday. Context: our profile, rubric and HANDOFF.md. Files: the applications export with contact columns removed. Plan it, ask me what's missing, and tell me if any application is incomplete."

Work in one folder or Project for the fund. If Claude can work in the ministry's own folder (Claude Desktop's Cowork, a synced Google Drive folder or Claude Code), read the master record there instead of asking for uploads. Name files Claude drafts with a `-Claude` suffix (`fall-2026-review-packet-Claude.md`). Update `HANDOFF.md` at the end of each session: decisions, open items with owners, next step, so a new chat or a teammate can pick up cold.

## Demonstration

Use `assets/demo-applications.csv` (fictional Cedar Hill Community Church Neighborhood Grants Fund, three years of rounds) and `assets/demo-rubric.md`. Show Step 3 for the three Fall 2026 applications, one award and one decline letter, the Step 5 report check (one report overdue, two due soon), a Step 6 snapshot and a short Step 7 story. Notice that one applicant has an overdue report from an earlier grant; show it as history for reviewers, not a judgment. Label outputs "Fictional sample data". About 15 minutes. Rehearsing here first means the first real round starts with a pattern the user has already seen.

## The master record

One row per application, with these columns (rename to fit, keep the meaning): `app_id`, `round`, `date_received`, `ministry`, `contact_first_name`, `contact_email` (master only, never in packets), `amount_requested`, `project_title`, `project_summary`, `people_served_est`, `status` (received, in review, awarded, declined, withdrawn), `award_amount`, `decision_date`, `paid_date` (entered by the treasurer), `report_due`, `report_requested_date`, `report_received_date`, `report_status` (not due, due, overdue, received, not applicable), `report_link`, `notes`. The demo CSV uses a subset.

## Step 1 of 7: intake form

Draft a short form (10 to 12 questions) whose answers map one-to-one onto master-record columns: ministry and contact, tax status (church, 501(c)(3) or other), project title and summary, amount, who benefits and roughly how many, timeline, budget, and a yes/no on agreeing to report. Draft the confirmation message applicants see. The user builds it in their tool (for example a Google Form linked to a sheet, or their website's form builder), or you build it if a connector allows and they ask. Test with one fictional entry.
Done: a test entry lands in the right columns. Why: a form that matches the record removes retyping.

## Step 2 of 7: one master record

If records are scattered, combine them first. Ask the user to back up every source file, then work on copies. Give each application one ID, link every award to its application, attach each impact report to its award, and give every row a final status (old rounds often sit at "received" forever). Never delete rows; mark them withdrawn. Show the user a count by round before and after, and a list of anything you could not match.
Done: every award links to its application and the treasurer confirms total awards per round against the books. Why: every later step trusts this list. A simple database tool is an optional later step when several forms or people feed the record; a spreadsheet is enough to start.

## Step 3 of 7: applicant summaries for reviewers

When a round closes, write one summary per applicant with the same template and length: basics, the request, who benefits, the budget, evidence for each rubric criterion quoted or paraphrased from the application, questions for reviewers, and history with the fund (past awards, report status). Describe; don't rank. Put the rubric at the front of the packet, strip contact details, and flag possible conflicts of interest for the chair. Before people review, run a second-model check: in a fresh chat, or with a different model if the user's plan offers one, ask: "Audit each summary against its application for accuracy and even treatment; grade each one; fix anything below an A and list what you changed." Give reviewers a score sheet with one row per application and, for each criterion, a score column and a one-sentence reasoning column; after scoring, total the sheets, list where reviewers disagree by two points or more, and hand that list to the chair for discussion.
Done: the coordinator approves the packet and the score sheet is ready. Reviewers score; you may total scores they return. Why: consistent summaries and a shared score sheet are what make a small fund fair, and they let the committee talk about differences instead of impressions.

## Step 4 of 7: decisions, letters and announcement

Record decisions exactly as the committee gives them. Draft award letters (amount, purpose, any conditions, report due date and what to include, and "our treasurer will be in touch about payment", never bank details) and decline letters (gracious, a reason only if the committee gave one, an invitation to apply again). Draft an awards write-up for the board and, with grantees' permission, a public announcement. The signer reviews; the user sends. The award letter, with its purpose and reporting terms, is the record the treasurer keeps with the payment and the entry in the books (in QuickBooks Online, for example). Before payment, the treasurer confirms each grantee's status under the church's own policy. Grants to groups that are not churches or registered charities, or to individuals, need extra care; suggest the treasurer check with the church's accountant before such an award is announced. Update every row's status and set `report_due`.
Done: every application in the round has a final status and a letter that is either sent or held with a reason. Why: a clear letter is what the grantee, the treasurer and next year's reviewers will all rely on.

## Step 5 of 7: impact reports

Each run, and ideally on a monthly schedule, list: due in the next 30 days, overdue, received but not yet logged. Draft short, warm reminders with the report form link. Match each incoming report (form, email or upload) to its grant by `app_id`, or by ministry and round, and log the date and link. If report form responses flow into a sheet automatically, match those rows the same way. Mark "not applicable" when a project was cancelled.
Done: every awarded grant shows a current report status. Why: reports are how the fund learns and how you thank grantees well.

## Step 6 of 7: snapshot dashboard

Build a snapshot from the master record only, dated "as of". Four tabs or sections: Summary (rounds, applications, awards, total awarded, reports received versus due), Organizations (each ministry's history: rounds applied, times funded, total received, report status), Grants Awarded, and Impact Reports. Export as a spreadsheet or PDF, or show it as an interactive Claude artifact for the board if their plan includes artifacts. Refresh it after each round.
Done: the totals match the treasurer's records. Why: a board that sees the same numbers as the books asks better questions and trusts the fund.

## Step 7 of 7: multi-year impact story

Build a program story from the master record and the reports: totals by year, kinds of ministries funded, what grantees said (quoted only from reports), and what the fund has learned. Make two editions: a full internal edition, and a shareable edition with no personal stories or per-grantee amounts unless grantees agreed. The pastor or board chair reviews both. If the church uses Scripture in its materials, 2 Corinthians 9:12 (a gift that meets real needs and overflows in thanksgiving to God) fits a story that reports back to givers; offer it, and use it only if the reviewer approves.
Done: the reviewer approves an edition for its audience. Why: the shareable edition is where most privacy mistakes happen, so it gets its own review.

## Useful follow-up prompts

- "Combine these three spreadsheets into one master record. Show me what you couldn't match."
- "Build the review packet for this round with the same template for everyone."
- "Who owes us an impact report, and draft reminders for them."
- "Refresh the snapshot and tell me what changed since last time."
- "Draft the shareable edition of our program story for the congregation."
- "Save this monthly report check as a routine I can rerun."
