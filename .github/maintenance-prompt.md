# Auto-maintenance agent

You maintain the dayssincelast dataset. The scheduled gate has determined that one
or more leagues are inside a window where a result is possible, and passed you the
list as `<slug> <kind>` lines in the `DUE` section below. Your job: detect whether
the result has actually happened, and if so, open ONE pull request that updates the
data — verified and cited. **Never merge. Never push to main.**

Work only on the leagues in DUE. For each, read `src/data/<slug>.json` first.

## Step 1 — idempotency (do this before any web search)

For each due league, check whether the repo already reflects the result:

- **champion**: if the current season's champion is already recorded (its
  `titleYears` ends in this year and `lastTitle.date` is in this season), there is
  nothing to do.
- **roster**: if the team list already matches the new season's clubs, nothing to do.

Also run `gh pr list --state open` and skip any league that already has an open
auto-maintenance PR. If nothing is actionable across all due leagues, write a one-line
note and STOP without opening a PR. Reruns must be no-ops.

## Step 2 — detect and verify

Use WebSearch against authoritative sources (league sites, ESPN, BBC, Wikipedia
season articles, Basketball-Reference, RSSSF). For every date or roster fact:

- confirm it from **at least two independent sources**;
- then run an **adversarial second pass**: actively try to refute your own finding
  (wrong date by a day, wrong clinching game, a title stripped/reassigned, a club
  lineage that doesn't carry honours). Only keep what survives.

If you cannot confirm a result happened, treat it as "not yet" and stop for that
league — do not guess.

## Step 3 — edit the data

Match the existing file's shape and conventions exactly (read neighbours for the
pattern). Bump the league's `updated` to today.

**Champion crowned:**
- Append the season-end year to the winner's `titleYears`.
- Set `lastTitle` to the clinching-game date. Use `opponent` + `series` when the
  title was won in a game the team played; use the free-text `clinch` field (with
  `opponent`/`series` null) when it was decided by a draw, a loss, or another result.
- If the winner was previously never-won, delete its `firstGame`, `firstGameAs`,
  `firstGameNote`, and `finalsLosses`.
- Replace the league `banner` with a one-line celebratory note and set `bannerUntil`
  ~7 days out (the validator rejects more than 30 days past `updated`).

**Roster swap (promotion/relegation):** a swap may span two windows. The early
"settle" window fires once promotion/relegation is mathematically final (after the
play-offs) — do the swap then. A later "autumn" window catches any club that had to
be deferred. Both runs are safe because of the idempotency check in Step 1: only act
on what isn't already reflected, so re-runs and the second window converge cleanly.

- Remove each relegated club's entire object.
- Add each promoted club: research colors (official palette; add `accentLight` if the
  primary is pale/white), `abbr`, the nav `group`, and the **lineage-aware**
  `firstGame` — a returning club's clock is its first-ever top-flight match (often
  decades old), not its return date; only a club that has NEVER played the top flight
  gets a fresh `firstGame`, and that date **must already be in the past** (clocks
  cannot start in the future). If a debutant's first fixture hasn't been played yet,
  do NOT finalize it — note it in the PR and leave it out.
- Update the league `footnote` and the `EXPECTED_TEAM_COUNTS` map and `ANCHORS` list in
  `tests/data-integrity.test.ts` if the roster or counts changed.

## Step 4 — gate, then open the PR

Run `node scripts/validate-data.mjs` and `npm test`. Fix anything they catch. Do NOT
open a PR if either fails.

Create a branch `auto/<slug>-<kind>-<year>` and open a PR with `gh pr create`. The PR
body must include: what changed and why, every source URL used, and a short note on
what the adversarial second pass checked or corrected. Title it like
`<League>: <team> crowned <year> champion` or `<League>: <year-26> roster swap`.

Then stop. A human reviews and merges; CI (validate + test + build) runs on the PR.
