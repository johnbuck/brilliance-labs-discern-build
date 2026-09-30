#!/usr/bin/env node
// Build a one-page finance dashboard from the spreadsheets described in a config file.
//
//   node build.mjs <path/to/dashboard.config.json>
//
// Writes next to the config:
//   dashboard.html   the dashboard (open it in a browser)
//   summary.json     the key numbers, for Claude to read and write insights from
// If insights.json exists next to the config, its notes appear on the dashboard.
// See ../SKILL.md for the config format.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readTables, toRecords, findHeaderRow, parseMoney, parseDate, isoDay } from './lib.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const configPath = process.argv[2];
if (!configPath) { console.error('Usage: node build.mjs <dashboard.config.json>'); process.exit(1); }
const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const outDir = path.dirname(path.resolve(configPath));
const folder = path.resolve(outDir, cfg.folder);
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ------------------------------------------------------------ load sources --
const tables = readTables(folder);
const tx = [];           // { date, amount, role, category, person, method, payee, source }
const budget = [];       // { year, category, type, annual, monthly[12] }
const extraTables = [];  // { title, header, rows }
const notes = [];        // data-quality notes shown at the bottom

const matches = (t, s) => t.file === s.file && (!s.sheet || s.sheet === '*' || t.sheet === s.sheet);
const INCOME_WORDS = /income|revenue|deposit|credit|donation|gift|offering|receipt/i;

for (const s of cfg.sources) {
  const found = tables.filter(t => matches(t, s));
  if (!found.length) { notes.push(`Couldn't find ${s.file}${s.sheet ? ` (sheet ${s.sheet})` : ''}. Skipped.`); continue; }
  for (const t of found) {
    const { header, records } = toRecords(t.aoa, s.headerRow ? s.headerRow - 1 : findHeaderRow(t.aoa));
    const label = t.sheet ? `${t.file} › ${t.sheet}` : t.file;
    const col = name => {
      if (!name) return null;
      if (!header.includes(name)) notes.push(`${label}: column "${name}" not found.`);
      return name;
    };
    if (s.role === 'table') {
      extraTables.push({ title: s.title || t.sheet || t.file, header, rows: records.map(r => header.map(h => r[h])) });
      continue;
    }
    if (s.role === 'budget') {
      const cat = col(s.category), type = col(s.type), annual = col(s.annual);
      const months = (s.months || []).map(col);
      for (const r of records) {
        if (!r[cat]) continue;
        const monthly = months.length === 12 ? months.map(m => parseMoney(r[m]) || 0) : null;
        const a = annual ? parseMoney(r[annual]) : monthly ? monthly.reduce((x, y) => x + y, 0) : null;
        if (a === null) continue;
        const ty = type ? String(r[type] || '') : s.budgetType || 'Expense';
        budget.push({ year: s.year, category: String(r[cat]).trim(), type: INCOME_WORDS.test(ty) ? 'income' : 'expense', annual: a, monthly: monthly || Array(12).fill(a / 12) });
      }
      continue;
    }
    // income / expense / ledger
    const dateC = col(s.date), amtC = col(s.amount), catC = col(s.category);
    let skipped = 0;
    for (const r of records) {
      const date = parseDate(r[dateC]);
      let amount = parseMoney(r[amtC]);
      if (!date || amount === null) { skipped++; continue; }
      let role = s.role;
      if (role === 'ledger') {
        if (s.type) role = (s.incomeValues || []).includes(r[s.type]) || INCOME_WORDS.test(String(r[s.type] || '')) ? 'income' : 'expense';
        else role = amount >= 0 ? 'income' : 'expense';
      }
      tx.push({
        date, amount: Math.abs(amount), role,
        category: catC && r[catC] ? String(r[catC]).trim() : 'Uncategorized',
        person: s.person ? r[s.person] : null,
        method: s.method ? r[s.method] : null,
        payee: s.payee ? r[s.payee] : null,
        source: label,
      });
    }
    if (skipped) notes.push(`${label}: skipped ${skipped} row${skipped > 1 ? 's' : ''} without a readable date or amount.`);
  }
}
if (!tx.length) { console.error('No transactions were loaded. Check the config column names against scan.mjs output.'); process.exit(1); }

// ------------------------------------------------------------------ numbers --
const asOf = tx.reduce((m, t) => (t.date > m ? t.date : m), tx[0].date);
const Y = asOf.getUTCFullYear();
const cutoffPrior = new Date(Date.UTC(Y - 1, asOf.getUTCMonth(), asOf.getUTCDate()));
const inYTD = t => t.date.getUTCFullYear() === Y;
const inPriorYTD = t => t.date.getUTCFullYear() === Y - 1 && t.date <= cutoffPrior;
const sum = (arr, f = () => true) => arr.filter(f).reduce((a, t) => a + t.amount, 0);
const pct = (a, b) => (b ? (a - b) / b : null);

const income = tx.filter(t => t.role === 'income');
const expense = tx.filter(t => t.role === 'expense');
const hasPrior = tx.some(t => t.date.getUTCFullYear() === Y - 1);

const kpi = {
  asOf: isoDay(asOf), year: Y,
  incomeYTD: sum(income, inYTD), expenseYTD: sum(expense, inYTD),
  incomePriorYTD: hasPrior ? sum(income, inPriorYTD) : null,
  expensePriorYTD: hasPrior ? sum(expense, inPriorYTD) : null,
};
kpi.netYTD = kpi.incomeYTD - kpi.expenseYTD;
kpi.incomeChange = pct(kpi.incomeYTD, kpi.incomePriorYTD);
kpi.expenseChange = pct(kpi.expenseYTD, kpi.expensePriorYTD);
const gifts = income.filter(inYTD).filter(t => t.person !== null && t.person !== undefined);
if (gifts.length) {
  kpi.givers = new Set(gifts.map(t => t.person)).size;
  kpi.gifts = gifts.length;
  kpi.avgGift = sum(gifts) / gifts.length;
  const prior = income.filter(inPriorYTD).filter(t => t.person != null);
  if (prior.length) kpi.giversPrior = new Set(prior.map(t => t.person)).size;
}

// Monthly totals across the whole range
const first = tx.reduce((m, t) => (t.date < m ? t.date : m), tx[0].date);
const monthKeys = [];
for (let d = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), 1)); d <= asOf; d.setUTCMonth(d.getUTCMonth() + 1)) {
  monthKeys.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
}
const mk = t => isoDay(t.date).slice(0, 7);
const monthly = monthKeys.map(k => ({
  month: k, label: `${MONTHS[+k.slice(5) - 1]} ${k.slice(2, 4)}`,
  income: sum(income, t => mk(t) === k), expense: sum(expense, t => mk(t) === k),
}));

// Cumulative income, this year vs last year
const cumulative = (arr, year) => {
  let run = 0;
  return MONTHS.map((_, m) => {
    if (year === Y && m > asOf.getUTCMonth()) return null;
    run += sum(arr, t => t.date.getUTCFullYear() === year && t.date.getUTCMonth() === m);
    return run;
  });
};
const yoy = hasPrior ? { current: cumulative(income, Y), prior: cumulative(income, Y - 1) } : null;

// Categories (this year, with last year same period)
const byCat = arr => {
  const m = {};
  for (const t of arr.filter(inYTD)) m[t.category] = (m[t.category] || 0) + t.amount;
  const p = {};
  for (const t of arr.filter(inPriorYTD)) p[t.category] = (p[t.category] || 0) + t.amount;
  return Object.entries(m).sort((a, b) => b[1] - a[1]).map(([category, amount]) => ({ category, amount, prior: p[category] ?? null }));
};
const incomeCats = byCat(income), expenseCats = byCat(expense);

// Budget vs actual, year to date (budget pro-rated through today)
const dayOfYear = (asOf - Date.UTC(Y, 0, 1)) / 864e5 + 1;
const yearFraction = dayOfYear / (((Y % 4 === 0 && Y % 100) || Y % 400 === 0) ? 366 : 365);
const monthFraction = asOf.getUTCDate() / new Date(Date.UTC(Y, asOf.getUTCMonth() + 1, 0)).getUTCDate();
const budgetRows = budget.filter(b => !b.year || b.year === Y).map(b => {
  const m = asOf.getUTCMonth();
  const budgetYTD = b.monthly.slice(0, m).reduce((a, v) => a + v, 0) + b.monthly[m] * monthFraction;
  const actual = sum(b.type === 'income' ? income : expense, t => inYTD(t) && t.category.toLowerCase() === b.category.toLowerCase());
  const used = b.annual ? actual / b.annual : null;
  const ratio = budgetYTD ? actual / budgetYTD : null;
  let status = 'on track';
  if (!budgetYTD) status = actual ? (b.type === 'income' ? 'ahead' : 'over') : 'not yet';
  else if (b.type === 'expense' && ratio > 1.1) status = 'over';
  else if (b.type === 'income' && ratio < 0.9) status = 'behind';
  else if (b.type === 'income' && ratio > 1.1) status = 'ahead';
  else if (b.type === 'expense' && ratio < 0.75) status = 'under';
  return { ...b, budgetYTD, actual, used, ratio, status };
});
const budgetTotals = budgetRows.length ? ['income', 'expense'].map(type => {
  const rows = budgetRows.filter(r => r.type === type);
  return { type, annual: rows.reduce((a, r) => a + r.annual, 0), budgetYTD: rows.reduce((a, r) => a + r.budgetYTD, 0), actual: rows.reduce((a, r) => a + r.actual, 0) };
}) : [];

// Giving methods (share this year vs last)
let methods = null;
if (income.some(t => t.method)) {
  const share = f => {
    const arr = income.filter(f).filter(t => t.method);
    const total = sum(arr);
    const m = {};
    for (const t of arr) m[t.method] = (m[t.method] || 0) + t.amount;
    return Object.fromEntries(Object.entries(m).map(([k, v]) => [k, total ? v / total : 0]));
  };
  const cur = share(inYTD), pri = share(inPriorYTD);
  methods = Object.keys(cur).sort((a, b) => cur[b] - cur[a]).map(k => ({ method: k, share: cur[k], prior: pri[k] ?? null }));
}

// Biggest one-time expenses this year (skip payees paid most months, like payroll and utilities)
const payeeMonths = {};
for (const t of expense.filter(inYTD)) (payeeMonths[t.payee || t.category] ||= new Set()).add(t.date.getUTCMonth());
const recurring = k => payeeMonths[k] && payeeMonths[k].size >= Math.max(3, Math.ceil((asOf.getUTCMonth() + 1) / 2));
const topExpenses = expense.filter(inYTD).filter(t => !recurring(t.payee || t.category)).sort((a, b) => b.amount - a.amount).slice(0, 8)
  .map(t => ({ date: isoDay(t.date), payee: t.payee || '', category: t.category, amount: t.amount }));

const summary = {
  organization: cfg.organization, asOf: kpi.asOf, year: Y, yearElapsed: yearFraction,
  kpi, monthly, incomeByCategory: incomeCats, expenseByCategory: expenseCats,
  budget: budgetRows.map(({ monthly: _, ...r }) => r), budgetTotals, givingMethods: methods, topExpenses,
  cumulativeIncome: yoy, extraTables, notes,
  sources: [...new Set(tx.map(t => t.source))].map(s => ({ source: s, rows: tx.filter(t => t.source === s).length })),
};
fs.writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));

// ------------------------------------------------------------------- render --
const insightsPath = path.join(outDir, 'insights.json');
const insights = fs.existsSync(insightsPath) ? JSON.parse(fs.readFileSync(insightsPath, 'utf8')) : [];

const styleCss = (() => {
  if (cfg.style && cfg.style !== 'brilliance') return fs.readFileSync(path.resolve(outDir, cfg.style), 'utf8');
  // Works from the class folder, or from a copy of this script inside a project folder
  const candidates = [path.resolve(here, '../../brilliance-ui/brand/brilliance.css'), path.resolve(process.cwd(), '.claude/skills/brilliance-ui/brand/brilliance.css')];
  return fs.readFileSync(candidates.find(c => fs.existsSync(c)) || candidates[0], 'utf8');
})();

const esc = v => String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const cur = cfg.currency || 'USD';
const money = (n, compact = false) => n === null || n === undefined ? '—' :
  new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, maximumFractionDigits: compact ? 1 : 0, notation: compact && Math.abs(n) >= 10000 ? 'compact' : 'standard' }).format(n);
const pctFmt = (n, signed = true) => n === null || n === undefined ? '—' : `${signed && n > 0 ? '+' : ''}${(n * 100).toFixed(Math.abs(n) < 0.1 ? 1 : 0)}%`;
const delta = (ch, goodWhenUp = true, label = 'vs same time last year') => {
  if (ch === null || ch === undefined) return '';
  const good = goodWhenUp ? ch >= 0 : ch <= 0;
  return `<p class="kpi-delta ${good ? 'up' : 'down'}"><span aria-hidden="true">${ch >= 0 ? '▲' : '▼'}</span> ${pctFmt(ch)} ${label}</p>`;
};
const cell = v => v instanceof Date ? isoDay(parseDate(v)) : typeof v === 'number' ? v.toLocaleString('en-US') : esc(v);
const asOfLabel = asOf.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

const kpiTiles = [
  `<div class="kpi"><p class="kpi-label">Income ${Y} so far</p><p class="kpi-value">${money(kpi.incomeYTD, true)}</p>${delta(kpi.incomeChange, true)}</div>`,
  `<div class="kpi"><p class="kpi-label">Expenses ${Y} so far</p><p class="kpi-value">${money(kpi.expenseYTD, true)}</p>${delta(kpi.expenseChange, false)}</div>`,
  `<div class="kpi"><p class="kpi-label">Net (income − expenses)</p><p class="kpi-value">${money(kpi.netYTD, true)}</p><p class="kpi-delta ${kpi.netYTD >= 0 ? 'up' : 'down'}">${kpi.netYTD >= 0 ? 'Surplus' : 'Shortfall'} so far this year</p></div>`,
  kpi.givers ? `<div class="kpi"><p class="kpi-label">Giving households</p><p class="kpi-value">${kpi.givers}</p><p class="kpi-delta">${kpi.gifts.toLocaleString('en-US')} gifts · avg ${money(kpi.avgGift)}</p></div>` : '',
  budgetTotals.length ? (() => {
    const e = budgetTotals.find(b => b.type === 'expense');
    return e && e.annual ? `<div class="kpi"><p class="kpi-label">Expense budget used</p><p class="kpi-value">${pctFmt(e.actual / e.annual, false)}</p><p class="kpi-delta">${pctFmt(yearFraction, false)} of the year has passed</p></div>` : '';
  })() : '',
].join('');

const insightHtml = insights.length ? `
  <section class="section section--alt" aria-labelledby="insights-title">
    <div class="section-inner">
      <p class="eyebrow">What the Numbers Say</p>
      <h2 class="section-title" id="insights-title">Key<br>Takeaways</h2>
      <div class="card-grid insights" style="margin-top:48px">
        ${insights.map((i, n) => `<article class="card insight insight--${esc(i.tone || 'info')}"><span class="card-num">${String(n + 1).padStart(2, '0')}</span><span class="card-tag">${esc({ good: 'Good news', watch: 'Keep an eye on', info: 'Worth knowing' }[i.tone] || 'Worth knowing')}</span><h3 class="card-title">${esc(i.title)}</h3><p class="card-body">${esc(i.text)}</p></article>`).join('')}
      </div>
    </div>
  </section>` : '';

const barRow = (label, value, max, extra = '') => `<tr><th scope="row">${esc(label)}</th><td class="num">${money(value)}</td>${extra}</tr>`;
const tableToggle = (id, head, rows) => `<details class="table-view"><summary>Show as a table</summary><table class="table" id="${id}"><thead><tr>${head.map((h, i) => `<th${i ? ' class="num"' : ''}>${h}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></details>`;

const budgetHtml = budgetRows.length ? `
  <section class="section" aria-labelledby="budget-title">
    <div class="section-inner">
      <div class="display-head">
        <h2 class="display-title" id="budget-title">Budget<br>vs Actual</h2>
        <span class="display-aside">${Y} through ${asOfLabel} · ${pctFmt(yearFraction, false)} of the year</span>
      </div>
      ${['income', 'expense'].map(type => {
        const rows = budgetRows.filter(r => r.type === type);
        if (!rows.length) return '';
        return `<h3 class="panel-title" style="margin-top:32px">${type === 'income' ? 'Income' : 'Expenses'}</h3>
        <table class="table budget-table">
          <thead><tr><th>Category</th><th class="num">Budget (year)</th><th class="num">Budget so far</th><th class="num">Actual so far</th><th class="bar-col">Share of year's budget used</th><th>Status</th></tr></thead>
          <tbody>${rows.map(r => `<tr>
            <th scope="row">${esc(r.category)}</th>
            <td class="num">${money(r.annual)}</td><td class="num">${money(r.budgetYTD)}</td><td class="num">${money(r.actual)}</td>
            <td class="bar-col"><div class="meter" role="img" aria-label="${pctFmt(r.used, false)} of annual budget used">
              <span class="meter-fill meter-fill--${r.status.replace(' ', '-')}" style="width:${Math.min(100, (r.used || 0) * 100).toFixed(1)}%"></span>
              <span class="meter-mark" style="left:${(yearFraction * 100).toFixed(1)}%" title="Where you'd be if spending were even through the year"></span>
            </div><span class="meter-label">${pctFmt(r.used, false)}</span></td>
            <td><span class="badge ${r.status === 'over' || r.status === 'behind' ? 'badge--watch' : r.status === 'ahead' ? 'badge--green' : ''}">${r.status === 'over' || r.status === 'behind' ? '⚠ ' : ''}${esc(r.status)}</span></td>
          </tr>`).join('')}</tbody>
        </table>`;
      }).join('')}
      <p class="hint" style="margin-top:16px">The thin black line in each bar marks how far through the year we are. A bar past the line means that category is running ahead of its budget.</p>
    </div>
  </section>` : '';

const methodHtml = methods ? `
  <div class="panel">
    <h3 class="panel-title">How People Give</h3>
    <table class="table"><thead><tr><th>Method</th><th class="num">${Y}</th>${hasPrior ? `<th class="num">${Y - 1} same period</th>` : ''}</tr></thead>
    <tbody>${methods.map(m => `<tr><th scope="row">${esc(m.method)}</th><td class="num">${pctFmt(m.share, false)}</td>${hasPrior ? `<td class="num">${pctFmt(m.prior, false)}</td>` : ''}</tr>`).join('')}</tbody></table>
  </div>` : '';

const topExpHtml = topExpenses.length ? `
  <div class="panel">
    <h3 class="panel-title">Largest One-Time Expenses · ${Y}</h3>
    <table class="table"><thead><tr><th>Date</th><th>Paid to</th><th class="num">Amount</th></tr></thead>
    <tbody>${topExpenses.map(t => `<tr><td>${t.date}</td><td>${esc(t.payee || t.category)}<br><span class="muted" style="font-size:13px">${esc(t.category)}</span></td><td class="num">${money(t.amount)}</td></tr>`).join('')}</tbody></table>
  </div>` : '';

const extraHtml = extraTables.map(t => `
  <section class="section section--alt">
    <div class="section-inner">
      <p class="eyebrow">Also in This Folder</p>
      <h2 class="section-title">${esc(t.title)}</h2>
      <div style="overflow-x:auto;margin-top:40px"><table class="table">
        <thead><tr>${t.header.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
        <tbody>${t.rows.map(r => `<tr>${r.map(v => `<td${typeof v === 'number' ? ' class="num"' : ''}>${cell(v)}</td>`).join('')}</tr>`).join('')}</tbody>
      </table></div>
    </div>
  </section>`).join('');

const chartData = {
  monthly, yoy, Y,
  incomeCats: incomeCats.slice(0, 8), expenseCats: expenseCats.slice(0, 10), currency: cur,
};

const fileCount = new Set(tx.map(t => t.source.split(' › ')[0])).size + extraTables.length;
const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(cfg.title || 'Finance Dashboard')} | ${esc(cfg.organization || '')}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Cormorant+Garamond:ital,wght@0,400..600;1,400..600&family=DM+Sans:ital,opsz,wght@0,9..40,300..700;1,9..40,300..700&display=swap">
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.5.1/chart.umd.min.js"></script>
<style>
${styleCss}
/* ---- dashboard additions ---- */
.viz-root {
  color-scheme: light;
  --series-1: #3d5ed2;  /* income  (validated palette, see SKILL.md) */
  --series-2: #E8860F;  /* expenses */
  --series-prior: #9a968d;
  --grid: rgba(13,13,13,0.08);
  --text-secondary: rgba(13,13,13,0.64);
}
.dash-hero { padding: 72px var(--gutter) 48px; border-bottom: 1px solid var(--border); }
.dash-hero .hero-title { font-size: clamp(56px, 8vw, 120px); }
.dash-meta { display: flex; flex-wrap: wrap; gap: 8px 24px; margin-top: 20px; font-size: 14px; color: var(--muted); }
.charts { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: var(--border); border: 1px solid var(--border); }
.charts .panel { border: 0; }
.chart-wide { grid-column: 1 / -1; }
.chart-box { position: relative; height: 320px; }
.chart-box--tall { height: 380px; }
.legend { display: flex; gap: 20px; margin: -8px 0 16px; font-size: 14px; color: var(--muted); }
.legend span::before { content: ''; display: inline-block; width: 12px; height: 12px; margin-right: 8px; vertical-align: -1px; background: var(--c); }
.legend .dashed::before { height: 0; border-top: 2px dashed var(--c); background: none; vertical-align: 3px; }
.table-view { margin-top: 16px; font-size: 14px; }
.table-view summary { cursor: pointer; color: var(--accent-ink); font-weight: 500; }
.table-view .table { margin-top: 12px; }
.bar-col { width: 28%; min-width: 180px; }
.meter { position: relative; display: inline-block; width: calc(100% - 56px); height: 12px; background: var(--bg-alt); vertical-align: middle; }
.meter-fill { position: absolute; inset: 0 auto 0 0; background: var(--series-1); border-radius: 0 4px 4px 0; }
.meter-fill--over, .meter-fill--behind { background: var(--orange); }
.meter-mark { position: absolute; top: -4px; bottom: -4px; width: 2px; background: var(--black); }
.meter-label { display: inline-block; width: 48px; margin-left: 8px; font-size: 13px; font-variant-numeric: tabular-nums; }
.badge--watch { border-color: var(--orange); color: var(--orange-ink); background: var(--orange-dim); }
.insight--watch { --card-fill: var(--orange); --card-ink: var(--orange-ink); }
.insight--good { --card-fill: var(--green); --card-ink: var(--green-ink); }
.insight .card-title { font-size: clamp(24px, 2.2vw, 32px); }
.side-panels { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: var(--border); border: 1px solid var(--border); margin-top: 48px; }
.side-panels .panel { border: 0; }
.notes li { font-size: 14px; color: var(--muted); }
@media (max-width: 900px) { .charts, .side-panels { grid-template-columns: 1fr; } .chart-wide { grid-column: auto; } }
@media print { .table-view { display: none; } }
</style>
</head>
<body class="viz-root">
<nav class="site-nav" aria-label="Main">
  <span class="nav-wordmark">${esc(cfg.organization || 'Finances')}<span>.</span></span>
  <ul class="nav-links"><li><a href="#overview">Overview</a></li><li><a href="#trends">Trends</a></li>${budgetRows.length ? '<li><a href="#budget-title">Budget</a></li>' : ''}${insights.length ? '<li><a href="#insights-title">Takeaways</a></li>' : ''}</ul>
  <span class="nav-cta" style="background:var(--bg-alt);color:var(--ink);border-color:var(--border-mid)">As of ${esc(asOfLabel)}</span>
</nav>
<main>
  <header class="dash-hero" id="overview">
    <p class="hero-eyebrow">${esc(cfg.subtitle || 'Finance Dashboard')}</p>
    <h1 class="hero-title">${esc(cfg.title || 'Our Finances')}</h1>
    <div class="dash-meta"><span>Data through <strong>${esc(asOfLabel)}</strong></span><span>${fileCount} file${fileCount > 1 ? 's' : ''} · ${tx.length.toLocaleString('en-US')} transactions</span><span>Built from the spreadsheets in <em>${esc(path.basename(folder))}</em></span></div>
  </header>

  <section class="section" style="padding-top:48px;padding-bottom:48px">
    <div class="kpi-grid">${kpiTiles}</div>
  </section>

  ${insightHtml}

  <section class="section" id="trends" aria-labelledby="trends-title" style="padding-top:64px">
    <div class="section-inner">
      <div class="display-head"><h2 class="display-title" id="trends-title">Money In,<br>Money Out</h2><span class="display-aside">Hover any bar or point for exact amounts</span></div>
      <div class="charts">
        <div class="panel chart-wide">
          <h3 class="panel-title">Each Month</h3>
          <div class="legend"><span style="--c:var(--series-1)">Income</span><span style="--c:var(--series-2)">Expenses</span></div>
          <div class="chart-box"><canvas id="monthly" aria-label="Monthly income and expenses bar chart" role="img"></canvas></div>
          ${tableToggle('t-monthly', ['Month', 'Income', 'Expenses', 'Net'], monthly.map(m => `<tr><td>${m.label}</td><td class="num">${money(m.income)}</td><td class="num">${money(m.expense)}</td><td class="num">${money(m.income - m.expense)}</td></tr>`).join(''))}
        </div>
        ${yoy ? `<div class="panel chart-wide">
          <h3 class="panel-title">Giving So Far: ${Y} vs ${Y - 1}</h3>
          <div class="legend"><span style="--c:var(--series-1)">${Y}</span><span class="dashed" style="--c:var(--series-prior)">${Y - 1}</span></div>
          <div class="chart-box"><canvas id="yoy" aria-label="Cumulative income this year compared with last year" role="img"></canvas></div>
          ${tableToggle('t-yoy', ['Through', String(Y), String(Y - 1)], MONTHS.map((m, i) => `<tr><td>${m}</td><td class="num">${money(yoy.current[i])}</td><td class="num">${money(yoy.prior[i])}</td></tr>`).join(''))}
        </div>` : ''}
        <div class="panel">
          <h3 class="panel-title">Income by Fund · ${Y}</h3>
          <div class="chart-box"><canvas id="incCats" aria-label="Income by category" role="img"></canvas></div>
          ${tableToggle('t-inc', ['Category', `${Y} so far`, `${Y - 1} same period`], incomeCats.map(c => `<tr><td>${esc(c.category)}</td><td class="num">${money(c.amount)}</td><td class="num">${money(c.prior)}</td></tr>`).join(''))}
        </div>
        <div class="panel">
          <h3 class="panel-title">Expenses by Category · ${Y}</h3>
          <div class="chart-box"><canvas id="expCats" aria-label="Expenses by category" role="img"></canvas></div>
          ${tableToggle('t-exp', ['Category', `${Y} so far`, `${Y - 1} same period`], expenseCats.map(c => `<tr><td>${esc(c.category)}</td><td class="num">${money(c.amount)}</td><td class="num">${money(c.prior)}</td></tr>`).join(''))}
        </div>
      </div>
      ${methodHtml || topExpHtml ? `<div class="side-panels">${methodHtml}${topExpHtml}</div>` : ''}
    </div>
  </section>

  ${budgetHtml}
  ${extraHtml}

  <section class="section" style="padding-top:48px">
    <div class="section-inner">
      <h2 class="panel-title">About This Data</h2>
      <ul class="notes">
        ${summary.sources.map(s => `<li>${esc(s.source)}: ${s.rows.toLocaleString('en-US')} rows</li>`).join('')}
        ${notes.map(n => `<li>${esc(n)}</li>`).join('')}
        <li>"Same period last year" compares ${Y} through ${esc(asOfLabel)} with ${Y - 1} through the same date.</li>
      </ul>
    </div>
  </section>
</main>
<footer class="site-footer"><div class="footer-bottom"><p>${esc(cfg.organization || '')} · Finance dashboard built ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p><p>Made with Claude</p></div></footer>

<script>
const D = ${JSON.stringify(chartData)};
const css = n => getComputedStyle(document.body).getPropertyValue(n).trim();
const fmt = (n, compact) => n == null ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency: D.currency, maximumFractionDigits: compact ? 0 : 0, notation: compact ? 'compact' : 'standard' }).format(n);
if (window.Chart) {
  Chart.defaults.font.family = css('--body') || 'DM Sans, sans-serif';
  Chart.defaults.font.size = 13;
  Chart.defaults.color = css('--text-secondary');
  Chart.defaults.plugins.legend.display = false;   // HTML legends above each chart
  Chart.defaults.plugins.tooltip.backgroundColor = '#0D0D0D';
  Chart.defaults.plugins.tooltip.padding = 12;
  Chart.defaults.plugins.tooltip.cornerRadius = 0;
  Chart.defaults.plugins.tooltip.callbacks.label = c => ' ' + (c.dataset.label ? c.dataset.label + ': ' : '') + fmt(c.parsed.y ?? c.parsed.x);
  const grid = { color: css('--grid'), drawTicks: false };
  const money = { callback: v => fmt(v, true), padding: 8 };

  // Value labels at the end of horizontal bars (selective direct labels)
  const endLabels = { id: 'endLabels', afterDatasetsDraw(chart) {
    const { ctx } = chart; ctx.save();
    ctx.font = '500 12px ' + Chart.defaults.font.family; ctx.fillStyle = css('--ink'); ctx.textBaseline = 'middle';
    chart.getDatasetMeta(0).data.forEach((bar, i) => ctx.fillText(fmt(chart.data.datasets[0].data[i], true), bar.x + 6, bar.y));
    ctx.restore();
  } };

  new Chart(document.getElementById('monthly'), {
    type: 'bar',
    data: { labels: D.monthly.map(m => m.label), datasets: [
      { label: 'Income', data: D.monthly.map(m => m.income), backgroundColor: css('--series-1'), borderRadius: { topLeft: 4, topRight: 4 }, borderSkipped: 'bottom', categoryPercentage: 0.7, barPercentage: 0.9 },
      { label: 'Expenses', data: D.monthly.map(m => m.expense), backgroundColor: css('--series-2'), borderRadius: { topLeft: 4, topRight: 4 }, borderSkipped: 'bottom', categoryPercentage: 0.7, barPercentage: 0.9 },
    ] },
    options: { maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
      scales: { x: { grid: { display: false } }, y: { grid, border: { display: false }, ticks: money, beginAtZero: true } } },
  });

  if (D.yoy) new Chart(document.getElementById('yoy'), {
    type: 'line',
    data: { labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'], datasets: [
      { label: String(D.Y), data: D.yoy.current, borderColor: css('--series-1'), backgroundColor: css('--series-1'), borderWidth: 2, pointRadius: 4, pointHoverRadius: 6, tension: 0.25 },
      { label: String(D.Y - 1), data: D.yoy.prior, borderColor: css('--series-prior'), backgroundColor: css('--series-prior'), borderWidth: 2, borderDash: [6, 4], pointRadius: 0, pointHoverRadius: 5, tension: 0.25 },
    ] },
    options: { maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
      scales: { x: { grid: { display: false } }, y: { grid, border: { display: false }, ticks: money, beginAtZero: true } } },
  });

  const hbar = (id, rows, color) => new Chart(document.getElementById(id), {
    type: 'bar', plugins: [endLabels],
    data: { labels: rows.map(r => r.category), datasets: [{ label: '', data: rows.map(r => r.amount), backgroundColor: color, borderRadius: { topRight: 4, bottomRight: 4 }, borderSkipped: 'left', barPercentage: 0.75 }] },
    options: { indexAxis: 'y', maintainAspectRatio: false, layout: { padding: { right: 64 } },
      scales: { x: { display: false, beginAtZero: true }, y: { grid: { display: false }, border: { display: false }, ticks: { color: css('--ink') } } } },
  });
  hbar('incCats', D.incomeCats, css('--series-1'));
  hbar('expCats', D.expenseCats, css('--series-2'));
} else {
  document.querySelectorAll('.chart-box').forEach(b => b.innerHTML = '<p class="hint">Charts need an internet connection. The tables below each chart have the same numbers.</p>');
  document.querySelectorAll('details.table-view').forEach(d => d.open = true);
}
</script>
</body>
</html>`;
fs.writeFileSync(path.join(outDir, 'dashboard.html'), html);

console.log(`Built ${path.join(outDir, 'dashboard.html')}`);
console.log(`  ${tx.length} transactions from ${fileCount} files · data through ${kpi.asOf}`);
console.log(`  ${Y} so far: income ${money(kpi.incomeYTD)}, expenses ${money(kpi.expenseYTD)}, net ${money(kpi.netYTD)}`);
if (kpi.incomeChange !== null) console.log(`  vs same period ${Y - 1}: income ${pctFmt(kpi.incomeChange)}, expenses ${pctFmt(kpi.expenseChange)}`);
const flagged = budgetRows.filter(r => r.status === 'over' || r.status === 'behind');
if (flagged.length) console.log(`  Budget flags: ${flagged.map(r => `${r.category} (${r.type}) ${r.status}`).join('; ')}`);
if (notes.length) console.log(`  Notes: ${notes.join(' | ')}`);
console.log(`  Key numbers saved to ${path.join(outDir, 'summary.json')}${insights.length ? ` · ${insights.length} insights included` : ' · no insights.json yet'}`);
