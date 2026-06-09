import type { APIRoute } from 'astro';
import { league, byDrought, clockStartMs, daysSince } from '../../lib/droughts';
import { renderOgPng } from '../../lib/og';

export const GET: APIRoute = async () => {
  const longest = byDrought(league.teams)[0];
  const days = daysSince(clockStartMs(longest));

  const png = await renderOgPng({
    badge: 'NBA',
    title: 'Every team, ranked by drought',
    number: String(days),
    context: `The ${longest.shortName} have waited the longest. All 30 droughts inside, ticking live.`,
    accent: '#f5b62e',
    secondary: '#8b97a5',
  });

  return new Response(png, { headers: { 'Content-Type': 'image/png' } });
};
