# CLAUDE.md — Swap Lab working agreement

This file is read at the start of every session. If it conflicts with `BUILD_PROMPT.md`, this file wins.

## Project
Swap Lab is a photoreal, physics-based virtual build garage for drift cars. Users swap engines, turbos, superchargers, cooling and drivetrain parts. They see the result live in 3D (exterior, engine bay, cutaway, cabin) and in calibrated numbers (dyno sheet, temps, limits), plus a compatibility check and the full cost.
- English only.
- Static site on GitHub Pages, deployed on push to `main`.
- The full spec is in `BUILD_PROMPT.md`. Progress is tracked in `docs/progress.md`.

## Owner
The owner builds this from his phone and desktop through Claude Code sessions. He's hands-on and wants direct answers, including honest statements when something isn't certain. He cares most about **accuracy of the numbers** and **realism of the visuals**.

## Rules
1. **One phase per session.** Read `docs/progress.md` first, do the next phase only, then stop.
2. **No invented data.** Every spec and price needs a `source` (URL + date) and a `confidence` of `verified`, `single-source` or `estimated`. If you can't verify something, say so in the summary. Never quietly fill in a gap.
3. **Calibration gates the UI.** Don't show simulated numbers in the UI for a car unless its stock calibration test passes (±3%).
4. **Never cartoon.** PBR, HDRI and real GLB models only. Placeholders are grey clay with a visible `PLACEHOLDER` tag.
5. **Licensing.** Only CC0, CC-BY (credited on `/credits`) or commercially licensed assets. No NoAI or NC assets. No manufacturer logos used as site branding.
6. **Design guardrails.** Follow Section 8 of the build prompt. No gradient hero, no glass cards, no Inter, no emoji, no purple. The site opens straight into the garage.
7. **Asset budget.** ≤ 25 MB per car GLB, ≤ 8 MB per engine GLB, and no file over 100 MB. `assets-raw/` is git-ignored. Run `npm run assets` to optimize.
8. **Performance.** The simulation runs in a Web Worker. Showroom ≥ 60 fps and cutaway ≥ 45 fps on mid-range hardware.
9. **Verify before you claim done.** Run `npm run lint && npm run typecheck && npm test`, take Playwright screenshots, and look at them. Only then commit.
10. **Ask before:** adding paid services, moving assets off GitHub Pages, adding a backend, adding big dependencies (over 200 KB gzipped), or changing the design direction.
11. **Log decisions** in `docs/decisions.md` (date, decision, why, alternatives considered).
12. **New feature ideas** go to `docs/ideas.md`. Build them only once they're approved.

## Skills (in `.claude/skills/`)
Use these whenever they apply:
- `frontend-design`: every UI and panel. Follow it together with Section 8, and Section 8 wins if they disagree.
- `webapp-testing`: Playwright checks and screenshots at the end of every phase.
- `webgpu-threejs-tsl`: WebGPU renderer, TSL shaders (combustion flash, EGT heat glow, intercooler temperature shift), compute-driven particles.
- `threejs-*` (fundamentals, materials, lighting, textures, loaders, postprocessing, interaction): scene setup, PBR, HDRI, GLB loading and picking.
- `threejs-aaa-graphics-builder`, `threejs-debug-profiler`: visual polish and hitting the fps targets.
If a skill conflicts with this file, this file wins. Never use AI-generated 3D models or asset-generation APIs.

## Commands (create these in Phase 0)
- `npm run dev`: local dev server
- `npm run build`: production build
- `npm test`: Vitest (unit + calibration)
- `npm run e2e`: Playwright smoke tests and screenshots
- `npm run assets`: optimize `assets-raw/` → `public/models/`
- `npm run validate-data`: Zod check of all data files and their sources

## Conventions
- TypeScript strict mode.
- `src/sim/` is pure, with no DOM or Three.js imports.
- Units: SI internally. Display hp/PS/kW, Nm/lb-ft, bar/psi and °C/°F as the user chooses. Defaults are hp, Nm, bar, °C, and SAR for money.
- Default ambient is 45 °C and default fuel is 95 RON.
- Mount point names: `mount_engine`, `mount_trans`, `mount_intake`, `mount_turbo`, `mount_supercharger`, `mount_exhaust`, `mount_radiator`, `mount_intercooler`, `mount_oilcooler`, `mount_seat_driver`, `mount_seat_passenger`, `mount_wheel_fl|fr|rl|rr`, `mount_aero_front|side|rear|wing`.

## End-of-session summary (always)
Cover: what you built, how you verified it, any data still marked `estimated`, decisions you made, and at most one question for the owner.
