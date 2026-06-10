# dayssincelast

Every team in every major American league, ranked by days since its last
championship — live-ticking jumbotron counters, fan-pain facts, and per-team
share cards. NFL, NBA, MLB, NHL, MLS, WNBA, NWSL.

Static [Astro](https://astro.build) site. No database, no API, no server: each
league is one JSON file in [`src/data/`](src/data/), with every title date
verified against box scores and dated game reports. Day counts tick
client-side from the clinching-game date, so they are always live regardless
of when the site was built.

## Commands

| Command                          | Action                                       |
| -------------------------------- | -------------------------------------------- |
| `npm install`                    | Install dependencies                         |
| `npm run dev`                    | Dev server at `localhost:4321`               |
| `npm run build`                  | Build static site + OG images into `./dist/` |
| `npm run preview`                | Serve the built site locally                 |
| `node scripts/validate-data.mjs` | Schema-check every league JSON               |

## The night a champion is crowned

The only maintenance this site needs, once per league per year:

1. In `src/data/<league>.json`, find the winner and update:
   - append the year to `titleYears`
   - set `lastTitle` to `{ "date": "<clinching game date>", "opponent": "...", "series": "...", "asName": null }`
   - if the winner had never won, also delete its `firstGame`, `firstGameAs`,
     `firstGameNote`, and `finalsLosses` fields
2. Update or remove the league's `banner` line.
3. Run `node scripts/validate-data.mjs`, commit, push. The winner's counter
   resets to ~0 and drops to the bottom of its board.

Championship nights by league: NFL early February, NHL mid-June, NBA mid-June,
WNBA mid-October, MLB late October/early November, NWSL late November, MLS
early December.

## Adding a league

Drop `src/data/<league>.json` in the same shape as the existing files (league
metadata + teams with verified `lastTitle`/`firstGame` dates). That's it — the
glob registry in `src/lib/droughts.ts` picks it up, and the nav link, league
board at `/<league>/`, team pages, and OG images all appear on the next build.
Run `node scripts/validate-data.mjs` before committing.

## Why the nightly rebuild exists

Counters tick live in the browser, but two things are baked at build time: the
no-JS fallback numbers and the day counts rendered into the OG share images
(`/og/<league>/<team>.png`). The GitHub Action in
[`.github/workflows/nightly-rebuild.yml`](.github/workflows/nightly-rebuild.yml)
triggers a redeploy every night so link previews never drift more than a day.

## Deploying (Vercel)

1. Push this repo to GitHub and import it in Vercel — the Astro preset's
   defaults are correct as-is.
2. Add the custom domain (`dayssincelast.app`) under Project → Domains.
3. Create a Deploy Hook (Project → Settings → Git → Deploy Hooks) and save its
   URL as the `VERCEL_DEPLOY_HOOK` repository secret on GitHub so the nightly
   rebuild can fire.

## Analytics

Two layers, both cookieless (no consent banner needed):

- **Vercel Web Analytics** — pageviews/referrers per team page. Enable it
  under Project → Analytics in the Vercel dashboard; the beacon is already in
  the layout (production builds only).
- **Umami Cloud** — share-click events. The Share the Pain button fires a
  `share` event with `team`, `league`, and `method` (native share vs. copy)
  properties. To activate: create a site at [cloud.umami.is](https://cloud.umami.is),
  copy its website ID, set `PUBLIC_UMAMI_WEBSITE_ID` as an environment
  variable in Vercel (Project → Settings → Environment Variables), and
  redeploy. The script is omitted from builds where the variable is unset, so
  local builds never send events. Share counts per team appear under the
  site's **Events** tab in Umami.

Shared links carry `utm_source=share`, so share-driven arrivals are
attributable in either dashboard.

## Data decisions

- **Counters start at midnight ET of the clinching game's date** — "days since
  June 17, 2024" matches how a fan would count it.
- **Franchise records follow official league history**, relocations included:
  the Kings' 1951 title was won as the Rochester Royals; the Wings carry the
  Detroit Shock's WNBA titles; the Browns' history stayed in Cleveland.
- **Never-won teams** count from their first regular-season game in the league.
- **Predecessor-league and non-championship trophies don't count** — ABA and
  AAFC titles, Supporters' Shields, and the like get an asterisk footnote, not
  a counter reset.
- **NFL convention:** pre-Super Bowl NFL championships and pre-1966 AFL titles
  count; for the 1966–69 seasons the Super Bowl winner is the champion (so the
  Vikings' 1969 NFL Championship Game win doesn't end their drought — matching
  how fans talk about it).
- **Verification:** every `lastTitle.date` and `firstGame` was built from box
  scores, then independently re-verified by an adversarial second pass.

## Fonts

- [DSEG](https://github.com/keshikan/DSEG) seven-segment by keshikan — SIL OFL 1.1
- [Anton](https://fonts.google.com/specimen/Anton) — SIL OFL 1.1
