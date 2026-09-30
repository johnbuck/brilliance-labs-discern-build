# Guided onboarding

Begin with the user's current request. If they want a sample, run the sample without an intake interview. For setup, look for `sermon-publisher-profile.json` in the selected project. Reuse confirmed answers; ask only for gaps or requested changes. Never infer the user's church from the presenter or unrelated tasks.

Ask one focused question, wait for the answer, and adapt. Do not present this whole list as a questionnaire.

Suggested progression:

1. “Where do your sermons need to appear first: your church website, podcast, YouTube, or several places?” Learn the actual destination/provider before recommending a connection. A custom website needs its repository/CMS and hosting workflow; podcast needs the hosting provider; YouTube needs the intended channel and video source.
2. “Which church is this for?” Then establish the working folder if it is not clear.
3. “What do you usually have after Sunday: finished audio, video, a transcript, or a combination?” Learn where the files arrive, how the sermon-only recording is identified, language, and which version is final. Do not assume Google Drive.
4. “Where should I confirm the title, preacher, passage, series, and sermon date?” A calendar, approved spreadsheet, or direct answers can work. Do not infer a service date from a file's modification time.
5. “Can we use an existing sermon page as the writing and layout reference?” Inspect what they provide and identify the public fields, description length, transcript preference, artwork, and tone. A website reference does not authorize copying private content.
6. “How do you want transcripts handled?” Existing transcript, an available local engine, or a selected external transcription provider. Explain when audio would leave the machine and whether that requires a separate account before choosing an upload route. Do not ask for API keys in chat.
7. “Who reviews the sermon, and what should happen after review?” Record local draft, remote draft, immediate publication, or scheduled release preferences and timezone. A saved preference informs future work; it is not blanket authorization to publish all future sermons.
8. Discover access to the selected services with [connections](connections.md). Ask for the next missing access detail only when needed. Record verified versus unverified capabilities.
9. Save the profile and summarize the next achievable step. Offer the bundled fictional packet or one real sermon draft. If real media is missing, the profile may still be complete enough for the sample.

Save JSON with these non-secret fields, leaving unknown values null or empty rather than inventing them:

- `schema_version`: 1
- `church_name`, `language`, `timezone`
- `source`: kind, location, final-file selection rule, metadata source
- `transcription`: method/provider, language, connection status
- `editorial`: reference page, voice notes, description length preference, include transcript
- `destinations`: list of platform, target locator, intended visibility, connection method, verification status, existing-record matching rule
- `review`: reviewer role, usual release mode
- `open_questions`: missing choices

Target locators may be needed in a private project profile. Never put credentials or private account locators into a public giveaway or demo. Write a new profile without overwriting unrelated data; merge requested changes into an existing profile. Explain exactly where it was saved.

First-time test prompt:
“Use $sermon-publisher to onboard me as a first-time user. Ask one question at a time. Do not assume Trinity's platforms. Save my setup locally and keep this in setup mode.”
