# Brilliance Labs Discern & Build

Skills and workflows for the Brilliance Labs Discern & Build event.

## Get a skill

Paste this into your AI agent:

```
Download the <skill-name> skill from https://github.com/johnbuck/brilliance-labs-discern-build
and save it as a ZIP in my Downloads folder, ready to upload.
```

Then upload the ZIP in your AI agent's skills settings.

## Get all the skills

Paste this into your AI agent:

```
Download every skill from https://github.com/johnbuck/brilliance-labs-discern-build
and save each one as its own ZIP in my Downloads folder, ready to upload.
```

Then upload each ZIP in your AI agent's skills settings.

## Ministry teaching skills

These skills support a leader's preparation and review; they do not replace pastoral judgment or authorize publication.

| Skill | Use it to | Requirements |
| --- | --- | --- |
| [Small-group lesson preparation](skills/small-group-lesson-preparation/SKILL.md) | Prepare source-grounded lessons, discussion questions, and optional handouts. | Approved lesson sources and an AI assistant that can read them. |
| [Pastoral discussion summary](skills/pastoral-discussion-summary/SKILL.md) | Create a faithful, privacy-conscious recap for attendees and absentees. | Approved meeting transcript or notes. |
| [Ministry teaching review](skills/ministry-teaching-review/SKILL.md) | Check Scripture, source fidelity, teaching coverage, and usability without chasing cosmetic perfection. | Original sources and readable final artifacts. |
| [Companion study resources](skills/companion-study-resources/SKILL.md) | Prepare coordinated slides, audio reviews, and objectively answerable flashcards. | User-approved generation/export tools for the requested formats. |
| [BSB Scripture retrieval](skills/bsb-scripture-retrieval/SKILL.md) | Retrieve exact Bible passages and verify quotations offline. | Python 3.10+, SQLite FTS5, and the included JSON; no account or API key. |

Each folder is independently packageable using the ZIP instructions above. Keep the BSB folder's `assets/bsb_smart.json` and helper script in its ZIP: Markdown alone will not run that skill. The bundled JSON is about 31 MB uncompressed; see its [source and licensing notes](skills/bsb-scripture-retrieval/SOURCE.md). The other four skills do not require the BSB helper; leaders can use a verified source for their chosen Bible translation.

## Add a skill or workflow

You'll need a GitHub account. Paste this into your AI agent:

```
Add my <skill-name> skill to https://github.com/johnbuck/brilliance-labs-discern-build
as a pull request.
```
