#!/usr/bin/env python3
"""Create a local-only sermon review packet using supplied text; no network I/O."""
import argparse
from datetime import date
import hashlib
import html
import json
from pathlib import Path
import re
from urllib.parse import urlsplit


def digest(data):
    return hashlib.sha256(data).hexdigest()


def required(data, key):
    value = data.get(key)
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f'{key}: a nonempty string is required')
    if any(ord(c) < 32 and c not in '\n\t\r' for c in value):
        raise ValueError(f'{key}: unsupported control character')
    return value.strip()


def prepare(input_path, output_path):
    input_path, output_path = Path(input_path), Path(output_path)
    if output_path.exists() or output_path.is_symlink():
        raise ValueError('Output path exists; choose a new version directory')
    raw = input_path.read_bytes()
    data = json.loads(raw)
    if not isinstance(data, dict):
        raise ValueError('Input must be a JSON object')
    if type(data.get('demo')) is not bool:
        raise ValueError('demo must be true or false')
    meta = {k: required(data, k) for k in ('church', 'title', 'date', 'preacher', 'passage', 'description', 'transcript_status')}
    if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', meta['date']):
        raise ValueError('date must be YYYY-MM-DD')
    date.fromisoformat(meta['date'])
    if meta['transcript_status'] not in ('unreviewed', 'reviewed'):
        raise ValueError('transcript_status must be unreviewed or reviewed')
    for key in ('series', 'audio_url'):
        if key in data:
            meta[key] = required(data, key)
    if 'audio_url' in meta:
        u = urlsplit(meta['audio_url'])
        if (u.scheme != 'https' or not u.hostname or u.username or u.password or u.query or u.fragment
                or re.search(r'[\s<>"\\]', meta['audio_url'])):
            raise ValueError('audio_url must be plain HTTPS without credentials, query, fragment, or whitespace')
        try:
            u.port
        except ValueError as exc:
            raise ValueError('audio_url has an invalid port') from exc
    sources = data.get('sources')
    if not isinstance(sources, dict):
        raise ValueError('sources must be an object')
    needed = ['title', 'date', 'preacher', 'passage', 'description', 'transcript']
    needed += [k for k in ('series', 'audio_url') if k in meta]
    sources = {key: required(sources, key) for key in needed}
    transcript_path = input_path.parent / required(data, 'transcript_file')
    transcript_bytes = transcript_path.read_bytes()
    transcript = transcript_bytes.decode('utf-8')
    if not transcript.strip():
        raise ValueError('Transcript is empty; transcription must finish first')
    known_placeholders = ('placeholder transcript for:', 'transcription would appear here', 'full transcript pending.')
    if any(marker in transcript.lower() for marker in known_placeholders):
        raise ValueError('Transcript contains a known failed-transcription placeholder')
    if not data['demo'] and transcript.startswith('FICTIONAL DEMONSTRATION EXCERPT'):
        raise ValueError('The bundled fictional excerpt must remain marked demo')
    issues = []
    if data['demo']:
        issues.append('Fictional demonstration only; no recording was transcribed.')
    if meta['transcript_status'] != 'reviewed':
        issues.append('Transcript has not been marked reviewed against its source.')
    if 'audio_url' not in meta:
        issues.append('No hosted audio URL supplied; media hosting is still unresolved.')
    else:
        issues.append('Audio URL supplied but not fetched or checked for playback by this helper.')
    issues.append('Editorial accuracy and destination schema still require review; source labels are not verification.')
    key_parts = [meta[k] for k in ('church', 'date', 'preacher', 'title')]
    meta.update(demo=data['demo'], draft=True, record_key=digest(json.dumps(key_parts,ensure_ascii=False).encode()))
    fm = '\n'.join(f'{k}: {json.dumps(v,ensure_ascii=False)}' for k,v in meta.items())
    md = f'---\n{fm}\n---\n\n{meta["description"]}\n\n## Transcript\n\n{transcript}'
    esc = html.escape
    banner = 'FICTIONAL DEMO · LOCAL DRAFT' if data['demo'] else 'LOCAL DRAFT · NOT PUBLISHED'
    media = f'<p><a href="{esc(meta["audio_url"],quote=True)}" rel="noreferrer">Open supplied audio</a> — playback unverified</p>' if 'audio_url' in meta else '<p>No hosted audio supplied.</p>'
    page = f'''<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(meta['title'])} — local review</title>
<style>body{{margin:0;background:#fafafa;color:#0a0a0a;font:18px/1.6 "Helvetica Neue",Arial,sans-serif}}main{{max-width:850px;margin:auto;padding:40px 24px}}h1{{font-size:clamp(2rem,6vw,4rem);line-height:1.05;font-weight:400}}aside{{border-left:5px solid #e8ff00;padding:8px 20px;background:white}}pre{{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit}}a{{color:inherit}}small{{color:#666}}</style>
<main><small>{banner}</small><p>{esc(meta['church'])}</p><h1>{esc(meta['title'])}</h1>
<p>{esc(meta['date'])} · {esc(meta['preacher'])} · {esc(meta['passage'])}</p>
<p>{esc(meta.get('series',''))}</p><p>{esc(meta['description'])}</p>{media}
<aside><strong>Review before publishing</strong><ul>{''.join('<li>'+esc(i)+'</li>' for i in issues)}</ul></aside>
<h2>Transcript</h2><pre>{esc(transcript)}</pre></main></html>'''
    outputs = {'preview.html':page.encode(), 'sermon.md':md.encode(), 'metadata.json':(json.dumps(meta,ensure_ascii=False,indent=2)+'\n').encode(), 'transcript.txt':transcript_bytes}
    review = dict(schema_version=1, state='local_draft', remote_actions=[], publication_authorized=False,
                  input_sha256=digest(raw), transcript_sha256=digest(transcript_bytes), record_key=meta['record_key'],
                  sources=sources, issues=issues, outputs={k:digest(v) for k,v in outputs.items()})
    outputs['review.json'] = (json.dumps(review,ensure_ascii=False,indent=2)+'\n').encode()
    # Validate and render completely before creating the new destination.
    output_path.mkdir(parents=True, exist_ok=False)
    for name,content in outputs.items():
        with (output_path/name).open('xb') as file:
            file.write(content)
    return review


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--input',required=True,type=Path)
    p.add_argument('--out',required=True,type=Path)
    args=p.parse_args()
    try:
        prepare(args.input,args.out)
    except (OSError,ValueError,TypeError) as exc:
        p.exit(1,f'Cannot prepare packet: {exc}\n')
    print(f'Local draft: {args.out.resolve() / "preview.html"}')
    print('No transcription, upload, remote draft, or publication was performed.')


if __name__=='__main__':
    main()
