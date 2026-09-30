#!/usr/bin/env python3
"""Validate sourced newsletter input and render an offline review draft."""
import datetime as dt
import hashlib
import html
import json
from pathlib import Path
import sys
from urllib.parse import urlparse
from zoneinfo import ZoneInfo


def required(obj, key):
    value = obj.get(key)
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f'Missing or invalid {key}')
    return value.strip()


def event_time(value):
    if value.casefold() == 'all day':
        return dt.time.min
    for fmt in ('%I:%M %p', '%H:%M'):
        try:
            return dt.datetime.strptime(value, fmt).time()
        except ValueError:
            pass
    raise ValueError('Event time must be HH:MM, H:MM AM/PM, or All day')


def validate(data):
    for key in ('church', 'timezone', 'issue_date', 'subject', 'intro'):
        required(data, key)
    ZoneInfo(data['timezone'])
    dt.date.fromisoformat(data['issue_date'])
    if not isinstance(data.get('demo'), bool):
        raise ValueError('demo must be explicitly true or false')
    for key in ('passage', 'preacher', 'source'):
        required(data['sermon'], key)
    for e in data.get('events', []):
        for key in ('title', 'date', 'time', 'location', 'description', 'url', 'source'):
            required(e, key)
        dt.date.fromisoformat(e['date'])
        event_time(e['time'])
        url = urlparse(e['url'])
        if url.scheme not in ('http', 'https') or not url.netloc or url.username or url.password:
            raise ValueError('Event URL must be a public http(s) URL without credentials')
        if e.get('private') or e.get('cancelled'):
            raise ValueError('Remove private or cancelled events before rendering')
    for a in data.get('announcements', []):
        for key in ('title', 'body', 'source'):
            required(a, key)


def render(data, output):
    validate(data)
    targets = [output / n for n in ('newsletter.html', 'newsletter.txt', 'review.json')]
    if any(p.exists() for p in targets):
        raise ValueError('Output exists; use a new revision folder')
    esc = lambda value: html.escape(str(value), quote=True)
    warnings = ['Offline draft only. Apply the approved production template and provider footer before external use.']
    if data['demo']:
        warnings.append('Fictional demonstration. example.org links are illustrative.')
    seen = set()
    events = []
    for event in sorted(data.get('events', []), key=lambda e: (e['date'], event_time(e['time']), e['title'])):
        key = (event.get('instance_id', event['title'].casefold()), event['date'], event['time'])
        if key in seen:
            warnings.append('Duplicate event omitted: ' + event['title'])
            continue
        seen.add(key)
        events.append(event)
    sermon = data['sermon']
    source_ledger = [{'section': 'Sunday passage', 'source': sermon['source']}]
    body = f'<p>{esc(data["intro"])}</p><h2>This Sunday</h2><p>{esc(sermon["passage"])}<br>Preacher: {esc(sermon["preacher"])}</p>'
    lines = [data['subject'], data['issue_date'] + ' / ' + data['timezone'], '', data['intro'], '', 'THIS SUNDAY', sermon['passage'], 'Preacher: ' + sermon['preacher']]
    if data['demo']:
        lines.insert(0, 'FICTIONAL DEMONSTRATION — NOT FOR DISTRIBUTION')
    for e in events:
        detail = f'{e["date"]} / {e["time"]} / {e["location"]}'
        body += f'<h2>{esc(e["title"])}</h2><p>{esc(detail)}</p><p>{esc(e["description"])}</p><p><a href="{esc(e["url"])}">Event details</a></p>'
        lines += ['', e['title'], detail, e['description'], e['url']]
        source_ledger.append({'section': e['title'], 'source': e['source']})
    for a in data.get('announcements', []):
        body += f'<h2>{esc(a["title"])}</h2><p>{esc(a["body"])}</p>'
        lines += ['', a['title'], a['body']]
        source_ledger.append({'section': a['title'], 'source': a['source']})
    label = 'FICTIONAL DEMONSTRATION' if data['demo'] else 'LOCAL REVIEW DRAFT'
    document = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{esc(data['subject'])}</title></head><body style="margin:0;background:#f4f4f1;color:#202020;font-family:Arial,Helvetica,sans-serif"><main style="max-width:600px;margin:auto;padding:32px 24px;background:white"><p style="font-size:12px;letter-spacing:1px">{label}</p><h1 style="font-size:32px;line-height:1.15">{esc(data['church'])}</h1><p>{esc(data['issue_date'])} / {esc(data['timezone'])}</p><div style="font-size:17px;line-height:1.6">{body}</div><footer style="margin-top:36px;font-size:13px;color:#555">Local preview. Use your approved email template and provider-managed subscription footer before distribution.</footer></main></body></html>'''
    output.mkdir(parents=True, exist_ok=True)
    targets[0].write_text(document, encoding='utf-8')
    targets[1].write_text('\n'.join(lines) + '\n', encoding='utf-8')
    targets[2].write_text(json.dumps({'mode': 'offline', 'demo': data['demo'], 'issue_date': data['issue_date'], 'timezone': data['timezone'], 'subject': data['subject'], 'sources': source_ledger, 'warnings': warnings, 'html_sha256': hashlib.sha256(document.encode()).hexdigest()}, indent=2), encoding='utf-8')
    return targets


if __name__ == '__main__':
    try:
        if len(sys.argv) != 3:
            raise ValueError('Usage: newsletter.py INPUT.json OUTPUT_DIRECTORY')
        results = render(json.loads(Path(sys.argv[1]).read_text(encoding='utf-8')), Path(sys.argv[2]))
        print('\n'.join(str(p.resolve()) for p in results))
    except (ValueError, KeyError, TypeError, OSError) as e:
        print(f'Newsletter not rendered: {e}', file=sys.stderr)
        sys.exit(1)
