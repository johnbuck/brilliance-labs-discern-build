#!/usr/bin/env node
// Ministry email workflow: a DEMO. Nothing is ever actually sent. "Sending" writes
// each personalised email into the project's outbox/ folder as .eml (opens in Mail /
// Outlook) and .html (opens in a browser), and records it in send-log.csv.
//
//   node mailer.mjs preview  <project>                 build control-center.html
//   node mailer.mjs run      <project> [--today DATE]  "send" whatever is due today
//   node mailer.mjs simulate <project> --days 42 [--today DATE]
//                                                      pretend N days pass, running each morning
//   node mailer.mjs reset    <project>                 empty the outbox and log
//
// A project folder holds: ministry.json, a contacts file (.csv or .xlsx), campaigns/*.json.
// See ../SKILL.md for the formats.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as XLSX from 'xlsx';

XLSX.set_fs(fs);
const here = path.dirname(fileURLToPath(import.meta.url));
const [, , cmd, projectArg, ...rest] = process.argv;
if (!cmd || !projectArg) {
  console.error('Usage: node mailer.mjs <preview|run|simulate|reset> <project-folder> [--today YYYY-MM-DD] [--days N]');
  process.exit(1);
}
const P = path.resolve(projectArg);
const flag = name => { const i = rest.indexOf(`--${name}`); return i >= 0 ? rest[i + 1] : null; };
const DAY = 864e5;
const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const iso = d => d.toISOString().slice(0, 10);
const parseDay = s => { const [y, m, d] = String(s).slice(0, 10).split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };
const nice = d => d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const short = d => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
const esc = v => String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const now = new Date();
const TODAY = flag('today') ? parseDay(flag('today')) : new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

// ------------------------------------------------------------------ load ----
function loadProject() {
  const ministryPath = path.join(P, 'ministry.json');
  if (!fs.existsSync(ministryPath)) throw new Error(`No ministry.json in ${P}`);
  const ministry = JSON.parse(fs.readFileSync(ministryPath, 'utf8'));
  const contactsFile = path.resolve(P, ministry.contacts || 'contacts.csv');
  const wb = XLSX.readFile(contactsFile, { raw: true });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '', raw: false });
  const norm = k => k.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_');
  const contacts = rows.map(r => {
    const c = {};
    for (const [k, v] of Object.entries(r)) c[norm(k)] = typeof v === 'string' ? v.trim() : v;
    c.first_name ||= (c.name || '').split(' ')[0] || 'Friend';
    c.full_name = c.full_name || c.name || `${c.first_name} ${c.last_name || ''}`.trim();
    c.groups = String(c.groups || '').split(/[;|]/).map(g => g.trim()).filter(Boolean);
    c.opted_in = !/^(no|n|false|0|unsubscribed)$/i.test(String(c.email_opt_in ?? 'yes'));
    return c;
  }).filter(c => c.email);
  const dir = path.join(P, 'campaigns');
  const campaigns = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort().map(f => {
    const c = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    c.id ||= f.replace(/\.json$/, '');
    c.steps ||= [{ id: 'main', subject: c.subject, preheader: c.preheader, body: c.body }];
    c.steps.forEach((s, i) => { s.id ||= `step-${i + 1}`; });
    return c;
  }) : [];
  return { ministry, contacts, campaigns };
}

function audienceOf(c, contacts) {
  const a = c.audience || {};
  const groups = (a.groups || ['*']).map(g => g.toLowerCase());
  const exclude = (a.exclude_groups || []).map(g => g.toLowerCase());
  return contacts.filter(p => p.opted_in)
    .filter(p => groups.includes('*') || groups.includes('everyone') || p.groups.some(g => groups.includes(g.toLowerCase())))
    .filter(p => !p.groups.some(g => exclude.includes(g.toLowerCase())))
    .filter(p => !a.language || String(p.language || '').toLowerCase() === a.language.toLowerCase());
}

// Which (step, person) pairs are due on a given day?
function dueOn(c, day, audience) {
  if ((c.status || 'active') !== 'active') return [];
  const s = c.schedule || {};
  const out = [];
  const same = (a, b) => iso(a) === iso(b);
  switch (s.type) {
    case 'once':
      if (same(parseDay(s.date), day)) audience.forEach(p => out.push({ step: c.steps[0], person: p }));
      break;
    case 'weekly': {
      const okDay = WEEKDAYS[day.getUTCDay()] === String(s.weekday || 'thursday').toLowerCase();
      const started = !s.start || day >= parseDay(s.start);
      const notEnded = !s.end || day <= parseDay(s.end);
      if (okDay && started && notEnded) audience.forEach(p => out.push({ step: c.steps[0], person: p }));
      break;
    }
    case 'before_event': {
      const ev = parseDay(s.event_date);
      for (const st of c.steps) if (same(new Date(ev - (st.days_before || 0) * DAY), day)) audience.forEach(p => out.push({ step: st, person: p }));
      break;
    }
    case 'after_joining':
      for (const p of audience) {
        if (!p.member_since) continue;
        const joined = parseDay(p.member_since);
        if (s.start && joined < parseDay(s.start)) continue;
        for (const st of c.steps) if (same(new Date(joined.getTime() + (st.days_after || 0) * DAY), day)) out.push({ step: st, person: p });
      }
      break;
    case 'birthday':
      for (const p of audience) if (p.birthday && String(p.birthday).slice(-5) === iso(day).slice(5)) out.push({ step: c.steps[0], person: p });
      break;
  }
  return out;
}

function scheduleText(c) {
  const s = c.schedule || {};
  const t = s.time ? ` at ${s.time}` : '';
  switch (s.type) {
    case 'once': return `Once, on ${nice(parseDay(s.date))}${t}`;
    case 'weekly': return `Every ${s.weekday || 'Thursday'}${t}${s.start ? `, starting ${short(parseDay(s.start))}` : ''}${s.end ? `, until ${short(parseDay(s.end))}` : ''}`;
    case 'before_event': return `${c.steps.length} email${c.steps.length > 1 ? 's' : ''} before the event on ${nice(parseDay(s.event_date))}: ${c.steps.map(st => st.days_before ? `${st.days_before} days before` : 'the day of').join(', ')}`;
    case 'after_joining': return `Welcome series for each new member: ${c.steps.map(st => st.days_after ? `day ${st.days_after}` : 'the day they join').join(', ')}`;
    case 'birthday': return `On each person's birthday${t}`;
    default: return 'No schedule set';
  }
}

// ---------------------------------------------------------------- render ----
function fill(text, vars) {
  return String(text || '').replace(/{{\s*([\w.]+)\s*}}/g, (m, k) => (vars[k] !== undefined && vars[k] !== '' ? vars[k] : m));
}
function varsFor(ministry, c, person, day) {
  const s = c.schedule || {};
  return {
    first_name: person.first_name, last_name: person.last_name || '', full_name: person.full_name,
    household: person.household || `the ${person.last_name || person.first_name} household`,
    ministry_name: ministry.name, sender_name: (c.sender || ministry.sender || {}).name || ministry.name,
    event_date: s.event_date ? nice(parseDay(s.event_date)) : '', send_date: nice(day), week_of: short(day),
    website: ministry.website || '', address: ministry.address || '',
  };
}
// Tiny Markdown: ## heading, **bold**, *italic*, [text](url), [[Button|url]], - bullets, > quote, blank-line paragraphs
function mdToHtml(md, accent) {
  const inline = s => esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a href="$2" style="color:#9A5700;">$1</a>`);
  return String(md || '').trim().split(/\n\s*\n/).map(block => {
    const b = block.trim();
    let m;
    if ((m = b.match(/^\[\[(.+?)\|(.+?)\]\]$/))) {
      return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;"><tr><td style="background:${accent};"><a href="${esc(m[2])}" style="display:inline-block;padding:16px 32px;font:600 13px/1 'DM Sans',Helvetica,Arial,sans-serif;letter-spacing:0.12em;text-transform:uppercase;color:#0D0D0D;text-decoration:none;">${esc(m[1])}</a></td></tr></table>`;
    }
    if (b.startsWith('## ')) return `<h2 style="margin:28px 0 12px;font:400 28px/1 'Bebas Neue','Arial Narrow',Impact,sans-serif;letter-spacing:0.02em;text-transform:uppercase;color:#0D0D0D;">${inline(b.slice(3))}</h2>`;
    if (b.split('\n').every(l => /^\s*[-*] /.test(l))) return `<ul style="margin:0 0 20px;padding-left:22px;">${b.split('\n').map(l => `<li style="margin:0 0 6px;">${inline(l.replace(/^\s*[-*] /, ''))}</li>`).join('')}</ul>`;
    if (b.startsWith('> ')) return `<p style="margin:0 0 20px;padding-left:18px;border-left:3px solid ${accent};font:italic 20px/1.5 'Cormorant Garamond',Georgia,serif;color:#1A1A1A;">${inline(b.replace(/^> ?/gm, ''))}</p>`;
    return `<p style="margin:0 0 20px;">${inline(b).replace(/\n/g, '<br>')}</p>`;
  }).join('\n');
}
function mdToText(md) {
  return String(md || '').trim()
    .replace(/\[\[(.+?)\|(.+?)\]\]/g, '$1: $2')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
    .replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1')
    .replace(/^## (.*)$/gm, (_, h) => h.toUpperCase());
}
function renderEmail(ministry, c, step, person, day) {
  const v = varsFor(ministry, c, person, day);
  const accent = ministry.accent || '#E8860F';
  const subject = fill(step.subject, v);
  const pre = fill(step.preheader || '', v);
  const body = fill(step.body, v);
  const why = (c.audience?.groups || ['*']).includes('*') ? `you're part of ${ministry.name}` : `you're part of ${(c.audience.groups || []).join(' / ')} at ${ministry.name}`;
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width">
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Cormorant+Garamond:ital@1&family=DM+Sans:wght@400;600&display=swap" rel="stylesheet">
<title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#EDEAE2;">
<div style="display:none;max-height:0;overflow:hidden;">${esc(pre)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EDEAE2;"><tr><td align="center" style="padding:32px 12px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#F5F2EB;border:1px solid rgba(13,13,13,0.09);">
    <tr><td style="padding:28px 40px;border-bottom:1px solid rgba(13,13,13,0.09);">
      <span style="font:400 26px/1 'Bebas Neue','Arial Narrow',Impact,sans-serif;letter-spacing:0.05em;text-transform:uppercase;color:#0D0D0D;">${esc(ministry.name)}<span style="color:${accent};">.</span></span>
    </td></tr>
    <tr><td style="padding:40px 40px 8px;">
      <div style="width:48px;height:4px;background:${accent};margin-bottom:24px;"></div>
      <div style="font:400 17px/1.7 'DM Sans',Helvetica,Arial,sans-serif;color:#1A1A1A;">
${mdToHtml(body, accent)}
      </div>
    </td></tr>
    <tr><td style="padding:24px 40px 32px;border-top:1px solid rgba(13,13,13,0.09);font:400 13px/1.6 'DM Sans',Helvetica,Arial,sans-serif;color:rgba(13,13,13,0.6);">
      ${esc(ministry.name)}${ministry.address ? ` · ${esc(ministry.address)}` : ''}<br>
      You're receiving this because ${esc(why)}. <a href="#unsubscribe" style="color:#9A5700;">Unsubscribe</a> · <a href="#preferences" style="color:#9A5700;">Email preferences</a>
    </td></tr>
  </table>
  <p style="font:400 12px/1.5 Helvetica,Arial,sans-serif;color:rgba(13,13,13,0.5);margin:16px 0 0;">Class demo: this email was not actually sent.</p>
</td></tr></table></body></html>`;
  const text = `${mdToText(body)}\n\n--\n${ministry.name}${ministry.address ? ' · ' + ministry.address : ''}\nYou're receiving this because ${why}. Unsubscribe: reply STOP.\n(Class demo: not actually sent.)\n`;
  const unknown = [...new Set([...`${step.subject} ${step.body}`.matchAll(/{{\s*([\w.]+)\s*}}/g)].map(m => m[1]).filter(k => v[k] === undefined))];
  return { subject, preheader: pre, html, text, unknown };
}
function toEml(ministry, c, person, email, day) {
  const sender = c.sender || ministry.sender || { name: ministry.name, email: 'office@example.org' };
  const b64 = s => `=?UTF-8?B?${Buffer.from(s).toString('base64')}?=`;
  const [hh, mm] = String(c.schedule?.time || '08:00').split(':').map(Number);
  const date = new Date(day.getTime() + (hh * 60 + (mm || 0)) * 60000);
  const boundary = 'demo-boundary-' + Math.abs(hash(person.email + email.subject)).toString(36);
  return [
    `From: ${b64(sender.name)} <${sender.email}>`,
    `To: ${b64(person.full_name)} <${person.email}>`,
    `Subject: ${b64(email.subject)}`,
    `Date: ${date.toUTCString().replace('GMT', '+0000')}`,
    'MIME-Version: 1.0',
    'X-Class-Demo: not sent',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`, 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: 8bit', '', email.text,
    `--${boundary}`, 'Content-Type: text/html; charset=UTF-8', 'Content-Transfer-Encoding: 8bit', '', email.html,
    `--${boundary}--`, '',
  ].join('\r\n');
}
function hash(s) { let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0; return h; }
const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

// ---------------------------------------------------------------- state -----
const logPath = path.join(P, 'send-log.csv');
function readLog() {
  if (!fs.existsSync(logPath)) return [];
  const [head, ...lines] = fs.readFileSync(logPath, 'utf8').trim().split('\n');
  if (!head) return [];
  const cols = head.split(',');
  return lines.filter(Boolean).map(l => {
    const vals = l.match(/("([^"]|"")*"|[^,]*)(,|$)/g).map(v => v.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '"'));
    return Object.fromEntries(cols.map((c, i) => [c, vals[i]]));
  });
}
function appendLog(rows) {
  const cols = ['date', 'time', 'campaign', 'step', 'to_name', 'to_email', 'subject', 'file'];
  const q = v => /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v);
  if (!fs.existsSync(logPath)) fs.writeFileSync(logPath, cols.join(',') + '\n');
  fs.appendFileSync(logPath, rows.map(r => cols.map(c => q(r[c] ?? '')).join(',')).join('\n') + (rows.length ? '\n' : ''));
}

// "Send" everything due on one day. Returns the log rows written.
function runDay(proj, day) {
  const sentKeys = new Set(readLog().map(r => `${r.date}|${r.campaign}|${r.step}|${r.to_email}`));
  const rows = [];
  for (const c of proj.campaigns) {
    const due = dueOn(c, day, audienceOf(c, proj.contacts));
    for (const { step, person } of due) {
      const key = `${iso(day)}|${c.id}|${step.id}|${person.email}`;
      if (sentKeys.has(key)) continue;
      const email = renderEmail(proj.ministry, c, step, person, day);
      const dir = path.join(P, 'outbox', iso(day));
      fs.mkdirSync(dir, { recursive: true });
      const base = `${slug(c.id)}--${slug(step.id)}--${slug(person.email)}`;
      fs.writeFileSync(path.join(dir, base + '.eml'), toEml(proj.ministry, c, person, email, day));
      fs.writeFileSync(path.join(dir, base + '.html'), email.html);
      rows.push({ date: iso(day), time: c.schedule?.time || '08:00', campaign: c.id, step: step.id, to_name: person.full_name, to_email: person.email, subject: email.subject, file: `outbox/${iso(day)}/${base}.html` });
      sentKeys.add(key);
    }
  }
  appendLog(rows);
  return rows;
}

// ------------------------------------------------------- control center ----
function buildControlCenter(proj) {
  const { ministry, contacts, campaigns } = proj;
  const css = fs.readFileSync([path.resolve(here, '../../brilliance-ui/brand/brilliance.css'), path.resolve(process.cwd(), '.claude/skills/brilliance-ui/brand/brilliance.css')].find(f => fs.existsSync(f)), 'utf8');
  const optedIn = contacts.filter(p => p.opted_in);
  const log = readLog();
  const HORIZON = 42;
  const upcoming = [];
  const warnings = [];
  for (const c of campaigns) {
    const aud = audienceOf(c, contacts);
    if (!aud.length && (c.status || 'active') === 'active') warnings.push(`"${c.name}" has no one in its audience yet.`);
    for (let i = 0; i < HORIZON; i++) {
      const day = new Date(TODAY.getTime() + i * DAY);
      const due = dueOn(c, day, aud);
      const bySteps = {};
      for (const d of due) (bySteps[d.step.id] ||= { step: d.step, people: [] }).people.push(d.person);
      for (const { step, people } of Object.values(bySteps)) {
        const sent = log.some(r => r.date === iso(day) && r.campaign === c.id && r.step === step.id);
        upcoming.push({ day, c, step, count: people.length, sample: people[0], sent });
      }
    }
    for (const st of c.steps) {
      const r = renderEmail(ministry, c, st, aud[0] || optedIn[0] || contacts[0], TODAY);
      if (r.unknown.length) warnings.push(`"${c.name}" uses unknown placeholder(s): ${r.unknown.map(u => `{{${u}}}`).join(', ')}`);
      if (r.subject.length > 70) warnings.push(`"${c.name}": the subject "${r.subject}" is long; phones cut it off after about 40–60 characters.`);
    }
  }
  upcoming.sort((a, b) => a.day - b.day || a.c.name.localeCompare(b.c.name));
  const next30 = upcoming.filter(u => (u.day - TODAY) / DAY < 30).reduce((a, u) => a + u.count, 0);
  const groupCounts = {};
  optedIn.forEach(p => (p.groups.length ? p.groups : ['(no group)']).forEach(g => (groupCounts[g] = (groupCounts[g] || 0) + 1)));
  const typeLabel = { once: 'One-time', weekly: 'Weekly', before_event: 'Event series', after_joining: 'Welcome series', birthday: 'Birthday' };
  const audienceText = c => {
    const g = c.audience?.groups || ['*'];
    const base = g.includes('*') ? 'Everyone who gets email' : g.join(', ');
    const ex = c.audience?.exclude_groups?.length ? ` (not ${c.audience.exclude_groups.join(', ')})` : '';
    return base + ex + (c.audience?.language ? ` · ${c.audience.language} speakers` : '');
  };

  const campaignCards = campaigns.map((c, n) => {
    const aud = audienceOf(c, contacts);
    const sample = aud[0] || optedIn[0];
    const status = c.status || 'active';
    return `<article class="card campaign">
      <span class="card-num">${String(n + 1).padStart(2, '0')}</span>
      <span class="card-tag">${esc(typeLabel[c.schedule?.type] || 'Campaign')}${status !== 'active' ? ` · ${esc(status)}` : ''}</span>
      <div class="card-bar"></div>
      <h3 class="card-title">${esc(c.name)}</h3>
      <dl class="facts">
        <dt>Who</dt><dd>${esc(audienceText(c))} <strong>(${aud.length} ${aud.length === 1 ? 'person' : 'people'})</strong></dd>
        <dt>When</dt><dd>${esc(scheduleText(c))}</dd>
        <dt>From</dt><dd>${esc((c.sender || ministry.sender || {}).name || ministry.name)}</dd>
      </dl>
      <div class="steps">
        ${c.steps.map(st => {
          const next = upcoming.find(u => u.c === c && u.step === st);
          const r = sample ? renderEmail(ministry, c, st, next?.sample || sample, next?.day || TODAY) : null;
          return `<details class="step"><summary><span class="step-when">${esc(st.days_before !== undefined ? (st.days_before ? `${st.days_before} days before` : 'Day of') : st.days_after !== undefined ? (st.days_after ? `Day ${st.days_after}` : 'Day they join') : 'Email')}</span> ${esc(r ? r.subject : st.subject)}</summary>
            ${r ? `<p class="hint">Preview for ${esc(sample.full_name)}${r.preheader ? ` · preview text: “${esc(r.preheader)}”` : ''}</p><iframe class="preview" title="Email preview" srcdoc="${esc(r.html)}" loading="lazy"></iframe>` : '<p class="hint">No one to preview for yet.</p>'}
          </details>`;
        }).join('')}
      </div>
    </article>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Email Control Center | ${esc(ministry.name)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Cormorant+Garamond:ital,wght@0,400..600;1,400..600&family=DM+Sans:ital,opsz,wght@0,9..40,300..700;1,9..40,300..700&display=swap">
<style>
${css}
.demo-banner { padding: 12px var(--gutter); background: var(--black); color: var(--on-dark); font-size: 14px; letter-spacing: 0.04em; }
.demo-banner strong { color: var(--orange); letter-spacing: 0.12em; text-transform: uppercase; font-size: 12px; margin-right: 10px; }
.cc-hero { padding: 64px var(--gutter) 40px; }
.cc-hero .hero-title { font-size: clamp(56px, 8vw, 120px); }
.campaigns { grid-template-columns: repeat(2, 1fr); }
.facts { display: grid; grid-template-columns: 64px 1fr; gap: 6px 12px; margin: 0 0 20px; font-size: 15px; }
.facts dt { font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--muted); padding-top: 3px; }
.facts dd { margin: 0; }
.step { border-top: 1px solid var(--border); padding: 12px 0; }
.step summary { cursor: pointer; font-weight: 500; }
.step-when { display: inline-block; min-width: 118px; margin-right: 8px; font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--accent-ink); }
.preview { width: 100%; height: 560px; margin-top: 12px; border: 1px solid var(--border-mid); background: #EDEAE2; }
.when { white-space: nowrap; }
.sent-badge { border-color: var(--green); color: var(--green-ink); background: var(--green-dim); }
.how ol { padding-left: 22px; } .how li { margin-bottom: 10px; }
.warn { padding: 16px 20px; margin-bottom: 32px; border-left: 4px solid var(--orange); background: var(--orange-dim); font-size: 15px; }
@media (max-width: 900px) { .campaigns { grid-template-columns: 1fr; } }
</style></head>
<body>
<div class="demo-banner"><strong>Demo mode</strong>Nothing here sends real email. “Sent” emails are saved in the outbox folder so you can open them.</div>
<nav class="site-nav" aria-label="Main">
  <span class="nav-wordmark">${esc(ministry.name)}<span>.</span></span>
  <ul class="nav-links"><li><a href="#upcoming">Coming Up</a></li><li><a href="#campaigns">Campaigns</a></li><li><a href="#outbox">Outbox</a></li><li><a href="#people">People</a></li></ul>
  <span class="nav-cta" style="background:var(--bg-alt);color:var(--ink);border-color:var(--border-mid)">Today: ${esc(short(TODAY))}</span>
</nav>
<main>
  <header class="cc-hero">
    <p class="hero-eyebrow">Church Communications</p>
    <h1 class="hero-title">Email Control Center</h1>
    <p class="hero-subtext">Every campaign, who it goes to, and when, in one place. Updated ${esc(nice(TODAY))}.</p>
  </header>
  <section class="section" style="padding-top:0;padding-bottom:48px">
    ${warnings.length ? `<div class="warn"><strong>Worth a look:</strong><ul style="margin:8px 0 0;padding-left:20px">${warnings.map(w => `<li>${esc(w)}</li>`).join('')}</ul></div>` : ''}
    <div class="kpi-grid">
      <div class="kpi"><p class="kpi-label">People who get email</p><p class="kpi-value">${optedIn.length}</p><p class="kpi-delta">${contacts.length - optedIn.length} opted out, never emailed</p></div>
      <div class="kpi"><p class="kpi-label">Active campaigns</p><p class="kpi-value">${campaigns.filter(c => (c.status || 'active') === 'active').length}</p><p class="kpi-delta">${campaigns.length} total</p></div>
      <div class="kpi"><p class="kpi-label">Emails in next 30 days</p><p class="kpi-value">${next30}</p><p class="kpi-delta">across ${new Set(upcoming.filter(u => (u.day - TODAY) / DAY < 30).map(u => iso(u.day))).size} send days</p></div>
      <div class="kpi"><p class="kpi-label">“Sent” so far (demo)</p><p class="kpi-value">${log.length}</p><p class="kpi-delta">${log.length ? `last on ${esc(short(parseDay(log[log.length - 1].date)))}` : 'nothing yet'}</p></div>
    </div>
  </section>

  <section class="section section--alt" id="upcoming">
    <div class="section-inner">
      <div class="display-head"><h2 class="display-title">Coming<br>Up</h2><span class="display-aside">Next ${HORIZON / 7} weeks</span></div>
      ${upcoming.length ? `<div style="overflow-x:auto"><table class="table">
        <thead><tr><th>When</th><th>Campaign</th><th>Email</th><th class="num">Recipients</th><th></th></tr></thead>
        <tbody>${upcoming.map(u => `<tr><td class="when">${esc(short(u.day))}${u.c.schedule?.time ? ` · ${esc(u.c.schedule.time)}` : ''}</td><td>${esc(u.c.name)}</td><td>${esc(renderEmail(ministry, u.c, u.step, u.sample, u.day).subject)}</td><td class="num">${u.count}</td><td>${u.sent ? '<span class="badge sent-badge">✓ Sent</span>' : ''}</td></tr>`).join('')}</tbody>
      </table></div>` : '<p class="muted">Nothing scheduled in the next few weeks.</p>'}
    </div>
  </section>

  <section class="section" id="campaigns">
    <div class="section-inner">
      <div class="display-head"><h2 class="display-title">Campaigns</h2><span class="display-aside">Click an email to preview it</span></div>
      ${campaigns.length ? `<div class="card-grid campaigns">${campaignCards}</div>` : '<p class="muted">No campaigns yet.</p>'}
    </div>
  </section>

  <section class="section section--alt" id="outbox">
    <div class="section-inner">
      <div class="display-head"><h2 class="display-title">Outbox</h2><span class="display-aside">What the automation has “sent” (demo)</span></div>
      ${log.length ? `<div style="overflow-x:auto"><table class="table">
        <thead><tr><th>Date</th><th>To</th><th>Subject</th><th>Campaign</th></tr></thead>
        <tbody>${log.slice(-60).reverse().map(r => `<tr><td class="when">${esc(short(parseDay(r.date)))} · ${esc(r.time)}</td><td>${esc(r.to_name)}<br><span class="muted" style="font-size:13px">${esc(r.to_email)}</span></td><td><a href="${esc(r.file)}">${esc(r.subject)}</a></td><td>${esc(r.campaign)}</td></tr>`).join('')}</tbody>
      </table></div>${log.length > 60 ? `<p class="hint" style="margin-top:12px">Showing the latest 60 of ${log.length}. Everything is listed in send-log.csv.</p>` : ''}` : '<p class="muted">Nothing sent yet. Run the automation to see emails appear here.</p>'}
    </div>
  </section>

  <section class="section" id="people">
    <div class="section-inner grid-2">
      <div>
        <p class="eyebrow">Audience</p>
        <h2 class="section-title">Groups</h2>
        <table class="table" style="margin-top:32px"><thead><tr><th>Group</th><th class="num">People</th></tr></thead>
        <tbody>${Object.entries(groupCounts).sort((a, b) => b[1] - a[1]).map(([g, n]) => `<tr><th scope="row">${esc(g)}</th><td class="num">${n}</td></tr>`).join('')}</tbody></table>
      </div>
      <div class="how">
        <p class="eyebrow">How It Works</p>
        <h2 class="section-title">The<br>Automation</h2>
        <ol style="margin-top:32px">
          <li>Every morning the helper checks each campaign's schedule against today's date.</li>
          <li>For each email that's due, it picks the right people (by group, skipping anyone who opted out) and fills in their name.</li>
          <li>It “sends” each one (in this demo, it saves it to the outbox) and writes it in the log, so no one gets the same email twice.</li>
          <li>In real life, the last step would hand the emails to your email service (e.g. Mailchimp, Planning Center, Constant Contact, or Gmail), and a computer schedule would run it each morning.</li>
        </ol>
      </div>
    </div>
  </section>
</main>
<footer class="site-footer"><div class="footer-bottom"><p>${esc(ministry.name)} · Email control center (class demo)</p><p>Made with Claude</p></div></footer>
</body></html>`;
  fs.writeFileSync(path.join(P, 'control-center.html'), html);
  return { upcoming, warnings, next30, optedIn: optedIn.length, contacts: contacts.length };
}

// ------------------------------------------------------------------ main ----
try {
  if (cmd === 'reset') {
    fs.rmSync(path.join(P, 'outbox'), { recursive: true, force: true });
    fs.rmSync(logPath, { force: true });
    const proj = loadProject();
    buildControlCenter(proj);
    console.log('Outbox and send log cleared.');
    process.exit(0);
  }
  const proj = loadProject();
  if (cmd === 'preview') {
    const r = buildControlCenter(proj);
    console.log(`Control center: ${path.join(P, 'control-center.html')}`);
    console.log(`  ${r.contacts} contacts (${r.optedIn} receive email) · ${proj.campaigns.length} campaigns · ${r.next30} emails in the next 30 days`);
    for (const u of r.upcoming.slice(0, 12)) console.log(`  ${iso(u.day)}  ${u.c.name} › ${u.step.id} → ${u.count} ${u.count === 1 ? "person" : "people"}`);
    if (r.warnings.length) console.log('  Warnings:\n   - ' + r.warnings.join('\n   - '));
  } else if (cmd === 'run') {
    const rows = runDay(proj, TODAY);
    buildControlCenter(proj);
    console.log(rows.length ? `${iso(TODAY)}: "sent" ${rows.length} emails (saved in outbox/${iso(TODAY)}/)` : `${iso(TODAY)}: nothing due today.`);
    const by = {}; rows.forEach(r => (by[`${r.campaign} › ${r.step}`] = (by[`${r.campaign} › ${r.step}`] || 0) + 1));
    for (const [k, n] of Object.entries(by)) console.log(`  ${k}: ${n}`);
  } else if (cmd === 'simulate') {
    const days = +(flag('days') || 28);
    let total = 0;
    console.log(`Pretending ${days} days pass, starting ${iso(TODAY)}. Each morning the automation runs:`);
    for (let i = 0; i < days; i++) {
      const day = new Date(TODAY.getTime() + i * DAY);
      const rows = runDay(proj, day);
      total += rows.length;
      if (rows.length) {
        const by = {}; rows.forEach(r => (by[r.campaign] = (by[r.campaign] || 0) + 1));
        console.log(`  ${short(day).padEnd(12)} ${Object.entries(by).map(([k, n]) => `${k} (${n})`).join(', ')}`);
      }
    }
    buildControlCenter(proj);
    console.log(`Done: ${total} emails "sent" into outbox/. Control center updated.`);
  } else {
    console.error(`Unknown command "${cmd}". Use preview, run, simulate, or reset.`);
    process.exit(1);
  }
} catch (e) {
  console.error('Problem: ' + e.message);
  process.exit(1);
}
