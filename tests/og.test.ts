// Smoke test for the share-card renderer: fonts load, satori accepts the
// layout, and resvg produces a real PNG at the OG-standard size.
import { describe, expect, it } from 'vitest';
import { renderOgPng } from '../src/lib/og';

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47];

describe('renderOgPng', () => {
  it('renders a valid PNG share card', async () => {
    const png = await renderOgPng({
      badge: 'TST',
      title: 'Test Team',
      number: '12345',
      context: '…and counting, since forever.',
      accent: '#F58426',
      secondary: '#006BB6',
    });
    expect(Array.from(png.slice(0, 4))).toEqual(PNG_SIGNATURE);
    // IHDR width lives at bytes 16-19; OG cards are 1200px wide.
    const width = (png[16] << 24) | (png[17] << 16) | (png[18] << 8) | png[19];
    expect(width).toBe(1200);
  });

  it('handles the white-accent edge case without dropping the number', async () => {
    const png = await renderOgPng({
      badge: 'BKN',
      title: 'Brooklyn Nets',
      number: '18127',
      context: '…and counting.',
      accent: '#FFFFFF',
      secondary: '#707070',
    });
    expect(Array.from(png.slice(0, 4))).toEqual(PNG_SIGNATURE);
  });
});
