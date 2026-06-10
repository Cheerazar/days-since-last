// Pure time math shared by the browser ticker (Base.astro) and the build.
// Keep this module dependency-free: the ticker script imports it, so anything
// pulled in here ships to the client on every page.

export const DAY_MS = 86_400_000;

export const pad = (n: number): string => String(n).padStart(2, '0');

export interface ElapsedParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/** Splits elapsed milliseconds into days + hh:mm:ss remainder, clamped at 0. */
export function splitElapsed(elapsedMs: number): ElapsedParts {
  const ms = Math.max(0, elapsedMs);
  const days = Math.floor(ms / DAY_MS);
  const rem = ms % DAY_MS;
  return {
    days,
    hours: Math.floor(rem / 3_600_000),
    minutes: Math.floor(rem / 60_000) % 60,
    seconds: Math.floor(rem / 1_000) % 60,
  };
}
