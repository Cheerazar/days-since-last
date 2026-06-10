import type { APIRoute } from 'astro';
import { leagues, type League, byDrought, clockStartMs, daysSince } from '../../../lib/droughts';
import { renderOgPng } from '../../../lib/og';

export function getStaticPaths() {
  return leagues.map((lg) => ({ params: { league: lg.slug }, props: { lg } }));
}

export const GET: APIRoute = async ({ props }) => {
  const { lg } = props as { lg: League };
  const longest = byDrought(lg.teams)[0];
  const days = daysSince(clockStartMs(longest));

  const png = await renderOgPng({
    badge: lg.league,
    title: 'Every team, ranked by drought',
    number: String(days),
    context: `The ${longest.shortName} have waited the longest. All ${lg.teams.length} ${lg.league} droughts inside, ticking live.`,
    accent: '#f5b62e',
    secondary: '#8b97a5',
  });

  return new Response(png, { headers: { 'Content-Type': 'image/png' } });
};
