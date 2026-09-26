# Progress

One phase per session (CLAUDE.md rule 1). The phase plan is in BUILD_PROMPT.md section 10.

| #   | Phase                                                                   | Status                                                                                    |
| --- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 0   | Scaffold, CI, Pages deploy, decisions, asset shopping list              | **Done in code, pending first deploy.** Shopping list covers cars only (see known issues) |
| 1   | Data layer: Zod schemas, 5 cars (every trim), 12 engines, with sources  | Next                                                                                      |
| 2   | Simulation engine, dyno chart, calibration tests                        | Not started                                                                               |
| 3   | Parts catalogue, compatibility engine, cost, best-combo solver          | Not started                                                                               |
| 4   | Asset pipeline, showroom with real or placeholder models, part swapping | Not started                                                                               |
| 5   | Engine bay and cutaway animation                                        | Not started                                                                               |
| 6   | Cabin view, live gauges, engine sound                                   | Not started                                                                               |
| 7   | Dyno mode, compare, share link, build sheet, heat-soak test             | Not started                                                                               |
| 8   | Polish: performance, accessibility, mobile, credits, screenshot tests   | Not started                                                                               |

## Phase 0: scaffold (2026-09-26)

### What's built

- **Project:** Vite 8, TypeScript 6 (strict, plus `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`), three r186 with `WebGPURenderer`, and an automatic WebGL 2 fallback (`?renderer=webgl` forces it). three.js ships as its own cached chunk; the app code is 8 kB gzipped.
- **Garage scene:** opens straight into the empty bay at night:
  - Procedural PBR sealed-concrete floor in real metres: cure mottling, aggregate grain, saw-cut joints on a 3 m grid, worn yellow bay lines, soaked-in oil stains under the engine and gearbox, stray drips, tyre scuffs, a steel trench drain, and a clear sealer worn along the wheel tracks.
  - Painted concrete-block walls with a dark lower band, a corrugated roller door and steel beams.
  - Six lit strip fixtures (5000 K area lights) over the working bay; the neighbouring bays are dark.
  - One warm (2700 K) flood lamp with shadows.
  - HDRI image-based lighting (interim, see known issues). Fog, and a tight bloom halo on the diffusers.
- **UI (Section 8):**
  - riveted stamped-aluminium shop tag;
  - collapsible bottom panel with readouts (renderer, frame time, fps) and the Low/High/Ultra quality keys;
  - masking-tape empty-bay note;
  - fault panel if start-up fails; it also stops the readouts and locks the keys.

  Keyboard camera control: arrows orbit, `+`/`-` move closer or further. Forced-colours support. Barlow Condensed and IBM Plex Mono are self-hosted. No Inter, gradients, glass, pills, emoji or purple.

- **Quality presets:** Low, High (default) and Ultra, covering DPR cap, MSAA, shadow size and bloom. Stored per browser; `?quality=` overrides.
- **Data validation (`npm run validate-data`):**
  - Zod schemas for sources and confidence:
    - `verified` needs two different sites, compared by registrable domain and looking through archive links;
    - `estimated` needs a written method;
    - no placeholder URLs or future dates.
  - The third-party asset manifest (`src/data/assets.json`) is checked with:
    - an allowed-licence enum;
    - canonical licence URLs;
    - required NoAI, editorial, game-rip and AI-generated attestations.
  - It fails on:
    - any unlisted file in `public/`, or asset file under `src/`;
    - an unlisted asset package such as fonts;
    - a font version that drifts from the manifest;
    - wrong-folder kinds;
    - missing or over-budget files;
    - any data file without a registered schema.
- **Asset pipeline:** `npm run assets` reads GLB and glTF (including Draco and multi-buffer files) from `assets-raw/`. It does dedup, prune (keeping `mount_*` empties), weld, resample and Meshopt compression, then writes to `public/models/`. It fails on budget (car 25 MB, engine 8 MB, any file 100 MB) and on output-name collisions. `assets-raw/` is git-ignored.
- **Sim purity guard:** ESLint rejects any Three.js import, any import from outside `src/sim/` and `src/data/`, dynamic imports, and every browser global in `src/sim/`. I checked this with a scratch file containing 11 kinds of violation; all were caught.
- **CI/CD:** `.github/workflows/ci.yml` runs lint, typecheck, unit tests and validate-data, then build + Playwright e2e under the Pages base path. A push to `main` deploys the exact tested `dist/` to GitHub Pages.
- **Docs:** `docs/decisions.md`, `docs/asset-shopping-list.md` (plus the raw research in `docs/research/`) and `docs/ideas.md`.

### How it was verified

- `npm run lint`, `npm run typecheck` (app, scripts and e2e configs) and `npm test` (79 tests) pass. `npm run validate-data` passes.
- The same checks and all six e2e tests passed on a fresh GitHub runner with Playwright's own Chromium: [CI run 1](https://github.com/Hazemalhayattrading/Swap-Lab-working-CAR/actions/runs/36271288264). The deploy job was skipped because the branch isn't `main`, which is what should happen.
- `npm run e2e`: six Playwright smoke tests against the production build served at `/Swap-Lab-working-CAR/`:
  - default backend (WebGPU in headless Chromium via SwiftShader);
  - forced WebGL 2;
  - quality switch and persistence;
  - panel collapse;
  - keyboard camera control;
  - phone layout (390 x 844, no sideways scroll).

  Each checks there are no console errors or failed requests. All except the keyboard test also check that the canvas is lit rather than black or flat.

- An independent five-part review (runtime, CI, data rules, CLAUDE.md compliance, UI) ran, with a skeptic re-checking every finding. Everything confirmed was fixed:
  - render-target leaks on quality switches;
  - lost resizes during start-up;
  - three's device-lost guard being bypassed;
  - several validation holes;
  - the Draco, `mount_*` and multi-buffer pipeline gaps;
  - the wrong colour temperature;
  - keyboard access and forced-colours issues;
  - a tape note that wrapped too early on narrow phones.
- Screenshots were reviewed by eye from four camera angles, at Low and High, on both backends, and on a phone viewport. The reviewed set is in `docs/screenshots/phase-0/`.

### Known issues and gaps

1. **The site isn't live yet.** Deploys run from `main`, and this work is on `claude/phase-0-setup-pb5p57`. In repo Settings, then Pages, set the Source to **GitHub Actions**, then merge. The URL will be https://hazemalhayattrading.github.io/Swap-Lab-working-CAR/.
2. **Interim HDRI.** It's a 512 x 256 CC0 copy of Poly Haven's _Empty Warehouse 01_, from an npm package that doesn't name its source (origin marked `estimated`). It's used only for lighting and reflections at low intensity. Its lights don't line up with ours, so faint off-model reflections show on the floor. Replace it with a 2k Poly Haven garage HDRI once polyhaven.com is reachable.
3. **Procedural floor, not scanned.** No CC0 texture site was reachable. It reads well at shop-floor distances. Up close, a scanned set would be better (see `docs/ideas.md`).
4. **Shopping list: cars only.**
   - The session's web-search budget (200) ran out after the five cars. Engines (all 12) and parts (turbo, supercharger, intercooler, radiator, wheels, seats, aero) still need 2-3 candidates each.
   - The car entries come from one research pass, seen through search summaries (marketplace pages are blocked here), and were not independently re-checked.
5. **Paid models may not be allowed on a public site.** See "Paid models and redistribution" in `docs/decisions.md`. Needs a decision before any paid model is committed.
6. **Performance isn't measured on real hardware.** Headless tests render in software (about 0.4-4 s per frame), so the 60 fps showroom target is unverified. Per frame: 65 draw calls and under 1k triangles at High, 32 draw calls at Low. The browser console exposes these as `__SWAPLAB__.lastFrame`.
7. **Asset pipeline is Phase 0 scope.** Renaming to our part names, adding `mount_*` empties, LODs and KTX2 textures come in Phase 4.
8. **No planar or screen-space reflections yet.** Strip lights show on the floor only as soft area-light highlights.
9. **Code licence not chosen** (README says so).

### Numbers marked `estimated`

No vehicle data exists yet. The only `estimated` field is the HDRI's origin in `src/data/assets.json`.

## Next: Phase 1 (data layer)

- Zod schemas for cars (trims by year and market, weights, mount-point geometry, bay envelopes) and for the 12 engines, each value with a `source` and a `confidence`.
- Register the schemas in `SCHEMA_RULES` (`src/data/validate.ts`).
- Check each seed figure in BUILD_PROMPT section 3 against at least two sources.
- Phase 2 should add a `tsconfig` for `src/sim/` with no DOM library, alongside the ESLint guard.

It would help to set these up before Phase 1, which is almost entirely source-checking:

- Allow `polyhaven.com`, `api.polyhaven.com`, `dl.polyhaven.org`, `sketchfab.com` and `api.sketchfab.com` in the environment's network settings.
- Raise the web-search budget (`CLAUDE_CODE_MAX_WEB_SEARCHES_PER_SESSION`).
