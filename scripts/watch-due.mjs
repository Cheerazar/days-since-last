// The free gate in front of the auto-maintenance agent. Reads every league in
// src/data/ and prints those whose `watch` window contains the target date (US
// Eastern), one per line as "<slug> <kind>". Empty output means no result is
// possible today, so the scheduled workflow exits without spending a token.
//
//   node scripts/watch-due.mjs                 # today (America/New_York)
//   node scripts/watch-due.mjs --date 2026-06-13
//
// Output is also written to $GITHUB_OUTPUT as `due<<EOF…` when present, so the
// workflow can branch on it.
import { readFileSync, readdirSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = 'src/data';

// Resolve the target month-day in US Eastern (the day boundary the site uses).
const arg = process.argv.indexOf('--date');
let mmdd;
if (arg !== -1) {
  mmdd = process.argv[arg + 1]?.slice(5); // "YYYY-MM-DD" → "MM-DD"
} else {
  // en-CA gives YYYY-MM-DD; take the MM-DD tail in the Eastern zone.
  mmdd = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    month: '2-digit',
    day: '2-digit',
  })
    .format(new Date())
    .replace('/', '-');
}

if (!/^\d{2}-\d{2}$/.test(mmdd ?? '')) {
  console.error(`bad --date (need YYYY-MM-DD): ${process.argv[arg + 1]}`);
  process.exit(2);
}

// Inclusive month-day range; supports windows that wrap past year-end.
const inWindow = (today, from, until) =>
  from <= until ? today >= from && today <= until : today >= from || today <= until;

const due = [];
for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
  const data = JSON.parse(readFileSync(join(dir, file), 'utf8'));
  for (const w of data.watch ?? []) {
    if (inWindow(mmdd, w.from, w.until)) due.push(`${data.slug} ${w.kind}`);
  }
}

const out = [...new Set(due)].sort();
for (const line of out) console.log(line);

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `due<<EOF\n${out.join('\n')}\nEOF\n`);
}
