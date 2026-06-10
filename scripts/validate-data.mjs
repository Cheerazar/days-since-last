// Validates every league JSON in src/data/. Run: node scripts/validate-data.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dir = 'src/data';
const HEX = /^#[0-9A-Fa-f]{6}$/;
const ISO = /^\d{4}-\d{2}-\d{2}$/;
let failures = 0;

const fail = (file, msg) => {
  failures++;
  console.error(`✗ ${file}: ${msg}`);
};

for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
  let data;
  try {
    data = JSON.parse(readFileSync(join(dir, file), 'utf8'));
  } catch (e) {
    fail(file, `unparseable JSON: ${e.message}`);
    continue;
  }

  for (const key of ['league', 'slug', 'finalsName', 'updated', 'teams']) {
    if (!data[key]) fail(file, `missing top-level "${key}"`);
  }
  // Banners are news; every one needs an expiry date so it can't go stale.
  if (data.banner && !data.bannerUntil) fail(file, 'banner without bannerUntil');
  if (data.bannerUntil && !ISO.test(data.bannerUntil)) {
    fail(file, `bad bannerUntil: ${data.bannerUntil}`);
  }
  // Smallest current league is the 8-team PWHL.
  if (!Array.isArray(data.teams) || data.teams.length < 6) {
    fail(file, `suspicious team count: ${data.teams?.length}`);
    continue;
  }

  const slugs = new Set();
  for (const t of data.teams) {
    const id = t.slug ?? t.name ?? '?';
    for (const key of ['slug', 'name', 'shortName', 'abbr', 'accent', 'secondary']) {
      if (!t[key]) fail(file, `${id}: missing "${key}"`);
    }
    if (slugs.has(t.slug)) fail(file, `duplicate slug ${t.slug}`);
    slugs.add(t.slug);
    for (const c of ['accent', 'secondary', 'accentLight']) {
      if (t[c] && !HEX.test(t[c])) fail(file, `${id}: bad hex in ${c}: ${t[c]}`);
    }
    if (!Array.isArray(t.titleYears)) fail(file, `${id}: titleYears must be an array`);

    if (t.lastTitle === null) {
      if (!t.firstGame || !ISO.test(t.firstGame)) fail(file, `${id}: never-won needs valid firstGame`);
      if (t.titleYears.length) fail(file, `${id}: never-won but titleYears non-empty`);
      if (t.firstGame && Date.parse(t.firstGame) > Date.now()) fail(file, `${id}: firstGame in the future`);
    } else if (t.lastTitle) {
      const { date, opponent, series, clinch } = t.lastTitle;
      if (!date || !ISO.test(date)) fail(file, `${id}: bad lastTitle.date: ${date}`);
      // League-format titles can be clinched via a draw, a loss, or another
      // team's result — then a clinch sentence stands in for opponent/series.
      if (!clinch && (!opponent || !series)) fail(file, `${id}: lastTitle needs opponent/series or clinch`);
      if (!t.titleYears.length) fail(file, `${id}: has lastTitle but empty titleYears`);
      const dateYear = Number(date?.slice(0, 4));
      const lastYear = t.titleYears.at(-1);
      // Title games can be played early the following year (Super Bowls).
      if (dateYear !== lastYear && dateYear !== lastYear + 1) {
        fail(file, `${id}: lastTitle.date year ${dateYear} doesn't match final titleYears entry ${lastYear}`);
      }
      if (Date.parse(date) > Date.now()) fail(file, `${id}: lastTitle.date in the future`);
    } else {
      fail(file, `${id}: lastTitle must be an object or null`);
    }
  }
  if (!failures) console.log(`✓ ${file}: ${data.teams.length} teams OK`);
}

process.exit(failures ? 1 : 0);
