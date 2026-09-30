# Progress

One phase per session (CLAUDE.md rule 1). The phase plan is in BUILD_PROMPT.md section 10.

| #   | Phase                                                                   | Status                                                                                                                             |
| --- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 0   | Scaffold, CI, Pages deploy, decisions, asset shopping list              | Done (merged)                                                                                                                      |
| 1   | Data layer: Zod schemas, 5 cars (every trim), 12 engines, with sources  | **Done** (parts 1, 2, 3a and 3b): all 5 cars, all 12 launch-swap engines (+ 4 stock-only), swap hardware for the 5 LS launch swaps |
| 2   | Simulation engine, dyno chart, calibration tests                        | **Part 2a done**: simulation engine, data loader, stock calibration (296 of 296 trims), dyno sheet. Part 2b next                   |
| 3   | Parts catalogue, compatibility engine, cost, best-combo solver          | Not started                                                                                                                        |
| 4   | Asset pipeline, showroom with real or placeholder models, part swapping | Not started                                                                                                                        |
| 5   | Engine bay and cutaway animation                                        | Not started                                                                                                                        |
| 6   | Cabin view, live gauges, engine sound                                   | Not started                                                                                                                        |
| 7   | Dyno mode, compare, share link, build sheet, heat-soak test             | Not started                                                                                                                        |
| 8   | Polish: performance, accessibility, mobile, credits, screenshot tests   | Not started                                                                                                                        |

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

### Follow-up the same day (owner's requests)

- **NoAI rule relaxed (owner's decision).**
  - CLAUDE.md rule 5 now allows a NoAI clause on CC0/CC-BY assets.
  - Those files are processed only by the asset scripts and never fed to an AI model. That includes screenshots: an AI-reviewed screenshot shows them as clay placeholders, and the owner reviews the real render.
  - The asset schema records `noAi` as true/false (true only on CC0/CC-BY), and validate-data lists the NoAI files.
  - In the shopping list, the MMC Works M3 E46 moved from Avoid to usable. CGTrader's "Royalty Free No AI" stays out, because it isn't CC0/CC-BY.
- **Factory manuals as primary sources.** Two research passes read Toyota's 1993 and 1997 New Car Features spec tables, Toyota's dealer Product Source books and US repair-manual chapters, and Nissan's S14 and B15 service manuals and parts catalogue. The S15's own manual couldn't be opened (login walls).
  - Supra:
    - seven estimated US weights replaced with Toyota's figures;
    - a US trim that never existed (1998 base 5MT) removed;
    - seven missing US trims added from Toyota's tables (the Sport Roof cars and the 1997 standard-roof Turbo 6MT);
    - the 1998 Torsen diff, the US rear tyre and the A340E code corrected or confirmed.
  - 2JZ: Toyota sources for the firing order, forged rods, piston oil jets and the export cam timing; US boost 11.6 psi; US redlines.
  - SR20: the SR20DET sump is at the **front** (the old "rear" estimate was wrong); S15 cams 240°/9.2 mm; ECU part numbers; S15 gearbox codes (FS6R92A, FS5W71C, RE4R01A); the Australian final drives.
  - I checked the Toyota scans by eye (every front + rear axle weight adds up to the printed total). I also found a Lexus spec sheet that settles the 1998 US 2JZ-GE at 10.5:1 against Toyota's Supra dealer book (10.0:1); it stays single-source with the conflict noted.
- **Commissioned models.** A new section in `docs/asset-shopping-list.md` covers what an artist would build for each car (exterior, cabin, bay, separate engines), the licence terms we'd need, published price anchors, and an estimate. The estimate for both cars and both engines is about $14,000–$57,000; a hybrid that keeps the free exteriors is about $4,800–$18,500 per car. It also covers the carmaker-rights caution. Evidence: `docs/research/commissioned-models-2026-09-26.md`.

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

## Phase 1, part 1: S15, Supra, SR20, 2JZ (2026-09-26)

Phase 1 is split across sessions because of the web-search limit (owner's call). This part covers the Nissan Silvia S15 and Toyota Supra JZA80 (every trim), their engines, a re-check of those two cars' shopping-list entries, and the Poly Haven HDRI.

### What's built

- **Schemas** (`src/data/schema/`):
  - `car.ts`: chassis, production period, dimensions, gearboxes with every ratio, and trims. A trim is market x grade x gearbox x period; it holds the engine variant, final drive, diff, curb weight, tyres, wheels, limiter and road tests. `geometry` is `pending-model` until Phase 4 (see decisions).
  - `engine.ts`: shared hardware (bore, stroke, materials, firing order, bellhousing, sump, internals and reported limits), plus per-market `variants` (compression, turbos, boost, injectors, cams, VVT, rated output with its rating standard). `launch-swap` engines must also carry weight, size, bellhousing, sump and internals.
  - `common.ts`: markets, YYYY-MM periods, and one unit list per quantity. Numbers are stored in the unit the source prints; `src/data/units.ts` converts to SI.
- **Validation:** `npm run validate-data` now checks cars and engines, that ids match file names, and that every trim points at a real engine variant and gearbox. It counts values by confidence and lists every `estimated` one.
- **Data:**

  Counts as of the end of the session, after the follow-up below:

  | File                                 | Contents                                                                                  | Verified | Single-source | Estimated |
  | ------------------------------------ | ----------------------------------------------------------------------------------------- | -------- | ------------- | --------- |
  | `cars/nissan-silvia-s15.json`        | 16 trims: JDM Spec-S, Spec-R, HICAS, Autech Version, Style-A, Varietta; AUDM 200SX        | 114      | 26            | 0         |
  | `cars/toyota-supra-jza80.json`       | 40 trims: 22 JDM (SZ, SZ-R, GZ, RZ, RZ-S, Aero Top), 16 USDM (incl. Sport Roof), 2 EUDM   | 217      | 130           | 4         |
  | `engines/sr20det.json` (launch swap) | Variants: S15 JDM MT (250 PS), S15 JDM AT (225 PS), S15 AUDM (147 kW), S14, S13           | 69       | 21            | 5         |
  | `engines/sr20de.json` (stock only)   | Variants: S15 Spec-S MT (165 PS), AT (160 PS), Autech Version (200 PS)                    | 32       | 14            | 0         |
  | `engines/2jz-gte.json` (launch swap) | Variants: JDM (280 PS / 44.0 kgf·m), JDM VVT-i (46.0 kgf·m), USDM (320 hp), EUDM (330 PS) | 63       | 20            | 0         |
  | `engines/2jz-ge.json` (stock only)   | Variants: JDM (225 PS), USDM (220 hp), USDM VVT-i (225 hp)                                | 35       | 8             | 0         |

  Main sources: Nissan's and Toyota's own releases and history pages; Toyota's 1993 and 1997 Supra New Car Features books and '93/1998 dealer Product Source books; the Nissan S14 and B15 service manuals and Nissan's parts catalogue; the Autech brochures; the Japanese catalogue databases (goo-net, Car Sensor, carview); Toyota USA's newsroom; Car and Driver road tests; and the MKIV NZ club's reproduction of Toyota's tables. Every source note quotes the line that states the value.

- **HDRI:** Poly Haven's _Autoshop 01_ (2k EXR, CC0, checksum-matched) replaces the interim warehouse copy. It's graded at load time to dim its daylight skylights, which put a blue glint in the oil stains that no light in the night bay explains (see decisions and `docs/screenshots/phase-1/`).
- **Shopping list:** the S15 and Supra entries were re-checked on the live listing pages, and the paid licences' terms were read and quoted. Findings are under "Known issues".

### How it was verified

- `npm run lint`, `npm run typecheck`, `npm test` (114 tests) and `npm run validate-data` all pass. New tests cover the car and engine schemas, unit conversion, the night grade, and the committed data files themselves (validation plus spot checks of the headline figures).
- `npm run e2e`: all six Playwright tests pass on the new HDRI.
- Screenshots reviewed by eye from four angles, at High and Low, on both backends and on a phone; the set is in `docs/screenshots/phase-1/`.
- I spot-checked the research myself against the live pages: Nissan's 1999 press kit (1,240 kg, the 6MT ratios, the 3.692 final drive) and goo-net's automatic Spec-R page (3.916 final drive, 1,270 kg, 225 PS at 6,000 rpm) both match what's stored. The MKIV NZ club page matches the 2JZ dimensions and turbo models. I also overturned one of my own assumptions: the S15's factory intercooler is a side-mount (DSPORT, plus an owner thread), not a front-mount. In the follow-up I read Toyota's New Car Features pages 256-257 and 124-125 and the 1998 Product Source pages 2 and 7 myself, and checked the RocketBrush and Polycount price figures on their pages.

### Checks against the BUILD_PROMPT seed table

- **S15 Spec-R:** 250 PS / 28.0 kgf·m (274.6 Nm) holds, but only for the 6MT; the 4AT Spec-R is 225 PS. The curb weight is 1,240 kg (6MT), not about 1,250 (1,250 is the HICAS car, 1,270 the 4AT).
- **Supra:** 280 PS JDM and 320 hp US hold. Torque is 44.0 kgf·m (431 Nm) before 1997-08 and 46.0 kgf·m (451 Nm) after, and 315 lb-ft (427 Nm) in the US; the EU car is 330 PS / 441 Nm. Weight: the JDM RZ 6MT is 1,490 kg (1993-96) or 1,510 kg; the US Turbo 6MT is 3,415 lb (1,549 kg) at launch in Toyota's tables, and 3,445-3,505 lb (1,563-1,589 kg) later or with the Sport Roof. So the seed's 1,500-1,570 kg mixes markets and years.
- **Wikipedia errors found and not used:** 2JZ-GTE JDM torque (says 44.3 kgf·m at 3,800; Toyota says 44.0 at 3,600), the claim that the US non-turbo was dropped for 1998 (Toyota USA shows a 225 hp VVT-i base car), and the Australian 200SX torque (161 lb-ft does not match 265 Nm).

### Numbers marked `estimated` (9, down from 19)

- **Supra, 4:**
  - the EU Turbo 4AT curb weight: the EU 6MT figure plus Toyota's US automatic-minus-manual difference (no European Toyota table was reachable);
  - the model-year span of the three MY1993.5-96 Sport Roof trims added in the follow-up. Toyota's MY1993.5-94 and MY1997-98 documents list them, but no MY1995-96 line-up was found.
- **SR20DET, 5:**
  - dimensions, 3 values: Wikipedia's SR20DE figures, axis order assumed, turbo excluded. No Nissan source gives outline dimensions; the S14 service manual was searched in full;
  - cast pistons: no Nissan document states the material;
  - the S13 side-mount intercooler: the S13 manuals are behind a login.

### Known issues and gaps

1. **SR20DET rod material is still unresolved** after the manual pass. The service manual gives dimensions only. It's stored as powdered-metal from one retailer page, and forum posts say forged but couldn't be opened. It matters for the Phase 2 limits.
2. **Weak single sources to know about:** SR20DET dry weight (166 kg, an enthusiast table of unknown origin), 2JZ-GTE dry weight (230 kg; published figures run from 226 to 270 kg and none say what's included), the reported bottom-end limits for both engines (tuner and forum claims), 2JZ injector sizes (440/550 cc vs 430/540 cc; Toyota's New Car Features gives no flow figure), and all Europe-market Supra figures except final drive and diff (from ultimatespecs, an aggregator).
3. **Not found, so left out:**
   - redlines and fuel-cut rev limits, except the US 2JZ redlines;
   - 2JZ-GTE boost for the JDM VVT-i and EU engines, and cams for the JDM VVT-i engine;
   - US and EU 2JZ ECU numbers;
   - Australian SR20DET injectors, ECU and cams;
   - front/rear weight split (Toyota's tables and the NZ club print axle loads; they're in the notes).
     S15 stock boost is now 9 psi from one magazine test (single-source).
4. **Shopping list (S15 and Supra):**
   - No free, stock-bodied S15 exists: every original-looking CC-BY S15 has a kit. The recommended free picks are zhe_kan's S15 (new find, aftermarket bumper and wheels, basic interior) and TinoD2's Supra (stock body, probably no interior). Neither has an engine bay.
   - The Sketchfab Store has stopped selling (it redirects to Fab), and CGTrader now sells only "Royalty Free (no AI)".
   - None of the stores' standard licences allows a plain GLB served to the browser; TurboSquid's forbids it outright. TurboSquid and Fab pages couldn't be opened (bot checks).
   - Commissioning is costed in the shopping list's "Commissioned models" section, for the owner to decide.
   - Commissioning or not, a model of a real car doesn't clear the carmaker's design rights; see the caution there.
5. **350Z, E46 and RX-7 shopping-list entries** are still the unchecked Phase 0 leads.
6. **Carried over from Phase 0:** the procedural floor (no scanned texture yet), performance unmeasured on real hardware, asset pipeline scope, no floor reflections, and no code licence chosen.

## Phase 1, part 2: 350Z, E46, VQ35DE/HR, M54B30, S54B32 (2026-09-27)

This part covers the Nissan 350Z / Fairlady Z (Z33) and the BMW E46 330i/330Ci and M3 (every trim found), their engines, and a re-check of both cars' shopping-list entries on the live pages.

### What's built

- **Schema additions** (see decisions): `automated-manual` gearboxes (BMW SMG / SMG II), the `wagon` body style, the `speed-sensing-clutch-lsd` differential (BMW's M differential lock), the `intake-and-exhaust-continuous` VVT value (double VANOS; VQ intake CVTCS plus exhaust e-VTC), and an optional published `torqueCurve` on engine variants. Tests cover each.
- **Data:**

  | File                                | Contents                                                                                                                          | Verified | Single-source | Estimated |
  | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------- | --------- |
  | `cars/nissan-350z-z33.json`         | 126 trims: 39 JDM (every Fairlady Z grade 2002-2008), 14 Europe/UK (2003-2009), 73 US (MY2003-2009 by grade, body and gearbox)    | 1087     | 210           | 134       |
  | `cars/bmw-3-series-e46.json`        | 58 trims: 330i/330Ci 20 Europe + 25 US (incl. ZHP), M3 13 (coupe, convertible, CSL, Competition/ZCP; manual and SMG II)           | 454      | 289           | 34        |
  | `engines/vq35de.json` (stock only)  | Variants: JDM 280 PS, JDM 35th (280 PS rev-up), JDM 294 PS, Europe 206 kW and 221 kW (with Nissan's torque curves), US 287/300 hp | 79       | 21            | 14        |
  | `engines/vq35hr.json` (launch swap) | Variants: JDM 313 PS, Europe 230 kW, US 306 hp; 7,500 rpm; its own bellhousing pattern                                            | 39       | 14            | 13        |
  | `engines/m54b30.json` (stock only)  | Variants: Europe 170 kW (231 PS), US 225 hp, US ZHP 235 hp / 6,800 rpm                                                            | 39       | 8             | 1         |
  | `engines/s54b32.json` (launch swap) | Variants: Europe 343 PS, US 333 hp, CSL 360 PS; 8,000 rpm                                                                         | 42       | 18            | 4         |

  Main sources: Nissan's 2004 350Z service manual (archive.org) and 2003-2007 manual sections (mirrors on pdf.textfiles.com and Google Drive), Nissan's owner's manuals, Nissan Japan releases and its own back-number catalogue, Nissan Europe/GB spec sheets and releases, Nissan USA press kits, the 2008 US brochure, EPA test-car data; BMW NA technical training (ST034, ST036, ST041, ST045, ST055, ST505, ST601), BMW AG/GB/NA press kits and spec sheets, BMW NA brochures, and the ETK parts catalogue (bmwfans.info mirror). Japanese catalogue databases (goo-net, GAZOO, carview, Car Sensor), ADAC, German price lists and magazine road tests fill in grades and weights. Every source note quotes the line it relies on.

- **Shopping list:** the 350Z, E46 330i and M3 entries were re-checked on the listing pages (Sketchfab Data API and pages, Blend Swap, SQUIR). Findings are under "Known issues"; the raw re-check is `docs/research/asset-recheck-350z-e46-2026-09-27.json`.

### How it was verified

- `npm run lint`, `npm run typecheck`, `npm test` (123 tests) and `npm run validate-data` all pass. New tests: the roster, the headline ratings of all four engines per market, the European torque curves peaking at the rated torque and rpm, the 350Z final drives on every trim, the M3's 3.62 final drive, and the torque-curve schema.
- `npm run e2e`: all six Playwright tests pass. I looked at the five screenshots it takes (WebGPU, forced WebGL 2, Low preset, panel toggled, phone). This part adds no UI, and they match the part 1 set in `docs/screenshots/phase-1/`, so no new set is committed.
- Research quotes were machine-checked against the saved page text by each research pass. I read the key factory pages myself: the 2004 and 2005/2007 Nissan manuals' SDS pages (displacement, bore and stroke, valve timing, valve springs, compression), the US press kits (287/300/306 hp, redlines, rev limit, aluminium block, cam chain), BMW's ST034/ST036/ST045/ST041 tables, BMW AG's 2003 technical-data table (330i dimensions, compression, weights) and BMW NA's 2003 spec sheets.
- One number checked on the live page in the earlier half of the session: the M3 final drive (ETK part 33 10 2 282 480 "I=3,62").

### Checks against the BUILD_PROMPT seed table

- **350Z, "287-306 hp by year":** holds for the US. The 287 hp VQ35DE ran MY2003-2006 (the 2006 automatics kept it); the MY2005 Track and 35th Anniversary 6MT and every MY2006 6MT had the 300 hp rev-up engine; every MY2007-2009 car has the 306 hp VQ35HR. Japan rated them 280 PS, 294 PS and 313 PS; Europe 206 kW (280 PS), 221 kW (300 PS) and 230 kW (313 PS).
- **350Z, "about 1,450 kg":** Japanese coupes are 1,430-1,520 kg (JIS, no driver) and roadsters 1,550-1,610 kg; US coupes 3,188-3,404 lb (1,446-1,544 kg, aggregator figures); European coupes 1,525-1,557 kg without a driver.
- **E46, "231 PS / 343 PS":** holds for Europe (330i 170 kW / 231 PS, M3 252 kW / 343 PS). The US ratings are 225 hp (ZHP 235 hp) and 333 hp; the CSL is 360 PS.
- **E46, "about 1,450-1,570 kg":** the 330i sedan is 1,505 kg in BMW AG's EU figure (1,430 kg DIN) and 3,285 lb (1,490 kg) in the US; the M3 coupe is 1,495 kg DIN (1,570 kg EU) and 3,415 lb (1,549 kg) US; the CSL 1,385 kg DIN. The seed mixes the two weight standards.

### Numbers marked `estimated` (200)

- **350Z US model-year windows, 73:** Nissan gives on-sale months for only some model years, so the rest use calendar-year precision (see decisions).
- **350Z, 61 more:**
  - 5 US curb weights with no published figure (neighbouring aggregator figures plus the gearbox or model-year difference);
  - 12 viscous-LSD calls where Nissan lists the differential for the grade but not the body (MY2004-2007 roadster manuals, the 35th Anniversary);
  - the European MY07 final drive (5 trims; from Nissan Japan's 2007 catalogue, since Europe's ratios are unchanged);
  - the US NISMO 350Z body dimensions (from Japan's Version NISMO), the MY2009 roadster's dimensions and rim sizes (carried over from MY2008), and the 35th Anniversary's rear track (its wheel offset isn't published);
  - the car's production end (2009; no Nissan date found).
- **E46, 34:** 21 curb weights (SMG, ZHP, Competition/ZCP and European GM-automatic cars use the matching standard car's weight), 11 periods (US model-year changes, the 330i Touring's start) and 2 SMG weight splits.
- **Engines, 32:** VQ35HR weight, outline dimensions and internal materials; S54 weight (from BMW's 2007 statement) and outline dimensions (from BMW's bore spacing, stroke and rod length); M54 weight (from BMW's kg/kW figure); VQ valve lifts from the manuals' valve-spring heights (20 values).

### Known issues and gaps

1. **VQ35HR and S54 size and weight are estimates.** No manufacturer figure exists in any source found. The VQ35HR outline comes from an aggregator that gets other facts wrong, and the S54 outline is a geometric estimate (about +/-60 mm). Phase 4 should measure both from the engine models.
2. **US 350Z curb weights are aggregator figures.** No Nissan weight table survives online; only six grade/year points are confirmed by a press car or magazine. The aggregators disagree for MY2005 and MY2008 (the MY-specific set is used, noted per trim).
3. **Weights use different standards by market** (JIS no driver, Nissan Europe no driver, BMW AG EU with a 75 kg driver, US curb weight). Each note says which; Phase 2 has to normalise them.
4. **The European BMW rating standard is not printed** by BMW AG or BMW GB, so it's `unknown`.
5. **Open questions in the sources:** the US ZHP manual's final drive for 03/2003-02/2004 builds (ETK says the 3.07 part starts 03/2004; BMW NA says 3.07 from launch), the E46 M3 oil capacity (5.5 L training manual vs 5.0 L owner's manual), the S54 Z3 M peak-power rpm, and whether a ZHP convertible automatic existed (not listed).
6. **Not found, so left out:** JDM 350Z speed limiter figure, 350Z ECU part numbers, VQ35HR cam lift, S54 injector flow at a stated pressure, M54 cam durations and outline dimensions, and 2000-2001 European 330i weights.
7. **Shopping list (350Z and E46):**
   - No clean, textured, stock-bodied free 350Z exists. Your decision (2026-09-27): not barking_dogo's model, because its uploader also posts extracted game models. The plan is tahseen's old Blend Swap model, which passed the originality and CC-BY check on the live pages; if it can't be used, the 350Z stays a grey clay placeholder. Paid or commissioned is a later decision.
   - The best free 330i is still Ricy's M Sport sedan, with no interior; the M3 pick is MMC Works' CC-BY model, which carries a NoAI clause (handled per rule 5; no image of it was viewed) and whose author says the proportions are approximate.
   - CGTrader, TurboSquid, Fab, 3DModels.org and cgmood couldn't be opened this session. SQUIR's M3 is Editorial-only.
   - Engine leads: one whole S54 of unknown origin (CC-BY), a VQ35DE block on GrabCAD (non-commercial terms), nothing for the M54 or VQ35HR.
8. **Terms-of-use note:** a research agent accepted the Nissan Europe newsroom's download agreement to open its spec sheets. Only facts are cited; no files are re-hosted (see decisions). Since 2026-09-27 that needs your approval first (CLAUDE.md rule 13).
9. **The 350Z data file is 2.3 MB**, mostly repeated source notes on 126 trims. It isn't loaded by the site yet; a Phase 2 loader should strip provenance for the client bundle.
10. **Carried over:** the procedural floor, performance unmeasured on real hardware, asset pipeline scope, no floor reflections, and no code licence chosen.

## Phase 1, part 3a: RX-7 FD3S, 13B-REW, 20B-REW (2026-09-27 to 2026-09-29)

Started 2026-09-27, paused by the owner the same day, resumed and finished 2026-09-29. The research that was saved at the pause (`docs/research-notes/part3a.md`) was reused, not redone.

### What's built

- **Rotary engines in the schema** (`src/data/schema/engine.ts`; decisions, 2026-09-27):
  - Engines are a union on `layout`. A rotary has `rotors`, rotor geometry (R, e, b and the maker's chamber displacement), ports with port timing, spark plugs per rotor, housing and rotor materials, and rotary internals with rotary limit components. Rotary variants have no cams or cam phasing; any variant can record staged fuelling (`secondaryInjectorFlow`).
  - Validation rejects a rotary displacement that isn't rotors x chamber displacement, a chamber displacement more than 1.5 % off 3·√3·R·e·b, and a firing order that misses a rotor.
- **The displacement and cycle convention** (decisions, 2026-09-29, with its Mazda sources; code in `src/data/displacement.ts`): displacement as Mazda states it (654 cc x rotors), rpm is eccentric-shaft rpm, and a rotary breathes its whole displacement per shaft turn while a four-stroke breathes half. Rotor geometry R = 105 mm, as Mazda's training handbook prints it (Yamamoto's 102 mm + 3 mm offset).
- **Smaller schema changes:** trims can record `seats`; periods compare at shared precision (`1995-04` to `1995`).
- **Data:**

  | File                                 | Contents                                                                                                                                                                                                                                         | Verified | Single-source | Estimated |
  | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ------------- | --------- |
  | `cars/mazda-rx-7-fd3s.json`          | 56 trims: 43 JDM (every Efini and Mazda RX-7 grade 1991-12 to 2002-08, series 1-6, with the limited editions and Spirit R Type A/B/C), 9 US (MY1993-1995: base, R1/R2, manual and automatic), Europe, UK, Australia and the RX-7 SP; 4 gearboxes | 358      | 143           | 41        |
  | `engines/13b-rew.json` (launch swap) | Variants: JDM 255 PS, 265 PS and 280 PS manuals, JDM 255 PS automatic, US 255 hp manual and automatic, export 176 kW (Europe, UK, Australia), Australian SP 204 kW, Eunos Cosmo 230 PS                                                           | 82       | 33            | 8         |
  | `engines/20b-rew.json` (launch swap) | Eunos Cosmo 280 PS / 41.0 kgf·m (one variant; no change recorded 1990-1995)                                                                                                                                                                      | 18       | 8             | 8         |

  Main sources: Mazda's Japanese brochures for series 1, 3, 5 and 6, the Type R-II Bathurst leaflet and Mazda's Japanese news releases (archive.org, newsroom.mazda.com); Mazda's 1993 and 1994 US workshop-manual technical data, 1993 Service Highlights and 1993-1995 US brochures (foxed.ca, archive.org); Mazda Germany's FC/FD training handbook and the 1992 Dutch brochure; Kenichi Yamamoto's _Rotary Engine_ (Mazda, 1981); the 1990 Eunos Cosmo brochure and Mazda Motorsports' 1997 competition parts catalogue. The goo-net, Car Sensor and carview catalogues corroborate the JDM grades; auto motor und sport, evo, Shannons and AusRotary cover Europe, the UK and Australia.

- **Shopping list:** every RX-7 entry re-checked on the listing pages, from text and metadata only (no model images viewed). Findings are under "Known issues"; the evidence is `docs/research/asset-recheck-rx7-2026-09-29.json`.

### How it was verified

- `npm run lint`, `npm run typecheck`, `npm test` (140 tests) and `npm run validate-data` all pass. New tests: the rotary schema and its checks, the convention helpers, periods at shared precision, the roster, the 13B-REW geometry (654.7 cc from R, e and b) and airflow per shaft turn, every 13B-REW market rating, the 20B-REW rating, and the RX-7's gearing by market, the two-seat Spirit R Type A and the SP.
- `npm run e2e`: all six Playwright tests pass. I looked at the screenshots (WebGPU, WebGL 2, Low preset, panel toggled, phone). This part adds no UI and they match the part 1 set, so no new set is committed. No NoAI assets exist yet.
- I read Mazda's 1993 US technical-data pages myself (section 1 of the research notes). Every web quote in the research was machine-checked against the saved page text by the research passes. Confidence labels were computed from the number of independent sites (goo-net and GAZOO count as one), never copied.

### Checks against the BUILD_PROMPT seed table

- **"255 hp US - 280 PS JDM":** holds. The US car is 255 hp SAE at 6,500 rpm (6,200 rpm automatic). Japan: 255 PS (1991-1995), 265 PS for 5MT cars from 1996, 280 PS for the Type RS/R/RZ/Bathurst/Spirit R 5MT from 1999; every automatic stays at 255 PS. Europe, the UK and Australia: 176 kW (239 PS). The Australian SP: 204 kW.
- **"About 1,280 kg":** JDM cars are 1,240-1,330 kg (JIS, no driver), US cars 2,789-2,881 lb (1,265-1,307 kg), European and UK cars 1,310 kg, and the SP 1,218 kg (homologated).

### Numbers marked `estimated` (57)

- **RX-7, 41:**
  - 23 differential types: JDM grades whose catalogue pages say only "LSD"; Mazda's brochures call it Torsen on every grade they cover.
  - 6 limited-edition periods: the sale month is sourced, but the end is the end of the series they were sold in.
  - 3 final drives from the base grade: Type R Bathurst X, Type RB Bathurst X, and the Type RS-R (Mazda names the Type RS as its base).
  - 3 US R1/R2 weights: Mazda prints one 5MT weight per model year.
  - 6 UK and Australian values: final drive and tyres, taken from the European car.
- **13B-REW, 8:**
  - weight (155 kg, from two weak sources that disagree);
  - outline dimensions: one owner's tape measurement of an FC 13B turbo, 19 x 16 x 20 in;
  - sump position;
  - rotor material and eccentric-shaft forging (Mazda's 1981 general text only);
  - the Cosmo 13B's intercooler (taken from the 20B Cosmo).
- **20B-REW, 8:**
  - **firing order:** the rotors are 120° apart, but 1-2-3 against 1-3-2 isn't in any readable source;
  - weight: 185 kg, built up from the 13B's figure;
  - outline dimensions: DRIFTED's figures, used as a placeholder;
  - sump, rotor material and eccentric shaft.

### Known issues and gaps

1. **Left out for lack of data:**
   - the 1992 and 1993 Type RZ limited editions: no source prints their weight or gearing;
   - the 1996-98 Australian car: one secondary source, output only;
   - every Canadian car: 1993-95 sales are confirmed, but no Canadian specification source was found.
2. **Market weights use different standards:** JIS without a driver, US curb weight, and unstated for Europe and the UK. Each note says which.
3. **The 1994-95 US weights (2,826 / 2,881 lb) are provisional.** The only free scans are 400-pixel previews, and Mazda's 1996 full-line brochure appears to read 2,830 / 2,883 lb. ImportArchive offers the 300 dpi scans only after a donation. Your decision (2026-09-29): no donation, and the weights stay as they are (see decisions).
4. **Gearing outside Japan and the US** comes from one magazine (auto motor und sport) for Europe, and is assumed for the UK, Australia and the SP. None of the Mazda JDM documents prints a gearbox code.
5. **Rotary swap hardware is thin:**
   - Mazda publishes no weight, outline dimensions, turbo model or JDM injector flow for either engine;
   - the 13B-REW turbos are recorded as two Hitachi HT-12s (single-source), and the 20B-REW's as an HT15 primary and HT12 secondary (single-source);
   - reported limits are only Mazda Motorsports' general advice on stock apex seals at 8,000 rpm and above; no reputable stock-power limit was found;
   - Phase 4 should measure both engines from their models.
6. **Research stops under rule 13** (nothing was accepted or signed up for):
   - a Scribd 1995 US brochure (log-in to download);
   - three archive.org lending-library books (log-in to borrow);
   - ImportArchive's high-resolution scans (donation);
   - Motor-Fan WebOption articles behind an age and smoker prompt, which was not answered;
   - Blendkit downloads (log-in).
7. **Shopping list (RX-7):**
   - No free, allowed, stock-bodied FD3S with an interior or an engine bay exists.
   - The best free bodies are realwallon's and hidan1199's CC-BY models, both probably exterior-only. You'd need to look at them in the Sketchfab viewer, since no images were viewed here.
   - Lexyc16's CC-BY model has a NoAI clause and would be a low-detail fallback.
   - Most old leads turned out to be game rips, re-uploads, Editorial or NC. CGTrader and TurboSquid couldn't be opened.
   - lunchinthetree's CC-BY photo scans of a real FD engine bay are useful as reference only.
8. **The RX-7 data file is 747 KB**, mostly source notes. As with the 350Z, a Phase 2 loader should strip provenance for the client bundle.
9. **Carried over:** the procedural floor, performance unmeasured on real hardware, asset pipeline scope, no floor reflections, and no code licence chosen.

## Phase 1, part 3b: 1JZ-GTE, RB25DET NEO, RB26DETT, LS1, LS3, K24 and the LS swap hardware (2026-09-29)

This part finishes Phase 1. Nine research passes ran in parallel (six engines, three for the LS swap hardware), each told to follow CLAUDE.md rule 13. All nine were cut off by an API rate limit partway through; after the reset they were resumed from where they stopped, not restarted.

### What's built

- **Schema** (decisions, 2026-09-29):
  - `src/data/schema/swap.ts` and `src/data/swaps/`: one file per car and engine family. A swap file lists real parts, each as its vendor or maker lists it (product, part number, price in the printed currency, what's included, what it says you also need), and the slots it fills. validate-data checks that every swap fills the slots BUILD_PROMPT section 3 names (mounts, gearbox or adapter, sump, wiring, ECU), that the car exists, that its engines exist and are launch-swap engines, and that a kept gearbox (`carGearbox`) is one of the car's transmissions. Swap files can also list sourced car-level `fitment` facts and `modifications`.
  - Engines: `sumpOptions` (factory pans by donor, maker swap pans, multi-swap aftermarket pans, each with position, part number and depth where printed), `camProfileSwitching` (Honda VTEC), and the `rod-bolts` and `valvetrain` limit components.
  - `Price` in the seller's currency (USD, AUD, JPY, GBP, EUR, SAR), kept out of the SI units.
- **Data:**

  | File                                   | Contents                                                                                                                                                             | Verified | Single-source | Estimated |
  | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------- | --------- |
  | `engines/1jz-gte.json`                 | Twin-turbo 1990-96 (JZA70, JZX81, JZX90, JZZ30; 280 PS / 37.0 kgf·m at 4,800) and VVT-i 1996-2006 (JZX100, JZX110, JZS171, late JZZ30; 38.5 kgf·m at 2,400)          | 44       | 9             | 5         |
  | `engines/rb25det-neo.json`             | ER34 5MT (35.0, then 37.0 kgf·m from 2000-08), ER34 4AT (34.0), WC34 Stagea AT and 5MT, C35 Laurel, Y34 Cedric/Gloria 4WD (260 PS, then 250 PS)                      | 71       | 29            | 11        |
  | `engines/rb26dett.json`                | BNR32, NISMO, N1; BCNR33, V-spec N1; BNR34, N1, Nür; Stagea 260RS. 280 PS; 36.0 / 37.5 / 40.0 kgf·m by generation                                                    | 132      | 30            | 3         |
  | `engines/ls1.json`                     | C5 Corvette (345 hp; 350 hp manual and automatic), F-body Z28/Formula/Trans Am and SS/WS6 (305-325 hp), 2004 GTO, Holden VT II to VZ Monaro, HSV VT II (16 in all)   | 49       | 136           | 16        |
  | `engines/ls3.json`                     | C6 Corvette (430 hp; 436 hp with the dual-mode exhaust), Camaro SS manual, G8 GXP, Chevrolet SS, Holden VF II SS, HSV 317/325 kW, crate LS3, LS376/480, LS376/525    | 121      | 38            | 12        |
  | `engines/k24.json`                     | The K24s swappers use: K24A2 (2004-05, 2006-08 TSX), JDM K24A RBB (200 PS), K24Z3 (2009-14 TSX), K24Z7 (2012-13, 2014-15 Civic Si), K24A1 CR-V block (2002-05, 2006) | 49       | 68            | 5         |
  | `swaps/nissan-silvia-s15--gm-ls.json`  | 50 parts (Sikky RHD S15 packages and parts, Collins/ISR CD009 route, KE Conversions, Chase Bays, Wiring Specialties S15 harnesses) + common LS hardware              | 27       | 176           | 0         |
  | `swaps/toyota-supra-jza80--gm-ls.json` | 42 parts (Sikky MKIV line, Collins LS-to-CD009 kit) + common LS hardware                                                                                             | 24       | 133           | 0         |
  | `swaps/nissan-350z-z33--gm-ls.json`    | 56 parts (Sikky, Hinson, TDR, Sikky CD00X adapter for DE and HR gearboxes, Wiring Specialties CAN-bus harnesses and modules) + common LS hardware                    | 22       | 193           | 0         |
  | `swaps/bmw-3-series-e46--gm-ls.json`   | 55 parts (Sikky, TDR, Pennsyltucky, Vorshlag; PMC and Rank One adapters for the car's ZF and the M3's Getrag 420G; Wiring Specialties) + common LS hardware          | 27       | 185           | 0         |
  | `swaps/mazda-rx-7-fd3s--gm-ls.json`    | 51 parts (Sikky with its PPF brace, Hinson's subframe and torque-arm package, radiators, Wiring Specialties US-car harnesses) + common LS hardware                   | 23       | 181           | 0         |

  The common LS hardware in every swap file: GM donor PCMs (P01 "0411" for the 24x LS1, E38 for the 58x LS3) with HP Tuners, the Chevrolet Performance LS3 controller kit, Holley Terminator X kits, Wiring Specialties and PSI standalone harnesses, fuel filter-regulators, and the gearbox routes each car's kits support (donor T56, Tremec Magnum or Magnum-F, TR6060, CD009 adapters), with clutches.

  Main sources:
  - **Toyota:** the September 1996 JZX100 repair book (archive.org), Toyota's parts catalogue (japan-parts.eu mirror, public pages only), toyota.jp and goo-net catalogue data, and 1992 and 2001 Chaser brochures.
  - **Nissan:** the English R32 GT-R service manual and R34 supplement (archive.org), Nissan's 1998 and 2000 Skyline and 1998 Stagea releases (the inline page images; the PDF downloads sit behind a licence prompt and were not opened), Nissan's parts catalogue (megazip.net) and NISMO's catalogues.
  - **GM:** GM Heritage vehicle-information kits and MVMA specification forms (gm.com), Chevrolet Performance's 2026 catalogue pages and crate-engine spec sheets, GM press kits, Holden handbooks and brochures.
  - **Honda:** Acura and Honda press kits, Honda Japan's auto-archive spec sheets, and the 2002 CR-V service manual.
  - **Swaps:** the vendors' own product pages and install guides.

### How it was verified

- **Checks:** `npm run lint`, `npm run typecheck`, `npm test` (158 tests) and `npm run validate-data` all pass.
- **New tests:**
  - the swap schema and its cross-file checks (slots, part ids, pairings, engines, kept gearboxes, fitment);
  - sump options, VTEC and the new limit components;
  - the full roster: 5 cars, the 12 launch-swap engines by code, and 4 stock-only engines;
  - every LS swap has a part in each required slot for the LS1 and for the LS3 separately (they need different ECUs and harnesses);
  - spot checks of each new engine's headline figures.
- **Quote checks:** every quoted passage in the new files was machine-checked against the saved page text. That is 1,872 quotes across the six engine files and 2,156 across the five swap files, with 0 missing. What couldn't be machine-checked is labelled in its note: page images and scanned PDFs (GM Heritage kits, Chevrolet Performance catalogue pages, Nissan and Toyota manual pages) and two PSI pages read through WebFetch.
- **Checked by hand** on the page images:
  - Chevrolet Performance's 2026 catalogue p. 34 (the crate LS3: 19540155, 430 hp at 5,900, 425 lb-ft at 4,600, nodular-iron crank, powdered-metal rods, hypereutectic pistons, 10.7:1, 6,600 rpm, "Includes Gen IV F-Car Oil Pan");
  - GM's 1998 Camaro MVMA forms, pp. 2 and 3A (the LS1 at 305 hp / 335 lb-ft SAE J1349, and "Total dressed engine mass (wt) dry: Automatic: 214.5 kg, Manual: 234.3 kg");
  - Nissan's R32 GT-R manual EN-3 (2,568 cc, 86.0 x 73.7 mm, 8.5:1, "Dimensions (L x W x H) 870 x 665 x 675");
  - Toyota's parts-catalogue illustration of the JZX100 block and pans (front sump);
  - Acura's 2004-2006 TSX spec sheets (200 hp at 6,800, then 205 hp at 7,000 SAE net).
- **One research claim corrected:** the S15 pass reported two sources for the S14 and S15 sharing a front suspension member. nissanpartsdeal.com doesn't mention the S15, so the fact is single-source (decisions).
- `npm run e2e` passes (six Playwright tests) and the screenshots match the part 1 set. This part adds no UI.
- The conflicts between sources, how each was settled, and the leads for Phase 3 are in `docs/research-notes/part3b.md`.

### Checks against the BUILD_PROMPT roster

The seed list names the swap engines without figures: "LS3 6.2 V8", "LS1 5.7 V8" and "K24 I4" hold (6,162 cc, 5,665 cc and 2,354 cc as the makers state them). "RB25DET NEO" is the 1998-on NEO, not the R33's RB25DET, and "1JZ-GTE (including the VVT-i version)" is two variants: the twin-turbo engine and the VVT-i single turbo.

### Numbers marked `estimated` in this part (52)

- **1JZ-GTE, 5:** weight 210 kg (the middle of 207, 210 and 225 kg, none saying what's included); outline dimensions copied from the 2JZ-GTE (same bore pitch; the height is an upper bound); the twin-turbo intercooler's side-mount position (by analogy with the JZX100).
- **RB25DET NEO, 11:** outline dimensions (midpoints of an aggregator's unsourced ranges); the 4WD pan's front sump (inferred from the RB26 AWD pan); cast pistons (inferred); the WC34, C35 and Y34 intercooler positions (5 variants: the WC34 and C35 share the ER34's cooler part; the Y34 is a placeholder); the late Y34 turbo part (carried over).
- **RB26DETT, 3:** the BNR32 boost (76 kPa, converted from Nissan's 570 mmHg, a unit the schema doesn't take); the BCNR33 V-spec N1's end date (end of R33 production); the Stagea 260RS intercooler position (from the GT-R).
- **LS1, 16:**
  - the 1998-2000 SS/WS6 torque rpm (4,400, from search snippets only);
  - the 10.1:1 compression of seven variants whose documents don't print it (GTO, Holden VX, VY, VY SS, VY II, VY II SS, HSV VT II), taken from every other GM and Holden LS1 document;
  - the periods of eight Holden and HSV variants (from handbook and brochure print dates).
- **LS3, 12:**
  - length and height (geometric, about ±60 mm);
  - the C6 and Zeta pan positions (read from drawings);
  - the C6 injector flow, twice (converted from GM's 5 g/s);
  - the G8 GXP's power and torque rpm (the Chevrolet SS's, which carries the same 415/415 rating);
  - four periods (the HSV 325 kW version, and the start of the crate LS3, LS376/480 and LS376/525 from the earliest dated GM documents).
- **K24, 5:** outline dimensions (geometric); the K24Z3 pan position (KPower says the pans interchange with the K24A); forged rods (Honda says only "high-strength connecting rods").

### Known issues and gaps

1. **Weak engine weights.** No maker weight was found for the 1JZ-GTE, RB25DET NEO, RB26DETT or K24:
   - the RB25's 260 kg sits among published figures of 180-260 kg;
   - the RB26's 255 kg is from a table of unknown origin;
   - the K24's 280 lb is one vendor's "fully dressed" figure.

   GM's figures (LS1 214.5 kg dressed, LS3 183 kg) are the only maker weights in this part. Phase 4 should weigh nothing but can measure the outlines from the engine models.

2. **Outline dimensions** are estimated for the 1JZ-GTE, RB25DET NEO, K24 and LS3 (length and height). The LS3 width (30.25 in) is GM's accessory-drive envelope, and the LS1's is Speedway Motors' labelled figure. Only the RB26DETT's comes from its maker.
3. **Reported limits** are builder and tuner guidance, not failure tests, and are single-source apart from the LS3's (GM's 6,600 rpm, and Edelbrock's warranted 599 hp / 547 lb-ft supercharger kit on a stock LS3). The schema can't say whether a torque limit is at the crank or the wheels. The K24's 500 lb-ft rod guidance is at the wheels, and says so in its context.
4. **Swap gaps:**
   - Sources don't cover these at all:
     - which factory GM pan clears any of the five cars (the kits use their own pans, or name the Holley 302-1 for the E46);
     - an adapter to keep the Supra's W58 or V160/V161, or the RX-7's own gearbox;
     - LS1 against LS3 bonnet clearance in the FD;
     - whether the E46's DSC works after the swap;
     - any Japanese vendor for the S15.
   - Sourced but single-source: the S15 fitment of most "S-chassis" parts, many of which are US left-hand-drive 240SX parts (each part's notes say what its listing names).
   - An open question in the sources: GM wants 60 psi constant fuel pressure for its LS3 controller kit, while the common Corvette filter-regulator is fixed at 58 psi.
5. **Prices** are as listed on 2026-09-29, before tax, shipping and options, in the currency printed (USD, plus EUR and GBP for the PMC and Rank One adapters). Several parts were sold out that day, which is noted per part. Option-dependent prices (driveshaft by gearbox, harness options) are in the notes, since a part has one price.
6. **Stopped at a gate (rule 13); nothing was accepted, signed up for, paid or submitted:**
   - the Nissan newsroom's PDF downloads (licence prompt);
   - TollBit pay-per-crawl redirects on k20a.org, skylineowners.com and gtr.co.uk;
   - Wiring Specialties' and Sikky's add-to-cart disclaimers;
   - lending-library manuals on archive.org.
7. **Blocked from here:** holley.com, summitracing.com, jegs.com, media.gm.com, toyota-global.com, Amayama and Partsouq (403s or bot checks), and web.archive.org (no connection).
8. **Earlier launch-swap engines** (SR20DET, 2JZ-GTE, VQ35HR, S54B32, 13B-REW, 20B-REW) still have one `sump` value and no `sumpOptions`, and the S15<-2JZ, RX-7<-2JZ and E46<-S54 swaps have no swap file yet (this part covered the swaps that use its engines).
9. **Carried over:** the procedural floor, performance unmeasured on real hardware, asset pipeline scope, no floor reflections, and no code licence chosen.

## Phase 1 final check (2026-09-29)

- **Cars, 5 (every trim):** Nissan Silvia S15 (16 trims), Toyota Supra JZA80 (40), Nissan 350Z Z33 (126), BMW E46 330i/330Ci and M3 (58), Mazda RX-7 FD3S (56).
- **Launch-swap engines, all 12 in BUILD_PROMPT section 3:** 2JZ-GTE, 1JZ-GTE, SR20DET, RB25DET NEO, RB26DETT, VQ35HR, LS3, LS1, K24, S54B32, 13B-REW, 20B-REW. Plus 4 stock-only engines for the stock trims: SR20DE, 2JZ-GE, VQ35DE, M54B30. A test checks this list by engine code.
- **Swap hardware:** the five LS launch swaps (S15, 350Z, E46, RX-7 and Supra with an LS) have swap files. The other three (S15<-2JZ, RX-7<-2JZ, E46<-S54) have the engine-side fitment data only.
- **`npm run validate-data` passes:** 27 data files; 3,317 values verified, 2,141 single-source, 318 estimated. Every source link and access date is recorded.

### Every value still marked `estimated` (318)

`npm run validate-data` prints each one's JSON path, and each value's `method` in its file says how it was made.

| File                                                 | Estimated | What                                                                                                                                                                                                                                                                  |
| ---------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cars/nissan-350z-z33.json`                          | 134       | 73 US model-year windows; 5 US curb weights; 12 viscous-LSD calls; 5 European MY07 final drives; 26 body dimensions (US NISMO from Japan's Version NISMO, the MY2009 roadster, the 35th Anniversary's rear track); 12 rim sizes (MY2009 roadster); the production end |
| `cars/mazda-rx-7-fd3s.json`                          | 41        | 23 differential types (Torsen where the catalogue says "LSD"); 6 limited-edition periods; 5 final drives (3 from the base grade, 2 UK/Australian from the European car); 3 US R1/R2 weights; 4 UK/Australian tyre sizes                                               |
| `cars/bmw-3-series-e46.json`                         | 34        | 21 curb weights (SMG, ZHP, Competition/ZCP and European GM-automatic cars from the matching standard car); 11 periods (US model-year changes, the 330i Touring's start); 2 SMG weight splits                                                                          |
| `cars/toyota-supra-jza80.json`                       | 4         | the EU Turbo 4AT weight; the periods of 3 MY1993.5-96 Sport Roof trims                                                                                                                                                                                                |
| `cars/nissan-silvia-s15.json`                        | 0         |                                                                                                                                                                                                                                                                       |
| `engines/ls1.json`                                   | 16        | see part 3b above                                                                                                                                                                                                                                                     |
| `engines/vq35de.json`                                | 14        | 14 valve lifts (7 variants x intake/exhaust, from the manuals' spring heights)                                                                                                                                                                                        |
| `engines/vq35hr.json`                                | 13        | weight; 3 outline dimensions; crank, rods and pistons; 6 valve lifts                                                                                                                                                                                                  |
| `engines/ls3.json`                                   | 12        | see part 3b above                                                                                                                                                                                                                                                     |
| `engines/rb25det-neo.json`                           | 11        | see part 3b above                                                                                                                                                                                                                                                     |
| `engines/13b-rew.json`                               | 8         | weight; 3 outline dimensions; sump position; rotor material; eccentric-shaft forging; the Cosmo 13B's intercooler                                                                                                                                                     |
| `engines/20b-rew.json`                               | 8         | firing order; weight; 3 outline dimensions; sump position; rotor material; eccentric-shaft forging                                                                                                                                                                    |
| `engines/1jz-gte.json`                               | 5         | see part 3b above                                                                                                                                                                                                                                                     |
| `engines/k24.json`                                   | 5         | see part 3b above                                                                                                                                                                                                                                                     |
| `engines/sr20det.json`                               | 5         | 3 outline dimensions; cast pistons; the S13 side-mount intercooler                                                                                                                                                                                                    |
| `engines/s54b32.json`                                | 4         | weight; 3 outline dimensions                                                                                                                                                                                                                                          |
| `engines/rb26dett.json`                              | 3         | see part 3b above                                                                                                                                                                                                                                                     |
| `engines/m54b30.json`                                | 1         | weight                                                                                                                                                                                                                                                                |
| `engines/2jz-gte.json`, `2jz-ge.json`, `sr20de.json` | 0         |                                                                                                                                                                                                                                                                       |
| `swaps/*.json` (5 files)                             | 0         | every part value is single-source or verified                                                                                                                                                                                                                         |

## Phase 2, part 2a: simulation engine, stock calibration, dyno sheet (2026-09-30)

The owner split Phase 2: part 2a is the simulation engine, the data loader, the stock calibration and the dyno sheet; part 2b is the known-build calibration, the thermal model and the fuel model.

### What's built

- **Simulation engine (`src/sim/`).** Pure TypeScript with no DOM or Three.js: ESLint blocks the imports at every folder depth, and `tsconfig.sim.json` compiles it without the DOM library. It runs in a Web Worker (`src/app/sim-worker.ts`), so the 3D view never waits for it.
  - **Airflow first:** for every 100 rpm from idle to redline, the air mass per revolution is the swept volume per revolution times volumetric efficiency (VE) times dry-air density. Rotaries use `src/data/displacement.ts`: one intake per rotor per eccentric-shaft turn, so the 13B takes 1.308 litres per turn. Fuel is added at the full-throttle lambda (0.87 NA, 0.80 turbo, 0.72 rotary turbo). Torque comes from the fuel energy times an efficiency set by compression ratio and lambda, less friction (Blair's piston FMEP; a separate rotary fit), pumping and back pressure.
  - **Knock:** hotter charge air, higher manifold pressure and lower octane move ignition timing away from the factory calibration (Russ, SAE 960497), and retarded timing costs torque (MIT and GM data). The model never adds timing beyond the stock map.
  - **Turbos:** a simplified compressor map (surge and choke lines, efficiency islands, a speed limit), turbine flow and power, a wastegate, spool, and a pull-back when the compressor reaches surge, choke or overspeed. Single, parallel and sequential twins (one turbo below the changeover rpm), with intercooler effectiveness and pressure drop.
  - **Superchargers:** positive-displacement (Roots and twin-screw, with leakage and bypass) and centrifugal (head rising with tip speed squared, on a map), with the drive power subtracted. Unit-tested; no stock car in the roster has one, so they get used when Phase 3 adds supercharger parts.
  - **Limits, each a named warning on the sheet:** injector duty over 85 % and compressor surge, choke or overspeed cap the curve where they bind. Rod and piston, clutch, gearbox and diff/axle ratings are flagged when exceeded but don't bend the curve; most stock ratings aren't on file yet, so these show "No data". Fuel pump: no data. Cooling: not modelled until 2b.
  - **Drivetrain loss:** an estimate of what a roller chassis dyno reads, pulled in the gear nearest 1:1: gearbox (manual in its direct gear 2 %, other manual gears 4 %, automatic 10 %, SMG 2 %) x final drive (6 %) x tyre on the roller (8 %), about 15 % for a manual.
  - **Uncertainty band:** the factory figure's own tolerance, an unprinted rating standard, the distance from a published point (the curve between peaks is the model's shape), the turbo spool region, the distance between your conditions and the rating's, and the calibration's own residual, added as independent parts.
- **Data loader** (`src/data/loader.ts`, served by `scripts/vite-plugin-catalogue.ts` as a build-time module). It strips every source, note and method, converts to SI and normalises curb weights to one basis, full tank and no driver: an EU "mass in running order" loses its 75 kg driver, a DIN or 90 %-tank figure gets a range up to 6 kg heavier, and a weight whose basis isn't stated keeps its figure with a range down to 75 kg lighter. The site's worker, catalogue included, is 283 kB (39 kB gzipped), and neither bundle contains Zod.
- **Reference data, all sourced:**
  - `src/data/standards/power-ratings.json`: the reference air of JIS D 1001, SAE J1349, DIN 70020 and EEC 80/1269 / ECE R85, from the EU texts (Publications Office), the JIS text (kikakurui.com), ISO 1585 (free preview) and secondary sources for SAE and DIN, whose texts are paid. Plus the rules for figures printed without a standard (see decisions).
  - `src/data/standards/fuels.json`: the fuel each market's figures are taken to be rated on, and the Saudi pump fuels PG91, PG95 and PG98 (Aramco started selling 98 in early 2026 in Riyadh, Jeddah, the Dammam area and on the highways between them).
  - `src/data/standards/weight-bases.json`: what each market's published weight includes.
  - `src/data/model/assumptions.json`: all 72 model constants, each with its value, unit, confidence and sources or method.
  - `2jz-gte.json`, `13b-rew.json` and `20b-rew.json` gained the sequential turbos' changeover rpm (single-source).
- **Stock calibration** (`tests/calibration/stock.test.ts`, run in CI): every trim (296 across the 5 cars) and every engine variant (95, including the swap-only engines) is within 3 % of its factory peak power and torque, with each peak within 250 rpm, compared under its own rating standard on its market's rating fuel. The two published Nissan Europe 350Z torque curves match at every point (17 and 18 points, all within 0.01 %; the fit uses those points directly, so this checks the solver more than the physics). The largest peak miss anywhere is 0.23 %, the European 350Z's power. The fit can't pass by inventing an impossible engine: VE must stay between 0.45 and 1.25, and an inferred stock boost must be plausible. The full table is in `docs/calibration.md`.
- **Dyno sheet.** A docked panel on the right (a collapsible bottom sheet on a phone):
  - car and trim pickers, with trims grouped by market; ambient keys 25/35/45/50 °C (default 45); fuel keys 91/95/98 RON (default 95); unit keys for hp/PS/kW, N·m/lb-ft, bar/psi and °C/°F; all remembered per browser;
  - a paper stock-check sticker: the factory figures, their standard and reference air, the model at the same conditions, and the pass mark;
  - peak crank power and torque with their band, estimated wheel power, and peak boost (or charge-air temperature for NA engines);
  - the chart (custom SVG): power solid and torque dashed in paper white, the band, dotted traces at the rating conditions, crosses on the factory figures, masking-tape peak labels, a hatched spool region and a boost strip for turbo engines, and a crosshair you can drive with the arrow keys;
  - the curve as a table, the named limits, and a list of what is estimated for that trim;
  - the "How we calculate this" drawer, in plain language, with the standards table and every assumption, its confidence and its sources.

  CLAUDE.md rule 3 is enforced in the worker: a trim that fails its stock check gets a report with no simulated numbers at all, only the factory figures and the reasons, so the page can't show them by mistake. No trim fails today.

### How it was verified

- `npm run lint`, `npm run typecheck` (app, scripts, e2e and the DOM-free sim config), `npm test` (597 tests: the calibration suite above, plus physics, loader and report unit tests) and `npm run validate-data` all pass.
- `npm run e2e`: 11 Playwright tests against the production build, the six garage tests plus five for the dyno sheet: the default car with a passed check, a cooler day giving more power, trim and unit changes persisting over a reload, the keyboard crosshair, the drawer, and the phone layout (collapsed bar, opened sheet, no sideways scroll). Each also checks for console errors and failed requests.
- Physics checks in the unit tests: air density, vapour pressure (Buck), the rotary's 1.308 litres per turn, 1 % torque loss at 6 degrees of retard, a hot day losing power, EGT between 750 and 950 °C at peak power, about 15 % drivetrain loss, the injector cap, and P = T x ω.
- An independent cross-check on the rating standards: Holden quoted the same Gen III V8 at 460 N·m DIN and 450 N·m ECE (GoAuto, 2002), 2.2 % apart. The model, fitted once, puts the LS1 2.7 % higher at the DIN reference than at ECE (a test now holds it within 1 %).
- Screenshots (desktop, drawer, phone collapsed and open) were reviewed by eye; the set is in `docs/screenshots/phase-2a/`.

### Numbers marked `estimated`

- **Model assumptions: 46 of 72** are estimated, 20 single-source and 6 verified. The estimated ones are modelling choices where no source gives a number: the lambda and cycle constants, the efficiency scales, the rotary friction fit, stock spark retard, turbo mechanical efficiency and the stock-turbo sizing rules, intercooler effectiveness and pressure drops, EGT fractions, two gearbox efficiencies, the injector duty limit, the curve template (idle, spool, power drop past peak), the VE prior, the sequential changeover fallback, and all the band widths. The drawer lists every one.
- **Reference data:** the water-vapour pressure at the JIS, SAE and DIN references (1 kPa); the four market rating fuels (JDM 99, USDM 95, EUDM 98, AUDM 91 RON); the five rules for figures printed without a standard; and the fuel fill of two weight bases.

### Known issues and gaps

1. **A stock match is the starting point, not the proof.** The calibration fits each engine to its own factory figures, so passing shows the model reproduces them, not that it predicts a modified engine. The known-build check (3 documented builds per car within 10 %) is part 2b.
2. **Boost curve shapes are the model's.** Only a single boost figure is published for any stock engine, so the model infers the rest of the curve from the torque curve. For the 2JZ-GTE it lets boost fall from 0.75 bar to about 0.45 bar by 6,000 rpm to follow the published torque; the real stock boost probably holds flatter while VE falls. The sheet lists this as estimated; known builds should settle it.
3. **Rating fuel is set per market, not per engine.** Several figures state their own fuel (BMW and Nissan Europe 98 RON, Holden VT II and VF II 91 RON, the VZ Monaro 95 RON). The per-variant fuel belongs with the 2b fuel model.
4. **Unlabelled rating standards are assumed.** The European BMW and Toyota figures, the Australian Nissan, Mazda, HSV and later Holden figures, and the GM crate engines print no standard. The market rules (in decisions) are estimated; the Australian split at 2002 is extrapolated from Holden's own statement. These trims show a wider band and say so.
5. **2JZ-GTE US boost conflict (not changed):** the data holds 11.6 psi (single-source), while Toyota's 1997 repair manual gives 61-75 kPa (8.8-10.8 psi) at 5,600 rpm and up.
6. **13B-REW changeover conflict:** 4,500 rpm (fd3s.net) is used; Mazda's 1993 workshop manual tests at 5,500 rpm.
7. **No factory compressor maps are public,** so each stock turbo is sized to its own engine's figures. Aftermarket turbo maps come with the Phase 3 parts.
8. **Part ratings are mostly missing,** so most limit tags read "No data" until the Phase 3 parts catalogue adds them.
9. **Pressure defaults to sea level (101.3 kPa).** Riyadh, at about 600 m, is closer to 94 kPa, which costs an NA engine about 7 % more.
10. **The panel's speed on real hardware isn't measured.** In headless Chromium a sweep takes about 30-80 ms, including the first fit for an engine.
11. Carried over: the procedural floor, performance unmeasured on real hardware, no floor reflections, no code licence chosen.

## Phase 2, part 2b: altitude, known builds, heat soak, fuels and rendering performance (2026-09-30)

The owner answered the pressure question at the start: an altitude selector with Jeddah (sea level), Riyadh (about 600 m, the default) and a custom elevation, and turbo boost control that compensates at altitude until the turbo runs out of headroom.

### What's built

- **Altitude.** Jeddah, Riyadh and Custom keys on the sheet, with a custom elevation from -100 to 3,500 m, remembered per browser. Pressure comes from the US Standard Atmosphere 1976; Riyadh's 612 m gives 94.2 kPa. The sheet's conditions line says where and at what pressure ("At 45 °C in Riyadh (about 600 m, 94.2 kPa) on PG95"), and an altitude note says what the air costs: about 7 % for an NA engine in Riyadh.
- **Turbos at altitude.** The stock boost target is an absolute manifold pressure (the owner's rule): the wastegate opens less where the air is thin, so gauge boost rises (the S15 peaks at 0.68 bar in Riyadh, 0.61 in Jeddah) and a turbo car loses almost nothing, until the compressor reaches choke, surge or its top pressure ratio, or the turbine can't make the power. The sheet names which. At 2,000 m the FD still holds its target and loses 2 % where the 350Z loses 25 %.
- **Fuels.** Keys for 91, 95 and 98 RON, race fuel (VP MS109, 109 RON) and E85 (VP C85), each with where it can be bought in Saudi Arabia: PG91 and PG95 everywhere, PG98 in Riyadh, Jeddah, the Dammam area and on the highways between, race fuel and E85-type fuel in 5-gallon pails from VP's distributor in Jeddah (about 25 and 23.5 SAR a litre; no pump sells E85). Race fuel and E85 need a tune, and the sheet says the model assumes one. E85's heat of vaporisation cools the charge, and its extra volume shows the factory injectors running out.
- **Octane limits timing and boost.** Knock is judged against the factory calibration at its peak boost, per fraction of manifold pressure (decisions). A factory ECU on too low an octane retards up to 15° from best timing and then holds the boost down, and the sheet says "fuel octane" limits it (the RX-7 on PG91). A factory map never gains from a better fuel; a tune on race fuel or E85 runs at the knock limit.
- **Thermal model and the heat-soak test.** Heat to coolant and oil as shares of the fuel burnt (a rotary puts far more into its oil), engine and fluid thermal mass, a thermostat, an oil-to-water cooler (or the RX-7's oil-to-air cooler), and a radiator whose rejection falls with air speed. Each factory system is sized by one rule (105 °C at full rated power, 10 m/s, 40 °C day). The test is a 3-minute drift session at 70-90 % load with 3 m/s through the radiator at the chosen ambient, against limits of 115 °C coolant and 150 °C oil, with a coolant and oil trace against both. While a car has no radiator figures of its own, the stamp says "Estimated, generic sizing" instead of Passed or Failed, and so does the cooling check (the owner's ruling); a car's own radiator data brings back the hard stamp.
- **Known-build calibration** (`tests/calibration/known-builds.test.ts`, in CI). Documented real builds per car (`src/data/builds/`), each with its dyno sheet or build thread linked, its dyno make and model, its correction standard and, where printed, the day's weather. Each runs through the model with its parts (boost, a turbo with its compressor's published flow, intercooler, intake, exhaust in three levels, injectors, ECU tune, fuel), is turned into what its own dyno would have printed (reading factor against a Dynojet, times the sheet's correction at the day's air), and must land within 10 % of the sheet's peak wheel power. A build whose sheet contradicts itself can be shown but not counted. Every car needs three counted builds, except the Supra, which counts two by the owner's exception in its own data; its sticker says "Known builds: validated on stock turbos only; big-turbo builds unverified". The 20 builds on file are the fit set (in-sample); a build added from now on is scored out-of-sample first and keeps that score, shown next to the current one in `docs/calibration.md` and the drawer. The drawer has the whole table.
- **Dyno normalisation.** `src/data/standards/dynos.json`: Dynojet, Dynapack, Mustang, Dyno Dynamics, Mainline, SuperFlow and Rototest with their reading factors, each sourced or marked estimated, and SAE J1349, SAE J607 (STD), DIN 70020, EEC 80/1269 and uncorrected, with their reference air and formulas.
- **Model changes the known builds forced** (decisions): the proportional knock law; knock referred to the factory's peak-boost state; the stock compressor's pressure-ratio fraction (0.65 to 0.52) and the turbo VE fall above peak (0.6 to 0.05), chosen with the builds; a VE prior from the engine's own published-boost variants; the JDM S15's factory exhaust restriction from DSPORT's same-car tests; the rotary's tuned mixture (lambda 0.73 against the factory 0.66).
- **Rendering performance.**
  - A notice when the browser renders in software (SwiftShader, the Microsoft Basic Render Driver or llvmpipe), with how to turn on hardware acceleration in Chrome, Edge and Firefox and a one-click switch to Low quality; dismissed per session.
  - The 5.2 MB EXR is gone: `npm run bake-env` bakes the graded environment offline into a 485 kB prefiltered RGB9E5 file that loads without decoding or prefiltering in the browser.
  - The garage renders on demand: nothing is drawn while nothing changes, and the frame rate reads "idle".
  - The dyno chart's axes scale to the data with round steps (`src/ui/dyno/axes.ts`), for a 150 hp car and a 600 hp build alike.
  - CI checks a performance budget (`perf-budget.json`, `npm run budget`) on the production build: 996 kB for a first visit today (with the frame-rate check) against 1,126 kB, three.js 341 of 380 kB, and frame budgets for draw calls and triangles.
  - A frame-rate check: add `?fps=1` to the address (https://hazemalhayattrading.github.io/Swap-Lab-working-CAR/?fps=1). While it's open the garage draws every frame, and the panel shows the mean frame rate, the 1 % low, the worst frame, the share of frames over 18.3 ms, CPU time per frame, draw calls and triangles, with the backend, the GPU and the quality. It says whether the 60 fps target is held. Add `&quality=ultra` (or `low`, `high`) to measure each preset.

### How it was verified

- `npm run lint`, `npm run typecheck`, `npm test` (647 tests: the stock calibration, the known-build gate with the Supra's exception and the fit-set pin, and the unit tests), `npm run validate-data`, `npm run build` and `npm run budget` pass.
- `npm run e2e`: 15 Playwright tests. New: the Riyadh default with the estimated heat-soak stamp, the Supra's sticker and drawer row, the frame-rate check (`?fps=1` keeps drawing with nothing moving, and reads "not held" on SwiftShader), altitude and fuel keys (2,000 m giving 79.5 kPa, the 350Z in Jeddah making more than 1.15 times its power at 2,000 m), the known-build table in the drawer, the software-rendering notice and its Low switch, rendering on demand (idle when nothing moves, a frame on a key press, within the frame budget), and quality presets switching back and forth. That last test found a crash going Low back to High (three disposed a light's shadow node that cached render objects still used); shadows are now switched with the renderer flag only.
- The known-build results, the calibration constants and the heat-soak results were cross-checked with diagnostic runs (the grid searches in decisions), and the figures quoted in the constants' methods were re-measured after the final choice.
- Screenshots (desktop dyno sheet, heat-soak card, the Supra's sticker, drawer with the known-build table, phone, software notice, frame-rate check) were reviewed by eye; the set is in `docs/screenshots/phase-2b/`.

### Numbers marked `estimated`

- **Model assumptions: 86 of 121** are estimated (27 single-source, 8 verified). New in 2b: 49 constants, 39 of them estimated: the heat shares and cooling-sizing rule, fluid properties' defaults, the thermostat, the drift-session profile and the limits, the aftermarket intercooler, intake and exhaust restrictions, the default top pressure ratio of an unmapped turbo, supercharger defaults, the factory ECU's knock authority, and charge cooling.
- **Dynos:** the Mustang (0.885), Dyno Dynamics (0.85), Mainline (0.835) and SuperFlow (0.91) reading factors; the Dynojet factor is 1 by definition, Dynapack verified, Rototest single-source.
- **Fuels:** race fuel's and E85's heating values and heats of vaporisation, and C85's ethanol share.
- **Places:** Jeddah's elevation (rounded to sea level as the owner set it).
- **The JDM S15's factory exhaust restriction** (62 kPa, calibrated to DSPORT's same-car tests).
- **Known builds:** fields a sheet doesn't state (an exhaust described only as "exhaust", an unstated intake, US octane converted to RON, a boost read off a trace) are marked estimated with the reason in each build.

### Known issues and gaps

1. **The known-build gate is in-sample.** The same builds chose four constants and two rules, then pass. It shows the model can match all of them at once with physical constants, not that it predicts builds it hasn't seen. From now on a new build is scored out-of-sample first, before any refit, and the report keeps both scores (decisions).
2. **Per-car leanings remain.** The DSPORT S15s land 7-9 % high and the FDs 6-10 % low. The FDs' two Mustang sheets carry about ±10 % from the Mustang reading factor alone.
3. **Turbo builds peak later than their sheets** (by 60 rpm for the FD at 14.5 psi, up to 1,000 rpm for the EFR car), and the FDs' mid-range torque at boost is well under their sheets; the peaks match better than the shapes.
4. **The turbine has one efficiency.** It can't give a late spool and spare energy at the top at once, so the stock-ECU S15 that crept to 12 psi is spool-limited at about 11 psi near redline in the model.
5. **Knock has no rpm dependence**, and a factory ECU's knock control is modelled as sitting exactly at the borderline.
6. **The heat soak is an estimate on every car.** With the generic sizing, every stock car goes over a limit at 45 °C (most at 25 °C too), so the stamp says "Estimated, generic sizing" until each car has its own radiator figures (next steps). Toyota's JZA80 ratings sit well under the rule's figure, so real data won't make that car pass. Intercooler heat soak isn't modelled.
7. **Per-variant rating fuels:** the schema and model take a figure's own rating fuel (`ratingFuelRon`), but the variants that state one (BMW and Nissan Europe 98 RON, some Holden figures) aren't entered yet.
8. **The fuel-pump limit has no data** and still reads "No data".
9. **60 fps on the reference laptop (integrated Intel Arc) isn't measured yet.** This environment renders in SwiftShader only, which says nothing about real hardware. The owner measures it with `?fps=1`.
10. **The DSPORT GT3582R Supra is excluded** from the gate (its sheet contradicts itself; see decisions); it would be 10.4 % low.
11. Carried over: the procedural floor, no floor reflections, no code licence chosen.
12. **The Supra counts two builds, by the owner's exception.** No third JZA80 build meets the inclusion rules (three research passes, five near-misses in the last). Both counted builds run the factory twins, so big-turbo Supra builds are unverified, and the sticker says so. Still open: the owner is looking for a Saudi tuner's sheet (a stock bottom end, a named turbo with a published flow, the correction or the weather printed), which would also test the altitude model. The closest near-miss was rejected.
13. **For Phase 3, logged, not refitted (owner):**
    - **E46 bolt-on gains look overstated.** Like for like (the same STD correction, air and Dynojet), the model gives +16.9 whp (+5.7 %) for the intake elbow and cat-back on the stock tune: +12.0 from the cat-back, +4.9 from the intake. The "+31 whp" first quoted compares that STD figure with an SAE stock one; the correction difference is about 15 whp of it. The real car's own stock run isn't on file, and it reads 14-19 whp below the two stock M3s once all three are on STD, so one car can't give the real gain, but it doesn't support +17 either. This matters before the parts catalogue shows gains to users.
    - **The RX-7 is low on every build, and more so with boost:** -6.0 % (EFR 7670), -6.7 % at 12.5 psi, -9.5 % at 14.5 psi on the same car. The 13B's response to boost looks underestimated.
    - **Three builds sit within a point of the 10 % limit:** the E46 elbow build +9.6 %, the S15 on its stock ECU +9.3 %, and the FD at 14.5 psi -9.5 %.

## Next: Phase 3, parts, compatibility and cost

- The parts catalogue (turbos with compressor maps, superchargers, intercoolers, intakes, exhausts, injectors, pumps, ECUs, cooling parts), the compatibility checks and the full cost, per BUILD_PROMPT section 3 onward.
- Cooling parts are where the heat-soak failures get fixed; intercooler heat soak belongs with them.
- **Radiator data per car:** OEM radiator core dimensions (height, width, thickness, rows), which replacement-radiator sellers publish, for each launch car, so its heat soak runs on its own radiator (`basis: car-data`) and gets a hard Passed or Failed.
- **Before the parts catalogue shows gains:** check the bolt-on gains (intake, cat-back, headers) against same-car before-and-after sheets, and the 13B's response to boost (known issue 13). Any new known build is scored out-of-sample first.
- **The Supra's third build** when the owner finds a sheet; the exception then comes out of its builds file.
- Carried from Phase 1: Phase 3 (parts, compatibility, cost) should:
  - move the common LS hardware out of the five swap files into `parts/`;
  - add swap files for S15<-2JZ, RX-7<-2JZ and E46<-S54;
  - backfill `sumpOptions` for the six earlier launch-swap engines;
  - consider what the research passes asked the schema for: per-part variant prices and bundles, per-part applicability (LHD only, M3 only), clutch push/pull type, lifter type, failure modes without a number, and wheel against crank torque on limits.
- Phase 4 has to build the NoAI screenshot swap: a flag the AI-reviewed screenshot run sets, which shows NoAI assets as their clay placeholder (CLAUDE.md rule 5).
