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
import re
import sys

INTERNALS_RE = re.compile(
    r"append-only|run manifest|evidence rows|cryptographic identit"
    r"|deep mode|fallback chain|evidence store|the run executed"
    r"|retrieval registered|source evaluation scored|pipeline|harness",
    re.IGNORECASE,
)
REF_RE = re.compile(r"\[(\d+(?:,\s*\d+)*)\]")


def count_refs(sentence: str) -> int:
    """Count refs in a sentence, handling both [1] [2] and [1, 2] styles."""
    return sum(len(g.split(",")) for g in REF_RE.findall(sentence))
SENT_SPLIT_RE = re.compile(r"(?<=[.!?])\s+")

# CAP-4 thresholds (calibrated; do not tune without re-calibrating on labelled artifacts)
INTERNALS_MAX = 0
MEAN_REFS_MAX = 1.6
PCT3_WARN = 20.0
PCT3_FAIL = 25.0


def split_bibliography(text: str) -> str:
    parts = text.split("## Bibliography", 1)
    return parts[0]


def measure(text: str) -> dict:
    body = split_bibliography(text)
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
    internals = INTERNALS_RE.findall(body)
    return {
        "sentences": len(sentences),
        "refs": total_refs,
        "mean_refs": round(total_refs / len(sentences), 2),
        "pct_3plus": round(100.0 * n3 / len(sentences), 1),
        "max_chain": max(chain_counts),
        "internals_hits": len(internals),
        "internals_samples": [s.strip()[:60] for s in internals[:5]],
    }


def evaluate(m: dict) -> tuple[list, list, list]:
    fails, warns, advisories = [], [], []
    if m["internals_hits"] > INTERNALS_MAX:
        fails.append(
            f"pipeline-internals leakage: {m['internals_hits']} hits "
            f"(samples: {m['internals_samples']}) — process narration belongs "
            f"in the run manifest, not the report"
        )
    if m["mean_refs"] > MEAN_REFS_MAX:
        fails.append(
            f"citation density: mean {m['mean_refs']} refs/sentence "
            f"(max {MEAN_REFS_MAX}) — cite 1-2 most authoritative per sentence, "
            f"batch the rest at paragraph level"
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
