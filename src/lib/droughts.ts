import nba from '../data/nba.json';

export interface LastTitle {
  date: string;
  opponent: string;
  series: string;
  asName: string | null;
}

export interface Team {
  slug: string;
  name: string;
  shortName: string;
  abbr: string;
  accent: string;
  secondary: string;
  titleYears: number[];
  lastTitle: LastTitle | null;
  firstNbaGame?: string;
  firstGameAs?: string | null;
  firstGameNote?: string;
  finalsLosses?: number[];
  abaTitles?: number[];
  lineage?: string;
}

export interface League {
  league: string;
  updated: string;
  banner?: string;
  teams: Team[];
}

export const league = nba as League;

// Counters run from midnight US Eastern on the date in question. Clinching
// games end late evening ET, so day counts match how a fan would say it:
// "it has been N days since June 17, 2024."
const ET_OFFSET = '-05:00';
export const DAY_MS = 86_400_000;

export function neverWon(team: Team): boolean {
  return team.lastTitle === null;
}

/** The ISO date a team's drought clock starts from. */
export function clockStartIso(team: Team): string {
  return team.lastTitle?.date ?? team.firstNbaGame!;
}

export function clockStartMs(team: Team): number {
  return Date.parse(`${clockStartIso(team)}T00:00:00${ET_OFFSET}`);
}

export function daysSince(epochMs: number, now: number = Date.now()): number {
  return Math.max(0, Math.floor((now - epochMs) / DAY_MS));
}

/** All teams, longest drought first. The reigning champion lands last. */
export function byDrought(teams: Team[]): Team[] {
  return [...teams].sort((a, b) => clockStartMs(a) - clockStartMs(b));
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
