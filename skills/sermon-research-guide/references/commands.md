# Local helper commands

The helper requires Python 3.9 or newer and only its standard library. On macOS/Linux use `python3`; on Windows use `py -3` when that is the installed launcher. In these examples `SKILL/scripts/research.py` means the actual installed script path and `WORKSPACE` means the user’s chosen separate research folder. Quote paths containing spaces. The agent runs these commands; the attendee does not need to memorize them.

```sh
python3 SKILL/scripts/research.py --workspace WORKSPACE init --label "My research"
python3 SKILL/scripts/research.py --workspace WORKSPACE status
python3 SKILL/scripts/research.py --workspace WORKSPACE preferences --input preferences.json
python3 SKILL/scripts/research.py --workspace WORKSPACE resource --input resource.json
```

`init` prints a new `profile_id`. Reuse that exact ID for this person’s records. It refuses to overwrite an existing research workspace.

## Preferences JSON

Use the user’s actual answers; all fields are optional and preserved on update. Allowed fields: `os`, `connection`, `tradition`, `translation`, `language`, `depth`, `preferred_authors`, `preferred_series`, `format_notes`. Values are strings or lists of strings. Do not store credentials.

## Resource JSON

Required fields: `id` (lowercase letters/digits/hyphens), `profile_id`, `resource_id` (observed Logos ID), `title`, `author`, `access` (`verified`, `unverified`, or `unavailable`), `evidence` (how access was checked, explicitly user-reported if applicable), and `books` (list of canonical English book names, such as `John`). Optional additional bibliographic fields can be retained. The helper records the check date. A registered ID cannot be reused for a different title, author, or Logos resource ID. Register a new ID for another book and re-import its sources. To revoke access, update the same resource ID with `unavailable` or `unverified`.

An ID or a book list cannot prove ownership or coverage. The agent verifies access and relevance before recording them. Account/profile confirmation is a user/tool-assisted check, not cryptographic identity verification.

## Register retrieved text or source notes

Use actual observed values in place of the symbolic fields below:

```sh
python3 SKILL/scripts/research.py --workspace WORKSPACE source --account PROFILE_ID --resource RESOURCE_SLUG --book "John" --passage "John 15:1-11" --file source-notes.txt --locator "Observed section title or passage locator" --link OBSERVED_LOGOS_LINK --coverage complete --method user-notes
```

`--method` accepts `browser`, `connector`, `user-notes`, or `user-export`. `--coverage partial` requires `--note` describing the gap. `complete` means the supplied source notes/material cover the requested passage, not that a whole copyrighted chapter is reproduced. Verify coverage before assigning this status. The input is nonempty UTF-8 plain text. Links must use an observed `https://app.logos.com/`, `https://ref.ly/`, or `logosres:` resource link. Source IDs are generated and returned. The file is copied into the user workspace and hashed. Changing it later invalidates a build until it is re-imported as a new source.

## Packet JSON

Write this from the actual retrieved sources. Values below describe the schema, not ready-to-use research:

```json
{
  "kind": "research",
  "profile_id": "the exact profile ID",
  "book": "John",
  "passage": "John 15:1-11",
  "title": "Research on John 15",
  "purpose": "The actual research question and scope",
  "sections": [
    {
      "heading": "A specific commentary summary",
      "basis": "source",
      "paragraphs": ["A supported summary written from the source."],
      "sources": ["the returned source ID"]
    },
    {
      "heading": "Questions for review",
      "basis": "review",
      "paragraphs": ["A question arising from the actual research."],
      "sources": []
    }
  ],
  "limitations": ["Any additional known limitations"]
}
```

`basis` is `source`, `synthesis`, or `review`. Source and synthesis sections require citations. The helper verifies profile IDs, exact passage/book matches, current resource access records, local source file integrity, and citations. It automatically includes partial-coverage notes and a single-resource limitation when applicable. It cannot verify that prose accurately represents a source. Review the prose and citations yourself.

```sh
python3 SKILL/scripts/research.py --workspace WORKSPACE build --input packet.json
```

This writes unique Markdown, Word, and manifest files under `outputs/`, with content/layout review marked pending. It does not overwrite previous packets. No network requests occur. Rendering and substantive review are separate steps described in research.md.
