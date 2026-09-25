# Curbside

*Start with nothing. Build a life.*

Curbside is a text-forward life sim about climbing from homelessness to stability and, later, to wealth. It's hard but fair. It runs in the browser, installs as an app, and works fully offline. It has no ads, no purchases and no accounts.

- **Play:** https://&lt;your-github-user&gt;.github.io/curbside/ (install it from the browser's "Add to Home Screen")
- **Status:** v0.1.0, the Act I vertical slice (the street, the shelter, your first rented room). See [CHANGELOG.md](CHANGELOG.md).
- **Design:** [docs/DESIGN.md](docs/DESIGN.md) · **Numbers:** [docs/BALANCE.md](docs/BALANCE.md)

## Run it locally

Requires Node 22.12+.

```bash
npm install
npm run dev        # http://localhost:5173/curbside/
npm test           # engine invariants, odds honesty, saves, content integrity, 60-year smoke test
npm run build      # production build + service worker into dist/
npm run preview    # serve the production build
```

Balance report (headless bot lives, medians written to `sim-report.txt`):

```bash
npm run sim                                  # 40 runs × 60 years per strategy (slow)
SIM_RUNS=16 SIM_YEARS=3 npm run sim          # quick Act I check
```

## Deploy

Every push to `main` runs the tests, builds, and deploys to GitHub Pages via `.github/workflows/deploy.yml`. The site is served from `/<repo-name>/`. The workflow sets `BASE_PATH` automatically; set it yourself for other hosts (`BASE_PATH=/ npm run build`).

One-time setup: in the repo's **Settings → Pages**, set Source to **GitHub Actions**. Or run:

```bash
gh api -X POST repos/<user>/curbside/pages -f build_type=workflow
```

## Debug menu

Open it any of these ways (all work on a phone):

- Press the backtick key (`` ` `` or `~`) on desktop
- Add `?debug=1` to the URL
- Tap the version number on the title screen 7 times

From the menu you can:

- Set cash, stats, skills, reputation, relationships, and days of life left
- Fast-forward N days with the sim running
- Trigger or force any event, or switch random events off
- Grant or remove items, get the dog, unlock every tab
- Jump to any story beat or show any story card
- Kill or revive the character
- View and set the RNG state, or replay the current seed
- Open the live ledger (with reconciliation) and a JSON state inspector
- Export, import or wipe saves
- Run the **balance simulator**: N headless bot lives with a chosen strategy, reporting median net worth by year, when they reach a room, and causes of death

Any use of the debug menu sets `debugUsed` on the save, and the title screen marks those slots.

## Project layout

```
src/engine/    Pure, framework-free game logic: (state, action) → new state + log. Seeded RNG.
src/content/   All content as typed data: events, story, items, housing, codex, strings, balance.ts
src/ui/        React UI. Never mutates game state; dispatches actions through ui/store.ts
docs/          Design spec, balance notes
```

- **Names:** every proper name (the game, the city, places, cast) lives in `src/content/config.ts`. Text refers to them with `{placeholders}`.
- **Numbers:** every tunable number lives in `src/content/balance.ts`.
- **UI strings:** everything goes through `t()` and `src/content/strings.en.ts`.

## Saves

The game autosaves to `localStorage` after every action. There are three slots, and you can export and import JSON from Settings. Saves carry a schema version, and `src/engine/save.ts` migrates old saves forward so an update never wipes a life.
