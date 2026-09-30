---
name: board-finance-report
description: Turn QuickBooks Online exports (Profit and Loss, Balance Sheet, Budget vs Actuals, or a Profit and Loss plus a budget file) into a board financial packet for a church or ministry, month-end or quarterly. Use when someone needs a plain-language summary for the board, a budget-vs-actual table with variance explanations the treasurer confirms, simple charts, an appendix, a treasurer review memo or a decision-items addendum, or needs to work treasurer comments into a new draft.
---

# Board finance report

A Discern & Build ministry workflow for turning closed QuickBooks Online books into a financial packet a board can read in ten minutes and act on.

The user may be new to AI. Explain each step in plain words, say what you will and won't do, and tell them where they are ("Step 5 of 8: send the draft to the treasurer"), what comes next and what done looks like. Setup takes about 30 minutes. A first packet takes about 2 hours plus the treasurer's review; later packets about 45 minutes.

## Who this is for

Treasurers, executive directors, pastors and administrators who prepare finances for a board, finance committee or elders, and the treasurer who reviews the draft.

## Choose the next step

- First use: read [onboarding](references/onboarding.md). One question at a time; it saves the board-level line mapping and preferences.
- Demonstration: run the fictional Cedar Hill Community Church quarter in [workflow](references/workflow.md) under "Practice run". No accounts needed.
- A month-end or quarterly packet, or a new draft after treasurer comments: read [workflow](references/workflow.md) and [packet parts](references/packet-parts.md).
- QuickBooks connector, exports, the script or trouble: read [connections](references/connections.md).

## Before you start

Before opening real exports, ask: "How careful do we need to be with your ministry's data? No constraints; some (member, donor or counseling data shouldn't leave our systems); strict; or not sure?" Save the answer in the profile.

- No constraints: use full reports.
- Some or not sure: treat it as "some". Use summary reports, not transaction detail with donor names. Describe gifts without names ("a family foundation grant") unless the ministry's practice is to name them. Salaries appear only as the totals the board already sees.
- Strict: use the fictional demo, or have the user paste summarized totals only.

Never ask for QuickBooks, bank or other passwords, security codes or API keys in chat.

## Operating boundaries

- You draft; people decide. The treasurer confirms every figure and every variance explanation. The board, not you, makes the decisions the packet lists. You never send the packet; the user or board secretary does.
- Never invent a reason for a variance. Draft explanations only from transaction detail or what the user tells you, label them "draft, not yet confirmed", and write "explanation needed" where you have no evidence.
- Report only closed, reconciled months as final. If the books aren't closed, label the packet "preliminary" on every page.
- Every figure must tie: the packet, the appendix and the QuickBooks reports agree, or you say where they don't.
- Name drafts with a `-Claude` suffix and `DRAFT` until the treasurer approves.
- This is reporting help, not audit or tax advice. Suggest a CPA for accounting-basis questions, prior-year corrections and restricted-fund presentation.

## Deliver

List the files (packet, appendix, budget-vs-actual CSV and HTML, any memo or decision addendum, comment log), what ran (fictional demo, real exports, connector reads), which figures the treasurer has confirmed, and every open item. Update `HANDOFF.md`.
