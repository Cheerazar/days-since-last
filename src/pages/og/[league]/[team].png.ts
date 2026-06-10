import type { APIRoute } from 'astro';
import {
  leagues,
  type League,
  type Team,
  clockStartMs,
  daysSince,
  neverWon,
  formatDate,
} from '../../../lib/droughts';
import { renderOgPng } from '../../../lib/og';

export function getStaticPaths() {
  return leagues.flatMap((lg) =>
    lg.teams.map((team) => ({
      params: { league: lg.slug, team: team.slug },
      props: { lg, team },
    })),
  );
}

export const GET: APIRoute = async ({ props }) => {
  const { lg, team } = props as { lg: League; team: Team };
  const days = daysSince(clockStartMs(team));
  const context = neverWon(team)
    ? `…and counting. The ${team.shortName} have never won a ${lg.league} title.`
    : `…and counting, since ${formatDate(team.lastTitle!.date)}.`;

  const png = await renderOgPng({
    badge: team.abbr,
    title: team.name,
    number: String(days),
    context,
    accent: team.accent,
    secondary: team.secondary,
  });

  return new Response(png, { headers: { 'Content-Type': 'image/png' } });
};
