# Connections that match the church

The offline packet requires Python 3.10+ and local file access. It requires no online accounts. Audio transcription and platform publication are additional capabilities, chosen during onboarding.

| Stage | Possible source or destination | Verify before using |
| --- | --- | --- |
| Media intake | Local folder, Google Drive, another storage service | Exact recording, readable file, final version, account/folder scope |
| Metadata | Approved calendar, spreadsheet, church staff | Service date, preacher, title, passage, series; provenance for each |
| Transcription | Existing transcript, installed local engine, selected transcription API | Available engine/tool, supported media, credentials through secret storage, selected language; one real result before claiming it works |
| Website | Church CMS or Git-backed site | Target site/repository, content schema, existing record lookup, draft semantics, media handling, preview/build and deployment path |
| Media hosting | Existing host or object storage | Intended object key, visibility, playable returned URL; do not manufacture URLs from naming patterns |
| Podcast (if selected) | Church's podcast hosting provider | Correct show, existing episode lookup, upload/draft/release capability, feed behavior and selected metadata |
| Video (if selected) | Church's video platform/channel | Finished video, correct channel, existing video lookup, upload and privacy/scheduling capability |

Use the host's callable tools or tool discovery to inspect actual capabilities. An installed connector does not prove that the correct account is authenticated or that it can upload media or create a draft. Prefer purpose-built tools; otherwise use an authorized supported CLI/API adapter, or supported browser interaction with the signed-in site. If neither works, prepare exact copy/paste fields and a manual handoff. Say what is unavailable instead of inventing a connector.

For a custom integration, inspect existing code first and consult the provider's current official documentation before implementing API calls. Read-only access checks should not create test posts, upload private media, or change visibility. Do not use a public upload as a connectivity test.

Keep tokens in host secret storage or the provider's sign-in flow. Record capability status as `unverified`, `read_verified`, `draft_verified`, or `publish_verified`, with the test date and evidence. Never upgrade status based only on a local output.

No connection is required solely because Trinity once used it. Logos is not a dependency for publishing a recorded sermon. A separate API account for transcription is unnecessary when a supplied transcript is sufficient. Do not install every platform listed here.
