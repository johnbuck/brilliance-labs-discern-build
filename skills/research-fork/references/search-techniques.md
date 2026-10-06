# Search Techniques

Query craft for step 2 (search and read). Harness-agnostic: none of this calls a
named vendor API — it is operator syntax for web engines plus method, usable with
whatever search tools the host harness provides. Load this file when a
sub-question's angles need sharpening or results run thin.

## Search operators

Web-engine query syntax. Support varies by engine; when an operator silently
fails, fall back to plain terms plus manual filtering.

- Exact phrase `"..."` — pins a term to the form the field actually uses.
  - Use it to lock in jargon: `"persistent memory" agents` beats
    `persistent memory agents` when the field has a fixed term.
  - Also the base for wildcard phrases (below).
- Exclude `-word` — strips a dominant wrong sense.
  - `jaguar -car` for the animal; `kafka -event-streaming` when you want
    the author, not the platform.
  - Excluding the loudest secondary-writeup domain can surface primaries
    that rank below it.
- `OR` (capitalized) — covers synonyms in one pass.
  - `"rate limit" OR "throttle limit"` — engines default to AND; OR widens.
  - Group with quotes so each side is a unit: `"cold start" OR "boot latency"`.
- `site:` — restricts to one domain.
  - The workhorse for official docs: `site:docs.python.org asyncio`.
  - Also `site:github.com` for repos, `site:arxiv.org` for preprints,
    `site:sec.gov` for filings (see source-class targeting below).
- `inurl:` / `intitle:` — requires the term in the URL or title.
  - `intitle:"release notes"` surfaces changelogs and version pages over
    blog chatter about them.
  - `inurl:rfc` pulls RFC documents themselves rather than pages about them.
- `filetype:pdf` — official reports, standards summaries, whitepapers, datasheets.
  - Much primary material lives only as PDF; engines under-rank it in
    default HTML results.
- `related:` — sites similar to a known-good one.
  - Useful to enumerate vendors in a product class once you hold one name:
    `related:stripe.com`.
- Asterisk `*` wildcard — matches any word inside a quoted phrase.
  - `"supported * databases"` catches "supported SQL databases" and
    "supported vector databases".
  - Good when you know the shape of a sentence but not the noun.

When each helps research: quotes and `OR` build the terminology net; `-` and
`site:` cut noise; `filetype:` and `intitle:` reach document genres engines
under-rank; `related:` and wildcards discover adjacent names and phrasings.

## Date and recency

- Prefer the engine's date filter (past year, custom range) over trusting
  rank — old pages rank forever.
  - Set the window wide first, then narrow; a too-narrow window hides the
    primary source an older write-up cites.
- Put the year or version in the query when the topic is time-sensitive.
  - `postgres 18 release notes`; `"SHA-3" FIPS 202` — this pulls documents
    that self-date.
- Publication date is a first-class fact here, not metadata decoration.
  - It lands in the source row's `published_at`; a number without its date
    fails the claim rules.
  - Get today's date once (`date +%Y-%m-%d`) and judge recency against it —
    never against a year remembered from training data.
- Cross-check against the skill's freshness rule.
  - A number three years old is history and is labeled as such.
  - For fast-moving topics (models, prices, versions), anything older than
    the current release cycle needs a successor check (see *Verifying you
    found the owner* below).
- Dated queries cut both ways.
  - When you need the state as of a past date (what was known then), use a
    custom range ending at that date, not today's results.

## Source-class targeting

Maps to step 2's per-sub-question source classes. One short recipe each:
where to search, then an example query.

- **Official docs** — the owner of behavior claims about a product.
  - Where: vendor docs domains and their `docs.` subdomains, official
    changelogs and release-note pages.
  - Example: `site:docs.aws.amazon.com lambda cold start`;
    `intitle:"what's new" site:azure.microsoft.com`.
- **Source code** — the owner of what the code actually does.
  - Where: GitHub code search; then the repo itself — spelunk the files
    once you land (read the actual module, not the README's claim about
    it); follow imports to the library that owns the behavior.
  - Example: `site:github.com "def parse_args" language:python`; in-repo
    search for the exact error string you are chasing.
- **Papers** — the owner of method and measurement claims.
  - Where: arXiv (preprints), PubMed (biomed), Google Scholar and Semantic
    Scholar (citation graphs).
  - Example: `site:arxiv.org "mixture of experts" routing`.
  - Citation chaining: backward (a paper's references, for origins) and
    forward ("cited by", for follow-ups and rebuttals). A claim that
    matters gets chased in both directions.
  - Errata, comments, and same-venue replies sit on this chain and point
    back to their originals — follow them; they map the dispute as well as
    the lineage.
- **Standards** — the owner of what a protocol or term normatively means.
  - Where: ISO/IEC indexes, W3C TR pages, IETF Datatracker (RFCs and
    drafts).
  - Example: `site:datatracker.ietf.org QUIC`;
    `site:w3.org/TR web authentication`.
- **Filings and regulatory** — the owner of corporate and product-status
  facts.
  - Where: SEC EDGAR (10-K, S-1, 8-K), FDA (approvals, advisories), EPA
    (regulatory dockets).
  - Example: `site:sec.gov 10-K semiconductor`; EDGAR full-text search on
    the product name.
- **Benchmarks** — the owner of performance claims.
  - Where: the industry-standard benchmark's own site and its
    reproducibility repo (MLPerf, SPEC, TPC; Papers with Code for research
    leaderboards).
  - Example: `site:mlcommons.org inference results` — the benchmark's
    published results table, not a vendor's slide citing it.

## Query iteration

- **Start broad, then narrow.**
  1. First query maps the terrain: top results reveal the vocabulary, the
     major players, the genre of answers.
  2. Subsequent queries exploit what the first taught you.
  3. A first page of results you learn from is not a failed search.
- **Synonym and terminology discovery.**
  - Mine a primary source for the field's real terms — section headings,
    naming in an RFC, flag names in a CLI — then re-query with those terms.
  - The gap between your words and the field's words is the usual reason
    early searches miss.
  - One good source typically yields three better queries.
- **Terminology-variant sweep.**
  - Before declaring a term exhausted or a topic empty, sweep its variants:
    the field's current term, older superseded terminology, artifact names,
    singular and plural, hyphenated and unhyphenated, phrase and keyword
    forms.
  - Batch the variants in one pass and log each result, zeros included.
    On contested or decision-grade topics this graduates into a planned
    terminology matrix (`contested-topics.md`).
- **Secondary → primary chains.**
  - A blog post is a lead: open it for the link it cites (paper,
    changelog, dataset), then cite that owner, not the blog.
  - Chain deliberately — blog → cited paper → cited dataset — and register
    the owner the moment you open it, per the store rules.
- **Pivot when results thin.**
  - If two angles return nothing usable, change one axis at a time:
    - terminology — synonyms taken from a found source;
    - source class — docs → code, blogs → filings;
    - engine — a different engine indexes a different corpus.
  - Thinning usually means vocabulary mismatch, not absence of material.
- **Multi-angle coverage.**
  - Work the 2–3 angles named per sub-question in `scope.md`.
  - Example, for "is X deprecated?": the official changelog angle, the
    maintainer/forum discussion angle, the downstream-breakage reports
    angle.
  - One angle confirms; two independent angles from different source
    classes start to verify. Register everything opened along the way.

## Verifying you found the owner

- Find the canonical version of a claim, not the loudest copy of it:
  - official changelog over a news writeup of the release;
  - the spec or standard over any summary of it;
  - the repo over a mirror or fork;
  - the paper over its abstract-on-an-aggregator;
  - the agency filing over the press release.
- Read the primary before citing it: a search snippet or a writeup is a
  lead, not testimony — and never cite on the strength of one.
- Cheap tells: the page's own domain outranks a repost; canonical URLs
  cite a version or date; mirrors carry push dates newer than their
  content.
- Check for newer superseding versions before citing:
  - a newer release note, an RFC marked "obsoletes by", a v2 paper, a
    successor standard, a retraction or errata page.
  - If found, the newer source is the citation and the older one becomes
    context, dated as such.
- When two sources both look primary and disagree, do not average —
  record both, mark the conflict per the rules, and let the report
  surface it.
