# Progress

One phase per session (CLAUDE.md rule 1). The phase plan is in BUILD_PROMPT.md section 10.

| #   | Phase                                                                   | Status                                                                                                                             |
| --- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 0   | Scaffold, CI, Pages deploy, decisions, asset shopping list              | Done (merged)                                                                                                                      |
| 1   | Data layer: Zod schemas, 5 cars (every trim), 12 engines, with sources  | **Done** (parts 1, 2, 3a and 3b): all 5 cars, all 12 launch-swap engines (+ 4 stock-only), swap hardware for the 5 LS launch swaps |
| 2   | Simulation engine, dyno chart, calibration tests                        | Not started                                                                                                                        |
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

## Next: Phase 2

- Phase 2 (simulation, dyno chart, calibration tests) should add a `tsconfig` for `src/sim/` with no DOM library, alongside the ESLint guard, and normalise the weight standards. Its airflow model and the Phase 6 sound synthesis must use `src/data/displacement.ts` for rotaries. A Phase 2 loader should strip provenance for the client bundle (the data files are about 7.8 MB with their sources).
- Phase 3 (parts, compatibility, cost) should:
  - move the common LS hardware out of the five swap files into `parts/`;
  - add swap files for S15<-2JZ, RX-7<-2JZ and E46<-S54;
  - backfill `sumpOptions` for the six earlier launch-swap engines;
  - consider what the research passes asked the schema for: per-part variant prices and bundles, per-part applicability (LHD only, M3 only), clutch push/pull type, lifter type, failure modes without a number, and wheel against crank torque on limits.
- Phase 4 has to build the NoAI screenshot swap: a flag the AI-reviewed screenshot run sets, which shows NoAI assets as their clay placeholder (CLAUDE.md rule 5).
