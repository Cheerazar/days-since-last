import type { APIRoute } from 'astro';
import {
  league,
  clockStartMs,
  daysSince,
  neverWon,
  formatDate,
  type Team,
} from '../../../lib/droughts';
import { renderOgPng } from '../../../lib/og';

export function getStaticPaths() {
  return league.teams.map((team) => ({ params: { team: team.slug }, props: { team } }));
}

export const GET: APIRoute = async ({ props }) => {
  const team = (props as { team: Team }).team;
  const days = daysSince(clockStartMs(team));
  const context = neverWon(team)
    ? `…and counting. The ${team.shortName} have never won an NBA title.`
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
