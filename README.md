# dayssincelast

Every NBA team, ranked by days since its last championship — live-ticking
jumbotron counters, fan-pain facts, and per-team share cards.

Static [Astro](https://astro.build) site. No database, no API, no server: the
entire dataset is [`src/data/nba.json`](src/data/nba.json), verified against
basketball-reference.com box scores. Day counts tick client-side from the
clinching-game date, so they are always live regardless of when the site was
built.

## Commands

| Command           | Action                                       |
| ----------------- | -------------------------------------------- |
| `npm install`     | Install dependencies                         |
| `npm run dev`     | Dev server at `localhost:4321`               |
| `npm run build`   | Build static site + OG images into `./dist/` |
| `npm run preview` | Serve the built site locally                 |

## The night a champion is crowned

The only maintenance this site needs, once a year:

1. In `src/data/nba.json`, find the winner and update:
   - append the year to `titleYears`
   - set `lastTitle` to `{ "date": "<clinching game date>", "opponent": "...", "series": "4–x", "asName": null }`
   - if the winner had never won (e.g. the Knicks), also delete its
     `firstNbaGame`, `firstGameAs`, `firstGameNote`, `finalsLosses` fields
2. Update or remove the `banner` line.
3. Commit and push. The deploy picks it up; the winner's counter resets to ~0
   and it drops to the bottom of the board.

## Why the nightly rebuild exists

Counters tick live in the browser, but two things are baked at build time: the
no-JS fallback numbers and the day counts rendered into the OG share images
(`/og/nba/<team>.png`). The GitHub Action in
[`.github/workflows/nightly-rebuild.yml`](.github/workflows/nightly-rebuild.yml)
triggers a redeploy every night so link previews never drift more than a day.

## Deploying (Vercel)

1. Push this repo to GitHub and import it in Vercel — the Astro preset's
   defaults are correct as-is.
2. Add the custom domain (`dayssincelast.app`) under Project → Domains.
3. Create a Deploy Hook (Project → Settings → Git → Deploy Hooks) and save its
   URL as the `VERCEL_DEPLOY_HOOK` repository secret on GitHub so the nightly
   rebuild can fire.

## Data decisions

- **Counters start at midnight ET of the clinching game's date** — "days since
  June 17, 2024" matches how a fan would count it.
- **Franchise records follow official NBA history**, relocations included: the
  Kings' 1951 title was won as the Rochester Royals (and the page says so);
  today's Hornets officially date to 1988; the Pelicans to 2002.
- **Never-won teams** count from their first NBA regular-season game.
- **ABA titles** (Pacers ×3, Nets ×2) don't count. They get a footnote.

## Adding a league

The data model is league-agnostic: add `src/data/<league>.json` in the same
shape, generalize the `league` export in `src/lib/droughts.ts`, and add
`src/pages/<league>/[team].astro` + an OG route. The drought math, facts
engine, ticker, and design system all carry over.

## Fonts

- [DSEG](https://github.com/keshikan/DSEG) seven-segment by keshikan — SIL OFL 1.1
- [Anton](https://fonts.google.com/specimen/Anton) — SIL OFL 1.1
