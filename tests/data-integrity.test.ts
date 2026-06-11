// Invariants over the real league data in src/data/. These complement
// scripts/validate-data.mjs (the pre-commit schema check) with the product
// rules the pages rely on, and pin a few independently verified anchor dates
// so accidental data edits fail loudly.
import { describe, expect, it } from 'vitest';
import { clockStartMs, leagues, neverWon, reigningChamp } from '../src/lib/droughts';

const HEX = /^#[0-9A-Fa-f]{6}$/;
const ISO = /^\d{4}-\d{2}-\d{2}$/;

const EXPECTED_TEAM_COUNTS: Record<string, number> = {
  nfl: 32,
  nba: 30,
  mlb: 30,
  nhl: 32,
  mls: 30,
  wnba: 15,
  nwsl: 16,
  pwhl: 8,
  epl: 20,
  laliga: 20,
  bundesliga: 18,
  seriea: 20,
  ligue1: 18,
  wsl: 14,
  ligaf: 16,
  frauenbundesliga: 14,
};

describe('league registry shape', () => {
  it('contains the expected leagues with full rosters', () => {
    expect(Object.fromEntries(leagues.map((l) => [l.slug, l.teams.length]))).toEqual(
      EXPECTED_TEAM_COUNTS,
    );
  });

  it('declares finals names and update stamps', () => {
    for (const league of leagues) {
      expect(league.finalsName.length, league.slug).toBeGreaterThan(3);
      expect(league.updated, league.slug).toMatch(ISO);
    }
  });
});

describe('every team', () => {
  const allTeams = leagues.flatMap((l) => l.teams.map((t) => ({ league: l, t })));

  it('has required display fields and valid colors', () => {
    for (const { league, t } of allTeams) {
      const id = `${league.slug}/${t.slug}`;
      expect(t.name, id).toBeTruthy();
      expect(t.shortName, id).toBeTruthy();
      expect(t.abbr, id).toBeTruthy();
      expect(t.accent, id).toMatch(HEX);
      expect(t.secondary, id).toMatch(HEX);
      if (t.accentLight) expect(t.accentLight, id).toMatch(HEX);
    }
  });

  it('has a coherent title history or never-won record', () => {
    for (const { league, t } of allTeams) {
      const id = `${league.slug}/${t.slug}`;
      if (t.lastTitle) {
        expect(t.lastTitle.date, id).toMatch(ISO);
        // A title clinched outside a championship game carries a clinch
        // sentence instead of opponent/series.
        if (!t.lastTitle.clinch) {
          expect(t.lastTitle.opponent, id).toBeTruthy();
          expect(t.lastTitle.series, id).toBeTruthy();
        }
        expect(t.titleYears.length, id).toBeGreaterThan(0);
        // Title games can be played early the following year (Super Bowls).
        const dateYear = Number(t.lastTitle.date.slice(0, 4));
        const finalYear = t.titleYears.at(-1) as number;
        expect([finalYear, finalYear + 1], id).toContain(dateYear);
      } else {
        expect(t.firstGame, id).toMatch(ISO);
        expect(t.titleYears, id).toEqual([]);
      }
    }
  });

  it('starts every clock in the past', () => {
    for (const { league, t } of allTeams) {
      expect(clockStartMs(t), `${league.slug}/${t.slug}`).toBeLessThan(Date.now());
    }
  });

  it('has unique slugs and abbreviations within its league', () => {
    for (const league of leagues) {
      const slugs = league.teams.map((t) => t.slug);
      const abbrs = league.teams.map((t) => t.abbr);
      expect(new Set(slugs).size, league.slug).toBe(slugs.length);
      expect(new Set(abbrs).size, league.slug).toBe(abbrs.length);
    }
  });
});

describe('reigning champions', () => {
  it('crowns exactly one current champion per league', () => {
    const champs = Object.fromEntries(
      leagues.map((l) => [l.slug, reigningChamp(l.teams)?.slug]),
    );
    expect(champs).toEqual({
      nfl: 'seattle-seahawks',
      nba: 'oklahoma-city-thunder',
      mlb: 'los-angeles-dodgers',
      nhl: 'florida-panthers',
      mls: 'inter-miami-cf',
      wnba: 'las-vegas-aces',
      nwsl: 'nj-ny-gotham-fc',
      pwhl: 'montreal-victoire',
      epl: 'arsenal',
      laliga: 'barcelona',
      bundesliga: 'bayern-munich',
      seriea: 'inter-milan',
      ligue1: 'paris-saint-germain',
      wsl: 'manchester-city',
      ligaf: 'barcelona',
      frauenbundesliga: 'bayern-munich',
    });
  });

  it('never crowns a never-won team', () => {
    for (const league of leagues) {
      const champ = reigningChamp(league.teams);
      expect(champ && neverWon(champ), league.slug).toBe(false);
    }
  });
});

// Clinching dates verified against box scores during the build; if one of
// these fails, a data edit changed history rather than adding to it.
describe('anchor dates', () => {
  const ANCHORS: Array<[string, string, string]> = [
    ['nfl', 'arizona-cardinals', '1947-12-28'],
    ['nfl', 'seattle-seahawks', '2026-02-08'],
    ['nba', 'sacramento-kings', '1951-04-21'],
    ['nba', 'new-york-knicks', '1973-05-10'],
    ['nba', 'oklahoma-city-thunder', '2025-06-22'],
    ['mlb', 'cleveland-guardians', '1948-10-11'],
    ['mlb', 'los-angeles-dodgers', '2025-11-01'],
    ['nhl', 'toronto-maple-leafs', '1967-05-02'],
    ['wnba', 'las-vegas-aces', '2025-10-10'],
    ['nwsl', 'nj-ny-gotham-fc', '2025-11-22'],
    ['mls', 'inter-miami-cf', '2025-12-06'],
    ['pwhl', 'montreal-victoire', '2026-05-20'],
    ['epl', 'newcastle-united', '1927-04-30'],
    ['epl', 'sunderland', '1936-04-13'],
    ['epl', 'nottingham-forest', '1978-04-22'],
    ['epl', 'arsenal', '2026-05-19'],
    ['laliga', 'real-betis', '1935-04-28'],
    ['laliga', 'sevilla', '1946-03-31'],
    ['laliga', 'barcelona', '2026-05-10'],
    ['bundesliga', 'eintracht-frankfurt', '1959-06-28'],
    ['bundesliga', 'hamburger-sv', '1983-06-04'],
    ['bundesliga', 'bayern-munich', '2026-04-19'],
    ['seriea', 'genoa', '1924-09-07'],
    ['seriea', 'bologna', '1964-06-07'],
    ['seriea', 'inter-milan', '2026-05-03'],
    ['ligue1', 'nice', '1959-05-24'],
    ['ligue1', 'strasbourg', '1979-06-01'],
    ['ligue1', 'paris-saint-germain', '2026-05-13'],
    ['wsl', 'charlton-athletic', '2000-05-06'],
    ['wsl', 'arsenal', '2019-04-28'],
    ['wsl', 'manchester-city', '2026-05-06'],
    ['ligaf', 'espanyol', '2006-04-09'],
    ['ligaf', 'athletic-club', '2016-06-05'],
    ['ligaf', 'barcelona', '2026-04-22'],
    ['frauenbundesliga', 'eintracht-frankfurt', '2008-06-15'],
    ['frauenbundesliga', 'wolfsburg', '2022-05-08'],
    ['frauenbundesliga', 'bayern-munich', '2026-04-22'],
  ];

  it.each(ANCHORS)('%s/%s last title on %s', (leagueSlug, teamSlug, date) => {
    const league = leagues.find((l) => l.slug === leagueSlug);
    const team = league?.teams.find((t) => t.slug === teamSlug);
    expect(team?.lastTitle?.date).toBe(date);
  });
});
