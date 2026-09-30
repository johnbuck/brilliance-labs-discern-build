---
name: ministry-email
description: Set up an automated email workflow for ministry staff to reach their congregation (weekly bulletins, event invitations with reminders, new-member welcome series, birthday notes, announcements). Interviews a non-technical person, drafts the emails with them, schedules them, and shows the automation running in a safe demo mode where nothing is actually sent. Use for church or ministry email campaigns, newsletters, bulletins, church communications, or email automation.
---

# Ministry email automation (demo mode)

You are helping someone who is **not technical** (usually ministry staff) build an automated email
workflow, often live in a 1-hour demo. Build it **one campaign at a time**, showing the result after
each step. Follow the tone rules in the project's CLAUDE.md.

**Safety: this is a demo. Nothing is ever actually sent.** "Sending" saves each personalized email
into the project's `outbox/` folder (`.eml` opens in Mail/Outlook, `.html` opens in a browser).
Do not connect a real email service, SMTP, or Gmail, even if asked. Explain that going live needs the
church's email provider, permission from leadership, and a person reviewing every campaign, and that
the instructor can talk through it.

## The engine

`node .claude/skills/ministry-email/scripts/mailer.mjs <command> <project> [--today YYYY-MM-DD] [--days N]`
(run from the workspace root; `npm install` first if `node_modules/` is missing)
- `preview`: build `control-center.html` (the dashboard: coming up, campaigns with previews, outbox, groups)
- `run`: "send" whatever is due today
- `simulate --days 21`: pretend 21 days pass, running the automation each morning
- `reset`: empty the outbox and log

In class, pass `--today` set to the class date (or the real date) so the schedule looks right.

### Project files (you write these)
`my-projects/<church-short-name>-email/`
- `ministry.json`:
  ```json
  { "name": "Cedar Creek Community Church", "address": "1200 SE Example Ave, Portland, OR 97214",
    "website": "https://example.org", "accent": "#E8860F", "contacts": "contacts.csv",
    "sender": { "name": "Pastor Michael Walsh", "email": "office@cedarcreek.example.org" } }
  ```
- `contacts.csv`: copy of `sample-data/members.csv` (84 fictional people) or their own list. Columns used:
  `first_name, last_name, email, household, groups` (separated by `;`), `member_since` (YYYY-MM-DD),
  `birthday` (MM-DD), `email_opt_in` (yes/no), `language`. Anyone with `email_opt_in = no` is never emailed.
  Sample groups: Choir, Youth Parents, Volunteers, Bible Study, Seniors, Young Adults, Finance Committee,
  Food Pantry Team, Children's Ministry Parents, New Members.
- `campaigns/<id>.json`: one file per campaign:
  ```json
  { "name": "Fall Festival 2026", "status": "active",
    "audience": { "groups": ["*"], "exclude_groups": [], "language": null },
    "sender": { "name": "Maria Santos, Events Coordinator", "email": "events@cedarcreek.example.org" },
    "schedule": { "type": "before_event", "event_date": "2026-10-17", "time": "10:00" },
    "steps": [
      { "id": "invite", "days_before": 14, "subject": "…", "preheader": "…", "body": "…" },
      { "id": "reminder", "days_before": 3, "subject": "…", "body": "…" },
      { "id": "day-of", "days_before": 0, "subject": "…", "body": "…" } ] }
  ```
  `audience.groups`: `["*"]` = everyone who gets email; otherwise any of the listed groups. `sender` is optional (defaults to ministry.json).
  Schedule types:
  | type | fields | step fields |
  |---|---|---|
  | `once` | `date`, `time` | one step |
  | `weekly` | `weekday`, `time`, `start`, optional `end` | one step |
  | `before_event` | `event_date`, `time` | `days_before` (0 = day of) |
  | `after_joining` | `time`, optional `start` | `days_after` (from each person's `member_since`) |
  | `birthday` | `time` | one step |

  **Body format** (simple): blank line between paragraphs, `## Heading`, `**bold**`, `- bullet` lines,
  `> quote` (scripture shows in italics), `[link text](https://…)`, and a button on its own line:
  `[[Button text|https://…]]`.
  **Placeholders**: `{{first_name}}`, `{{last_name}}`, `{{full_name}}`, `{{household}}`, `{{ministry_name}}`,
  `{{sender_name}}`, `{{event_date}}`, `{{week_of}}` (send date, short), `{{send_date}}`.
  An unsubscribe footer and the church address are added automatically.

## Part 1: Set up (about 5 minutes)

1. One short welcome: "Let's build an email system for your church, one campaign at a time. Nothing
   will actually be sent. You'll see exactly what *would* go out, to whom, and when."
2. Ask in plain chat: "What's the name of your church or ministry, and who usually signs the emails?
   (For example: 'Pastor Michael Walsh')." If they'd rather not, use Cedar Creek Community Church and
   Pastor Michael Walsh.
3. AskUserQuestion (header "Contacts"): "Whose contact list should we use?"
   - The practice list: 84 fictional church members (Recommended)
   - My own list (a spreadsheet file). If chosen, remind them to use only data they're allowed to use.
     Read it, map its columns to the ones above, and tell them in plain words what you matched.
4. Create the project folder, `ministry.json`, and `contacts.csv`, then run `preview` and open
   `control-center.html`. Point out: how many people get email (and that opted-out people are protected),
   and the groups at the bottom.

## Part 2: The first campaign (about 15 minutes)

Ask one question at a time:

1. AskUserQuestion (header "Campaign"): "What should we set up first?"
   - Weekly bulletin: every week, to everyone (Recommended)
   - Event invitation + reminders: an invite, a reminder, and a day-of note
   - New member welcome series: automatic emails when someone joins
   - Birthday blessings: a note on each person's birthday
   (Other covers a one-time announcement, giving campaign, volunteer drive, etc.)
2. AskUserQuestion (header "Audience", multiSelect): "Who should get it?" Offer "Everyone who gets email"
   first, then the real groups from their contacts (up to 3 more; Other lets them type).
3. Ask in plain chat for the **details**: for an event: name, date, time, place, link; for a bulletin:
   which day it should go out and what's usually in it. Rough notes are fine.
4. AskUserQuestion (header "Tone"): "How should it sound?"
   - Warm and pastoral (Recommended)
   - Joyful and energetic
   - Short and practical
   - Formal and traditional
5. **Draft it with them. This is the AI moment, so narrate it:** "Now I'll write a first draft in your
   voice." Write 3 subject lines and AskUserQuestion (header "Subject") to pick one. Then write the body.
   Writing rules:
   - Subject under ~50 characters; a specific, friendly preheader.
   - Greet by `{{first_name}}`. Short paragraphs. One clear next step (usually one button).
   - Sign off as a real person (`{{sender_name}}`), not "The Team".
   - Faith-filled but not preachy; a short scripture line is welcome where it fits.
   - Giving appeals: gratitude and impact, never guilt or pressure.
   - Invent no facts: use [square-bracket placeholders] for anything you don't know, and point them out.
6. Save `campaigns/<id>.json`, run `preview`, open the control center, and show them: the "Coming up"
   table and the email preview under the campaign (click it to expand).
7. Ask: "Anything you'd like to change?" Make edits by conversation ("warmer", "shorter", "add the
   parking info", "move it to Wednesdays") and re-run `preview` after each change.

## Part 3: Watch the automation run (about 10 minutes)

1. Explain in one sentence: "In real life a computer would check every morning what's due and send it.
   Let's fast-forward three weeks and watch."
2. Run `simulate --days 21` (with `--today`). Read the output back as a short story ("Thursday: the
   bulletin goes to 77 people. Saturday: the festival invitation…").
3. Run `preview` and open the control center again: the Outbox is full. Open one of the `.html`
   emails in the browser. On a Mac, open an `.eml` too, to show it in Apple Mail.
4. Point out: every email is personalized, opted-out people got nothing, and each person gets each
   email only once (that's what the send log is for).

## Part 4: Add more campaigns (the rest of the time)

Repeat Part 2 for a second (and third) campaign. Each campaign is just one small file.
Good demo moments:
- **Welcome series + a new member:** set up the welcome series, then add a new row to `contacts.csv` for
  a volunteer from the room (fake email ending in @example.com, `member_since` = today, group
  `New Members`), run `run` with `--today`, and show their personal welcome email appear.
- **Spanish-language version:** duplicate a campaign with `"language": "Spanish"` in the audience and
  translate it, and add `"exclude_groups"` or a language filter to the English one so no one gets both.
- **Pause a campaign:** set `"status": "paused"` and show it vanish from "Coming up".

Run `reset` whenever you want a clean outbox before a fresh simulation.

## Wrap-up (say briefly)
- What they built: an audience list, campaigns, a schedule, drafting help, and an automation with a log.
- Going live would mean connecting a real email service the church already uses (Planning Center, Mailchimp,
  Constant Contact, Gmail), with consent rules (opt-in, unsubscribe) and **a person approving each
  campaign before it runs**. AI drafts; people decide.
