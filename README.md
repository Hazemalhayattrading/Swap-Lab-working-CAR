# Swap Lab

A photoreal, physics-based virtual build garage for drift cars. Plan an engine swap, forced induction, cooling and drivetrain, and see the result in 3D and in calibrated numbers before spending money on the real car.

- Live site (after the first deploy from `main`): https://hazemalhayattrading.github.io/Swap-Lab-working-CAR/
- Spec: [`BUILD_PROMPT.md`](BUILD_PROMPT.md). Working agreement: [`CLAUDE.md`](CLAUDE.md).
- Status: [`docs/progress.md`](docs/progress.md). Decisions: [`docs/decisions.md`](docs/decisions.md). Models to buy: [`docs/asset-shopping-list.md`](docs/asset-shopping-list.md).

## Commands

Node 22 or newer.

```sh
npm ci                 # install exact dependency versions
npm run dev            # local dev server
npm run build          # production build into dist/
npm test               # Vitest: unit tests (calibration tests from Phase 2)
npm run e2e            # Playwright smoke tests; screenshots in test-results/screenshots/
npm run lint           # ESLint + Prettier check
npm run typecheck      # TypeScript, strict
npm run validate-data  # Zod check of every data file, its sources and licences
npm run assets         # optimise assets-raw/ into public/models/
```

In the garage: drag or use the arrow keys to look around; scroll, pinch or press `+`/`-` to move closer or further.

Useful URL options: `?renderer=webgl` forces the WebGL 2 fallback, and `?quality=low|high|ultra` picks a render preset.

## Layout

```
src/app/      the 3D garage view (scene, camera, pipeline wiring)
src/render/   renderer, WebGPU/WebGL 2 selection, quality presets, post-processing
src/scene/    workshop shell, lights, HDRI environment, procedural PBR materials
src/ui/       HUD overlay (shop tag, telemetry strip)
src/data/     data files, Zod schemas, asset manifest and budgets
src/sim/      (Phase 2) pure simulation code: no DOM, no Three.js
scripts/      validate-data and the asset pipeline
tests/        Vitest (unit, scripts; calibration from Phase 2)
e2e/          Playwright smoke tests
```

## Licences

Code: not yet chosen (the owner decides). Third-party assets and their licences are listed in [`src/data/assets.json`](src/data/assets.json).
