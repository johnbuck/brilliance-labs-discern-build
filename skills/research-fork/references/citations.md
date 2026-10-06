# Citation Guide

## Basic Source Citation

Always cite sources you have registered in `sources.jsonl` using inline markdown links:

```markdown
[Page Title](https://example.com/page)
```

The URL is the source's `raw_url` from its registered source row. The title is the source's registered `title`.

## Evidence Tags

Add an evidence tag whenever support is not evident from the link alone — numbers, quotes, contested claims, anything a reader might challenge:

```markdown
The Q4 revenue increased by 23% quarter-over-quarter ([Q4 Financial Report](https://example.com/q4) [E:1a2b3c4d5e6f7890]).
```

An `[E:id]` must resolve to an `evidence_id` in this Run's `evidence.jsonl`. The tag is the reader's path from a Report sentence to the exact captured quote and its locator.

## Inline Citations

Cite immediately after referenced information:

```markdown
The Q4 revenue increased by 23% quarter-over-quarter ([Q4 Financial Report](https://example.com/q4)).
```

## Multiple Sources

When information comes from multiple sources:

```markdown
Customer satisfaction has improved across all metrics ([Q3 Survey Results](https://example.com/q3), [Support Analysis](https://example.com/support)).
```

## Grouping

Group citations where adjacent claims share a source. **Over-citing** (every sentence) and **under-citing** (no attribution) are both failures; the right balance is one grouped citation per supported statement:

```markdown
The revenue increased, costs decreased, and margin improved ([Q4 Financial Report](https://example.com/q4) [E:0f1e2d3c4b5a6978]).
```

## Section-Level Citations

For longer sections derived from one source:

```markdown
### Engineering Priorities

According to the [Engineering Roadmap 2025](https://example.com/roadmap):

- Focus on API scalability
- Improve developer experience
- Migrate to microservices architecture
```

## Sources Section

Every Report ends with a "Sources" section listing every registered source the Report actually cites:

```markdown
## Sources

- [Strategic Plan 2025](https://example.com/strategic-plan)
- [Market Analysis Report](https://example.com/market-analysis)
- [Competitor Research: Q3](https://example.com/competitor-q3)
```

Group by category for long lists:

```markdown
## Sources

### Primary Sources
- [Official Roadmap](https://example.com/roadmap)
- [Strategy Document](https://example.com/strategy)

### Supporting Research
- [Market Trends](https://example.com/trends)
```

Removing the Sources section must leave no orphan inline citation, and vice versa: every inline link resolves to a Registered Source, every Sources entry is cited inline.

## Quoting Content

When quoting directly from a source:

```markdown
The product team noted: "We need to prioritize mobile experience improvements" ([Product Meeting Notes](https://example.com/notes) [E:9a8b7c6d5e4f3021]).
```

For block quotes:

```markdown
> We need to prioritize mobile experience improvements to meet our Q4 goals. This includes performance optimization and UI refresh.
>
> — [Product Meeting Notes - Oct 2025](https://example.com/notes)
```

Direct quotes must exist as evidence rows: the quote in the Report matches the `quote` field of the `[E:id]` row in `evidence.jsonl`.

## Data Citations

When presenting data, cite the source on a "Source:" line:

```markdown
| Metric | Q3 | Q4 | Change |
|--------|----|----|--------|
| Revenue | $2.3M | $2.8M | +21.7% |
| Users | 12.4K | 15.1K | +21.8% |

Source: [Financial Dashboard](https://example.com/dashboard) [E:1122334455667788]
```

## Freshness Dating

Publication date is part of the truth. The source row's `published_at` carries it; stale numbers carry their publication date in the Report:

```markdown
The original API design ([API Spec v1](https://example.com/api-v1), published January 2024) has been superseded by the new architecture in [API Spec v2](https://example.com/api-v2).
```

Never guess a date from memory — take it from the source page or leave `published_at` null and say the date is unknown.

## Cross-References

Link to related prior Runs by their report path when the current findings build on them:

```markdown
## Related Research

This research builds on previous findings:
- [Market Analysis - Q2 2025](../market-analysis-q2-20250601/market-analysis-q2.md)

For implementation details, see:
- [Technical Implementation Guide](../technical-implementation-20251012/technical-implementation.md)
```

Evidence from a prior Run is never cited directly: re-register the source and re-capture the quote into the current Run's stores first (consult freely, re-capture to cite).

## Citation Validation (final pass, local and structural)

Before the Report counts as done, check — locally, against Run Folder files only, no network:

- Every key claim has a source citation
- Every inline link resolves to a Registered Source in `sources.jsonl`
- Every `[E:id]` resolves to a row in `evidence.jsonl`
- Sources section includes all cited sources and nothing uncited
- Outdated sources are noted as such (freshness dating)
- Direct quotes are clearly marked and match their evidence rows
- Data sources are attributed

## Citation Style

The style is fixed, not a per-Run choice: inline markdown links after the supported statement, `[E:id]` tags where support is not evident from the link alone, grouped citations, and a trailing Sources section. Every citation a reader follows must land on a Run Folder artifact using only Run Folder files.
