export interface LastTitle {
  date: string;
  /** Null only when the title wasn't decided in a game the team played (see clinch). */
  opponent: string | null;
  series: string | null;
  asName: string | null;
  /**
   * For titles not won in a championship game — e.g. league-format titles
   * clinched via a draw, a loss, or another team's result. Rendered in place
   * of "beat the {opponent}, {series}".
   */
  clinch?: string;
}

export interface Asterisk {
  /** Predecessor-league label, e.g. "ABA", "AAFC". */
  label: string;
  years: number[];
}

export interface Team {
  slug: string;
  name: string;
  shortName: string;
  abbr: string;
  accent: string;
  /** Official-palette alternate for light backgrounds, where accent is too pale. */
  accentLight?: string;
  secondary: string;
  titleYears: number[];
  lastTitle: LastTitle | null;
  firstGame?: string;
  firstGameAs?: string | null;
  firstGameNote?: string;
  finalsLosses?: number[];
  asterisk?: Asterisk;
  lineage?: string;
}

export interface League {
  league: string;
  slug: string;
  /** How the championship round is referred to, e.g. "the Finals", "the Super Bowl". */
  finalsName: string;
  /**
   * Noun for "first {noun} game" / "{noun} seasons" copy when the competition
   * predates the league's current name (e.g. "top-flight" for the Premier
   * League, whose history runs back through the First Division). Defaults to
   * the league name.
   */
  competitionNoun?: string;
  updated: string;
  banner?: string;
  teams: Team[];
}

// Every JSON in src/data/ is a league. Drop a new file in and it appears in
// the nav, homepage, routes, and OG images on the next build.
const modules = import.meta.glob('../data/*.json', { eager: true }) as Record<
  string,
  { default: League }
>;

const LEAGUE_ORDER = ['nfl', 'nba', 'mlb', 'nhl', 'mls', 'wnba', 'nwsl', 'pwhl', 'epl'];

export const leagues: League[] = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => {
    const ai = LEAGUE_ORDER.indexOf(a.slug);
    const bi = LEAGUE_ORDER.indexOf(b.slug);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi) || a.slug.localeCompare(b.slug);
  });

export function getLeague(slug: string): League | undefined {
  return leagues.find((l) => l.slug === slug);
}

// Counters run from midnight US Eastern on the date in question. Clinching
// games end late evening ET, so day counts match how a fan would say it:
// "it has been N days since June 17, 2024."
const ET_OFFSET = '-05:00';
export { DAY_MS } from './clock';
import { DAY_MS } from './clock';

export function neverWon(team: Team): boolean {
  return team.lastTitle === null;
}

/** The ISO date a team's drought clock starts from. */
export function clockStartIso(team: Team): string {
  return team.lastTitle?.date ?? team.firstGame!;
}

export function clockStartMs(team: Team): number {
  return Date.parse(`${clockStartIso(team)}T00:00:00${ET_OFFSET}`);
}

export function daysSince(epochMs: number, now: number = Date.now()): number {
  return Math.max(0, Math.floor((now - epochMs) / DAY_MS));
}

/** All teams in a league, longest drought first. The reigning champion lands last. */
export function byDrought(teams: Team[]): Team[] {
  return [...teams].sort((a, b) => clockStartMs(a) - clockStartMs(b));
}

/**
 * The team holding the league's most recent title — the reigning champion.
 * Not simply the last row of the drought sort: a brand-new expansion team's
 * clock (first game) can start after the champion's title date.
 */
export function reigningChamp(teams: Team[]): Team | undefined {
  return teams
    .filter((t) => t.lastTitle)
    .sort((a, b) => Date.parse(b.lastTitle!.date) - Date.parse(a.lastTitle!.date))[0];
}

/** The single longest-running drought across every league on the site. */
export function worstDrought(): { league: League; team: Team } {
  let worst: { league: League; team: Team } | null = null;
  for (const league of leagues) {
    const team = byDrought(league.teams)[0];
    if (!worst || clockStartMs(team) < clockStartMs(worst.team)) {
      worst = { league, team };
    }
  }
  return worst!;
}

export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function yearOf(iso: string): number {
  return Number(iso.slice(0, 4));
}
