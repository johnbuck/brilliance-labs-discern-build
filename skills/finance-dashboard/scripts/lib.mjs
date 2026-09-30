// Shared helpers: read spreadsheets, find headers, parse money and dates.
import fs from 'node:fs';
import path from 'node:path';
import * as XLSX from 'xlsx';

XLSX.set_fs(fs);

const SHEET_EXT = /\.(xlsx|xlsm|xls|csv|tsv|ods)$/i;

/** Every sheet of every spreadsheet in a folder (not recursive), as arrays of rows. */
export function readTables(folder) {
  const files = fs.readdirSync(folder)
    .filter(f => SHEET_EXT.test(f) && !f.startsWith('~$') && !f.startsWith('.'))
    .sort();
  const out = [];
  for (const file of files) {
    try {
      const wb = XLSX.readFile(path.join(folder, file), { cellDates: true });
      const multi = wb.SheetNames.length > 1;
      for (const sheet of wb.SheetNames) {
        const aoa = XLSX.utils.sheet_to_json(wb.Sheets[sheet], { header: 1, raw: true, defval: null, blankrows: false });
        if (aoa.length) out.push({ file, sheet: multi || !/\.(csv|tsv)$/i.test(file) ? sheet : null, aoa });
      }
    } catch (e) {
      out.push({ file, sheet: null, aoa: [], error: e.message });
    }
  }
  return out;
}

/** Turn "$1,234.56", "(45.00)", "1.234,00 €", 12 into a number, or null. */
export function parseMoney(v) {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (v instanceof Date) return null;
  let s = String(v).trim();
  if (!s) return null;
  const neg = /^\(.*\)$/.test(s) || /^-/.test(s) || /-$/.test(s);
  s = s.replace(/[()\s$€£¥₹]|USD|CAD|EUR|GBP/gi, '').replace(/-/g, '');
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, '').replace(',', '.'); // 1.234,56
  else s = s.replace(/,/g, '');
  if (!/^\d*\.?\d+$/.test(s)) return null;
  const n = parseFloat(s);
  return neg ? -n : n;
}

/** Turn a Date, Excel serial, "1/5/2026", "2026-01-05", "Jan 5, 2026" into a UTC Date, or null. */
export function parseDate(v) {
  if (v === null || v === undefined || v === '') return null;
  if (v instanceof Date) {
    if (isNaN(v)) return null;
    // SheetJS gives local-midnight dates; normalise to the calendar day in UTC
    const d = new Date(Date.UTC(v.getFullYear(), v.getMonth(), v.getDate()));
    return v.getHours() >= 12 ? new Date(d.getTime() + 864e5) : d;
  }
  if (typeof v === 'number') {
    if (v > 20000 && v < 80000) return new Date(Date.UTC(1899, 11, 30) + v * 864e5); // Excel serial
    return null;
  }
  const s = String(v).trim();
  let m;
  if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) return new Date(Date.UTC(+m[1], m[2] - 1, +m[3]));
  if ((m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/))) {
    let y = +m[3]; if (y < 100) y += 2000;
    return new Date(Date.UTC(y, m[1] - 1, +m[2])); // assume US month/day
  }
  if (/[a-z]{3}/i.test(s) && /\d{4}/.test(s)) {
    const d = new Date(s + ' UTC');
    if (!isNaN(d)) return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }
  return null;
}

export const isoDay = d => d.toISOString().slice(0, 10);

/** The header is the first row (of the first 15) whose cells are mostly short text and
 *  that is followed by rows of data. Title rows like "Expense Ledger Q1" are skipped. */
export function findHeaderRow(aoa) {
  let best = 0, bestScore = -1;
  for (let i = 0; i < Math.min(15, aoa.length - 1); i++) {
    const row = aoa[i] || [];
    const cells = row.filter(c => c !== null && c !== '');
    const texty = cells.filter(c => typeof c === 'string' && c.length < 40 && parseMoney(c) === null && !parseDate(c)).length;
    const next = (aoa[i + 1] || []).filter(c => c !== null && c !== '').length;
    const score = texty >= 2 && next >= Math.min(2, texty) ? texty * 10 - i : -1;
    if (score > bestScore) { bestScore = score; best = i; }
  }
  return best;
}

/** Rows below the header as objects keyed by header name. Stops at the first fully blank row
 *  followed by a "Total" style row, and drops obvious total rows. */
export function toRecords(aoa, headerRow = findHeaderRow(aoa)) {
  const header = (aoa[headerRow] || []).map((h, i) => (h === null || h === '' ? `Column ${i + 1}` : String(h).trim()));
  const records = [];
  for (const row of aoa.slice(headerRow + 1)) {
    if (!row || row.every(c => c === null || c === '')) continue;
    const first = row.find(c => c !== null && c !== '');
    if (typeof first === 'string' && /^(grand\s+)?totals?\b/i.test(first.trim())) continue;
    const rec = {};
    header.forEach((h, i) => { rec[h] = row[i] ?? null; });
    records.push(rec);
  }
  return { header, records };
}

function kindOf(values) {
  const vals = values.filter(v => v !== null && v !== '');
  if (!vals.length) return 'empty';
  const dates = vals.filter(v => v instanceof Date || (typeof v === 'string' && parseDate(v))).length;
  if (dates / vals.length > 0.8) return 'date';
  const money = vals.filter(v => typeof v === 'string' && /[$€£]|^\(?-?[\d,]+\.\d{2}\)?$/.test(v.trim()) && parseMoney(v) !== null).length;
  const nums = vals.filter(v => typeof v === 'number' || parseMoney(v) !== null).length;
  if (nums / vals.length > 0.8) {
    const decimals = vals.filter(v => typeof v === 'number' && !Number.isInteger(v)).length;
    const idLike = vals.every(v => typeof v === 'number' && Number.isInteger(v)) && new Set(vals).size < vals.length * 0.9 && Math.max(...vals) < 100000 && Math.min(...vals) > 999;
    if (idLike) return 'id';
    return money || decimals ? 'money' : 'number';
  }
  return 'text';
}

/** Summary of one table for the scan report. */
export function profileTable(t) {
  if (t.error) return { file: t.file, sheet: t.sheet, error: t.error };
  const headerRow = findHeaderRow(t.aoa);
  const { header, records } = toRecords(t.aoa, headerRow);
  let dateMin = null, dateMax = null;
  const columns = header.map(name => {
    const values = records.map(r => r[name]);
    const kind = kindOf(values);
    const filled = values.filter(v => v !== null && v !== '').length;
    const col = { name, kind, filled };
    const fmt = v => v instanceof Date ? isoDay(parseDate(v)) : String(v).slice(0, 30);
    col.examples = [...new Set(values.filter(v => v !== null && v !== '').map(fmt))].slice(0, 3);
    if (kind === 'money' || kind === 'number') col.sum = values.reduce((a, v) => a + (parseMoney(v) || 0), 0);
    if (kind === 'text' || kind === 'id') {
      const counts = {};
      values.forEach(v => { if (v !== null && v !== '') counts[v] = (counts[v] || 0) + 1; });
      col.distinct = Object.keys(counts).length;
      col.top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k]) => k);
    }
    if (kind === 'date') {
      for (const v of values) {
        const d = parseDate(v); if (!d) continue;
        if (!dateMin || d < dateMin) dateMin = d;
        if (!dateMax || d > dateMax) dateMax = d;
      }
    }
    return col;
  });
  return {
    file: t.file, sheet: t.sheet, headerRow: headerRow + 1, rows: records.length, columns,
    dateRange: dateMin ? [isoDay(dateMin), isoDay(dateMax)] : null,
  };
}
