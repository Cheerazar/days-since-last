# dayssincelast

By [Gunnari Auvinen](https://gunnariauvinen.com) — principal software engineer.

[![CI](https://github.com/cheerazar/days-since-last/actions/workflows/ci.yml/badge.svg)](https://github.com/cheerazar/days-since-last/actions/workflows/ci.yml)

Every team in every major league, ranked by days since its last
championship — live-ticking jumbotron counters, fan-pain facts, and per-team
share cards. NFL, NBA, MLB, NHL, MLS, WNBA, NWSL, PWHL, and the English
Premier League.

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
| `npm test`                       | Run the Vitest suite                         |
| `node scripts/validate-data.mjs` | Schema-check every league JSON               |

## The night a champion is crowned

The only maintenance this site needs, once per league per year:

1. In `src/data/<league>.json`, find the winner and update:
   - append the year to `titleYears`
   - set `lastTitle` to `{ "date": "<clinching game date>", "opponent": "...", "series": "...", "asName": null }`
   - if the winner had never won, also delete its `firstGame`, `firstGameAs`,
     `firstGameNote`, and `finalsLosses` fields
2. Update or remove the league's `banner` line. Banners are news with a
   shelf life and always carry a `bannerUntil` date (the last day they show;
   the nightly rebuild hides them after that, no commit needed): a banner for
   a final round in progress expires the day of the last possible game, and a
   "they just won" banner expires about a week after the clinch — beyond
   that, the reset counter at the bottom of the board tells the story better.
   Permanent context belongs in the league's `footnote` (fine print on the
   board), never in a banner.
3. Run `node scripts/validate-data.mjs`, commit, push. The winner's counter
   resets to ~0 and drops to the bottom of its board.

Championship nights by league: NFL early February, Premier League April/May
(whenever the title is mathematically clinched — not necessarily a match the
champion played; use the `clinch` field), NHL mid-June, NBA mid-June, WNBA
mid-October, MLB late October/early November, NWSL late November, MLS early
December.

### Premier League only: the annual relegation swap

Once the season and the Championship play-off final end (late May), the
league's membership changes. In `src/data/epl.json`:

1. Delete the three relegated clubs' entries.
2. Add the three promoted clubs. A club returning to the top flight keeps its
   full history: titles from any earlier top-flight spell still count, and a
   never-won club's `firstGame` is its first-ever top-flight match (which may
   be decades old), not its return date. Only a club that has never played
   top-flight football gets a fresh `firstGame` (its first PL fixture — wait
   until it has been played, since clocks can't start in the future).
3. Update `EXPECTED_TEAM_COUNTS`/anchors in `tests/` if affected, then
   `node scripts/validate-data.mjs` and `npm test`.

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
- **Premier League convention:** the board shows the 20 clubs of the current
  season (relegation/promotion swaps the roster annually — see the playbook
  above), but history follows the club, not the era: the English top flight is
  one continuous competition (First Division 1888–1992 → Premier League), so
  Everton's 1987 and Sunderland's 1936 titles count, exactly like pre-Super
  Bowl NFL crowns. A club's drought clock keeps running while it is relegated
  — days since a title don't pause in the second tier. League titles are often
  clinched via a draw, a loss, or another club's result, so `lastTitle` carries
  a free-text `clinch` sentence instead of relying on `opponent`/`series`. FA
  Cups are not championships; they get the asterisk treatment.
- **Verification:** every `lastTitle.date` and `firstGame` was built from box
  scores, then independently re-verified by an adversarial second pass.

## Fonts

- [DSEG](https://github.com/keshikan/DSEG) seven-segment by keshikan — SIL OFL 1.1
- [Anton](https://fonts.google.com/specimen/Anton) — SIL OFL 1.1
