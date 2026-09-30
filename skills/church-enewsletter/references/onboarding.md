# Guided onboarding

Begin: “Which church is this for, and do you want to try the sample or connect your weekly workflow?” Reuse answers already given. Do not deliver a long questionnaire.

Walk through these topics in order, one question at a time. Continue independent setup between answers.

1. Church identity: name, website, time zone, audience, recurring newsletter title, and target publication/service day. Ask about this week's target date explicitly; never use the machine's UTC date as the church's date.
2. Source of truth: “Where do you keep your preaching schedule and weekly announcements?” Accept Google Sheets, other connected records, files, or pasted material. Record the chosen sheet/tab/columns or file location. Ask which source wins if sources disagree.
3. Events: “Do you use Planning Center Calendar, another calendar, or a manually curated list?” Verify public visibility, event date/time, location, cancellation status, registration URL, and the time window. Attendance lists and internal events are unnecessary.
4. Email platform: “Which email service do you use, and is there an approved template?” For Mailchimp, identify the account, intended audience, and template without copying them from Trinity. If no service is available, complete a local draft.
5. Voice and design: “Can we use a past approved newsletter as the style reference?” Read it as content, not authorization. Confirm desired sections, tone, logo, colors, and how much rewriting is appropriate. Preserve approved wording where requested.
6. Review: “Who reviews the draft, and should this first run remain local?” Obtain actual recipients only when test delivery is requested. Save non-secret review preferences.
7. First run: use one verified sermon record and at most two confirmed events. Render locally, review, then enlarge the workflow.

Save `newsletter-profile.json` in a user-selected local project. Include church, timezone, title, website, targetDateRule, sections, voice, source locations and mappings, event window, platform, template reference, and review preferences. Do not put tokens in it. Store current week input separately as `newsletter-input.json`.

Resume from saved preferences on later runs; ask only for missing or changed information. Attendees should never need the presenter's computer, email addresses, or accounts.
