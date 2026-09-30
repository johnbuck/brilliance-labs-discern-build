# Local renderer

Resolve these paths relative to the skill directory. Choose a project output folder; do not write output into the installed skill.

```sh
python3 scripts/newsletter.py assets/demo.json /absolute/path/to/project/demo-output
```

For an actual draft, replace `assets/demo.json` with the normalized weekly input described in weekly.md. On Windows use the available Python launcher (`py -3` when appropriate). Nonzero exit means validation failed. This renderer makes no network calls and cannot send email.

Outputs: `newsletter.html`, `newsletter.txt`, and `review.json` (source ledger, target date, demo flag, warnings, and HTML hash). The output folder must be new or empty: existing files are not overwritten. Revisions should use a new folder.

Preview HTML in a browser. The sample is deliberately labeled fictional and uses reserved example.org links. Those links are illustrative, not verified registrations. The production church template and email-provider footer must be used for any external draft.
