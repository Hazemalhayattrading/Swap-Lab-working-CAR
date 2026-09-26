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

  The licence enum can only hold CC0, CC-BY, OFL, MIT, Apache-2.0 or `commercial`. The licence URL must be that licence's canonical page, and any Creative Commons NC, ND or SA URL is rejected. Every asset must also attest `restrictions` (NoAI, editorial-only, game rip, AI-generated) as `false`, because those ride on top of otherwise allowed licences.

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

### Paid models and redistribution: open question

- **Status:** Not decided. This needs the owner before any paid model is committed.
- **Issue:** Everything in `public/` is committed to the repo and served as a plain file from GitHub Pages. Store licences (Sketchfab Store, CGTrader Royalty Free, TurboSquid Standard) generally allow use inside a product, but not redistributing the model file itself. A GLB at a public URL, and in the history of a public repo, may count as redistribution. I couldn't read the licence texts from here, so this is flagged, not concluded.
- **Options:**
  1. Use CC0/CC-BY models only on the public site.
  2. Check each paid licence's clause on real-time web delivery before buying.
  3. Keep paid GLBs out of git and host them elsewhere. That's a hosting change, so it needs your approval (CLAUDE.md rule 10), and even then the served file can be extracted.

### Shopping-list research method

- **Decision:** Candidates were found with web search only, because Sketchfab, CGTrader and TurboSquid are blocked here. Every entry says "seen via search" and lists what is still unknown. Nothing is filled in by guesswork.
- **Consequence:** The session's 200-search budget ran out after the five cars, so engines and parts are not researched yet (see `docs/progress.md`).
- **Alternatives:** The Sketchfab Data API, which returns licence, face count and price exactly. It needs `api.sketchfab.com` allowed in the environment.
