# SWAP LAB — Build Prompt

> Paste this into a Claude Code session opened on the `swap-lab` repo. Read `CLAUDE.md` first: it's the working agreement, and it overrides anything here if the two conflict.
> Work **one phase per session**. Finish the phase, run the checks, commit, push, and stop. Don't start the next phase until you're told to.

---

## 1. What we're building

**Swap Lab** is a browser-based **virtual build garage for drift cars**. People who modify cars plan their whole build here before they spend money in real life:

- They pick a real car (starting with 5 drift icons).
- They swap the engine, add a turbo or supercharger, upgrade the cooling, fuel, drivetrain, suspension and aero.
- **Live**, they see:
  1. **The look**: photoreal 3D exterior, engine bay, cabin, and a *cutaway* engine running inside the car (pistons, valves, combustion flame, exhaust gas moving through the manifold, turbo, and out the tailpipe).
  2. **The numbers**: a dyno sheet (hp and torque curves), boost, AFR, EGT, coolant/oil temps, weight, weight distribution, power-to-weight, and 0–100 / ¼-mile estimates.
  3. **The reality check**: whether the parts actually fit together, what else the build now needs (fuel pump, clutch, axles, ECU, wiring), and **total cost** (parts plus labour, in USD and SAR).

It has to be **useful to a real builder, not just pretty**. If it looks amazing but the numbers are wrong, the project has failed.

Language: **English only**.
Hosting: **GitHub Pages** (static). Deploy on push to `main`.

---

## 2. Non-negotiables

1. **Photoreal, never cartoon.** PBR materials, HDRI lighting, real 3D models (GLB) for cars, engines and parts. No toon shading, no flat low-poly, no emoji, no clip-art icons for parts.
2. **Every number has a source.** Stock specs, part specs and prices live in data files. Every value has a `source` (URL + date accessed) and a `confidence` field. If you can't find a source for something, mark it `estimated` and show that in the UI. **Never make up a number and present it as a fact.**
3. **The simulation is physics-based and calibrated** (Section 6). A stock car must match its factory figures within ±3%. Known documented builds must land within ±10%. Always show an uncertainty band on the dyno chart.
4. **Compatibility is explicit.** Every "fits / doesn't fit / fits with X" verdict comes from a rule you can read in the data, not from vibes.
5. **Design is distinctive** (Section 8). It must not look like a typical AI-generated website.

---

## 3. Launch car roster

These are the stock values to seed with. **Check every one against at least two sources before you commit it**, and correct it if it's wrong:

| Car | Chassis | Stock engine | Layout | Seed stock output | Seed curb weight |
|---|---|---|---|---|---|
| Nissan Silvia Spec-R | S15 | SR20DET 2.0 I4 turbo | FR | ~250 PS / ~275 Nm | ~1,250 kg |
| Toyota Supra RZ / Turbo | JZA80 (MK4) | 2JZ-GTE 3.0 I6 twin turbo (sequential) | FR | 280 PS JDM / 320 hp US, ~427–451 Nm | ~1,500–1,570 kg |
| Nissan 350Z | Z33 | VQ35DE / VQ35HR 3.5 V6 NA (by year) | FR | 287–306 hp by year | ~1,450 kg |
| BMW 3 Series | E46 (330i + M3) | M54B30 3.0 I6 / S54B32 3.2 I6 | FR | 231 PS / 343 PS | ~1,450–1,570 kg |
| Mazda RX-7 | FD3S | 13B-REW twin-rotor, sequential twins | FR | 255 hp US – 280 PS JDM | ~1,280 kg |

Handle year and market variants (JDM, US, EU) as trims, because they have different outputs, gearing and weights.

Engine swaps to support at launch (each one gets a full engine data entry):
`2JZ-GTE`, `1JZ-GTE`, `SR20DET`, `RB25DET NEO`, `RB26DETT`, `VQ35HR`, `LS3 6.2 V8`, `LS1 5.7 V8`, `K24 I4`, `S54B32`, `13B-REW`, `20B-REW`.

Popular real-world swaps must work end to end, with the right swap kit, mounts, adapter, sump, wiring and ECU: S15←2JZ, S15←LS, 350Z←LS, E46←LS, E46←S54/M3 swap, RX-7←LS, RX-7←2JZ, Supra←LS (yes, people do this).

---

## 4. Tech stack

- **Vite + TypeScript**, strict mode.
- **Three.js** using `WebGPURenderer` with an automatic WebGL2 fallback. React Three Fiber is fine if you prefer it; pick one and write the decision down in `docs/decisions.md`.
- Assets: **glTF/GLB** with **Meshopt or Draco** geometry compression and **KTX2 (Basis)** textures. HDRI environments as `.hdr` / `.exr` (Poly Haven, CC0).
- Charts: a lightweight custom canvas/SVG dyno plot. No chart library that forces its own look.
- Audio: Web Audio API. Engine sound is synthesized from firing order, RPM, cylinder count and exhaust config (Section 7.4).
- Simulation runs in a **Web Worker**, so the 3D scene never stutters while numbers recompute.
- State: one serializable `Build` object. **The whole build encodes into the URL**, so any build can be shared as a link.
- Tests: **Vitest** for the simulation and compatibility engine, **Playwright** for smoke tests and screenshots.

### Asset constraints (GitHub Pages)
- GitHub rejects files over 100 MB and Pages doesn't serve Git LFS files. Target **≤ 25 MB per car GLB** and **≤ 8 MB per engine GLB** after compression.
- Use LOD: a lightweight model for the showroom and a detailed one only when the user zooms into the bay or cutaway.
- If total assets outgrow Pages, plan a move to Cloudflare R2 or a CDN, write it up in `docs/decisions.md`, and **ask before doing it**.

---

## 5. 3D assets: sourcing and licensing

The owner will buy or download realistic models from **Sketchfab** (CC licences, or paid), **CGTrader** or **TurboSquid**.

Your job:
1. Keep a shopping list at `docs/asset-shopping-list.md`: for each car, engine, turbo, supercharger, intercooler, radiator, wheels, seats and aero part, list 2–3 candidate models with link, price, licence, polycount, whether the interior is modelled, and whether the engine bay is modelled.
2. **Licence check.** Only CC0, CC-BY or commercially licensed models. Credit every CC-BY asset on a `/credits` page. Skip anything tagged NoAI or non-commercial.
3. Build an **asset pipeline script** (`scripts/optimize-assets.ts` using `gltf-transform`) that turns raw models in `assets-raw/` (git-ignored) into optimized GLBs in `public/models/`. It should: rename parts to our naming convention, attach standard **mount points** as empty nodes (`mount_engine`, `mount_intake`, `mount_turbo`, `mount_exhaust`, `mount_radiator`, `mount_intercooler`, `mount_seat_driver`, and so on), compress, and generate LODs.
4. **Placeholder policy:** until a real model arrives, use a neutral grey "clay" placeholder with a visible `PLACEHOLDER` tag. Never ship a placeholder that pretends to be the real thing.
5. **Branding:** car and engine names are fine to use descriptively. Don't use manufacturer logos or badges as UI branding, and don't imply the site is endorsed by any carmaker.

---

## 6. The simulation engine (the heart of the project)

It lives in `src/sim/`, is pure TypeScript with no DOM access, and is fully unit-tested.

### 6.1 Engine model: airflow first
For each RPM point (idle → redline, every 100 rpm):

- Air mass flow = displacement × (RPM / 2) × volumetric efficiency(RPM) × intake air density.
  (For the rotary, use its own displacement and cycle convention, and document it.)
- The VE curve comes from engine data (cam profile and head flow class), modified by intake, exhaust, cams and headers.
- Intake air density comes from ambient pressure and temperature, **boost pressure** and **intercooler efficiency**. So charge temperature = ambient + compressor heating × (1 − intercooler efficiency).
- Power = air mass flow ÷ AFR × fuel energy × brake thermal efficiency. Knock limits reduce timing, and therefore efficiency, based on **octane**, charge temperature and compression ratio.
- **Forced induction:**
  - Turbo: a simplified **compressor map** (flow and pressure-ratio limits, efficiency islands) plus a spool model (boost threshold, response). Twin and sequential setups are supported.
  - Supercharger: a displacement per revolution (roots/twin-screw) or an impeller model (centrifugal: ProCharger, Vortech, Rotrex), pulley ratio, and parasitic drive loss.
- **Limits that cap output** (each one appears as a named warning when it's the bottleneck):
  injector duty cycle (> 85%), fuel pump flow, compressor surge or choke, rod/piston torque rating, clutch torque capacity, gearbox rating, diff/axle rating, and cooling capacity.
- Output: wheel hp and crank hp (drivetrain loss by layout and transmission type), torque, boost curve, AFR, EGT estimate, charge temp, and injector duty.

### 6.2 Thermal model
- Heat to coolant and heat to oil as a fraction of fuel energy.
- Radiator, oil cooler and intercooler capacity against the heat load, at a **user-set ambient temperature**. **Default is 45 °C** (Riyadh summer), with presets for 25 / 35 / 45 / 50 °C.
- A "sustained drift session" test: 3 minutes at 70–90% load with low airspeed. Does coolant or oil temperature climb past safe limits? This is where cooling mods earn their place.

### 6.3 Chassis / performance
Weight and front/rear distribution (engine swaps move mass), power-to-weight, gearing, tyre grip, and 0–100 km/h, ¼-mile and top-speed estimates. Keep these simple, but make them honest.

### 6.4 Fuel
Saudi pump fuel is the default (91 and 95 RON). Race fuel and E85 are options, each labelled with its availability. Octane directly limits timing and boost in the model.

### 6.5 Calibration and validation (required before any UI shows numbers)
- `tests/calibration/stock.test.ts`: every stock car and trim within ±3% of factory peak hp and torque, including the RPM where peaks occur (±250 rpm).
- `tests/calibration/known-builds.test.ts`: at least **3 documented real builds per car** (a published dyno sheet or build thread, with the source linked) within ±10% of peak whp.
- CI fails if calibration fails.
- The UI shows a **confidence band** and a small "How we calculate this" drawer that explains the model in plain language.

---

## 7. Parts, compatibility and cost

### 7.1 Data model (`src/data/`, JSON or TS, validated with Zod)
- `cars/*.json`: chassis, trims, stock drivetrain, weights, mount-point geometry, engine bay envelope (bounding volumes), transmission tunnel, and allowed swap kits.
- `engines/*.json`: geometry (length, width, height, weight), bellhousing pattern, sump options, VE curve, compression, bore/stroke, redline, internals torque rating, firing order, and sound profile.
- `parts/<category>/*.json`: turbos (compressor map points, A/R, flange), superchargers, intercoolers, radiators, oil coolers, fuel pumps, injectors, ECUs, clutches, gearboxes, diffs, axles, coilovers, angle kits, seats, wheels/tyres, aero, exhaust, intake, and cams.
- Every part has: `brand`, `model`, `partNumber` (if known), `specs`, `price { usd, source, date }`, `fitment` rules, `requires[]`, `conflictsWith[]`, and `mountPoint`.

### 7.2 Compatibility engine
- Rule types: physical envelope clearance (engine and turbo bounding boxes against the bay, bonnet and strut towers), mount or flange pattern match, bellhousing ↔ gearbox, torque rating chain (engine → clutch → gearbox → driveshaft → diff → axles), fuel system capacity, ECU support, and cooling capacity.
- The output has three levels:
  - ✅ **Fits**
  - ⚠️ **Fits with…** plus an auto-generated list of required supporting parts, each one addable with a single click
  - ❌ **Doesn't fit**, with the exact reason
- A **"Best combo" solver**: given a goal (target whp, budget in SAR, reliability priority, "drift-comp spec" or "street") and the current car, suggest the top 3 part combinations with the trade-offs explained.

### 7.3 Cost
- Parts total with price ranges (low/high) and a date stamp for each.
- **Labour estimate** in hours per job, multiplied by a user-settable hourly rate (default in SAR).
- Hidden costs checklist: fluids, gaskets, tuning or dyno time, wiring, alignment.
- USD ↔ SAR at the 3.75 peg. Shipping or import estimate as a separate line, clearly labelled as an estimate.

### 7.4 Engine sound
Synthesize it from cylinder count, firing order, RPM, load and exhaust type (so an I6 sounds different from a V8 or a rotary). Add turbo whistle and blow-off, supercharger whine, and backfire or pops on lift-off if it's tuned that way. It must be something you can switch off.

---

## 8. Visual design direction

**Concept: "Night shift in a real tuning shop."** A dark workshop lit by strong overhead strip lights and a warm work lamp. Concrete floor with subtle oil stains and reflections. Where the UI shows data, it should read like **motorsport telemetry and dyno software** (think MoTeC or a Dynojet print-out), not like a SaaS dashboard.

- Palette: near-black graphite (`#0d0e10`), raw concrete greys, **anodized part colours as accents** (signal orange for boost, coolant cyan, heat red→white for EGT), and a thin paper-white for data lines. No purple, no violet-to-blue gradients.
- Type: a condensed industrial display face for headings (e.g. *Barlow Condensed* or *Oswald*) and a technical mono for readouts (e.g. *IBM Plex Mono*). **Don't use Inter or the default system stack.**
- UI panels feel like **physical objects**: stamped metal tags, part-number stickers, torque-spec labels, masking-tape annotations on the dyno sheet. No frosted-glass cards, no pill buttons, no giant rounded corners.
- The 3D scene is the hero and fills the screen. UI lives in slim docked panels you can collapse.
- **Banned:** hero section with a gradient blob, three feature cards with icons, "Get started" CTA, emoji, cartoon icons, or a generic landing page. The site opens **straight into the garage** with the car on the lift.
- Motion: mechanical and weighted (the lift raises, the bonnet opens on a hinge curve, bolts spin out). Nothing floaty or bouncy.

### Camera modes
1. **Showroom:** orbit the exterior. Studio or garage HDRI, realistic reflections, AO, shadows.
2. **Engine bay:** bonnet opens and the camera moves in. Parts are clickable.
3. **Cutaway / X-ray:** the body becomes a ghosted section and the engine is sectioned to show:
   - pistons, rods and crank moving in sync with RPM and the correct firing order (or rotors and eccentric shaft for the 13B/20B)
   - valves opening on cam timing
   - a **combustion flash** in each cylinder at ignition (volumetric shader, colour and intensity driven by AFR and load)
   - **exhaust gas particles** flowing through the manifold → turbo turbine (which spins at a speed tied to the sim) → downpipe → cat/test pipe → muffler → tip, with **heat glow on the manifold driven by EGT**
   - intake air flowing through the compressor → intercooler (colour shift = temperature drop) → throttle → plenum
   - coolant flow through the block → radiator, visible when cooling mods are selected
4. **Cabin:** a first-person driver's seat view of the real interior, with gauges that move with the sim (tach, boost, oil pressure, water temp), plus any added gauges or seats.
5. **Dyno mode:** the car strapped to rollers, doing a live pull. The dyno sheet draws in real time next to it, with before/after overlay.

Performance target: 60 fps on a mid-range laptop GPU in showroom mode, and ≥ 45 fps in cutaway. Add a quality toggle (Low / High / Ultra).

---

## 9. Extra features (the owner wants these)

- **Before/after overlay** on every chart and a side-by-side comparison of two builds.
- **Build sheet export**: a printable PDF or image with the parts list, costs, dyno sheet and the supporting-parts checklist, ready to take to a workshop.
- **Share by link** (URL-encoded build) and a "Build of the week" gallery of curated example builds.
- **"What breaks first?" meter**: shows the weakest link in the drivetrain at the current power level.
- **Heat soak test** (Section 6.2) with a pass/fail stamp.
- **Stage presets** per car (Stage 1 / 2 / 3 / "Full send") that auto-fill realistic, sourced combos.
- **Honest mode tooltips**: when a part's gain is marketing-inflated, show the realistic dyno-proven number with a source.
- Suggest other ideas in `docs/ideas.md` as you go. Build them only after the owner approves.

---

## 10. Phases (one per session)

| # | Phase | Done when |
|---|---|---|
| 0 | Scaffold: Vite + TS + Three.js, CI (lint, typecheck, test), GitHub Pages deploy, `docs/decisions.md`, `docs/asset-shopping-list.md` | The live URL shows an empty garage scene with HDRI and a concrete floor |
| 1 | Data layer: Zod schemas, all 5 cars (every trim) and 12 engines with sources | Schema validation passes and each source link is recorded |
| 2 | Simulation engine + dyno chart (no 3D dependency) + calibration tests | Stock ±3% and known builds ±10% pass in CI |
| 3 | Parts catalogue (first 60+ parts), compatibility engine, cost, best-combo solver | Every launch swap in Section 3 resolves correctly, with its required parts |
| 4 | Asset pipeline + showroom with real car models (or honest placeholders) + part swapping on mount points | You can swap engine, turbo, wheels and seats, and see it in 3D |
| 5 | Engine bay + cutaway animation (combustion, exhaust flow, turbo, intake, coolant) | Animation stays in sync with sim RPM and firing order |
| 6 | Cabin view + live gauges + engine sound | First-person view works and sound tracks RPM and load |
| 7 | Dyno mode, compare, share link, build-sheet export, heat-soak test | All features in Section 9 work |
| 8 | Polish: performance, accessibility, mobile layout, credits page, Playwright screenshot tests | Performance targets met and screenshots reviewed |

At the end of each phase: update `docs/progress.md` (what's done, what's next, known issues), take screenshots with Playwright and look at them yourself, then commit and push.

---

## 11. How to report back each session

End each session with a short summary covering:
- what you built
- what you verified and how (test output, screenshots)
- any numbers still marked `estimated`
- decisions you made
- the one question you need the owner to answer (if there is one)
