# Source Access — When a Source Won't Let You In

Retrieval craft for step 2 (search and read) when a source blocks, thins, or
dies. A block is not a failure: it is a signal to switch paths. This ladder
names capability classes — search tool, page extractor, browser, plain HTTP,
archives — and every harness provides some of them.

## The access ladder

Move down the moment a path blocks you. Never retry the same path more than
twice on the same URL.

1. **Search tool + page extractor** — the fast path when it works.
2. **A real browser** — if the harness has one. Sites that block extractors
   (ad-heavy news and media commonly) often render fine in a browser.
   Extract the section you came for with a targeted query against the page's
   structure, not a full dump — a content-heavy page can overwhelm your
   context.
3. **Plain HTTP from the terminal** — a different egress path from the
   browser. Terminal and browser networks can disagree in both directions:
   if one cannot reach a host, still try the other before declaring the
   owner unreachable.
4. **An alternate host for the same document** — the blocked page's data
   often exists elsewhere unblocked: an official mirror, another page on the
   same domain, the PDF instead of the HTML. Search the document's exact
   title and take the second host.
5. **Archives** — the Wayback Machine's CDX API
   (`web.archive.org/cdx/search/cdx?url=<domain>/<prefix>*&output=json`)
   lists snapshots even for deep links that were never directly archived. It
   rate-limits hard: space retries 30s apart, fetch at most one snapshot per
   attempt. An archived snapshot is a time machine, not a current source —
   its capture date is part of the access story, and a page that changed
   since capture needs a successor check (*Verifying you found the owner* in
   `search-techniques.md`).
6. **Reader proxies** — public read-the-page-for-me services are worth one
   try each; they are often challenged by the same walls you are escaping.
   Last rung, never a habit.

## Walls that never clear

Some sites serve a non-interactive challenge that no amount of retrying
clears in an automated browser. Recognition signs: the page title is a
"verifying…" placeholder, the page shows only security-check text, and there
is no interactive element to click. When all three hold, the browser's
fingerprint already failed — one navigation retry, one wait cycle, then move
down the ladder. Do not perform interaction theater on a page with nothing
to interact with.

## Zero results is a finding; a failed request is not

Before logging either way, know which one happened:

- A **clean negative** — the index answered a well-formed query with "no
  matches" — is a finding. State it plainly in the report: no primary
  source exists for this sub-question. Well-formed means the
  terminology-variant sweep (`search-techniques.md`) already ran; a zero on
  a single phrasing is not a negative, it is an unfinished sweep.
- A **failed request** — timeout, block page, error — is not a finding. It
  says nothing about the evidence. Move down the ladder and try again
  through another path.

The difference has decided real runs: errors misfiled as negatives have
hidden clean findings, and unrun variants have produced false "no data
exists" conclusions.

## When every path fails

Then the owner cannot be reached, and Rule 1 governs: the claim stays
unverified or gets dropped, and the report says which sources were
unreachable and what that costs the findings. An unreachable owner is
itself reportable — as a limitation, not as evidence of absence.
