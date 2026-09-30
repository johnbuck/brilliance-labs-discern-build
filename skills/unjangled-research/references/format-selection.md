# Format Selection Guide

Choose the right output format for your research needs. The Format Selection Tree is walked in the synthesize step of the working sequence; the chosen template is filled from `templates/`.

## Decision Tree

```
Is this comparing multiple options?
  ├─ YES → Use Comparison Format
  └─ NO ↓

Is this time-sensitive or simple?
  ├─ YES → Use Quick Brief
  └─ NO ↓

Does this require formal/extensive documentation?
  ├─ YES → Use Comprehensive Report
  └─ NO → Use Research Summary (default)
```

## Format Overview

| Format | Length | When to Use | Mandatory Sections | Template |
|--------|--------|-------------|--------------------|----------|
| Comparison | 800-1200 words | Evaluating options, decision support | Overview; Comparison Matrix (criteria × options); Detailed Analysis per option (Pros, Cons, Best for, Source); Recommendation with rationale; Sources | [comparison.md](templates/comparison.md) |
| Quick Brief | 200-400 words | Time-sensitive, simple topics | Summary; Key Points; Action Items; Sources | [quick-brief.md](templates/quick-brief.md) |
| Comprehensive Report | 1500+ words | Formal docs, strategic decisions | Executive Summary; Background & Context; Methodology; Key Findings by theme; Data & Evidence; Implications (short/long-term); Recommendations (Priority 1/2, each What/Why/How); Appendix; Sources | [comprehensive-report.md](templates/comprehensive-report.md) |
| Research Summary | 500-1000 words | Most research requests (default) | Executive Summary; Key Findings (each with a source line); Detailed Analysis; Conclusions; Next Steps; Sources | [research-summary.md](templates/research-summary.md) |

Word targets are goals, not gates: a Quick Brief that needs 450 words is still a Quick Brief. Missing mandatory sections are a Verify failure, not a style choice.

## Formatting Guidelines

### Headings
- Use `#` for title
- Use `##` for major sections
- Use `###` for subsections
- Keep heading hierarchy consistent

### Lists
- Use `-` for bullet points
- Use `1.` for numbered lists
- Keep list items parallel in structure

### Emphasis
- Use `**bold**` for key terms and section labels
- Use `*italic*` for emphasis
- Use sparingly for maximum impact

### Citations
- Cite inline with markdown links — `[Title](url)` — immediately after the supported statement
- Add an `[E:id]` tag whenever support is not evident from the link alone
- Include citation immediately after referenced information
- Group all sources in a "Sources" section at the end
- Full rules: [citations.md](citations.md)

### Tables
- Use for structured data comparison
- Keep columns to 3-5 for readability
- Include header row
- Align content appropriately

### Code Blocks
Use when including:
- Technical specifications
- Configuration examples
- Command examples

```
Example code or configuration here
```

## Content Guidelines

### Executive Summaries
- Lead with the most important finding
- Include 1-2 key implications
- Make it standalone (reader gets value without reading further)
- Target 2-3 sentences for summaries, 1 paragraph for reports

### Key Findings
- Start with a clear headline
- Support with specific evidence
- Include relevant data points or quotes
- Cite source immediately
- Focus on actionable insights

### Recommendations
- Make them specific and actionable
- Explain the "why" behind each recommendation
- Prioritize clearly (Priority 1, 2, 3 or High/Medium/Low)
- Include implementation hints when relevant

### Source Citations
- Link to the source's registered URL — `[Title](url)` — and add `[E:id]` where support is not evident from the link alone
- Note if information is outdated (check `published_at` on the source row)
- Credit specific sections when quoting
- Group related sources together
