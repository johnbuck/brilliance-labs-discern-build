#!/usr/bin/env node
// Look inside every spreadsheet in a folder and describe what's there.
//
//   node scan.mjs <folder> [--json out.json]
//
// For each file and sheet it finds the header row, then reports every column:
// its name, what kind of values it holds (date / money / number / text), how many
// are filled in, and a few examples. Claude reads this to decide how each file
// should feed the dashboard (see dashboard.config.json in SKILL.md).

import fs from 'node:fs';
import path from 'node:path';
import { readTables, profileTable } from './lib.mjs';

const [, , folder, ...rest] = process.argv;
if (!folder) { console.error('Usage: node scan.mjs <folder> [--json out.json]'); process.exit(1); }
if (!fs.existsSync(folder)) { console.error(`Folder not found: ${folder}`); process.exit(1); }

const tables = readTables(folder);
if (!tables.length) { console.log(`No spreadsheets (.xlsx, .xls, .csv) found in ${folder}`); process.exit(0); }

const profiles = tables.map(profileTable);
for (const p of profiles) {
  console.log(`\n■ ${p.file}${p.sheet ? `  [sheet: ${p.sheet}]` : ''}`);
  if (p.error) { console.log(`  Could not read: ${p.error}`); continue; }
  console.log(`  ${p.rows} data rows · header on row ${p.headerRow}${p.dateRange ? ` · dates ${p.dateRange[0]} → ${p.dateRange[1]}` : ''}`);
  for (const c of p.columns) {
    const extra = c.kind === 'money' || c.kind === 'number' ? ` · total ${c.sum.toLocaleString('en-US', { maximumFractionDigits: 0 })}` :
      c.kind === 'text' && c.distinct <= 25 ? ` · ${c.distinct} distinct: ${c.top.join(' | ')}` :
      c.kind === 'text' ? ` · ${c.distinct} distinct` : '';
    console.log(`  - "${c.name}": ${c.kind} (${c.filled}/${p.rows} filled)${extra}   e.g. ${c.examples.join(', ')}`);
  }
}
const jsonIdx = rest.indexOf('--json');
if (jsonIdx >= 0 && rest[jsonIdx + 1]) {
  fs.writeFileSync(rest[jsonIdx + 1], JSON.stringify(profiles, null, 2));
  console.log(`\nSaved details to ${rest[jsonIdx + 1]}`);
}
