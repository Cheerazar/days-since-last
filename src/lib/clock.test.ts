import { describe, expect, it } from 'vitest';
import { DAY_MS, pad, splitElapsed } from './clock';

describe('splitElapsed', () => {
  it('splits a duration into days plus hh:mm:ss remainder', () => {
    const ms = 3 * DAY_MS + 4 * 3_600_000 + 5 * 60_000 + 6_000;
    expect(splitElapsed(ms)).toEqual({ days: 3, hours: 4, minutes: 5, seconds: 6 });
  });

  it('clamps negative durations to zero (clock start in the future)', () => {
    expect(splitElapsed(-1)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  });

  it('rolls over exactly at the day boundary', () => {
    expect(splitElapsed(DAY_MS - 1).days).toBe(0);
    expect(splitElapsed(DAY_MS - 1).hours).toBe(23);
    expect(splitElapsed(DAY_MS)).toEqual({ days: 1, hours: 0, minutes: 0, seconds: 0 });
  });

  it('never produces out-of-range clock parts', () => {
    for (const ms of [0, 999, 59_999, 3_599_999, DAY_MS - 1, DAY_MS * 7.5]) {
      const { hours, minutes, seconds } = splitElapsed(ms);
      expect(hours).toBeGreaterThanOrEqual(0);
      expect(hours).toBeLessThan(24);
      expect(minutes).toBeGreaterThanOrEqual(0);
      expect(minutes).toBeLessThan(60);
      expect(seconds).toBeGreaterThanOrEqual(0);
      expect(seconds).toBeLessThan(60);
    }
  });
});

describe('pad', () => {
  it('zero-pads single digits for seven-segment display', () => {
    expect(pad(0)).toBe('00');
    expect(pad(7)).toBe('07');
    expect(pad(59)).toBe('59');
  });
});
