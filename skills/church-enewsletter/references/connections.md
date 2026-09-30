# Connections

The skill runs in Codex. Python 3 is required only for its bundled offline renderer. No third-party Python packages are needed. Service connections are optional for the offline demo and necessary only for the chosen live sources/destination.

| Capability | Preferred route | Setup and verification | Fallback |
|---|---|---|---|
| Editorial schedule | Available Google Sheets/Drive tools or the church's existing Sheets API adapter | Sign into the intended account; identify the exact spreadsheet, tabs, and column mapping; read one target-date row. Use read-only access for collection. | User-provided CSV, JSON, or pasted approved records |
| Public events | Existing Planning Center Calendar adapter, available connector, or authorized browser | Verify the selected Calendar account and read one public event; check date, timezone, visibility, location, and link against the public listing. Keep credentials in local secret storage. | Curated public-event records |
| Email draft | Available Mailchimp tool, authorized browser, or an existing tested Marketing API adapter | Verify account, audience, sender, and template. Read existing drafts before creating one; save its campaign ID. | Local HTML and text for manual import |
| Preview delivery | Same verified email platform | Requires an explicit test-send request and named recipients; record successful result. A platform test message is not an audience campaign. | Open local preview |
| Visual review | Local HTML-capable viewer or browser | Check desktop and narrow/mobile layouts, link destinations, images, and footer. | HTML file plus plain-text inspection |

Tool names vary by installation. Discover capabilities at runtime. Do not fabricate MCP names or install a plugin just because this document mentions a service. If only browser access exists, inspect the current UI and use its supported controls. If API setup is necessary, check the provider's current official documentation before giving credentials/scopes/endpoint instructions. Do not ask the attendee to paste tokens in chat.

Confirm each connection separately. A successful login does not prove the desired sheet, calendar, audience, or resource is accessible.

## Recovery

- Expired login: reauthorize the same selected account through the supported flow; preserve the local draft.
- Missing target-date row: report the missing date and source. Do not substitute a prior sermon.
- Calendar failure: mark events unavailable. Do not say there are no events. Render other verified sections for review.
- Conflicting event dates: show the two source records and resolve before publishing that event.
- Ambiguous campaign creation: inspect remote drafts and saved IDs. Do not blindly retry POST or the entire production pipeline.
- Template fields: resolve content placeholders. Preserve platform unsubscribe, address, and preference tags that the provider is expected to expand.

The bundled renderer has no service adapters and makes no network calls. Live collection and remote draft operations require tools or the church's existing adapter. The Trinity host already has a separate production adapter; do not distribute its secrets or private configuration.
