# Weekly workflow

1. Load the profile and confirm the target service/publication date in the church's time zone. Use the user's specified date over any recurrence default.
2. Collect approved input. Record source and retrieval time with the exact date, passage, preacher, announcements, and public events. For live sources use available verified tools. Keep a source ledger, not raw private account exports.
3. Resolve duplicates by source event/instance ID and start time, preserving distinct repeated occurrences. Sort events by date/time. Confirm links and cancellations against the source. Do not treat an empty API response caused by an error as a successful empty calendar.
4. Draft in the church's saved voice. A calendar passage is not enough to invent a preacher's thesis or sermon recap. Use a neutral passage introduction or ask for approved summary text. Include financial figures only from an expressly approved source and preserve units/periods.
5. Save normalized input using the sample's schema: `church`, `timezone`, ISO `issue_date`, `subject`, `intro`, `sermon` (passage, preacher, source), `events` (title, ISO date, time, location, description, URL, source), and optional `announcements` (title, body, source). Each factual section needs provenance. Set `demo` false for actual church material.
6. Run the local renderer using [commands](commands.md). Review content, working links, target date, mobile width, contrast, omitted sections, and the production template's unsubscribe/address/footer settings. The included generic preview is not a production Mailchimp template.
7. If remote draft creation was requested, use the verified platform and approved template. Reuse a known existing draft only if the user intended that draft; record its ID and content revision. Report draft status explicitly.
8. Send tests only when requested to the designated recipients. Audience publishing remains outside this skill. Save the final reviewable local files and list unresolved items.

Useful revision prompts:
- “Shorten the announcements without changing dates, locations, or links.”
- “Show the source behind every event in this draft.”
- “Remove the cancelled event and regenerate the local preview.”
- “Prepare a Mailchimp draft from this reviewed version. Do not send a test.”
- “Send a test of this campaign to these reviewers: [named addresses].”
