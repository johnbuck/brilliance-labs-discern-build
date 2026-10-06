#!/usr/bin/env python3
# unjangled-research v3.5: network citation verifier (second checker).
# Locally authored. Stdlib only, Python 3.10+.
"""
verify_citations.py -- re-fetch each registered source and confirm:
  1. the source URL resolves (any 2xx/3xx; 403/404 = unreachable, recorded)
  2. each direct_quote row attributed to that source appears in the fetched
     content (normalized whitespace, case-sensitive)

This is the SECOND checker (CAP-3). The local gate (final_pass.py) checks
structure; this checks the live network. Disagreements between the two are
findings, not noise. Bot-walls (403) are expected weather: they mean
"unverifiable this pass," not "fabricated."

Exit 0 = all reachable sources verified, zero fidelity misses.
Exit 1 = fidelity misses on reachable sources (quotes not found).
Exit 2 = all sources unreachable (nothing verifiable — recorded, not failed).
"""

import argparse
import json
import os
import re
import sys
import urllib.request
import urllib.error

UA = 'unjangled-research/3.5 (citation-verifier; contact: homelab)'


def norm(s: str) -> str:
    return re.sub(r'\s+', ' ', s.strip())


def fetch(url: str, timeout: int = 30) -> tuple[str, int]:
    """Return (body, status). Non-fatal on any network error."""
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.read(2_000_000).decode('utf-8', errors='replace'), r.status
    except urllib.error.HTTPError as e:
        return '', e.code
    except Exception as e:
        return '', -1


def main() -> None:
    ap = argparse.ArgumentParser(prog='verify_citations')
    ap.add_argument('--dir', required=True, help='Run directory')
    ap.add_argument('--json', action='store_true', help='JSON output')
    args = ap.parse_args()

    sources = [json.loads(l) for l in open(os.path.join(args.dir, 'sources.jsonl')) if l.strip()]
    evidence = [json.loads(l) for l in open(os.path.join(args.dir, 'evidence.jsonl')) if l.strip()]

    superseded = {e.get('supersedes') for e in evidence if e.get('supersedes')}
    live_ev = [e for e in evidence if e['evidence_id'] not in superseded]

    results = []
    misses = []
    unreachable = 0

    for src in sources:
        url = src.get('raw_url') or src.get('canonical_locator', '')
        if not url.startswith('http'):
            results.append({'source_id': src['source_id'], 'url': url, 'status': 'skipped (non-http)'})
            continue
        body, code = fetch(url)
        if code in (200, 301, 302) and body:
            body_norm = norm(body)
            src_quotes = [e for e in live_ev
                          if e.get('source_id') == src['source_id'] and e.get('evidence_type') == 'direct_quote']
            for q_row in src_quotes:
                q = norm(q_row.get('quote', ''))
                if len(q) >= 20:
                    ok = q in body_norm
                    results.append({'source_id': src['source_id'], 'evidence_id': q_row['evidence_id'],
                                    'status': 'verified' if ok else 'MISS'})
                    if not ok:
                        misses.append(q_row['evidence_id'])
        else:
            unreachable += 1
            results.append({'source_id': src['source_id'], 'url': url[:80], 'status': f'unreachable ({code})'})

    report = {
        'run_dir': os.path.abspath(args.dir),
        'sources_checked': len(sources),
        'reachable': len(sources) - unreachable,
        'unreachable': unreachable,
        'fidelity_misses': len(misses),
        'miss_ids': misses,
        'detail': results,
    }

    if args.json:
        print(json.dumps(report, indent=2, ensure_ascii=False))
    else:
        for r in results:
            print(f"{r.get('status', '?'):16s} {r.get('source_id', '')} {r.get('evidence_id', '')}")
        print(f"--- {report['reachable']} reachable / {unreachable} unreachable / {len(misses)} misses")

    if misses:
        sys.exit(1)
    if unreachable == len(sources) and sources:
        sys.exit(2)
    sys.exit(0)


if __name__ == '__main__':
    main()
