import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Resolved from the project root: this module runs inside Astro's prerender
// bundle, so import.meta.url would point at a dist/ chunk, not src/.
const anton = readFileSync(resolve(process.cwd(), 'public/fonts/Anton-Regular.ttf'));
const dseg = readFileSync(resolve(process.cwd(), 'public/fonts/DSEG7Classic-Bold.ttf'));

interface OgSpec {
  badge: string;
  title: string;
  number: string;
  context: string;
  accent: string;
  secondary: string;
}

const el = (type: string, style: Record<string, unknown>, children?: unknown) => ({
  type,
  props: { style, children },
});

/** 1200x630 share card in the jumbotron style. Day counts are baked in at
 *  build time; the nightly rebuild keeps them honest. */
export async function renderOgPng(spec: OgSpec): Promise<Uint8Array> {
  const svg = await satori(
    el(
      'div',
      {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: '#07090c',
        backgroundImage:
          `radial-gradient(900px 500px at 50% 115%, ${spec.accent}33, transparent 70%)`,
        padding: '56px 64px',
        fontFamily: 'Anton',
        color: '#e8edf2',
      },
      [
        el('div', { display: 'flex', alignItems: 'center', gap: '24px' }, [
          el(
            'div',
            {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '92px',
              height: '92px',
              backgroundColor: spec.accent,
              color: '#0a0c10',
              borderRadius: '14px',
              fontSize: '38px',
              letterSpacing: '1px',
            },
            spec.badge,
          ),
          el('div', { display: 'flex', flexDirection: 'column' }, [
            el(
              'div',
              { fontSize: '26px', letterSpacing: '6px', color: '#8b97a5' },
              'DAYS SINCE LAST CHAMPIONSHIP',
            ),
            el('div', { fontSize: '54px', letterSpacing: '2px' }, spec.title.toUpperCase()),
          ]),
        ]),
        el(
          'div',
          {
            display: 'flex',
            justifyContent: 'center',
            fontFamily: 'DSEG7',
            fontSize: spec.number.length > 5 ? '170px' : '200px',
            color: spec.accent === '#FFFFFF' ? '#e8edf2' : spec.accent,
          },
          spec.number,
        ),
        el('div', { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }, [
          el('div', { fontSize: '30px', color: '#aab6c4', letterSpacing: '1px', maxWidth: '820px' }, spec.context),
          el('div', { fontSize: '30px', letterSpacing: '3px', color: '#8b97a5' }, 'DAYSSINCELAST.APP'),
        ]),
      ],
    ) as Parameters<typeof satori>[0],
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Anton', data: anton, weight: 400, style: 'normal' },
        { name: 'DSEG7', data: dseg, weight: 700, style: 'normal' },
      ],
    },
  );

  return new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
}
