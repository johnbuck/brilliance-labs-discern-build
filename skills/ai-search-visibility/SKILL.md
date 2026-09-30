---
name: ai-search-visibility
description: Help a church or ministry find out whether AI assistants such as ChatGPT, Claude, Gemini or Perplexity mention it when people ask about ministries like theirs, and whether the answers are right, then fix what they can and re-check on a routine. Covers writing 10 to 15 real questions, a baseline scorecard CSV, fixes (a clear About page, an FAQ page, schema.org structured data, consistent listings, Google Business Profile, a robots.txt check, an optional llms.txt), and monthly or weekly re-checks. Use when someone asks "do we show up in AI answers?" or wants their ministry described accurately by AI tools.
---

# AI search visibility

A Discern & Build ministry workflow for checking, and improving, how AI assistants describe your ministry when people ask for help, a church or a program like yours.

## Who this is for

Pastors, executive directors, communications volunteers and administrators who care whether a neighbor asking an AI assistant "where can I get groceries this Saturday?" hears about their ministry, with correct times and address.

The user may be new to AI. Lead them: name the step ("Step 3 of 7: run the baseline"), say what comes next and what done looks like, and explain briefly why each checkpoint exists. Say what you will and won't do. Set time expectations: about 60 to 90 minutes for the first baseline, one to three hours for fixes, and about 20 minutes for each re-check after that.

Be honest from the first message: AI answers vary by assistant, day, wording and location. Nobody can guarantee a mention. The fixes make accurate facts easy to find, which also helps people who visit your site directly. In real use, a ministry appeared in very few answers at its first check, shipped fixes the same day, and set a weekly re-check to watch what changed.

## Choose the next step

- First use or a new ministry: read [onboarding](references/onboarding.md). One question at a time; save `ai-search-visibility-profile.json` where the user chooses, never in the installed skill.
- Demonstration: open [the Cedar Hill fact sheet](assets/demo-facts.md) and [baseline scorecard](assets/demo-scorecard.csv) (fictional; "Assistant A, B, C" stand in for real assistant names). Try this: "Run the ai-search-visibility demo: summarize the Cedar Hill scorecard, name the three most important fixes, and draft one FAQ entry and one structured-data block from the fact sheet." No accounts needed.
- Baseline, fixes and re-checks: read [workflow](references/workflow.md), with fix templates in [fixes](references/fixes.md). Start a new scorecard from [the template](assets/scorecard-template.csv).
- Assistants, listings, scheduling or trouble: read [connections](references/connections.md).

## Before you start

Ask: "How careful do we need to be with your ministry's data? No constraints; Some (member, donor or counseling data shouldn't leave our systems); Strict; or Not sure?" This work uses public facts, so the risk is low, but still:
- Any answer: use only public information (address, times, public staff roles). Never put member names, prayer requests or counseling details into questions or the scorecard.
- Some or Not sure: questions describe needs in general terms ("help with rent"), never a real person's situation.
- Strict: the user runs every check in their own accounts and pastes only the answers; Claude does not browse or sign in anywhere.
Record the answer in the profile.

## Operating boundaries

- Claude drafts; people decide. Page text, FAQ answers and listing changes go to the approver the user names (often the pastor or communications lead; confirm, don't assume).
- Drafting a fix doesn't authorize publishing it. Site changes go to a preview first (see the website-rebuild skill); listings are changed by whoever owns them.
- Whether AI crawlers may read the site is a leadership decision. Explain the trade-off in plain words; a leader decides; Claude records it.
- Never invent facts: service times, addresses, programs, staff, beliefs or statistics. Every fact in a fix comes from the confirmed fact sheet.
- Record what assistants actually said. Don't guess or fill in answers you didn't see. Never promise rankings or mentions.
- Never ask for passwords or API keys in chat, and never sign in to someone's accounts for them.

## Deliver

Say what ran: demo, a baseline by the user, a baseline by Claude with web search, fixes drafted, fixes published (by whom), or a re-check. Give the scorecard file, a short summary (mentions, accuracy problems, sources cited), the fix list with owners and status, and the next re-check date. Name AI-drafted files with a `-Claude` suffix.
