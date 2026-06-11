import { type League, type Team, leagueRef, neverWon, clockStartIso, yearOf } from './droughts';

// Things that have happened since a team last won. Labels read as items in
// "Since then: X, Y, and Z."
const EVENTS: Array<[string, string]> = [
  ['1955-07-17', 'Disneyland opened'],
  ['1957-10-04', 'Sputnik launched'],
  ['1961-04-12', 'the first human reached space'],
  ['1969-07-20', 'humans walked on the Moon'],
  ['1977-05-25', 'Star Wars premiered'],
  ['1981-08-01', 'MTV went on the air'],
  ['1989-11-09', 'the Berlin Wall fell'],
  ['1991-08-06', 'the World Wide Web went public'],
  ['1994-09-22', 'Friends premiered'],
  ['2001-10-23', 'the iPod was unveiled'],
  ['2004-02-04', 'Facebook launched'],
  ['2005-02-14', 'YouTube launched'],
  ['2007-06-29', 'the first iPhone went on sale'],
  ['2009-01-03', 'Bitcoin mined its first block'],
  ['2010-10-06', 'Instagram launched'],
  ['2018-08-02', 'TikTok went global'],
  ['2022-11-30', 'ChatGPT launched'],
];

const PRESIDENCIES: string[] = [
  '1945-04-12', '1953-01-20', '1961-01-20', '1963-11-22', '1969-01-20',
  '1974-08-09', '1977-01-20', '1981-01-20', '1989-01-20', '1993-01-20',
  '2001-01-20', '2009-01-20', '2017-01-20', '2021-01-20', '2025-01-20',
];

// Per-league icons, sorted by birth date; the first one born after the title
// date is the punchline.
const PEOPLE: Record<string, Array<[string, string]>> = {
  nba: [
    ['1963-02-17', 'Michael Jordan'],
    ['1984-12-30', 'LeBron James'],
    ['1988-03-14', 'Stephen Curry'],
    ['1999-02-28', 'Luka Dončić'],
    ['2004-01-04', 'Victor Wembanyama'],
  ],
  nfl: [
    ['1977-08-03', 'Tom Brady'],
    ['1995-09-17', 'Patrick Mahomes'],
  ],
  mlb: [
    ['1974-06-26', 'Derek Jeter'],
    ['1994-07-05', 'Shohei Ohtani'],
  ],
  nhl: [
    ['1961-01-26', 'Wayne Gretzky'],
    ['1997-01-13', 'Connor McDavid'],
  ],
  wnba: [
    ['1972-07-07', 'Lisa Leslie'],
    ['2002-01-22', 'Caitlin Clark'],
  ],
  mls: [
    ['1982-03-04', 'Landon Donovan'],
    ['1987-06-24', 'Lionel Messi'],
  ],
  nwsl: [
    ['1989-07-02', 'Alex Morgan'],
    ['2000-08-10', 'Sophia Smith'],
  ],
  epl: [
    ['1970-08-13', 'Alan Shearer'],
    ['1975-05-02', 'David Beckham'],
    ['1985-10-24', 'Wayne Rooney'],
    ['1993-07-28', 'Harry Kane'],
    ['2001-09-05', 'Bukayo Saka'],
  ],
  laliga: [
    ['1947-04-25', 'Johan Cruyff'],
    ['1977-06-27', 'Raúl'],
    ['1987-06-24', 'Lionel Messi'],
    ['2007-07-13', 'Lamine Yamal'],
  ],
  bundesliga: [
    ['1945-09-11', 'Franz Beckenbauer'],
    ['1961-03-21', 'Lothar Matthäus'],
    ['1989-09-13', 'Thomas Müller'],
    ['2003-02-26', 'Jamal Musiala'],
  ],
  seriea: [
    ['1943-08-18', 'Gianni Rivera'],
    ['1967-02-18', 'Roberto Baggio'],
    ['1976-09-27', 'Francesco Totti'],
    ['1999-02-25', 'Gianluigi Donnarumma'],
  ],
  ligue1: [
    ['1955-06-21', 'Michel Platini'],
    ['1972-06-23', 'Zinédine Zidane'],
    ['1977-08-17', 'Thierry Henry'],
    ['1998-12-20', 'Kylian Mbappé'],
  ],
  wsl: [
    ['1978-10-29', 'Kelly Smith'],
    ['1991-10-28', 'Lucy Bronze'],
    ['2001-09-29', 'Lauren James'],
  ],
  ligaf: [
    ['1994-02-04', 'Alexia Putellas'],
    ['1998-01-18', 'Aitana Bonmatí'],
    ['2006-07-26', 'Vicky López'],
  ],
  frauenbundesliga: [
    ['1977-10-25', 'Birgit Prinz'],
    ['1991-04-06', 'Alexandra Popp'],
    ['2001-12-19', 'Lena Oberdorf'],
  ],
  'seriea-femminile': [
    ['1964-02-05', 'Carolina Morace'],
    ['1975-02-08', 'Patrizia Panico'],
    ['1990-04-23', 'Cristiana Girelli'],
  ],
};

/** Season end-year of the season currently in progress (or just finished). */
function currentSeasonEndYear(now: Date): number {
  return now.getUTCMonth() >= 9 ? now.getUTCFullYear() + 1 : now.getUTCFullYear();
}

function spread<T>(items: T[], max: number): T[] {
  if (items.length <= max) return items;
  const picks = [0];
  for (let i = 1; i < max - 1; i++) picks.push(Math.round((items.length - 1) * (i / (max - 1))));
  picks.push(items.length - 1);
  return [...new Set(picks)].map((i) => items[i]);
}

function listOut(labels: string[]): string {
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(', ')}, and ${labels.at(-1)}`;
}

/** "the Super Bowl" → "Super Bowl", for mid-sentence use like "Super Bowl losses". */
function finalsShort(league: League): string {
  return league.finalsName.replace(/^the /, '');
}

/**
 * Fan-pain facts for a team page, computed from the drought start date.
 * Returns short sentences for the "In the meantime" panel.
 */
export function factsFor(team: Team, league: League, now: Date = new Date()): string[] {
  const since = clockStartIso(team);
  const noun = league.competitionNoun ?? league.league;
  const facts: string[] = [];

  if (neverWon(team)) {
    facts.push(`The ${team.shortName} have never won it all. This clock has been running since their first ${noun} game.`);
    if (team.asterisk?.years.length) {
      const plural = team.asterisk.years.length === 1 ? 'title' : 'titles';
      const ref = leagueRef(league);
      facts.push(`They did win ${team.asterisk.years.length} ${team.asterisk.label} ${plural} (${team.asterisk.years.join(', ')}). ${ref[0].toUpperCase()}${ref.slice(1)} doesn't count those. Neither does the pain.`);
    }
    if (team.finalsLosses?.length) {
      facts.push(`Closest calls: ${finalsShort(league)} losses in ${listOut(team.finalsLosses.map(String))}.`);
    } else if (!team.asterisk?.years.length) {
      facts.push(`They have never even reached ${league.finalsName}.`);
    }
  }

  const seasons = currentSeasonEndYear(now) - yearOf(since);
  if (seasons >= 2) {
    facts.push(`That's ${seasons} ${noun} seasons of waiting.`);
  }

  const eventsSince = EVENTS.filter(([d]) => d > since);
  if (eventsSince.length > 0) {
    facts.push(`Since then: ${listOut(spread(eventsSince, 3).map(([, label]) => label))}.`);
  }

  const presidencies = PRESIDENCIES.filter((d) => d > since).length;
  if (presidencies >= 2) {
    facts.push(`${presidencies} U.S. presidencies have started.`);
  }

  const notYetBorn = (PEOPLE[league.slug] ?? []).find(([dob]) => dob > since);
  if (notYetBorn) {
    const years = yearOf(notYetBorn[0]) - yearOf(since);
    facts.push(
      years >= 2
        ? `${notYetBorn[1]} wouldn't be born for another ${years} years.`
        : `${notYetBorn[1]} hadn't been born yet.`,
    );
  }

  return facts;
}
