#!/usr/bin/env python3
"""UNDRSCOR local research records and packet export. Python standard library only."""
import argparse
import hashlib
import json
import re
import shutil
import sys
import uuid
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from xml.sax.saxutils import escape, quoteattr


def now():
    return datetime.now(timezone.utc).isoformat()


def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8'))


def save(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + '.tmp')
    tmp.write_text(json.dumps(value, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    tmp.replace(path)


def required(d, names):
    for key in names:
        if not isinstance(d.get(key), str) or not d[key].strip():
            raise ValueError('Missing nonempty string: ' + key)


def slug(value):
    if not re.fullmatch(r'[a-z0-9][a-z0-9-]{0,79}', value):
        raise ValueError('IDs must use 1–80 lowercase letters, digits, and hyphens')
    return value


def profile(root):
    return read(root / 'profile.json')


def account(p, value):
    if value != p['profile_id']:
        raise ValueError('Profile mismatch. Reconfirm this account or create a separate workspace.')


def records(root):
    return read(root / 'resources.json')


def source_record(root, sid):
    return read(root / 'sources' / (slug(sid) + '.json'))


def safe_source(root, source):
    f = (root / source['file']).resolve()
    if not f.is_relative_to((root / 'sources').resolve()):
        raise ValueError('Source path escapes the source folder')
    if not f.is_file() or hashlib.sha256(f.read_bytes()).hexdigest() != source['sha256']:
        raise ValueError('Source is missing or changed: ' + source['id'])
    return f


def init(args, root):
    if (root / 'profile.json').exists() or (root / 'resources.json').exists() or (root / 'sources').exists():
        raise ValueError('Workspace already has research data. Resume it or choose a new folder.')
    root.mkdir(parents=True, exist_ok=True)
    p = {'version': 1, 'profile_id': str(uuid.uuid4()), 'label': args.label,
         'created_at': now(), 'preferences': {}}
    save(root / 'profile.json', p)
    save(root / 'resources.json', {})
    print(json.dumps(p))


def preferences(args, root):
    p = profile(root)
    d = read(args.input)
    allowed = {'os', 'connection', 'tradition', 'translation', 'language', 'depth', 'preferred_authors', 'preferred_series', 'format_notes'}
    if not isinstance(d, dict) or set(d) - allowed:
        raise ValueError('Unexpected preference keys; never store credentials in this profile')
    if any(not isinstance(v, (str, list)) for v in d.values()):
        raise ValueError('Preferences must be strings or lists of strings')
    if any(isinstance(v, list) and any(not isinstance(x, str) for x in v) for v in d.values()):
        raise ValueError('Preference lists must contain strings')
    p['preferences'].update(d)
    save(root / 'profile.json', p)
    print('Preferences saved')


def resource(args, root):
    p = profile(root)
    d = read(args.input)
    required(d, ['id', 'profile_id', 'resource_id', 'title', 'author', 'access', 'evidence'])
    slug(d['id']); account(p, d['profile_id'])
    if d['access'] not in ['verified', 'unverified', 'unavailable']:
        raise ValueError('Invalid access state')
    if not isinstance(d.get('books'), list) or not d['books'] or any(not isinstance(x, str) or not x.strip() for x in d['books']):
        raise ValueError('books must list verified biblical-book coverage')
    d['checked_at'] = now()
    rr = records(root)
    old = rr.get(d['id'])
    if old and any(old.get(k) != d.get(k) for k in ['resource_id', 'title', 'author']):
        raise ValueError('Resource identity cannot change under an existing ID. Register a new ID and re-import its sources.')
    rr[d['id']] = d
    save(root / 'resources.json', rr)
    print('Resource recorded: ' + d['id'])


def ingest(args, root):
    p = profile(root); account(p, args.account)
    rr = records(root); r = rr.get(args.resource)
    if not r or r['access'] != 'verified' or r['profile_id'] != p['profile_id']:
        raise ValueError('Resource access is not verified for this profile')
    if args.book.casefold() not in [x.casefold() for x in r['books']]:
        raise ValueError('Resource does not have verified coverage for this biblical book')
    src = Path(args.file)
    if not src.is_file() or not src.read_text(encoding='utf-8').strip():
        raise ValueError('A nonempty UTF-8 source text file is required')
    if not args.locator.strip() or not args.passage.strip():
        raise ValueError('Passage and observed locator are required')
    if args.coverage == 'partial' and not args.note.strip():
        raise ValueError('Partial sources require a limitation note')
    if not args.link.startswith(('https://app.logos.com/', 'https://ref.ly/', 'logosres:')):
        raise ValueError('Provide an observed Logos resource link')
    sid = 'source-' + uuid.uuid4().hex[:12]
    dest = root / 'sources' / (sid + '.txt'); dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(src, dest)
    s = {'id': sid, 'profile_id': p['profile_id'], 'resource': args.resource,
         'resource_identity': {k:r[k] for k in ['resource_id','title','author']},
         'book': args.book, 'passage': args.passage, 'locator': args.locator,
         'link': args.link, 'method': args.method, 'coverage': args.coverage,
         'limitation': args.note, 'retrieved_at': now(),
         'file': 'sources/' + dest.name, 'sha256': hashlib.sha256(dest.read_bytes()).hexdigest()}
    save(root / 'sources' / (sid + '.json'), s)
    print(json.dumps(s))


def paragraph(text, style='Normal'):
    return '<w:p><w:pPr><w:pStyle w:val=' + quoteattr(style) + '/></w:pPr><w:r><w:t xml:space="preserve">' + escape(text) + '</w:t></w:r></w:p>'


def write_docx(path, blocks, links):
    ns = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
    relns = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
    body = ''.join(paragraph(text, style) for style, text in blocks)
    for index, label in enumerate(links):
        body += '<w:p><w:hyperlink r:id="link' + str(index) + '"><w:r><w:rPr><w:color w:val="225577"/><w:u w:val="single"/></w:rPr><w:t>' + escape(label) + '</w:t></w:r></w:hyperlink></w:p>'
    document = '<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="' + ns + '" xmlns:r="' + relns + '"><w:body>' + body + '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr></w:body></w:document>'
    styles = '<w:styles xmlns:w="' + ns + '"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Georgia" w:hAnsi="Georgia"/><w:sz w:val="22"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="140" w:line="280"/><w:widowControl/></w:pPr></w:pPrDefault></w:docDefaults>'
    for name, size in [('Normal',22),('Title',40),('Heading1',30),('Heading2',25)]:
        styles += '<w:style w:type="paragraph" w:styleId="' + name + '"><w:name w:val="' + name + '"/><w:pPr>' + ('<w:keepNext/><w:spacing w:before="260" w:after="160"/>' if name!='Normal' else '') + '</w:pPr><w:rPr><w:sz w:val="' + str(size) + '"/>' + ('<w:b/>' if name!='Normal' else '') + '</w:rPr></w:style>'
    styles += '</w:styles>'
    rels = '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="styles" Type="' + relns + '/styles" Target="styles.xml"/>'
    for i, url in enumerate(links.values()):
        rels += '<Relationship Id="link' + str(i) + '" Type="' + relns + '/hyperlink" Target=' + quoteattr(url) + ' TargetMode="External"/>'
    rels += '</Relationships>'
    with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('[Content_Types].xml', '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>')
        z.writestr('_rels/.rels', '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="doc" Type="' + relns + '/officeDocument" Target="word/document.xml"/></Relationships>')
        z.writestr('word/document.xml', document); z.writestr('word/styles.xml', styles)
        z.writestr('word/_rels/document.xml.rels', rels)


def build(args, root):
    p = profile(root); packet = read(args.input); rr = records(root)
    required(packet, ['profile_id', 'passage', 'book', 'title', 'purpose', 'kind'])
    account(p, packet['profile_id'])
    if packet['kind'] != 'research':
        raise ValueError('Only research packets are supported')
    sections = packet.get('sections')
    if not isinstance(sections, list) or not sections:
        raise ValueError('Research sections are required')
    sources = {}; blocks = [('Title',packet['title']),('Normal','UNDRSCOR Sermon Research Guide'),('Normal',packet['passage']),('Normal',packet['purpose'])]
    md = '# ' + packet['title'] + '\n\nUNDRSCOR Sermon Research Guide\n\n' + packet['passage'] + '\n\n' + packet['purpose'] + '\n\n'
    for section in sections:
        required(section, ['heading', 'basis'])
        if section['basis'] not in ['source', 'synthesis', 'review']:
            raise ValueError('Section basis must be source, synthesis, or review')
        paras = section.get('paragraphs')
        if not isinstance(paras, list) or not paras or any(not isinstance(t,str) or not t.strip() for t in paras):
            raise ValueError('Section paragraphs must be nonempty strings')
        ids = section.get('sources', [])
        if not isinstance(ids, list) or any(not isinstance(x,str) for x in ids):
            raise ValueError('sources must be a list of source IDs')
        if section['basis'] != 'review' and not ids:
            raise ValueError('Source and synthesis sections require source citations')
        for sid in ids:
            s = source_record(root, sid); account(p, s['profile_id']); safe_source(root, s)
            r = rr.get(s['resource'])
            if not r or r['access'] != 'verified' or r['profile_id'] != p['profile_id']:
                raise ValueError('Source resource access is no longer verified')
            if s.get('resource_identity') != {k:r[k] for k in ['resource_id','title','author']}:
                raise ValueError('Source metadata no longer matches the registered resource. Re-import after checking provenance.')
            if s['passage'].casefold() != packet['passage'].casefold() or s['book'].casefold() != packet['book'].casefold():
                raise ValueError('Source passage/book does not match packet')
            if packet['book'].casefold() not in [x.casefold() for x in r['books']]:
                raise ValueError('Resource coverage changed')
            sources[sid] = (s,r)
        attribution = section['basis'].capitalize() + (': ' + ', '.join(ids) if ids else '')
        blocks.extend([('Heading1',section['heading']),('Normal',attribution)])
        md += '## ' + section['heading'] + '\n\n' + attribution + '\n\n'
        for t in paras:
            blocks.append(('Normal',t)); md += t + '\n\n'
    if not sources:
        raise ValueError('No retrieved source supports this packet')
    limitations = packet.get('limitations', [])
    if not isinstance(limitations,list) or any(not isinstance(x,str) for x in limitations):
        raise ValueError('limitations must be a list of strings')
    auto = ['The full Scripture passage is not reproduced unless supplied separately. Citations use observed source locators.']
    if len({s['resource'] for s,r in sources.values()}) == 1:
        auto.append('This packet draws on one commentary resource and cannot establish agreement among commentators.')
    for sid,(s,r) in sources.items():
        if s['coverage']=='partial': auto.append(r['title'] + ': partial coverage. ' + s['limitation'])
    auto += limitations
    blocks.append(('Heading1','Coverage and limitations')); md += '## Coverage and limitations\n\n'
    for line in auto: blocks.append(('Normal',line)); md += line + '\n\n'
    blocks.append(('Heading1','Source register')); md += '## Source register\n\n'; links={}
    for sid,(s,r) in sources.items():
        line = f"{sid}. {r['author']}. {r['title']}. {s['locator']}. Resource {r['resource_id']}. Coverage: {s['coverage']}. Method: {s['method']}. Retrieved: {s['retrieved_at']}. Access evidence: {r['evidence']}. Access checked: {r['checked_at']}."
        blocks.append(('Normal',line)); md += line + '\n\n[' + r['title'] + '](' + s['link'] + ')\n\n'
        links[sid + ' — ' + r['title']] = s['link']
    out = root / 'outputs'; out.mkdir(exist_ok=True)
    stem = 'research-' + datetime.now().strftime('%Y%m%d-%H%M%S') + '-' + uuid.uuid4().hex[:6]
    (out / (stem + '.md')).write_text(md, encoding='utf-8')
    write_docx(out / (stem + '.docx'), blocks, links)
    save(out / (stem + '.manifest.json'), {'profile_id':p['profile_id'],'passage':packet['passage'],'sources':list(sources),'created_at':now(),'layout_review':'pending','content_review':'pending'})
    print(json.dumps({'markdown':str(out/(stem+'.md')),'docx':str(out/(stem+'.docx')),'review':'Content and visual review remain required'}))


def status(args, root):
    p=profile(root); rr=records(root)
    print(json.dumps({'profile_id':p['profile_id'],'label':p['label'],'preferences':p['preferences'],
        'verified_resources':sum(r['access']=='verified' for r in rr.values()),
        'source_records':len(list((root/'sources').glob('source-*.json'))),
        'note':'Local records do not prove current browser authentication or source completeness.'},indent=2))


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--workspace',required=True,type=Path)
    sub=parser.add_subparsers(dest='command',required=True)
    q=sub.add_parser('init');q.add_argument('--label',required=True)
    for name in ['preferences','resource','build']:
        q=sub.add_parser(name);q.add_argument('--input',required=True,type=Path)
    q=sub.add_parser('source')
    for flag in ['account','resource','book','passage','file','locator','link']:
        q.add_argument('--'+flag,required=True)
    q.add_argument('--coverage',required=True,choices=['complete','partial'])
    q.add_argument('--method',required=True,choices=['browser','connector','user-notes','user-export'])
    q.add_argument('--note',default='')
    sub.add_parser('status')
    args=parser.parse_args();root=args.workspace.expanduser().resolve()
    try:
        {'init':init,'preferences':preferences,'resource':resource,'source':ingest,'build':build,'status':status}[args.command](args,root)
    except (ValueError,KeyError,TypeError,OSError,json.JSONDecodeError) as e:
        print('Error: '+str(e),file=sys.stderr);return 1
    return 0

if __name__=='__main__':
    sys.exit(main())
