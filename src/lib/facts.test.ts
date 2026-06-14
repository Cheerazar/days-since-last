import { describe, expect, it } from 'vitest';
import { type League, type Team, getLeague } from './droughts';
import { factsFor } from './facts';

// Pin "now" so season math is deterministic: June 10, 2026.
const NOW = new Date('2026-06-10T12:00:00Z');

const teamIn = (leagueSlug: string, teamSlug: string): { team: Team; league: League } => {
  const league = getLeague(leagueSlug);
  if (!league) throw new Error(`no league ${leagueSlug}`);
  const team = league.teams.find((t) => t.slug === teamSlug);
  if (!team) throw new Error(`no team ${teamSlug}`);
  return { team, league };
};

describe('factsFor — champions of the past', () => {
  it('builds a deep-drought panel exactly as the site shows it', () => {
    const { team, league } = teamIn('nba', 'atlanta-hawks');
    const facts = factsFor(team, league, NOW);
    expect(facts).toContain("That's 68 NBA seasons of waiting.");
    expect(facts).toContain('13 U.S. presidencies have started.');
    expect(facts).toContain("Michael Jordan wouldn't be born for another 5 years.");
    expect(facts.some((f) => f.startsWith('Since then:'))).toBe(true);
  });

  it('picks the earliest-born person after the title date', () => {
    const { team, league } = teamIn('nba', 'sacramento-kings');
    const facts = factsFor(team, league, NOW);
    expect(facts).toContain("Michael Jordan wouldn't be born for another 12 years.");
  });

  it('spans the event list from first to last for long droughts', () => {
    const { team, league } = teamIn('nba', 'sacramento-kings');
    const since = factsFor(team, league, NOW).find((f) => f.startsWith('Since then:'));
    expect(since).toContain('Disneyland opened');
    expect(since).toContain('ChatGPT launched');
  });

  it('keeps recent champions humble but factual', () => {
    const { team, league } = teamIn('nba', 'boston-celtics');
    const facts = factsFor(team, league, NOW);
    expect(facts).toContain("That's 2 NBA seasons of waiting.");
    expect(facts.some((f) => f.includes('born'))).toBe(false);
  });
});

describe('factsFor — never-won teams', () => {
  it('leads with the never-won line and league-specific finals name', () => {
    const { team, league } = teamIn('nfl', 'minnesota-vikings');
    const facts = factsFor(team, league, NOW);
    expect(facts[0]).toBe(
      'The Vikings have never won it all. This clock has been running since their first NFL game.',
    );
    expect(facts).toContain('Closest calls: Super Bowl losses in 1969, 1973, 1974, and 1976.');
  });

  it('mentions predecessor-league titles via the asterisk', () => {
    const { team, league } = teamIn('nba', 'indiana-pacers');
    const facts = factsFor(team, league, NOW);
    expect(
      facts.some((f) => f.includes('3 ABA titles (1970, 1972, 1973)') && f.includes("doesn't count")),
    ).toBe(true);
  });

  it('calls out teams that never even reached the finals', () => {
    const { team, league } = teamIn('mlb', 'seattle-mariners');
    const facts = factsFor(team, league, NOW);
    expect(facts).toContain('They have never even reached the World Series.');
  });

  it('lists exactly two finals losses without an Oxford comma', () => {
    const { team, league } = teamIn('nba', 'utah-jazz');
    const facts = factsFor(team, league, NOW);
    expect(facts).toContain('Closest calls: Finals losses in 1997 and 1998.');
  });
});
