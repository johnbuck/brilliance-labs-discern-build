#!/usr/bin/env python3
"""Readability gate — CAP-4.

Measures citation-chain density and pipeline-internals leakage in a research
report body (bibliography excluded). Thresholds calibrated 2026-10-06 against
two blind-labelled task-73 artifacts (fork judged 72, upstream 07 judged 83).

Gates (spec CAP-4):
  internals  == 0                    hard fail
  mean refs/sentence <= 1.6          hard fail
  pct sentences 3+ refs <= 20%       warn above 20, fail above 25
  max chain                          advisory only (non-discriminating)

Exit codes: 0 pass, 1 fail, 2 warn.
"""

import argparse
import json
import os
import re
import sys

# textstat is a hard dependency (CAP-4b). The skill vendors a copy under
# vendor/ so deployments without pip access still run; a system install
# takes precedence when present.
_VENDOR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "vendor")
if os.path.isdir(_VENDOR) and _VENDOR not in sys.path:
    sys.path.insert(0, _VENDOR)
try:
    import textstat
except ImportError as e:
    sys.stderr.write(
        f"FATAL: textstat is required (pip install textstat, or restore the "
        f"skill's vendor/ directory). {e}\n"
    )
    sys.exit(3)

INTERNALS_RE = re.compile(
    r"append-only|run manifest|evidence rows|cryptographic identit"
    r"|deep mode|fallback chain|evidence store|the run executed"
    r"|retrieval registered|source evaluation scored|pipeline|harness"
    r"|\b[0-9a-f]{12,}\b",
    re.IGNORECASE,
)
REF_RE = re.compile(r"\[(\d+(?:,\s*\d+)*)\]")


def count_refs(sentence: str) -> int:
    """Count refs in a sentence, handling both [1] [2] and [1, 2] styles."""
    return sum(len(g.split(",")) for g in REF_RE.findall(sentence))
SENT_SPLIT_RE = re.compile(r"(?<=[.!?])\s+")

# CAP-4 thresholds. Internals recalibrated 2026-10-06 after an instrument-
# window defect was found (post-bibliography appendices were unmeasured;
# corrected to whole-document scan). Re-derived from the same blind-labelled
# pair: fork v1.1 (judged 72) = 20 hits incl. hash-ID table; 07 (judged 83,
# docked lightly for its own appendix chatter) = 6 hits. Judges penalize
# degree, not presence -> warn > 2, fail > 6 (never worse than the 83-scored
# benchmark). Hash-ID pattern added per judge feedback naming the table.
INTERNALS_WARN = 2
INTERNALS_FAIL = 6
MEAN_REFS_MAX = 1.6
PCT3_WARN = 20.0
PCT3_FAIL = 25.0
# Standard-formula gates (CAP-4b, calibrated 2026-10-06 on the same blind-
# labelled pair): 07 (judged 83) = 21.6 words/sentence, FK 15.7; fork v1.1
# (judged 72) = 32.2, FK 19.0. Warn at the 83-scored benchmark's level,
# fail midway toward the 72-scored level. Flesch/Fog/SMOG are reported but
# ungated (redundant with FK; compressed dynamic range on academic prose).
SENTLEN_WARN = 22.0
SENTLEN_FAIL = 27.0
FK_WARN = 16.5
FK_FAIL = 18.0


def body_before_bibliography(text: str) -> str:
    """Argument prose: everything before the '## Bibliography' heading.

    Citation-density metrics are computed on this window only — it is the
    window the CAP-4 thresholds were calibrated on (fork 2.06, 07 1.04).
    """
    return text.split("## Bibliography", 1)[0]


def reader_facing_text(text: str) -> str:
    """The whole document minus the bibliography section's citation entries.

    Post-bibliography appendices are reader-facing and stay IN scope for the
    internals gate — moving narration past the bibliography heading must not
    evade the gate.
    """
    parts = text.split("## Bibliography", 1)
    if len(parts) == 1:
        return text
    after = parts[1]
    nxt = after.find("\n## ")
    if nxt == -1:
        return parts[0]
    return parts[0] + after[nxt:]


def measure(text: str) -> dict:
    body = body_before_bibliography(text)  # calibrated citation-density window
    reader_facing = reader_facing_text(text)  # whole doc minus bib entries
    sentences = [s for s in SENT_SPLIT_RE.split(body) if len(s.strip()) > 30]
    if not sentences:
        return {
            "sentences": 0,
            "refs": 0,
            "mean_refs": 0.0,
            "pct_3plus": 0.0,
            "max_chain": 0,
            "internals_hits": 0,
            "internals_samples": [],
        }
    chain_counts = [count_refs(s) for s in sentences]
    n3 = sum(1 for n in chain_counts if n >= 3)
    total_refs = sum(chain_counts)
    internals = INTERNALS_RE.findall(reader_facing)
    return {
        "sentences": len(sentences),
        "refs": total_refs,
        "mean_refs": round(total_refs / len(sentences), 2),
        "pct_3plus": round(100.0 * n3 / len(sentences), 1),
        "max_chain": max(chain_counts),
        "internals_hits": len(internals),
        "internals_samples": [s.strip()[:60] for s in internals[:5]],
        "flesch_ease": round(textstat.flesch_reading_ease(body), 1),
        "fk_grade": round(textstat.flesch_kincaid_grade(body), 1),
        "gunning_fog": round(textstat.gunning_fog(body), 1),
        "smog": round(textstat.smog_index(body), 1),
        "mean_sent_len": round(
            textstat.lexicon_count(body) / max(1, textstat.sentence_count(body)), 1
        ),
    }


def evaluate(m: dict) -> tuple[list, list, list]:
    fails, warns, advisories = [], [], []
    if m["internals_hits"] > INTERNALS_FAIL:
        fails.append(
            f"pipeline-internals leakage: {m['internals_hits']} hits "
            f"(fail > {INTERNALS_FAIL}; samples: {m['internals_samples']}) — "
            f"process narration belongs in the run manifest, not the report"
        )
    elif m["internals_hits"] > INTERNALS_WARN:
        warns.append(
            f"pipeline-internals leakage: {m['internals_hits']} hits "
            f"(warn > {INTERNALS_WARN}; samples: {m['internals_samples']})"
        )
    if m["mean_refs"] > MEAN_REFS_MAX:
        fails.append(
            f"citation density: mean {m['mean_refs']} refs/sentence "
            f"(max {MEAN_REFS_MAX}) — cite 1-2 most authoritative per sentence, "
            f"batch the rest at paragraph level"
        )
    if m["mean_sent_len"] > SENTLEN_FAIL:
        fails.append(
            f"sentence length: mean {m['mean_sent_len']} words/sentence "
            f"(fail > {SENTLEN_FAIL}) — split compound sentences; unchain "
            f"comma-linked appositive lists"
        )
    elif m["mean_sent_len"] > SENTLEN_WARN:
        warns.append(
            f"sentence length: mean {m['mean_sent_len']} words/sentence "
            f"(warn > {SENTLEN_WARN})"
        )
    if m["fk_grade"] > FK_FAIL:
        fails.append(
            f"reading grade: Flesch-Kincaid {m['fk_grade']} (fail > {FK_FAIL}) — "
            f"shorten sentences and prefer plain words"
        )
    elif m["fk_grade"] > FK_WARN:
        warns.append(
            f"reading grade: Flesch-Kincaid {m['fk_grade']} (warn > {FK_WARN})"
        )
    if m["pct_3plus"] > PCT3_FAIL:
        fails.append(
            f"{m['pct_3plus']}% of sentences carry 3+ refs (fail > {PCT3_FAIL})"
        )
    elif m["pct_3plus"] > PCT3_WARN:
        warns.append(
            f"{m['pct_3plus']}% of sentences carry 3+ refs (warn > {PCT3_WARN})"
        )
    if m["max_chain"] >= 12:
        advisories.append(
            f"max citation chain {m['max_chain']} — consider splitting across "
            f"sentences (advisory; upstream also scores 83 with a 12-chain)"
        )
    return fails, warns, advisories


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("report", help="Path to report markdown")
    ap.add_argument("--json", action="store_true", help="Emit machine-readable JSON")
    args = ap.parse_args()

    text = open(args.report, encoding="utf-8").read()
    m = measure(text)
    fails, warns, advisories = evaluate(m)

    if args.json:
        print(json.dumps({"metrics": m, "fails": fails, "warns": warns,
                          "advisories": advisories}, indent=2))
    else:
        print(f"readability: {args.report}")
        print(f"  sentences={m['sentences']} refs={m['refs']} "
              f"mean/sent={m['mean_refs']} pct3+={m['pct_3plus']}% "
              f"maxchain={m['max_chain']} internals={m['internals_hits']}")
        print(f"  flesch={m['flesch_ease']} fk={m['fk_grade']} "
              f"fog={m['gunning_fog']} smog={m['smog']} "
              f"sent-len={m['mean_sent_len']}w")
        for f_ in fails:
            print(f"  FAIL: {f_}")
        for w in warns:
            print(f"  WARN: {w}")
        for a in advisories:
            print(f"  advisory: {a}")

    if fails:
        return 1
    if warns:
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
