import { describe, expect, it } from 'vitest';
import {
  DAY_MS,
  type Team,
  byDrought,
  clockStartIso,
  clockStartMs,
  daysSince,
  formatDate,
  getLeague,
  leagues,
  neverWon,
  reigningChamp,
  worstDrought,
  yearOf,
} from './droughts';

const team = (overrides: Partial<Team>): Team => ({
  slug: 'test-team',
  name: 'Test Team',
  shortName: 'Test',
  abbr: 'TST',
  accent: '#FFFFFF',
  secondary: '#000000',
  titleYears: [],
  lastTitle: null,
  ...overrides,
});

const champion = (slug: string, date: string): Team =>
  team({
    slug,
    titleYears: [yearOf(date)],
    lastTitle: { date, opponent: 'Opponent', series: '4–1', asName: null },
  });

const expansion = (slug: string, firstGame: string): Team => team({ slug, firstGame });

describe('clock start', () => {
  it('uses the last title date for champions', () => {
    const t = champion('champ', '2024-06-17');
    expect(clockStartIso(t)).toBe('2024-06-17');
  });

  it('uses the first game for never-won teams', () => {
    const t = expansion('newbie', '2026-03-14');
    expect(neverWon(t)).toBe(true);
    expect(clockStartIso(t)).toBe('2026-03-14');
  });

  it('anchors to midnight US Eastern, not UTC', () => {
    // Midnight ET = 05:00 UTC for the fixed -05:00 offset the site uses.
    expect(clockStartMs(champion('c', '2024-06-17'))).toBe(Date.parse('2024-06-17T05:00:00Z'));
  });
});

describe('daysSince', () => {
  const epoch = Date.parse('2024-06-17T05:00:00Z');

  it('counts whole days only', () => {
    expect(daysSince(epoch, epoch + DAY_MS - 1)).toBe(0);
    expect(daysSince(epoch, epoch + DAY_MS)).toBe(1);
    expect(daysSince(epoch, epoch + 365 * DAY_MS)).toBe(365);
  });

  it('clamps to zero when the clock starts in the future', () => {
    expect(daysSince(epoch, epoch - 1)).toBe(0);
  });
});

describe('byDrought', () => {
  it('sorts longest-suffering first', () => {
    const sorted = byDrought([
      champion('recent', '2024-06-17'),
      champion('ancient', '1951-04-21'),
      expansion('newbie', '2026-03-14'),
    ]);
    expect(sorted.map((t) => t.slug)).toEqual(['ancient', 'recent', 'newbie']);
  });

  it('does not mutate the input', () => {
    const input = [champion('a', '2024-06-17'), champion('b', '1951-04-21')];
    byDrought(input);
    expect(input[0].slug).toBe('a');
  });
});

describe('reigningChamp', () => {
  // Regression: a brand-new expansion team's clock (first game) can start
  // after the champion's title date — it must NOT be crowned by sort order.
  it('ignores expansion teams whose clock starts after the title', () => {
    const teams = [
      champion('gotham', '2025-11-22'),
      expansion('denver-summit', '2026-03-14'),
      expansion('boston-legacy', '2026-03-14'),
    ];
    expect(reigningChamp(teams)?.slug).toBe('gotham');
  });

  it('picks the most recent title among multiple champions', () => {
    const teams = [champion('old', '2014-06-15'), champion('new', '2025-06-22')];
    expect(reigningChamp(teams)?.slug).toBe('new');
  });

  it('returns undefined when nobody has won', () => {
    expect(reigningChamp([expansion('a', '2020-01-01')])).toBeUndefined();
  });
});

describe('formatDate', () => {
  it('formats without timezone off-by-one', () => {
    expect(formatDate('2024-06-17')).toBe('June 17, 2024');
    expect(formatDate('1951-04-21')).toBe('April 21, 1951');
  });
});

describe('league registry', () => {
  it('loads every league in display order', () => {
    expect(leagues.map((l) => l.slug)).toEqual([
      'nfl',
      'nba',
      'mlb',
      'nhl',
      'mls',
      'wnba',
      'nwsl',
      'pwhl',
      'epl',
    ]);
  });

  it('finds leagues by slug', () => {
    expect(getLeague('nba')?.league).toBe('NBA');
    expect(getLeague('nope')).toBeUndefined();
  });

  it('crowns Newcastle with the longest wait on the site', () => {
    const { league, team: worst } = worstDrought();
    expect(league.slug).toBe('epl');
    expect(worst.slug).toBe('newcastle-united');
    expect(worst.lastTitle?.date).toBe('1927-04-30');
  });
});
