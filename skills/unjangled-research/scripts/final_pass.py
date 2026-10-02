#!/usr/bin/env python3
# unjangled-research v3.4.3: mechanical Final Pass gate.
# Locally authored (not vendored). Stdlib only, Python 3.10+.
# v3.4.1 (868ebb0): trailing-slash-only locator diffs demoted to warnings;
# superseded source rows skipped in locator checks; warnings excluded from
# the pass/fail exit code.
# v3.4.2: numeral check now strips markdown link URLs (keeps link text) —
# prior MD_LINK.sub kept the URL and dropped the text, the exact inversion,
# confirmed by URL-digit false positives across bench batches 3-5.
# v3.4.3: report selection previously took the alphabetically-first .md
# (excluding scope.md), so notes.md shadowed the real report for any slug
# sorting after 'n' — notes.md now excluded, largest remaining .md is the
# report. Also fixed the v3.4.2 regression where MD_LINK.findall (two
# capture groups) yielded tuples in the reference check, flagging every
# markdown link as unregistered.
"""
final_pass.py -- mechanical enforcement of the Final Pass classes that recurred
as failures in the 2026-10-01 smoke runs. Enforces, per SKILL.md:

  1. artifacts   all six run artifacts exist and are non-empty
  2. schema      required fields, enums, ID patterns, no extra keys
  3. ids         every source/claim/evidence/assumption ID recomputes
  4. locator     canonical_locator case-normalization (scheme+host only)
  5. numerals    every numeral in an [E:id]-tagged sentence appears in a cited
                 evidence row (digit-normalized; unit conversions are flagged,
                 not silently accepted)
  6. references  [E:id] resolve; evidence->source resolve; report links
                 resolve to registered sources
  7. manifest    timestamps ordered and non-placeholder; artifact_paths exist
  8. coverage    factual claims carry non-empty evidence_ids

Exit 0 = no violations. Exit 1 = violations printed as a JSON report.
Agent judgment (honest uncertainty labels, synthesis arithmetic, prose
quality) is NOT checked here -- it stays with the agent-judged pass.
"""

import argparse
import hashlib
import json
import os
import re
import sys
from datetime import datetime
from urllib.parse import urlsplit

HEX16 = re.compile(r'^[0-9a-f]{16}$')
NUM_TOKEN = re.compile(r'\d[\d,]*(?:\.\d+)?%?')
E_TAG = re.compile(r'\[E:([0-9a-f]{16})\]')
MD_LINK = re.compile(r'\[([^\]]*)\]\((https?://[^)]+)\)')
CAPTURE_TS = re.compile(r'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}')


def norm_ws(s: str) -> str:
    return re.sub(r'\s+', ' ', s.strip()).lower()


def digits(n: str) -> str:
    return n.replace(',', '').rstrip('%')


def load_jsonl(path):
    rows = []
    if not os.path.exists(path):
        return rows, False
    with open(path) as f:
        for i, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            rows.append((i, json.loads(line)))
    return rows, True


def check(run_dir: str) -> dict:
    v = {name: [] for name in
         ['artifacts', 'schema', 'ids', 'locator', 'numerals',
          'references', 'manifest', 'coverage']}

    # -- 1 artifacts ---------------------------------------------------------
    # The report is the largest .md besides scope.md and notes.md — never the
    # alphabetically-first (notes.md shadowed late-alphabet slug reports).
    report_files = [f for f in os.listdir(run_dir)
                    if f.endswith('.md') and f not in ('scope.md', 'notes.md')]
    for name in ['scope.md', 'sources.jsonl', 'evidence.jsonl',
                 'claims.jsonl', 'run_manifest.json']:
        p = os.path.join(run_dir, name)
        if not os.path.isfile(p) or os.path.getsize(p) == 0:
            v['artifacts'].append(f'missing or empty: {name}')
    if not report_files:
        v['artifacts'].append('no report *.md (besides scope.md)')

    sources, _ = load_jsonl(os.path.join(run_dir, 'sources.jsonl'))
    evidence, _ = load_jsonl(os.path.join(run_dir, 'evidence.jsonl'))
    claims, _ = load_jsonl(os.path.join(run_dir, 'claims.jsonl'))
    manifest, mok = (None, False)
    mp = os.path.join(run_dir, 'run_manifest.json')
    if os.path.isfile(mp) and os.path.getsize(mp) > 0:
        try:
            manifest = json.load(open(mp))
            mok = True
        except json.JSONDecodeError as e:
            v['artifacts'].append(f'run_manifest.json not valid JSON: {e}')

    # -- 2 schema ------------------------------------------------------------
    # Allowlist = the schema files' own properties (required + optional), so
    # optional fields like source.authors are legal while unknown keys fail.
    schema_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'schemas')
    allowed_keys = {}
    for kind, fname in [('source', 'source.schema.json'), ('evidence', 'evidence.schema.json'),
                        ('claim', 'claim.schema.json')]:
        sp = os.path.join(schema_dir, fname)
        allowed_keys[kind] = set(json.load(open(sp)).get('properties', {}).keys()) if os.path.exists(sp) else set()
    enums = {
        ('source', 'source_type'): {'web', 'academic', 'documentation', 'code', 'news', 'government', 'book'},
        ('source', 'metadata_status'): {'unverified', 'doi_verified', 'url_verified', 'title_matched'},
        ('claim', 'claim_type'): {'factual', 'synthesis', 'recommendation', 'speculation'},
        ('claim', 'support_status'): {'unverified', 'supported', 'partial', 'unsupported', 'needs_review'},
    }
    required = {
        'source': ['source_id', 'canonical_locator', 'raw_url', 'title', 'source_type', 'metadata_status', 'registered_at'],
        'evidence': ['evidence_id', 'source_id', 'quote', 'evidence_type', 'captured_at'],
        'claim': ['claim_id', 'section_id', 'text', 'claim_type', 'support_status'],
    }
    stores = {'source': sources, 'evidence': evidence, 'claim': claims}
    ev_enum = {'direct_quote', 'paraphrase', 'data_point', 'figure_reference', 'methodology'}
    for kind, rows in stores.items():
        for ln, row in rows:
            rid = row.get(f'{kind}_id', f'line{ln}')
            for f in required[kind]:
                if f not in row:
                    v['schema'].append(f'{kind} {rid}: missing required {f}')
            for f in row:
                if f not in allowed_keys[kind]:
                    v['schema'].append(f'{kind} {rid}: unknown key {f}')
            for (k2, fld), allowed in enums.items():
                if k2 == kind and fld in row and row[fld] not in allowed:
                    v['schema'].append(f'{kind} {rid}: {fld}={row[fld]!r} not in enum')
            if kind == 'evidence' and row.get('evidence_type') not in ev_enum:
                v['schema'].append(f'evidence {rid}: bad evidence_type')
            for fld in [f'{kind}_id']:
                if fld in row and not HEX16.match(str(row[fld])):
                    v['schema'].append(f'{kind} {rid}: {fld} not 16-hex')
    if mok:
        for k in ['version', 'query', 'mode', 'started_at', 'report_dir', 'artifact_paths']:
            if k not in manifest:
                v['schema'].append(f'manifest: missing {k}')
        if manifest.get('mode') not in {'quick', 'standard', 'deep', 'ultradeep'}:
            v['schema'].append(f"manifest: mode={manifest.get('mode')!r} not in enum")

    # -- 3 ids ---------------------------------------------------------------
    src_ids = set()
    for ln, row in sources:
        want = hashlib.sha256(row.get('canonical_locator', '').encode()).hexdigest()[:16]
        src_ids.add(row.get('source_id'))
        if row.get('source_id') != want:
            v['ids'].append(f"source {row.get('source_id')}: source_id != sha256(canonical_locator)[:16] (want {want})")
    for ln, row in evidence:
        payload = (row.get('source_id', '') + norm_ws(row.get('quote', '')) + (row.get('locator') or ''))
        want = hashlib.sha256(payload.encode('utf-8')).hexdigest()[:16]
        if row.get('evidence_id') != want:
            v['ids'].append(f"evidence {row.get('evidence_id')}: id mismatch (want {want})")
    for ln, row in claims:
        payload = (row.get('section_id', '').strip() + norm_ws(row.get('text', '')))
        want = hashlib.sha256(payload.encode('utf-8')).hexdigest()[:16]
        if row.get('claim_id') != want:
            v['ids'].append(f"claim {row.get('claim_id')}: id mismatch (want {want})")
    if mok:
        for a in manifest.get('assumptions', []) or []:
            want = 'asm_' + hashlib.sha256(a.get('text', '').encode()).hexdigest()[:8]
            if a.get('assumption_id') != want:
                v['ids'].append(f"assumption {a.get('assumption_id')}: != {want}")

    # -- 4 locator normalization ----------------------------------------------
    # Rows superseded by a live re-registration are historical: their defects
    # are moot, so they are skipped. A path CASE change is a real canonical-
    # form violation; a trailing-slash-only difference is a warning (the URL
    # resolves identically and the hash is internally consistent).
    superseded = {s for _, row in sources for s in ([row.get('supersedes')] if row.get('supersedes') else [])}
    v.setdefault('warnings', [])
    for ln, row in sources:
        if row.get('source_id') in superseded:
            continue
        cl, ru = row.get('canonical_locator', ''), row.get('raw_url', '')
        if not cl.startswith('http'):
            continue
        try:
            c, r = urlsplit(cl), urlsplit(ru)
        except ValueError:
            continue
        if c.scheme != c.scheme.lower() or c.netloc != c.netloc.lower():
            v['locator'].append(f"source {row.get('source_id')}: scheme/host not lowercased in canonical_locator")
        if r.path and c.path != r.path:
            msg = f"source {row.get('source_id')}: path differs from raw ({c.path} vs raw {r.path})"
            if c.path.rstrip('/') == r.path.rstrip('/'):
                v['warnings'].append(f"locator (trailing slash only): {msg}")
            else:
                v['locator'].append(f"source {row.get('source_id')}: path case changed ({c.path} vs raw {r.path})")

    # -- report text ----------------------------------------------------------
    report_text = ''
    if report_files:
        report_text = open(os.path.join(
            run_dir,
            max(report_files, key=lambda f: os.path.getsize(os.path.join(run_dir, f))),
        )).read()

    # -- 5 numerals in cited sentences ----------------------------------------
    # Years are context, not data: a 4-digit token in 1900-2100 is exempt.
    # Link targets and image syntax are stripped so URL digits don't count.
    def is_year(t: str) -> bool:
        core = digits(t)
        return len(core) == 4 and core.isdigit() and 1900 <= int(core) <= 2100

    ev_by_id = {row.get('evidence_id'): row for _, row in evidence}
    prose = MD_LINK.sub(r'\1 ', report_text)          # keep link text, drop URL digits
    sentences = re.split(r'(?<=[.!?])\s+|\n\s*(?:[-*#]|\d+\.)\s*', prose)
    for s in sentences:
        tags = E_TAG.findall(s)
        if not tags:
            continue
        cited_text = ' '.join(
            (ev_by_id.get(t, {}).get('quote', '') + ' ' + (ev_by_id.get(t, {}).get('locator') or ''))
            for t in tags)
        cited_digits = {digits(m) for m in NUM_TOKEN.findall(cited_text)}
        s_clean = E_TAG.sub(' ', s)
        for m in NUM_TOKEN.findall(s_clean):
            if is_year(m):
                continue
            if digits(m) not in cited_digits:
                v['numerals'].append(f"numeral {m!r} not in cited evidence: {s_clean.strip()[:90]!r}")

    # -- 6 references ----------------------------------------------------------
    src_urls = {row.get('raw_url') for _, row in sources} | {row.get('canonical_locator') for _, row in sources}
    ev_ids = set(ev_by_id)
    for t in set(E_TAG.findall(report_text)):
        if t not in ev_ids:
            v['references'].append(f'[E:{t}] in report has no evidence row')
    for ln, row in evidence:
        if row.get('source_id') not in src_ids:
            v['references'].append(f"evidence {row.get('evidence_id')}: unknown source_id {row.get('source_id')}")
    for _linktext, url in MD_LINK.findall(report_text):
        if url not in src_urls:
            v['references'].append(f'report link not a registered source: {url[:80]}')
    for ln, row in claims:
        for e in row.get('evidence_ids') or []:
            if e not in ev_ids:
                v['references'].append(f"claim {row.get('claim_id')}: unknown evidence_id {e}")

    # -- 7 manifest -------------------------------------------------------------
    if mok:
        st, fi = manifest.get('started_at'), manifest.get('finished_at')
        if st and st.endswith('T00:00:00Z'):
            v['manifest'].append('started_at is placeholder midnight')
        if fi and fi.endswith('T00:00:00Z'):
            v['manifest'].append('finished_at is placeholder midnight')
        caps = [row.get('captured_at') for _, row in evidence if row.get('captured_at')]
        try:
            if st and caps and datetime.fromisoformat(st.replace('Z', '+00:00')) > datetime.fromisoformat(min(caps).replace('Z', '+00:00')):
                v['manifest'].append('started_at after first evidence capture')
            if fi and caps and datetime.fromisoformat(fi.replace('Z', '+00:00')) < datetime.fromisoformat(max(caps).replace('Z', '+00:00')):
                v['manifest'].append('finished_at before last evidence capture')
        except ValueError:
            v['manifest'].append('unparseable timestamp (manifest or captured_at)')
        ap = manifest.get('artifact_paths')
        if isinstance(ap, dict):
            paths = [str(x) for x in ap.values()]
        else:
            paths = [p.get('report', '') if isinstance(p, dict) else str(p) for p in (ap or [])]
        for p in paths:
            if p and not os.path.exists(os.path.join(run_dir, p)):
                v['manifest'].append(f'artifact_path missing on disk: {p}')

    # -- 8 coverage --------------------------------------------------------------
    # Superseded claims are historical: skip them (symmetric with the locator
    # check's supersede handling).
    superseded_claims = {s for _, row in claims for s in ([row.get('supersedes')] if row.get('supersedes') else [])}
    for ln, row in claims:
        if row.get('claim_id') in superseded_claims:
            continue
        if row.get('claim_type') == 'factual' and not (row.get('evidence_ids') or []):
            v['coverage'].append(f"factual claim {row.get('claim_id')} has empty evidence_ids")

    return v


def main() -> None:
    ap = argparse.ArgumentParser(prog='final_pass')
    ap.add_argument('--dir', required=True, help='Run directory')
    ap.add_argument('--json', action='store_true', help='JSON report only')
    args = ap.parse_args()
    v = check(args.dir)
    warnings = v.pop('warnings', [])
    total = sum(len(x) for x in v.values())
    report = {'run_dir': os.path.abspath(args.dir), 'violations': total,
              'warnings': warnings, 'detail': v}
    if args.json:
        print(json.dumps(report, indent=2, ensure_ascii=False))
    else:
        for k, items in v.items():
            for item in items:
                print(f'{k}: {item}')
        for item in warnings:
            print(f'warning: {item}')
        print(f'{"PASS" if total == 0 else "FAIL"} ({total} violations, {len(warnings)} warnings)')
    sys.exit(0 if total == 0 else 1)


if __name__ == '__main__':
    main()
