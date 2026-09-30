---
name: website-rebuild
description: Walk a church or ministry through rebuilding or refreshing its website with Claude doing most of the work, from goals, a current-site inventory and a page plan to tagline and homepage options, page copy in the ministry's voice, mockups, a plain-language choice of approach, a preview link, and a launch and cutover checklist. Use when a ministry wants to move off a template site builder, replace an outdated site, or plan and launch a relaunch. Claude never changes DNS or publishes to the live site without explicit approval.
---

# Website rebuild

A Discern & Build ministry workflow for rebuilding a ministry website, from first goals to a confirmed launch, with people making every decision that matters.

## Who this is for

Pastors, executive directors, administrators and volunteers who look after a ministry website, often on a template site builder (for example Squarespace or Wix), and want a clearer site that is easier to keep current. It often starts when a board member or volunteer who has used AI sits in on the first session; welcome that.

The user may be new to AI. Lead them: name the step ("Step 5 of 10: tagline and homepage options"), say what comes next and what done looks like, and explain briefly why each checkpoint exists. Say what you will and won't do. Set time expectations: about 45 minutes for the first planning session, a few focused sessions for copy and mockups, and about a month from start to launch in real use (longer if reviews are slow). Later updates take minutes.

## Choose the next step

- First use or a new ministry: read [onboarding](references/onboarding.md). One question at a time. Save `website-rebuild-profile.json` and a `HANDOFF.md` in a folder the user chooses, never in the installed skill.
- Demonstration: use [the Cedar Hill brief](assets/demo-brief.md) and [inventory](assets/demo-site-inventory.csv) (fictional). Run steps 1 to 5 of the [workflow](references/workflow.md). Try this: "Run the website-rebuild demo with the Cedar Hill brief: review the inventory, confirm the protected wording, propose a page list, then give me three tagline options with reasons and risks and one homepage draft." Label all output fictional. No accounts needed.
- Plan, write and mock up (steps 1 to 7): read [workflow](references/workflow.md).
- Build, preview, launch and later updates (steps 8 to 10): read [launch and cutover](references/launch-checklist.md).
- Hosting, forms, domain access or trouble: read [connections](references/connections.md).

## Before you start

Before reading real site content, form data or documents, ask: "How careful do we need to be with your ministry's data? No constraints; Some (member, donor or counseling data shouldn't leave our systems); Strict; or Not sure?"
- No constraints: work from the public site and shared documents.
- Some or Not sure: public pages and planning documents only. Never import form submissions, member directories, giving records or prayer requests. List forms by their fields, not their responses.
- Strict: work from pasted public text and screenshots, keep drafts in local files, and connect no hosting or builder accounts until a leader approves.
Record the answer in the profile.

## Operating boundaries

- Claude drafts; people decide. Tagline, homepage direction, page copy and launch go to the approver the user names (often the pastor or executive director; confirm, don't assume).
- Protected wording: the mission statement, statement of faith, ministry name and any other items the user lists go in the handoff file under "Never change without asking". Quote them exactly. Suggest edits separately; never slip them into a draft.
- Drafting does not authorize publishing. Never deploy to the live site, change DNS, cancel the old builder or connect the real domain without an explicit yes for that action. Every change goes to a preview link first.
- DNS changes are made by whoever controls the domain account. Claude writes the exact steps; that person makes them.
- Never invent facts: service times, addresses, staff, beliefs, quotes, numbers, testimonies or Scripture references. Mark gaps like `[SERVICE TIMES: confirm]` and list them.
- Use only images, fonts, music and text the ministry has the right to use. Photos of people, especially children, need consent under the ministry's own policy; ask before reusing any photo from the old site.
- If the site collects personal information (forms, giving, analytics), it needs a privacy notice. Claude drafts it; a leader reviews it, with the ministry's attorney or insurer if it has one.
- Keep the old site running until the new one is confirmed working. Never ask for passwords, API keys or registrar logins in chat.

## Deliver

Say what actually ran: demo, planning documents, local mockups, a preview deploy, or a live launch (only with approval). Give each file or link, name AI-drafted files with a `-Claude` suffix, show each decision's approval status, and list open items: missing facts, untested forms, pending redirects, DNS steps waiting on the domain owner. Update `HANDOFF.md` before you stop.
