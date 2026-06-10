import type { APIRoute } from 'astro';
import { leagues, worstDrought, clockStartMs, daysSince } from '../../lib/droughts';
import { renderOgPng } from '../../lib/og';

export const GET: APIRoute = async () => {
  const { league, team } = worstDrought();
  const days = daysSince(clockStartMs(team));
  const totalTeams = leagues.reduce((n, l) => n + l.teams.length, 0);

  const png = await renderOgPng({
    badge: 'ALL',
    title: 'Every league. Every drought.',
    number: String(days),
    context: `The ${team.shortName} (${league.league}) have waited the longest. ${totalTeams} teams across ${leagues.length} league${leagues.length === 1 ? '' : 's'}, ticking live.`,
    accent: '#f5b62e',
    secondary: '#8b97a5',
  });

  return new Response(png, { headers: { 'Content-Type': 'image/png' } });
};
