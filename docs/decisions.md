# Decisions

Each entry has the date, the decision, why, and the alternatives considered (CLAUDE.md rule 11).

## 2026-09-26 (Phase 0)

### Plain Three.js, not React Three Fiber

- **Decision:** Vanilla TypeScript with `three/webgpu` and TSL. No React.
- **Why:** The render pipeline is the core of the product, and it's easiest to control directly: WebGPU renderer, TSL materials, the post chain, and later compute particles for the cutaway. The UI is a handful of slim docked panels, which don't need a component framework. It also keeps React (about 45 kB gzipped) out of the bundle.
- **Alternatives:** R3F + drei. It gives a nice declarative scene graph for part swapping, but drei's helpers lag behind on WebGPU/TSL, and they add a layer between us and the renderer. We can revisit this if the panels grow into a real app UI.

### WebGPU first, automatic WebGL 2 fallback

- **Decision:** `WebGPURenderer` from three r186. When WebGPU is missing, it switches to its own WebGL 2 backend. `?renderer=webgl` forces the fallback for testing. The readout shows which backend is running.
- **Why:** This is the stack in BUILD_PROMPT section 4. TSL materials compile to both WGSL and GLSL, so one material codebase serves both backends.
- **Alternatives:** Classic `WebGLRenderer` (no WebGPU, and no TSL compute for the Phase 5 particles). Separate renderers per backend (two material codebases).
- **Size note (CLAUDE.md rule 10):** three is about 1.2 MB minified (367 kB gzipped), above the 200 kB "ask first" line. It's the mandated core library, not an optional add-on, so I treated it as pre-approved. Say if you disagree. It's split into its own chunk, so app updates don't make returning visitors download it again. The app code itself is 20 kB (8 kB gzipped).

### A small WebGPU compatibility shim

- **Decision:** `src/render/webgpu-compat.ts` removes `swizzle: 'rgba'` from `GPUTexture.createView()` calls.
- **Why:** three r186 always sends that field. `'rgba'` is the identity swizzle and the spec default, so removing it changes nothing. But Chromium 141 (the build in this environment) shipped an older draft of the field and rejects the string, so no frame renders at all. Any user on a Chromium of that age would see a blank garage.
- **Alternatives:** Pin an older three (loses fixes). Detect Chromium versions (brittle). Remove the shim once those browsers age out.

### Toolchain versions

- **Decision:** TypeScript 6.0 (not 7.0), Vite 8, Vitest 5, ESLint 10 with typescript-eslint `strictTypeChecked`, Prettier, Playwright 1.63, Node 22.
- **Why:** typescript-eslint 8.70 supports TypeScript below 6.1, and type-aware linting matters more than the TS 7 compiler speed-up at this size.
- **Alternatives:** TS 7 with a lighter, non-type-aware lint setup. Revisit when typescript-eslint supports it.

### Dev-only tools are not "big dependencies"

- **Decision:** CLAUDE.md rule 10's "over 200 kB gzipped, ask first" is read as applying to code that ships to visitors. Build and test tools are dev dependencies and never reach the site: gltf-transform, meshoptimizer, `draco3d` (decodes Draco-compressed purchases), `tldts` (public-suffix list for source checks), Zod, Playwright.
- **Why:** None of them are in `dist/`. The bundle is three.js plus 20 kB of app code.
- **Alternatives:** Ask for each tool. Say if you want that.

### Self-hosted fonts

- **Decision:** Barlow Condensed (headings, stamped tags) and IBM Plex Mono (readout values) come from `@fontsource` packages, bundled by Vite. Both are OFL-1.1.
- **Why:** No third-party font requests, versions are pinned, and it works from GitHub Pages with nothing else to configure.
- **Alternatives:** Google Fonts CDN (an extra origin, no version pinning). Oswald instead of Barlow Condensed (both named in the brief; Barlow's narrower digits suit the readouts better).

### Zod only at build and test time

- **Decision:** Zod schemas live in `src/data/schema/` but are only imported by `npm run validate-data` and the tests. The client imports the JSON directly.
- **Why:** Validation is a gate before shipping, not something every visitor should download and run.
- **Alternatives:** Validate at runtime in the browser (costs bundle size and start-up time, and catches problems only after they've shipped).

### Provenance rules encoded in the schema

- **Decision (`src/data/schema/source.ts`):**
  - `verified` needs sources on at least two different sites. A "site" is the registrable domain, so `en.m.wikipedia.org` and `wikipedia.org` count as one. Wayback Machine links count as the site they archived, and trailing dots are ignored.
  - `single-source` needs at least one source.
  - `estimated` needs a written method (at least 20 characters). It may have no source, because BUILD_PROMPT section 2 says unsourced values are marked `estimated` and shown as such.
  - Source URLs must be public HTTPS sites: no localhost, IPs or placeholders like `https://tbd`. Access dates must be real ISO dates, not in the future.
- **Why:** CLAUDE.md rule 2 and BUILD_PROMPT section 3 ("check every one against at least two sources"). A schema that rejects a false "verified" is safer than relying on reviews.
- **Alternatives:** Compare full hostnames (let mirrors and subdomains pass as independent). Require a source for estimates too (would contradict BUILD_PROMPT and push toward made-up sources).

### One asset manifest drives licensing and credits

- **Decision:** `src/data/assets.json` lists every third-party file that ships, with licence, source, origin and status (`final`, `interim`, `placeholder`). `npm run validate-data` fails if:
  - any file in `public/`, or any image, font, model or audio file under `src/`, isn't listed. It's default-deny: first-party exceptions have to be named in `FIRST_PARTY_PUBLIC_FILES`;
  - an asset-bearing npm package (`@fontsource/*`, `@pmndrs/assets`) is a dependency but isn't listed, or its installed version differs from the manifest;
  - a listed file is missing, sits in a folder for a different kind (for example `public/models/cars/` must be `model-car`), or is over budget. Car and engine assets are also budgeted as a whole download, not only per file.

  The licence enum can only hold CC0, CC-BY, OFL, MIT, Apache-2.0 or `commercial`. The licence URL must be that licence's canonical page, and any Creative Commons NC, ND or SA URL is rejected. Every asset must also attest `restrictions` (NoAI, editorial-only, game rip, AI-generated) as `false`, because those ride on top of otherwise allowed licences. (Changed on 2026-09-26: a NoAI clause is now allowed on CC0 or CC-BY assets; see "NoAI clauses allowed on CC0 and CC-BY" below.)

- **Why:** The `/credits` page (Phase 8) can be generated from this list, and nothing can ship without a licence on record.
- **Alternatives:** A hand-maintained credits page (drifts from what ships). An allowlist of file extensions (the first version did this, and the review showed fonts, SVG and audio slipping through).

### Interim HDRI and a procedural floor (network policy)

- **Decision:**
  - Lighting uses Poly Haven's _Empty Warehouse 01_ (CC0), taken from the CC0 npm package `@pmndrs/assets` (512 x 256 EXR). The package doesn't name its source, so the manifest records the origin as `estimated`. It's matched on content, and on drei's `warehouse` preset from the same maintainers, which maps to `empty_warehouse_01`.
  - The concrete floor and block walls are procedural TSL PBR materials instead of scanned textures.
- **Why:** This environment's network policy blocks `polyhaven.com`, `dl.polyhaven.org`, `api.polyhaven.com` and `ambientcg.com`, and there was no other reachable source of scanned CC0 concrete.
- **Alternatives:**
  - Downloading through GitHub Actions: rejected. It would route around a network policy you set, without asking you.
  - Copying from other GitHub repos: outside this session's allowed repositories.
  - Shipping without an HDRI: fails the Phase 0 done-criteria.
- **Next:** When Poly Haven is reachable, swap in a 2k original (candidates: `autoshop_01`, `garage`, `auto_service`, `workshop`, which search confirms exist) and a scanned concrete set. Then keep the procedural oil stains, joints and bay paint as an overlay.

### The HDRI lights the scene; it isn't the backdrop

- **Decision:** The HDRI is only `scene.environment` (reflections and fill) at low intensity. What you see is a modelled two-bay workshop shell: floor, block walls, roller door, beams and strip lights.
- **Why:** A photo backdrop of another building never lines up with our floor, our shadows or our camera moves. A modelled bay gives correct parallax, and the car's reflections will come from lights that are actually in the room.
- **Alternatives:** HDRI as a visible background, or three's `GroundedSkybox` (projects the photo's own floor, which would hide our PBR floor and clash with car shadows).

### Light rig

- **Decision:**
  - Six `RectAreaLight` strips (about 5000 K, `#ffe4ce`) over the working bay; the neighbouring bays stay dark.
  - One warm (about 2700 K) wall flood lamp as a shadow-casting spot.
  - One dim, wide overhead spot, only to give future cars a contact shadow, because area lights can't cast shadows in three.js.
- **Why:** "Night shift": pools of light over the bay, darkness at the edges, one warm accent. 5000 K is a typical LED shop batten.
- **Alternatives:** A cooler 6500 K daylight tube (the first version was about 7500 K by mistake; the review caught it). All bays lit (loses the night mood). Point lights instead of area lights (wrong highlight shape on car paint and the floor).

### Tone mapping: AgX for now

- **Decision:** `AgXToneMapping` at exposure 1.
- **Why:** It handles the bright diffusers and lamp without the hue shifts ACES gives.
- **Alternatives:** ACES Filmic (hue shifts on bright emissives). Khronos PBR Neutral: keeps base colours more faithful, which matters for choosing paint. Compare it against AgX when car paint arrives (Phase 4).

### Post-processing and quality presets

- **Decision:**

  | Preset         | DPR cap | MSAA | Shadows | Bloom      |
  | -------------- | ------- | ---- | ------- | ---------- |
  | Low            | 1       | none | none    | none       |
  | High (default) | 1.5     | 4x   | 1024    | tight halo |
  | Ultra          | 2       | 4x   | 2048    | tight halo |

  The preset is stored in `localStorage`, and `?quality=` overrides it. Bloom is deliberately tight (strength 0.08, radius 0.05, threshold 3). On a phone, where several strips are in view at once, wider settings washed the dark shop out grey. A quality switch frees the old pass and bloom targets.

- **Alternatives:** Stronger bloom (reads as haze). FXAA or SMAA instead of MSAA (softer edges on the thin fixtures).
- **Deferred:** Screen-space or planar reflections on the sealed floor (Ultra, Phase 8 polish), and GTAO.

### Keyboard camera control

- **Decision:** The 3D view is focusable. Arrow keys orbit 6 degrees per press, and `+`/`-` (or PageUp/PageDown) move 10% closer or further, within the same limits as the mouse.
- **Why:** Otherwise the only interaction in the scene needs a pointer (WCAG 2.1.1).
- **Alternatives:** OrbitControls' built-in keys. They pan by default (pan is off here), and rotating needs a modifier key.

### CI and deploy in one workflow

- **Decision:** `.github/workflows/ci.yml` runs on every push and PR:
  - checks: lint, typecheck, unit + calibration tests, validate-data;
  - e2e: build, then Playwright against `vite preview` under the Pages base path.

  A push to `main` then deploys the exact `dist/` that e2e tested.

- **Why:** A red check can never reach the live site, and calibration failures (Phase 2) will block deploys automatically.
- **Alternatives:** Separate CI and deploy workflows (a deploy could run on a commit whose checks failed, and the deployed build would differ from the tested one). The branch-based Pages source (serves committed files, with no build step).
- **Needs from the owner:** Settings, then Pages, then "Build and deployment", Source: **GitHub Actions**. The workflow's token can't switch this on itself.

### Headless GPU testing

- **Decision:** Playwright runs Chromium with SwiftShader for both WebGPU and WebGL 2. The flags are in `playwright.config.ts`.
- **Why:** Both backends get tested, not just the fallback. `--disable-vulkan-surface` is deliberately left out: it makes WebGPU canvases come out black in screenshots.
- **Alternatives:** Test only the WebGL 2 path (misses WebGPU-only bugs, such as the swizzle issue above). A GPU CI runner (paid).
- **Local note:** In this cloud environment, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, because the pre-installed Chromium is older than the one Playwright 1.63 expects. CI installs the matching browser.

### Asset pipeline scope in Phase 0

- **Decision:** `npm run assets`:
  - reads GLB and glTF, including Draco-compressed and multi-buffer exports;
  - does dedup, prune (keeping empty nodes, so authored `mount_*` points survive), weld, resample and Meshopt geometry compression;
  - reports triangles and texture sizes;
  - fails on budget (car 25 MB, engine 8 MB, any file 100 MB), or if two inputs would write the same output (compared case-insensitively).
- **Deferred to Phase 4:** Renaming to our part names, adding `mount_*` empties, LODs, and KTX2 textures. The KTX2 encoder choice (the `toktx` CLI or a Basis WASM encoder) depends on what runs in CI.
- **Why:** Mount-point positions come from the car data (Phase 1), and there are no models to tune against yet.
- **Alternatives:** Draco instead of Meshopt for geometry. Meshopt decodes faster and also compresses animation data, and Draco input is still accepted.

### Paid models and redistribution: decided by the owner

- **Status:** Decided by the owner on 2026-09-26, at the start of Phase 1.
- **Decision:** Launch with free CC0 or CC-BY models only. Before any paid model is bought, its licence is checked: it must explicitly allow real-time or interactive web use, and it must not be "editorial use only". Those findings go in the shopping list, and the owner decides per model.
- **Why the question came up:** Everything in `public/` is committed to the repo and served as a plain file from GitHub Pages. Store licences generally allow use inside a product but not redistribution of the model file, and a GLB at a public URL may count as redistribution.
- **Alternatives:** Keep paid GLBs out of git and host them elsewhere. That's a hosting change and would need approval (CLAUDE.md rule 10), and the served file can still be extracted.

### Shopping-list research method

- **Decision:** Candidates were found with web search only, because Sketchfab, CGTrader and TurboSquid are blocked here. Every entry says "seen via search" and lists what is still unknown. Nothing is filled in by guesswork.
- **Consequence:** The session's 200-search budget ran out after the five cars, so engines and parts are not researched yet (see `docs/progress.md`).
- **Alternatives:** The Sketchfab Data API, which returns licence, face count and price exactly. It needs `api.sketchfab.com` allowed in the environment.

## 2026-09-26 (Phase 1, part 1: S15, Supra, SR20, 2JZ)

### Phase 1 is split across sessions

- **Decision:** At the owner's request, Phase 1 is split because of the web-search limit. This session covers the Nissan Silvia S15 and Toyota Supra JZA80 (every trim) and their engines. The Z33, E46 and FD3S and the other swap engines come next.
- **Why:** Source-checking every trim takes many page reads. Doing two cars properly beats five cars thinly.

### Numbers are stored in the unit the source prints

- **Decision:** A data file stores `280 PS`, `44.0 kgf·m` or `315 lb-ft` exactly as the source prints it, with a unit from a fixed list per quantity (`src/data/schema/common.ts`). `src/data/units.ts` converts to SI when the data is loaded.
- **Why:** Anyone can hold the file up against the source page and check it. Converting first would hide rounding, and an unconverted number next to its source is easier to audit (CLAUDE.md rule 2).
- **Alternatives:** Store SI only (loses the link to the source's own figure), or store both (two numbers that can drift apart).

### The rating standard travels with every output figure

- **Decision:** Each engine variant's rated output records its standard: JIS net, SAE net, DIN 70020, EEC 80/1269, ADR or unknown.
- **Why:** The 2JZ-GTE is 280 PS in Japan, 320 hp in the US and 330 PS in Europe. Part of that is hardware, and part is how it was measured. The Phase 2 calibration has to know which is which.

### What counts as a trim

- **Decision:** A trim is a market x grade x gearbox x period combination that differs in engine, rated output, gearbox, final drive, differential, tyres or curb weight. Equipment-only packages go in the trim's notes.
- **Why:** Those are the inputs the simulation and the weight model use. Splitting on trim-level equipment would multiply entries without changing any number.

### Engine variants, and stock-only engines

- **Decision:** An engine file holds what every version shares (bore, stroke, block, firing order, bellhousing, internals). `variants` holds what differs by year or market (compression, turbos, boost, injectors, cams, VVT, rated output). Each trim points at one variant.
  Engines have a `role`. The 12 launch swap engines are `launch-swap`, and for those the schema also requires weight, dimensions, bellhousing, sump and internals. The SR20DE (S15 Spec-S) and 2JZ-GE (Supra SZ and US base) power stock trims but aren't swap options, so they're `stock-only` with core specs.
- **Why:** Without the NA engines, "every trim" would leave out the Spec-S and the non-turbo Supras.
- **Alternatives:** Only list turbo trims (not every trim). Or make every engine a full swap entry, which is research for swaps nobody asked for.

### No volumetric-efficiency curve in the data files

- **Decision:** Engine files carry the published facts: rated output and rpm, compression, cams and turbos where sourced. The VE curve from BUILD_PROMPT 6.1 is fitted in Phase 2 against those figures, and the fit is what the calibration test checks.
- **Why:** No manufacturer publishes a VE curve. Writing one into a data file now would be invented data wearing a source.

### Mount points and bay envelopes wait for a to-scale model

- **Decision:** Car files have `geometry.status: "pending-model"` and no coordinates. Mount points and the engine-bay envelope will be measured in Phase 4 from a licensed, to-scale 3D model, or from a dimensioned drawing if one turns up. The schema only accepts `measured` geometry with a source for every point.
- **Why:** No reachable source gives bay dimensions or engine positions for either car, and guessing them would feed made-up numbers into the clearance checks.
- **Consequence:** Until then, the Phase 3 compatibility engine can only use explicit, sourced fitment rules (documented swap kits, bellhousing and mount patterns), not geometric clearance.
- **Alternatives:** Estimate the bay from exterior dimensions (would be a guess with a method attached). Measure from photos (no scale reference).

### Poly Haven Autoshop 01 replaces the interim HDRI

- **Decision:** Lighting and reflections now use Poly Haven's _Autoshop 01_ by Oliksiy Yakovlyev (CC0), as the 2k EXR (5.3 MB) downloaded straight from Poly Haven, with its checksum checked against Poly Haven's API. It replaces the 512 x 256 copy of _Empty Warehouse 01_ from an npm package, whose origin had to be marked `estimated`. It's still used only as `scene.environment` at intensity 0.08, never as a backdrop.
- **Why this one:** It's a car workshop lit by fluorescent strips, and Poly Haven records its white balance as 5050 K, close to our 5000 K strips. The other candidates were `garage` (mostly daylight through windows), `auto_service` (daylight-lit workshop) and `workshop` (a cluttered metal shop, with a 23 MB 2k EXR).
- **Why 2k:** three.js builds its reflection map at a quarter of the image width, so a 2k image gives 512-pixel cube faces. That keeps reflections on car paint sharp in Phase 4. A 1k image would halve that for a 1.5 MB saving.
- **Night grade:** The shop also has roof skylights. In the first render, the glossy oil stains picked up a blue-white glint from them, which no light in our night-time bay explains. `src/scene/night-grade.ts` now dims pixels that are both bright and clearly bluer than neutral (blue/red ratio above 1.12, full strength at 1.3) when the HDRI loads. Measured on the file, it removes 88% of the bright skylight energy, keeps 99% of the neutral strip-light energy, and takes out 25% of the HDRI's total light. The file on disk stays byte-identical to Poly Haven's, so provenance stays clean. The grade runs once at start-up (decode as float, grade, pack to half float).
- **Alternatives:** Rotate the HDRI (the skylights run the length of the roof, so rotating only moves the glint). Edit the EXR offline (the shipped file would no longer match Poly Haven's checksum). Pick a night-time HDRI (Poly Haven has no night-time car workshop).

### Source links may be plain HTTP

- **Decision:** `SourceSchema` now accepts `http:` as well as `https:` citation URLs. The other checks still apply: public host only, no IPs or placeholders, and no future dates. Asset licence URLs stay HTTPS-only. This relaxes the Phase 0 rule "Source URLs must be public HTTPS sites".
- **Why:** The best enthusiast reference for the JZA80 (mkiv.supras.org.nz, which reproduces Toyota's own spec tables) only serves HTTP. To satisfy the old rule, the 2JZ research cited Wayback Machine copies of it. The Wayback API then showed that no snapshot of that page exists, so 33 citations pointed at nothing. Citing the page that was actually read is the honest option.
- **Alternatives:** Keep HTTPS-only and drop the source (loses the only published figures for engine size, turbo wheels and cams), or keep the archive links (dead citations).

### NoAI clauses allowed on CC0 and CC-BY

- **Decision (owner, 2026-09-26):** A NoAI clause no longer rules out a model whose licence is otherwise CC0 or CC-BY, because we never train AI on assets. CLAUDE.md rule 5 now says so. In `src/data/assets.json`, `restrictions.noAi` is recorded as `true` or `false`. The schema accepts `true` only on CC0 or CC-BY, and validate-data prints every NoAI file.
- **Handling (from the owner's instruction):** NoAI files are processed only by the asset pipeline scripts, the build and the renderer. They're never fed to an AI model: not opened with Read or image tools, and not uploaded to AI services.
- **Screenshots (confirmed by the owner, 2026-09-26, as the safe reading):** Typical NoAI wording, such as the MMC Works M3 listing's "may not be used ... as inputs to generative AI programs", also covers renders. So screenshots that an AI reviews show NoAI assets as their grey clay placeholder, and the owner checks the real renders himself. Phase 4 has to build that swap, e.g. a query flag the e2e screenshot run sets. Automated pixel checks, which involve no AI, can run on the real render.
- **Scope:** Read literally, as "if the licence is otherwise fine (CC0/CC-BY)". A NoAI clause on a paid licence (all of CGTrader's current "Royalty Free No AI") is still excluded. Those models would mostly fail the web-delivery check anyway.
- **BUILD_PROMPT section 5** still says "skip anything tagged NoAI". CLAUDE.md overrides it.
- **Alternatives:** Keep excluding NoAI (loses otherwise good free models, such as the MMC Works M3 E46). Accept NoAI on any licence (goes beyond what the owner said).

## 2026-09-27 (Phase 1, part 2: 350Z, E46, VQ35DE/HR, M54B30, S54B32)

### E46 scope: 330i/330Ci and M3 in one car file

- **Decision:** `bmw-3-series-e46.json` holds every 330i/330Ci trim (sedan, Touring, coupe, convertible; Europe and US, including the US ZHP Performance Package) and every M3 trim (coupe, convertible, CSL, Competition Package/ZCP, each with manual and SMG II). Left out: other E46 engines, the 330xi/330xd AWD cars, diesels, the UK-only 330Ci Clubsport, and the S54 in the Z3 M and Z4 M (their ratings are noted in the S54 file, not modelled).
- **Why:** The brief asks for the E46 "330i and M3, all trims". One chassis file keeps the shared body data (base dimensions, gearbox families) in one place, as the schema intends.
- **Alternatives:** Separate files for the 330i and the M3 (duplicates the chassis and the production window).

### Markets covered

- **Decision:** The 350Z has Japanese, US and European (UK and Germany) trims; the E46 has European (BMW AG's German data, which BMW GB repeats) and US trims. The Australian 350Z is left out.
- **Why:** Those are the markets with factory or near-factory sources. The only Australian source found is Redbook through carsales, and its kerb and tare weights contradict each other.
- **Alternatives:** Add AUDM from Redbook as single-source (weights would be unreliable).

### Schema additions for these cars

- **Decision:**
  - Gearbox type `automated-manual` for BMW's SMG and SMG II (computer-controlled clutch, no torque converter).
  - Body style `wagon` (330i Touring).
  - Differential `speed-sensing-clutch-lsd`: BMW's variable M differential lock, a clutch pack pressed by a viscous shear pump in proportion to the left-right speed difference.
  - VVT value `intake-and-exhaust-continuous`: BMW double VANOS, and Nissan's intake CVTCS plus electromagnetic exhaust e-VTC (VQ35HR and the 2005-on rev-up VQ35DE).
  - An optional `torqueCurve` on engine variants: [rpm, torque] pairs in rising rpm, at least three points, with a torque unit. Only where the maker published a table: Nissan Europe's 350Z engine sheets (280 PS and 300 PS engines).
- **Why:** Each is a real difference that changes the simulation. Forcing an SMG into `manual` or the M differential into `clutch-lsd` would misdescribe it. A published curve is better calibration data than two peak figures.
- **Alternatives:** Put these in notes only (the simulation couldn't use them).

### Special editions left out

- **Decision:** The Fairlady Z Version NISMO Type 380RS (a 3.8-litre NISMO engine, 350 PS, 300 cars) and NISMO's S-tune GT complete car are recorded in the research but not modelled as trims.
- **Why:** Both are NISMO complete cars with their own engines or builds, not Nissan catalogue grades, and the 380RS engine would need its own engine file.

### Nissan's valve-timing table

- **Decision:** In Nissan's service-manual valve-timing table (diagram PBIC0187E), `a` is the exhaust duration, `b` the intake duration, `c` intake opening BTDC, `d` intake closing ABDC, `e` exhaust closing ATDC and `f` exhaust opening BBDC. Durations are read that way: VQ35DE 238° intake / 240° exhaust, rev-up and VQ35HR 248°/248°.
- **Why:** The identities c + 180 + d = b and f + 180 + e = a hold for all three engines, and the diagram was checked by eye on the 2004 manual's page image.

### M3 final drive: 3.62, not 3.64

- **Decision:** Every E46 M3 trim uses 3.62:1.
- **Why:** BMW's parts catalogue (ETK) lists one final-drive part, 33 10 2 282 480 "I=3,62", for every E46 M3 in every market and year, including the CSL, and BMW NA's own MY2002-2003 sheets print 3.62. BMW NA printed 3.64 from MY2004 on with the same wording, which reads as a documentation slip.
- **Alternatives:** 3.64 for the US MY2004-2006 cars (no hardware change supports it).

### Japanese catalogue databases: goo-net and GAZOO count as one source

- **Decision:** For JDM confidence, goo-net and GAZOO are treated as one source even though they are different sites. carview and Car Sensor count separately.
- **Why:** GAZOO uses goo-net's catalogue IDs and identical values, so two matching pages are one dataset, not independent confirmation.

### Mirrors of factory manuals are cited as such

- **Decision:** Where Nissan's own service manuals are only reachable as third-party copies (the 2005 and 2007 section EM files on Google Drive linked from carmanualsclub.com; the MY2003-2007 sections on pdf.textfiles.com), they are cited with the mirror named in the source title. Only facts are cited; no manual files are redistributed.
- **Why:** They are the only copies of the 2005-2007 manuals found, and they carry the factory data (valve timing, gear ratios, final drives, capacities).

### Terms of use on newsroom downloads

- **Decision:** Facts are quoted and linked, never re-hosted. One research agent clicked "Accept" on the Nissan Europe newsroom's download agreement to open the 350Z spec-sheet attachments; the files themselves are not in the repository.
- **Why:** Disclosed so the owner can judge it. Citing a published figure with its source is normal use; redistributing the attachments would not be.

### Weight conventions are kept as each market prints them

- **Decision:** Japanese weights are JIS 車両重量 (full fuel, no driver). Nissan Europe/GB weights are the no-driver kerb weight, stored as the minimum of the published range. BMW AG weights are stored as printed, "Leergewicht nach EU" = DIN kerb weight + 75 kg for driver and luggage (the DIN figure is in each note); the M3 uses BMW's DIN figure where BMW printed one. US weights are curb weights. Each trim's note says which it is.
- **Why:** The numbers stay checkable against the source (rule: values as printed). Phase 2 has to normalise them before comparing cars.
- **Alternatives:** Store derived DIN weights for BMW AG (every one would become `estimated`, although the arithmetic is exact).

### Merging catalogue periods and model years

- **Decision:** Consecutive Japanese catalogue periods of the same body, grade and gearbox are one trim when every stored number is identical; a model-code change (UA- to CBA-) or a tax-inclusive price display is not a trim change. US 350Z model years are merged the same way. US model-year windows are marked `estimated`: Nissan gives on-sale months for only some model years (MY2003 August 2002, MY2007 January 2007, NISMO July 2007, MY2009 roadster September 2008), so the other ends use calendar-year precision.
- **Why:** Keeps the trim list to real differences without inventing sale months.

### SMG, Competition Package and ZHP weights

- **Decision:** Where BMW prints no weight for the SMG, the Competition Package/ZCP or the ZHP, the trim uses the matching manual or standard car's weight, marked `estimated` with the reason.
- **Why:** BMW publishes one weight per body (and gearbox type for automatics). The manual weight is a lower bound for the SMG (the ETK SMG box is heavier).

### Rating standards

- **Decision:** US ratings are SAE net: Nissan prints "SAE J1349 JUN1995" from its MY2006 kit on, and for earlier Nissan and all BMW NA figures SAE net is the US convention of the period (noted). Nissan Europe's are EEC 80/1269 (its UK brochure footnotes 1999/99/EC). Japanese catalogues say every figure is net (JIS). BMW AG and BMW GB print no standard, so European BMW ratings are `unknown`, as the European Supra was in part 1.

### Estimated swap hardware for the VQ35HR and S54

- **Decision:** No trustworthy weight, outline dimensions or (for the VQ35HR) internal materials exist, so they are estimated with methods: VQ35HR 150 kg (the one VQ35DE weighing plus the HR's structural additions), outline 710 x 790 x 720 mm (an unreliable aggregator used as a placeholder, cited), forged crank and rods and cast pistons by analogy with the VQ35DE; S54 217 kg (BMW's 2007 statement that its V8 is "some 15 kg" lighter at 202 kg) and about 780 x 700 x 650 mm from BMW's own bore spacing, stroke and rod length. Valve lifts for the VQ engines are estimated from the service manuals' valve-spring heights (installed height minus height at full lift).
- **Why:** Launch-swap engines must carry these fields (Phase 3 fitment), and each value says exactly how it was made. They should be replaced by measurements from the engine models in Phase 4.

### Bellhousing ids

- **Decision:** `nissan-vq-de` (2003-2006 350Z gearboxes) and `nissan-vq-hr` (2007-on, shared with the VQ37VHR) are separate patterns; `bmw-m54-s54` covers the M54 and S54, which the ETK shows bolting to the same gearbox part numbers.
- **Why:** Swap vendors (TDConversions, Grannas, LOJ) sell DE and HR adapters separately and say DE-pattern parts don't fit the HR. This matters for the compatibility checker: a VQ35HR swap into a 2003-2006 350Z needs the later gearbox or an adapter.
