# Asset shopping list

Candidate 3D models for you to buy or download. I don't download or buy anything; you pick, and the files go in `assets-raw/` (see "When you buy one" below).

**Read this before buying anything:**

- **Your licence decision (2026-09-26):** launch with free CC0 or CC-BY models only. A paid model is only considered if its licence explicitly allows real-time or interactive web use and isn't editorial-only; you decide per model. The terms of each store are summarised under "Paid licence terms" below. In short, none of them allows a plain GLB served to the browser.
- **S15 and Supra: re-checked on the listing pages on 2026-09-26** (Sketchfab Data API and pages; CGTrader in a headless browser). TurboSquid (DataDome bot check) and Fab (Cloudflare) couldn't be opened. Evidence: `docs/research/asset-recheck-silvia-supra-2026-09-26.json`.
- **350Z and E46: re-checked on the listing pages on 2026-09-27** (Sketchfab Data API and pages; SQUIR and Blend Swap opened). CGTrader, TurboSquid, Fab, 3DModels.org and cgmood couldn't be opened. Evidence: `docs/research/asset-recheck-350z-e46-2026-09-27.json`.
- **RX-7: still the Phase 0 leads**, seen only through search summaries and not re-checked. Treat every field there as a lead, not a fact.
- **The Sketchfab Store has stopped selling.** `/store` redirects to Fab, and every paid Sketchfab model checked shows no Buy button. Prices from the Phase 0 list for Sketchfab paid models are out of date.
- **NoAI is now allowed on CC0 and CC-BY models** (your decision, 2026-09-26), because we never train AI on them. Those files are processed only by the asset scripts and are never shown to an AI model (CLAUDE.md rule 5).
- **CGTrader now sells to ordinary buyers only under "Royalty Free License (no AI)".** That licence isn't CC0 or CC-BY, so the No AI clause still keeps it out. Its extraction clause (21A.3) would anyway, unless you approve a model.
- **Commissioning original models** is costed under "Commissioned models" below, for you to decide later.
- **Engines and parts are not researched yet.**
- "Unknown" means the page didn't say. Nothing is guessed. Polycounts are as listed, and listings mix triangles, polygons (quads) and vertices.

## Licence rules (CLAUDE.md rule 5)

- **OK:** CC0, and CC Attribution (credit it on /credits), including models with a NoAI clause. Record the clause as `noAi: true` in `src/data/assets.json`. Those files are processed only by the asset scripts, never shown to an AI model, and swapped for clay placeholders in screenshots an AI reviews (CLAUDE.md rule 5).
- **Paid: only with your per-model approval,** and only if the licence explicitly allows real-time or interactive web use (the GLB is served to the browser from GitHub Pages and sits in a public repo). See "Paid licence terms" below: as checked on 2026-09-26, none of the three stores' standard licences does.
- **Editorial: no.** Every editorial licence checked limits use to news, commentary or academic work (see "Paid licence terms").
- **Never:**
  - NonCommercial (NC);
  - NoDerivatives (ND), because we must optimise and edit the files;
  - ShareAlike (SA);
  - a NoAI clause on anything other than a CC0 or CC-BY licence (so CGTrader's "Royalty Free No AI" is still out);
  - game rips (Forza, NFS, GT, Assetto Corsa, GTA, BeamNG, CSR2, Grid);
  - AI-generated models.

`npm run validate-data` enforces the enforceable part:

- only allowed licences can be recorded;
- the licence URL must match the licence;
- every asset has to attest its NoAI, editorial, game-rip and AI-generated status. Only NoAI may be true, and only on a CC0 or CC-BY asset;
- validate-data lists the NoAI files, so every session knows which files it must not open.

## Before you buy, check on the listing page

1. The licence is exactly as listed here. Note any NoAI tag or clause: it's fine on CC0 or CC-BY, and it has to be recorded.
2. The description doesn't say it's based on or ported from a game, and the uploader actually made it.
3. Whether the interior and engine bay are modelled (screenshots or the viewer).
4. The real polycount and texture sizes. A car GLB must fit in 25 MB after `npm run assets`; anything above about 1M triangles will need decimating.
5. The body: stock versus kit, year and market trim.

## When you buy one

1. Put the original file in `assets-raw/cars/`, `assets-raw/engines/` or `assets-raw/parts/`. That folder is git-ignored and never committed.
2. Tell the session the listing URL, the licence as shown, the price paid, the date, and whether the page shows any NoAI or editorial restriction. It goes into `src/data/assets.json`, and CC-BY credits go on /credits.
3. `npm run assets` writes the optimised GLB to `public/models/` and fails if it's over budget.
4. For a paid model, don't commit that GLB until you've approved that model's licence for web delivery (decision of 2026-09-26 in `docs/decisions.md`).

## Paid licence terms (checked 2026-09-26)

Question for each licence: may a paid model ship inside a public web app where the browser downloads the GLB?

**Short answer:**

- None of the three licences explicitly allows a plain GLB served to the browser.
- TurboSquid explicitly forbids it without written approval.
- Sketchfab forbids anything that lets others download or extract the file.
- CGTrader requires protecting the model from extraction.

That supports launching with CC0 and CC-BY only.

- **Sketchfab Store, Standard licence** ([sketchfab.com/licenses](https://sketchfab.com/licenses)). No explicit real-time or web permission.
  - 2.2(b): you agree not to "make available the Licensed Material as a stand-alone file (or group of files) or in a way that allows third parties to use, download, extract or access the Licensed Material as a stand-alone file".
  - 2.2(h): not to "make the Licensed Material available in a manner intended to allow or invite a third party to download, extract, redistribute or access the Licensed Material as a stand-alone file".
  - 2.7: "Licensee shall post terms and conditions on its permitted websites that prohibit, republication, retransmission, reproduction or other use of the Licensed Material as a stand-alone file".
  - 12: "Licensee shall maintain a robust firewall to safeguard against unauthorized third-party access to the Licensed Material."

  **Verdict: no** for a public GLB.

  Note that the Sketchfab Store no longer sells: `/store` redirects to a "Buy & sell 3D models on Fab" page, and every paid model checked shows `inStore: false`. **Fab's own licence (fab.com/eula) couldn't be opened** (Cloudflare challenge), so any ex-Sketchfab model offered on Fab needs its Fab terms read before buying.

- **Sketchfab Editorial licence** (same page). 2.3: no "commercial, promotional, endorsement, advertising or merchandising use", and no "purpose other than to create a Licensee Work that comments on or criticizes (i) the subject matter ... or (ii) newsworthy or public interest events". The summary says editorial assets "can be used in only works that comment on or criticize the subject matter". **Verdict: no.**
- **CGTrader Royalty Free / Royalty Free No AI** ([Terms & Conditions, sections 21A to 22](https://www.cgtrader.com/pages/terms-and-conditions)). Web delivery is not explicitly allowed.
  - Games are allowed "if the Product is contained inside a proprietary format".
  - Apps and platforms are allowed only if the "Product is not downloadable by users ... in the form in which it is downloaded from the Site" (21A.2).
  - 21A.3: "you must take all commercially reasonable measures to prevent the end user from gaining access to the Product", for example with "a proprietary Product format", "a proprietary and/or password protected database or resource file", or "encrypting the Product data".

  **Verdict: unclear, leaning no** for an open GLB in a public repo.

  Two facts matter for the rules:
  - 21A.7: ordinary buyers now only get "Royalty Free License, No AI"; plain Royalty Free is for enterprise deals.
  - 21B.1: No AI means the "same licensing terms ... except that Product use for machine learning or training of neural network models ... is not permitted".

  Rule 5 now accepts a NoAI clause only on CC0 or CC-BY models, so CGTrader's "No AI" licence still keeps its models out, and 21A.3 would too.

- **CGTrader Editorial** (22.2): "Buyers may only use Products marked 'editorial' ... for legitimate, editorial purposes on some issue of journalistic, editorial, cultural or otherwise newsworthy value." **Verdict: no.**
- **TurboSquid 3D Model License** ([blog.turbosquid.com/turbosquid-3d-model-license](https://blog.turbosquid.com/turbosquid-3d-model-license/), effective 16 March 2023). Web applications are a permitted use (7: "mobile, desktop and web applications"), but 7(b) says:

  > "3D Models must be contained in proprietary formats so that they cannot be opened or imported in a publicly available software application or framework, or extracted without reverse engineering. WebGL exports from Unity, Unreal, and Lumberyard are permitted. Any other open format ... or other WebGL programs not listed here) are prohibited."

  The FAQ adds that other WebGL use needs a non-standard format or a substantially modified mesh, and "must be approved in advance". **Verdict: no** for three.js with GLB, unless TurboSquid approves it in writing.

  Editorial (4): "limited to news reporting ... A second permitted use is use within an academic setting". The FAQ says: "No commercial, non-news related purpose." **Verdict: no.** (The TurboSquid listing pages themselves couldn't be opened; the licence pages on blog.turbosquid.com could.)

## Commissioned models

For you to decide later. Commissioning means paying a 3D artist or studio to build original models to our spec, under a licence written for this site. It's the route to consider because of what the store search found:

- no free, stock-bodied S15 exists;
- the best free Supra has no interior;
- neither free pick has an engine bay;
- no store's standard licence allows a plain GLB served to the browser.

### What the artist would build (per car: S15 Spec-R, Supra RZ/Turbo)

The camera modes in BUILD_PROMPT section 8 decide the scope. Each block below can be quoted and ordered separately.

**1. Exterior (showroom)**

- Stock body, to scale, matching our verified data files:
  - S15: 4,445 x 1,695 x 1,285 mm, wheelbase 2,525 mm, tracks 1,470 / 1,460 mm.
  - Supra: 4,520 x 1,810 x 1,275 mm, wheelbase 2,550 mm, tracks 1,520 / 1,525 mm.
- Separate objects with real pivot points:
  - four wheels, with brake discs and calipers separate so the wheels can turn while the calipers stay;
  - bonnet on its real hinge axis (the bay view opens it), plus doors and bootlid or hatch;
  - glass, and lights with emissive materials.
- Badges as separate meshes, so they can be hidden (CLAUDE.md rule 5: no manufacturer logos as site branding).
- Paint as its own material, so the colour can change.
- Optional extras, quoted separately:
  - S15: Spec-S 15-inch wheels; the Aero rear wing.
  - Supra: 16-inch (JDM 1993-96) and 17-inch wheels; the removable targa roof (Aero Top in Japan, Sport Roof in the US).

**2. Interior (cabin view)**

- A full cabin that holds up from the driver's eye point.
- Every gauge needle as a separate object, so the sim can drive them (tach, speed, boost, oil pressure, water temperature). That includes the S15 Spec-R's A-pillar boost gauge (in Nissan's 1999 launch release).
- A separate steering wheel, pedals and gear lever.
- Seats as separate objects on `mount_seat_driver` and `mount_seat_passenger`, so bucket seats can replace them.

**3. Engine bay**

- The bay structure: strut towers, firewall, frame rails, radiator support, inner wings, brake booster, battery, loom and the underside of the bonnet.
- Built so that it still looks right with the stock engine taken out, because swapped engines sit in the same bay.
- Our `mount_*` empties placed at the real positions: `mount_engine`, `mount_trans`, `mount_intake`, `mount_turbo`, `mount_exhaust`, `mount_radiator`, `mount_intercooler`, `mount_oilcooler`.
  A to-scale bay is also what the car files' `geometry` is waiting for: the mount points and bay envelope get measured from it in Phase 4.
- The underside at least along the transmission tunnel and exhaust route, for the dyno and cutaway views.

**4. Separate engines: SR20DET and 2JZ-GTE (8 MB budget each)**

- Exterior: block, head, cam cover, intake and plenum, throttle body, exhaust manifold, the turbo (two sequential turbos on the 2JZ-GTE), intercooler piping, and accessories and belts.
- The cutaway set as separate, correctly pivoted objects, so the renderer can animate them in time with rpm and firing order:
  - pistons, rods, crankshaft;
  - camshafts, valves and springs;
  - turbine and compressor wheels;
  - a sectioned block and head for the X-ray view.
- Real geometry from our data: 86.0 x 86.0 mm bore and stroke on both engines; firing orders 1-3-4-2 and 1-5-3-6-2-4.

**Technical spec for every model**

- glTF 2.0 (GLB) plus the editable source file (Blender preferred).
- Metres, Y-up, real-world pivots.
- Our part names and `mount_*` empties.
- PBR metal/roughness textures.
- It must fit the budgets after `npm run assets`: car 25 MB, engine 8 MB. Two levels of detail per car (a light showroom version and a detailed close-up version), sized to the performance targets (60 fps showroom, 45 fps cutaway on mid-range hardware).
- References: blueprints and photos, which the artist usually sources; our data files give the dimensions.

### Licence terms we'd need

The contract must explicitly grant:

1. **Real-time web use:** rendering the models in a public website, where the optimised GLB is downloaded by every visitor's browser, served from GitHub Pages and stored in a public git repository. This is exactly what store licences forbid.
2. **Modification:** optimising, decimating, renaming, re-materialing, adding mount points and cutting sections.
3. **Perpetual and worldwide rights, including commercial use,** in case the site ever earns money.
4. **Warranties:** original work; no game rips; no AI tools used (one marketplace's terms allow AI tools unless the brief forbids them); no parts from other models, except CC0 or CC-BY items listed in a bill of materials.
5. **No NoAI clause.** CLAUDE.md rule 5 only accepts NoAI on CC0/CC-BY assets, so a commissioned licence with one would need your sign-off.

What we can accept in return:

- **We don't redistribute the source files** (the .blend and texture masters). They stay out of the repo, since `assets-raw/` is git-ignored.
- **We don't resell the models as standalone assets.**

Ownership options, from most to least control:

- **Copyright assignment:** we own the model.
  - Upwork's optional contract terms (6.4) and Fiverr's terms (section 10) assign copyright to the buyer on payment by default. Some Fiverr gigs charge extra for a "Commercial Use License" instead, under which the seller keeps ownership.
  - A US "work made for hire" needs a signed agreement and one of nine qualifying categories. A web-app model doesn't clearly qualify, so contracts assign copyright as well (US Copyright Office Circular 30). Saudi law wasn't researched.
- **Exclusive licence:** the artist keeps copyright but can't license the model to anyone else. CGTrader's exclusive project licence (3D Projects terms 6.5) explicitly covers "making available to the public ... over computer networks (on the Internet)".
- **Non-exclusive licence:** usually the cheapest, and the artist may sell the same model elsewhere. It only works for us if it explicitly allows the unprotected public GLB. CGTrader's non-exclusive project licence falls back to its general terms, including the anti-extraction clause 21A.3, which is the same problem as with stock models. On CGTrader, don't tick the box that lets the designer resell the result.

Other contract points the research supports:

- Source files named by type (.blend or .max, Substance files, full-resolution textures), delivered on payment.
- Payment by milestone.
- Acceptance tested in our pipeline (it loads, fits the budget, uses our names). Note that CGTrader deems a delivery accepted after 10 business days without an objection.
- Portfolio use agreed up front.

### Rough prices (checked 2026-09-26)

Specialist car-model studios don't publish commission prices: Squir, and 3DModels.org (which Hum3D now redirects to), quote on request. These are the published figures found:

| Source                                                       | Published figure                                                                                                                                     |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| RocketBrush, game-art studio (prices updated September 2025) | "Vehicle (optimized) $4,000–8,000+" at "$35–37/h". Doesn't say whether an interior is included.                                                      |
| Pixune, game-art studio                                      | Vehicles and props "$500 to $2,500 per asset"; studios "$40 and $150 per hour".                                                                      |
| Yord Studio, web car configurators                           | "From €20,000" for one vehicle including the configurator app, "+€5,000 per model". This assumes manufacturer CAD data, which we don't have.         |
| Visartech, WebGL car interior                                | 56–80 hours to model an interior from scratch.                                                                                                       |
| Fiverr (107 car gigs read)                                   | Detailed exterior plus interior tiers: median $180 (quartiles $120–$275, highest $800), median 7 days. Engine bays: "message me for a custom quote". |
| CGTrader 3D Projects (budgets set by clients)                | Mostly $50–$800 per car, e.g. $200 for a stock exterior.                                                                                             |
| Hourly rates                                                 | Upwork profiles: 3D modellers $17–30/h, 3D artists $25–40/h. Polycount members' averages: US individual contractors $34.50–62.50/h.                  |
| Engine with moving internals                                 | No commission price published anywhere. For scale, a stock rigged 2JZ-GTE on CGTrader costs $48 (90 parts, 35.8k polygons, "No AI" licence).         |

I spot-checked the RocketBrush and Polycount figures on the live pages.

**Estimate for our scope.** This is not a quote. The hours are inferred from the published anchors above (RocketBrush's price divided by its rate for the exterior, Visartech for the interior, analogy for the bay and engine), at $30–50/h for a vetted vehicle artist:

| Deliverable                                             | Hours         | Cost                                     |
| ------------------------------------------------------- | ------------- | ---------------------------------------- |
| Exterior only, per car                                  | 80–200        | $2,400–$10,000                           |
| Exterior plus cabin, per car                            | 140–320       | $4,200–$16,000                           |
| Engine bay (add-on), per car                            | 40–100        | $1,200–$5,000                            |
| Engine with internals, each                             | 60–150        | $1,800–$7,500                            |
| **Both cars, everything, plus the SR20DET and 2JZ-GTE** | **480–1,140** | **$14,000–$57,000 (SAR 54,000–214,000)** |

One artist would need about 4.5–10.5 weeks per car and 1.5–4 weeks per engine. A studio at RocketBrush-type rates lands at roughly $19,000–$60,000 for the lot.

What to take from it:

- **Fiverr tiers are 10 to 50 times below the studio figures.** At those prices they can't meet a reference-accurate, real-time spec with a clickable bay, so treat them as a floor. Several Fiverr car sellers work on GTA V and FiveM mods, which is one more reason for the originality warranty.
- **The engine bay and the moving internals are the least certain lines.** Nobody publishes a price for them.
- **Cheaper hybrid:** keep the free CC-BY exteriors (TinoD2's Supra, zhe_kan's S15) and commission only the cabin, the bay and the engines. That's about 160–370 hours, or $4,800–$18,500 per car. The catch: that S15 isn't stock-bodied, and the CC-BY credit stays.

### Carmaker rights (caution, not legal advice)

- Commissioning a model doesn't clear Nissan's or Toyota's rights in the car's design. TurboSquid's brand policy says the responsibility "applies equally whether you license a 3D model or create it yourself". Its generic-content policy says removing logos "may not be enough", because the body shape can itself be trade dress. A US court held exactly that for Ferrari body shapes (Ferrari v. Roberts, 1991).
- This applies just as much to the free CC-BY models.
- CLAUDE.md's rules (descriptive names, no logos as site branding, no implied endorsement) are the right stance. Badges as separate meshes, so they can be hidden, help.
- If the site ever earns money, get a lawyer's view for your jurisdiction.

### References the artist needs

- No stock-body blueprints were found for either car. The first catalogue pages at the-blueprints.com only showed race-car versions; the full catalogue wasn't paged through.
- An accurate body may need photos plus measurements, or a scan of a local car. One UK studio quotes £800–£1,000 for a full-car scan (2024); Saudi scanning prices weren't researched.

Full evidence with every quote and link: `docs/research/commissioned-models-2026-09-26.md`, plus the Fiverr tiers and CGTrader job budgets as CSV files next to it.

## Cars

### Nissan Silvia S15 (Spec-R, 1999-2002)

Re-checked on 2026-09-26 by opening the listing pages. Sketchfab was read through its Data API and the rendered model page, CGTrader in a headless browser. TurboSquid is behind a DataDome bot check and could not be opened at all. Evidence is in `docs/research/asset-recheck-silvia-supra-2026-09-26.json`. Interior and engine bay are judged from the description, texture and material names, comments and thumbnails; no file was downloaded.

**No stock-bodied S15 with a clean free licence was found.** Every free CC-BY S15 that looks original has an aftermarket kit. No CC0 S15 exists on Sketchfab.

Free, licence allowed (CC0/CC-BY):

| Model                                                                                                   | Where, by                     | Licence as seen                 | Price | Polycount                          | Interior                             | Engine bay                        | Notes                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------- | ----------------------------- | ------------------------------- | ----- | ---------------------------------- | ------------------------------------ | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Nissan Silvia](https://sketchfab.com/3d-models/nissan-silvia-30e45aa381ca4fac8dc91f52e781124d) (new)   | Sketchfab, zhe_kan (@zhe_kan) | CC Attribution 4.0, no noai tag | Free  | 271.8k triangles / 143.2k vertices | Basic (seats and wheel visible)      | Probably not (no engine textures) | Verified on the listing page 2026-09-26. **Recommended free S15.** Published 2026-02-02. Substance Painter PBR texture sets per material, up to 4096 px; source is a 20 MB GLB. No game or "based on" wording, and no game-style texture names. The author has a large, varied portfolio. **Not stock:** aftermarket front bumper and wheels. The origin is not stated. Credit on /credits. |
| [Nissan silvia S15](https://sketchfab.com/3d-models/nissan-silvia-s15-484b546f73774673b78fb6376e4956bf) | Sketchfab, Mfdoom (@MF_doom)  | CC Attribution 4.0, no noai tag | Free  | 386.6k triangles / 203.4k vertices | Unknown (not visible, not mentioned) | Unknown                           | Verified on the listing page 2026-09-26. Published 2023-03-23. The description only says "Nissan silvia s15 made by blender 3d". **No image textures** (colour-only materials), so every surface needs new PBR materials. **Not stock:** big wing, mesh wheels, lowered. The account has only 4 uploads, so provenance is hard to judge. Fallback only.                                     |

Paid: licence check for real-time web use:

| Model                                                                                                   | Where, by                   | Licence as seen            | Price                                                    | Polycount                          | Interior                         | Engine bay    | Real-time web use allowed?                                                                                                                          | Notes                                                                                                                                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------- | --------------------------- | -------------------------- | -------------------------------------------------------- | ---------------------------------- | -------------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [Nissan Silvia S15](https://sketchfab.com/3d-models/nissan-silvia-s15-6570ef4cef894f38af4ac7be7d558e36) | Sketchfab, NLM (@NLM-Group) | Standard (Sketchfab Store) | **Not for sale** (the API still shows the old USD 39.99) | 664.8k triangles / 338.7k vertices | Yes ("Highly detailed interior") | Not mentioned | **No / unclear.** Sketchfab Standard 2.2(b), 2.2(h): no making it available so others can "download, extract or access" it "as a stand-alone file". | Verified on the listing page 2026-09-26. The page has no Buy button (`inStore: false`), because the Sketchfab Store now points to Fab, and no Fab migration is recorded. **Not stock:** aftermarket bumper, wheels, bucket seats. Textures only 1024 px. Published 2022-08-23. |

Avoid:

- [Nissan S15 Drift [FREE] (autoNgraphic)](https://sketchfab.com/3d-models/nissan-s15-drift-free-18348c1698f74d9db1497a791bd21a2f): Moved from the usable list. It's CC-BY with 539.8k triangles, and it has the only modelled SR20DET bay and full interior among the free S15s. But the provenance is doubtful:
  - the author says it was made with "3dsmax, zmodeler and photoshop";
  - a commenter wrote "my steering wheel", and the author replied "@RomGER Mine now, thanks";
  - the texture names (`vehicle_generic_detail2`, `remap`, `lights_lod0`, `nfsframe`) match GTA V mod conventions.

  It's also an Origin Labo widebody, not stock. Verified 2026-09-26. Five re-uploads exist at 537,142 triangles, plus an "India spec" re-skin; avoid those too.

- [Nissan Silvia S15 (Muhammad Seno Aji)](https://sketchfab.com/3d-models/nissan-silvia-s15-c3653a18842242edb52a26d47c82647d): The licence is **Editorial**, not Royalty Free as the old list said. It is not for sale any more (no Buy button), and it's a modified car (the source file is "Nissan Silvia V2 Modifikasi"). Verified 2026-09-26.
- [Nissan silvia s15 collection (CGTrader pack)](https://www.cgtrader.com/3d-model-collections/nissan-silvia-s15-collection): Falkon9, USD 12.60. The page shows **Royalty Free License (no AI)**: a No AI clause on a non-CC licence, which rule 5 still excludes, and 21A.3 requires protecting the file from extraction. The interior is modelled ("both car have the same interior"); the polycount isn't shown. Formats are BLEND, OBJ, FBX and DAE. Published 2023-07-17. Verified 2026-09-26.
- [Nissan Silvia S15 Spec-R AERO (CGTrader)](https://www.cgtrader.com/free-3d-models/car/sport-car/nissan-silvia-s15-spec-r-aero): jara-nov. It is now a **free** download (not delisted, as the old list said), but it's under CGTrader's **Royalty Free License (no AI)**, not CC-BY, so rule 5 still excludes it (and 21A.3 applies to free CGTrader models too). It has 663,000 polygons and 567,000 vertices and comes as OBJ only. The interior is "Low detail ... made only for the silouette purposes". Verified 2026-09-26.
- [Nissan Silvia S15 Spec-r Aero 1999 (TurboSquid 2217169)](https://www.turbosquid.com/3d-models/nissan-silvia-s15-specr-aero-1999-3d-2217169) and [Nissan Silvia S15 (TurboSquid 1519405)](https://www.turbosquid.com/3d-models/nissan-silvia-s15-3d-1519405): **Couldn't be opened** (403, DataDome bot check), so the licence, price and polycount were not re-verified. Whatever the listing says, the TurboSquid licence 7(b) forbids open formats in WebGL other than Unity, Unreal or Lumberyard exports without written approval, so they don't fit Swap Lab's GLB pipeline.
- [2002 Nissan Silvia S15 Spec R Aero (Ddiaz Design)](https://sketchfab.com/3d-models/2002-nissan-silvia-s15-spec-r-aero-8afd07698ca6414dad100af12dfd0d62): Confirmed CC BY-NC-SA, and the description says "Based on a Need For Speed Heat 3d model". Verified 2026-09-26.
- [2000 Nissan Silvia Spec-R (OUTPISTON)](https://sketchfab.com/3d-models/2000-nissan-silvia-spec-r-dd63ddbf2a504990b93cee5ebb052a79): Confirmed CC BY-NC-SA. The account biography reads "Vehicle 3D Models from Gran Turismo, Forza, Real Racing, Need For Speed, CSR2 ... Non-Commercial Use Only". Verified 2026-09-26.
- [Free Nissan Silvia S15 (TurboSquid 1230532)](https://www.turbosquid.com/3d-models/nissan-silvia-s15-3d-model-1230532): Couldn't be opened (DataDome), so it was not re-verified. Kept on Avoid from the earlier CC-BY-NC summary.
- [Nissan Silvia S15 Dmax Gripex Garage (CGTrader)](https://www.cgtrader.com/3d-models/car/racing-car/nissan-silvia-s15-dmax-gripex-garage): Strykke, USD 19.99. **Royalty Free License (no AI)**. It's a D-Max kit with a "2jz-gte under the hood" swap. A buyer review says "Horrible quality with errors everywhere." Verified 2026-09-26.
- [Nissan Silvia S15 2001 Tuning Body For Print (CGTrader)](https://www.cgtrader.com/3d-print-models/hobby-diy/automotive/nissan-silvia-s15-2001-tuning-body-for-print): USD 5.00 and **Royalty Free License (no AI)**. It's an STL print shell. Verified 2026-09-26.
- Other free S15s checked this session and rejected:
  - DR1KING100K "Nissan S15": hash-named, extracted-style textures;
  - DR1KING100K "Fast And Furious": a movie car with game-style texture names;
  - ivan123.nola uploads;
  - Socksthecat "Custom": `grille1_s_lod0` game-mod textures;
  - ZapupaNekra: loose kit parts, untextured;
  - doroni.af: untextured;
  - mayphyuhan.st: tagged `noai` and `createdwithai`.

  The URLs are in the JSON.

### Toyota Supra JZA80 (MK4, 1993-2002)

Re-checked on 2026-09-26 by opening the listing pages (same method as the S15). TurboSquid could not be opened. No CC0 Supra A80 exists on Sketchfab.

Free, licence allowed (CC0/CC-BY):

| Model                                                                                                                 | Where, by                          | Licence as seen                 | Price | Polycount                        | Interior                 | Engine bay | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ------------------------------- | ----- | -------------------------------- | ------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Toyota Supra MK IV (1994)](https://sketchfab.com/3d-models/toyota-supra-mk-iv-1994-eb9bb1eb41db431cb078088ae1ce45f8) | Sketchfab, Martin Trafas (@TinoD2) | CC Attribution 4.0, no noai tag | Free  | 262k triangles / 137.3k vertices | Probably none or minimal | No         | Verified on the listing page 2026-09-26. **Recommended free Supra.** Sketchfab Staff Pick (2021-07-23), published 2021-07-19. **Stock-looking body:** factory bumpers, wing and 5-spoke wheels. Proper PBR sets (base colour, metallic, roughness, normal, AO) up to 2048 px; source is OBJ. The author has a long record of original cars and his own ArtStation renders, with no rip indicators. There are no interior texture sets, and a 2023 comment says "$30 for a car without a interior?", so plan to build or source the cabin. Credit on /credits. |

No new free Supra met the bar. The closest was [MiguelG19 "Toyota Supra Mk4"](https://sketchfab.com/3d-models/toyota-supra-mk4-7b814545bf7148aba70b7af03b0f2817). It's CC-BY with 710k triangles and "Stock interior included", but it has no textures and its origin isn't stated, so it's only useful as a geometry base.

Paid: licence check for real-time web use:

| Model                                                                                                       | Where, by          | Licence as seen                  | Price                                                        | Polycount                           | Interior                                                 | Engine bay                                             | Real-time web use allowed?                                                                                                                                                                                             | Notes                                                                                                                                                                                                             |
| ----------------------------------------------------------------------------------------------------------- | ------------------ | -------------------------------- | ------------------------------------------------------------ | ----------------------------------- | -------------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Toyota Supra MK IV A80 1993](https://www.cgtrader.com/3d-models/car/sport-car/toyota-supra-mk-iv-a80-1993) | CGTrader, xtreme85 | **Royalty Free License (no AI)** | USD 20.00 (USD 14.00 also shown beside "Subscribe and save") | 377,206 polygons / 286,857 vertices | Yes (buyer: "one of the best ... interiors for the mk4") | No (buyer: "engine bay etc would have been very nice") | **Unclear, leaning no.** CGTrader 21A.3: "take all commercially reasonable measures to prevent the end user from gaining access to the Product". **Also still blocked by rule 5:** NoAI is only accepted on CC0/CC-BY. | Verified on the listing page 2026-09-26. Formats: MAX (V-Ray 5), OBJ, FBX, 3DS. Published 2022-01-16. The best-documented paid A80 found, but CGTrader now sells to normal buyers only under "No AI" (T&C 21A.7). |

Avoid:

- [Toyota Supra mk IV (Render at Night)](https://sketchfab.com/3d-models/toyota-supra-mk-iv-6e42a10b2019416996a35972e0537817): The licence is **Editorial**, not Royalty Free as the old list said. It is not for sale on Sketchfab. The description now says "Now available on Fab", but the [Fab listing](https://www.fab.com/listings/9227d414-b7c2-4855-ac70-3b020be3ef88) couldn't be opened (Cloudflare), so its Fab licence is unknown. The Sketchfab viewer mesh is 1.63M triangles; the description lists a 132,952-polygon low version and an 815,702-polygon high version. Verified 2026-09-26.
- [Toyota Supra A80 (Ashminggu), riftocloes](https://sketchfab.com/3d-models/toyota-supra-a80-ashminggu-9178fa9d53e04bf4bfe1d7761cfa2f74): The licence question is resolved: Ashminggu's [original](https://sketchfab.com/3d-models/93-supra-mk4-ff-4a391fdb930b4bada40486479436b2ed) is also CC-BY, so the re-upload with credit is allowed. But this upload is only 9,144 triangles, and the original is a Blockbench/Minecraft-style model (tags minecraft, mcpe). Far below the photoreal target. Verified 2026-09-26.
- [Supra A80 Mk4 (TurboSquid 1639507, PhinDev)](https://www.turbosquid.com/3d-models/3d-model-supra-a80-mk4-cars-1639507) and [Toyota Supra 1993 (Hum3D, TurboSquid 1130282)](https://www.turbosquid.com/3d-models/3d-toyota-supra-1993/1130282): **Couldn't be opened** (403, DataDome), so the Editorial label from the old search summary is not re-verified. Either way, the TurboSquid licence 7(b) forbids open-format WebGL use outside Unity, Unreal or Lumberyard without written approval, and its Editorial terms rule out "commercial, non-news related purpose". The Hum3D [CGTrader copy](https://www.cgtrader.com/3d-models/car/sport-car/toyota-supra-1993) is gone (HTTP 410, "The page you requested could not be found").
- [TOYOTA SUPRA MK4 (A80) (temich)](https://sketchfab.com/3d-models/toyota-supra-mk4-a80-61d402d6de904374bfe5a98907c85b1d): Confirmed CC BY-NC. The description says "Based on CSR2 model + some tuning stuff. NOT FOR COMMERCIAL USE!" Verified 2026-09-26.
- [Toyota Supra (A80) 1993 (Lexyc16)](https://sketchfab.com/3d-models/toyota-supra-a80-1993-dd897d7823784bc5893c183c1328e8cb): Confirmed CC BY-NC, tagged `noai`, and only 30k triangles. Verified 2026-09-26.
- [1998 Toyota Supra (BHP3D)](https://sketchfab.com/3d-models/1998-toyota-supra-b9ee69e17af947c0bce1c54d34195187): The label is CC-BY, but the description says "exported from a BeamNG mod. Credits: StivgGames:model, textures". The tags include `rip` and `noai1`. Verified 2026-09-26.
- [Toyota Supra MK4 RZ 1998 low-poly (CGTrader)](https://www.cgtrader.com/3d-models/car/sport-car/toyota-supra-rz-1998-8b0e93ff-9c06-4cf6-88f3-cd2ad3896131): kerubimpatabang, USD 3.50. **Royalty Free License (no AI)**. The listing gives "705 polygons / 378,930 vertices", which don't agree. Verified 2026-09-26.
- [Toyota Supra mk4 low poly free (CGTrader)](https://www.cgtrader.com/free-3d-models/car/racing-car/toyota-supra-mk4-6edf7cda-4a65-4ea0-8503-b7db477b5e9f): cgeus, free. **Royalty Free License (no AI)**, with 17,357 polygons. Verified 2026-09-26.
- Other free Supras checked this session and rejected:
  - BlackSnow02: Forza-style `toy_suprarz_98_*` texture names;
  - iftikharsol765: GTA-style textures borrowed from a 240SX;
  - nolimitsofficial: game-style `*gmtsub*` textures;
  - ShaheerHashmi: the uploaded source is Sketchfab's own `scene.gltf`, so probably a re-upload;
  - a.m18110665: untextured, 424 MB, big-wing kit;
  - Blueberry12: "no interior";
  - xray_collection: kit;
  - Car2022: wrong engine spec.

  The URLs are in the JSON.

### Nissan 350Z (Z33, 2003-2008)

Re-checked on 2026-09-27 by opening the listing pages. Sketchfab was read through its Data API, the viewer metadata and the model page. **CGTrader couldn't be opened this time:** it answers with an empty challenge page, and the headless browser that got past it on 2026-09-26 couldn't be used in this session. TurboSquid (DataDome), Fab and 3DModels.org (Cloudflare) couldn't be opened either. Evidence is in `docs/research/asset-recheck-350z-e46-2026-09-27.json`. Interior and engine bay are judged from the description, source-file and texture names, comments and thumbnails; no file was downloaded.

**No clean, textured, stock-bodied free 350Z was found.** The best body is an untextured CC-BY model whose uploader also publishes extracted game models, so it's your call. No CC0 350Z exists on Sketchfab, and no free 350Z has a modelled engine bay.

Free, licence allowed (CC0/CC-BY):

| Model                                                 | Where, by           | Licence as seen        | Price | Polycount                         | Interior | Engine bay | Notes                                                                                                                                                                                                                                                                          |
| ----------------------------------------------------- | ------------------- | ---------------------- | ----- | --------------------------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [Nissan 350z](https://blendswap.com/blend/4442) (new) | Blend Swap, tahseen | CC-BY, no NoAI wording | Free  | Not shown (the .blend is 1.78 MB) | Unknown  | Unknown    | Verified on the listing page 2026-09-27. **Fallback only.** "I modeled it in Blender 2.61"; uploaded over 14 years ago, with Blender Internal materials. The preview render shows a stock-looking early 350Z. Expect to redo the materials and add detail. Credit on /credits. |

Needs your call:

| Model                                                                                                         | Where, by                                | Licence as seen                 | Price | Polycount                        | Interior             | Engine bay | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ------------------------------- | ----- | -------------------------------- | -------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Nissan 350Z](https://sketchfab.com/3d-models/nissan-350z-17ca0ac209fd4823878a013c0dff82bf) (new)             | Sketchfab, barking_dogo (@barking_dogo)  | CC Attribution 4.0, no noai tag | Free  | 1.23M triangles / 623k vertices  | Unknown (dark glass) | Unknown    | Verified on the listing page 2026-09-27. **The best stock body found:** factory bumpers, lights, mirrors and wheels in the cover image. It's a geometry base only: no textures, and the author says it's "not uv-wrapped and have problems with topology". Nothing on this model points to a rip, but the same account publishes models it says are "extracted model from videogame" (Emperor: Battle for Dune) under CC-BY, so its licence labels aren't reliable in general. Source is a 34.8 MB FBX. Published 2024-02-11. |
| [Tuned Nissan 350z](https://sketchfab.com/3d-models/tuned-nissan-350z-b85bcb7a726d478bb775ca070e3b1fce) (new) | Sketchfab, SDC PERFORMANCE (@Lambo_SC04) | CC Attribution 4.0, no noai tag | Free  | 3.13M triangles / 1.61M vertices | Unknown              | Unknown    | Verified on the listing page 2026-09-27. "Nissan 350z modeled with blender"; no textures. **Not stock:** mesh wheels, carbon bonnet, skirts, rear wing, lowered. Only worth it for a tuned car, and it needs heavy decimation. Published 2020-07-07.                                                                                                                                                                                                                                                                          |

Avoid:

- [Nissan 350Z with HQ interior 2007](https://www.cgtrader.com/3d-models/car/sport-car/nissan-350z-with-hq-interior-2007) and [Nissan 350Z 2007](https://www.cgtrader.com/3d-models/car/sport-car/nissan-350z-2007-07cefb2907a350d322fe67e994809494) (Hum3D, CGTrader): moved from the usable list. **Couldn't be opened** this time. Whatever the listings say, CGTrader now sells to ordinary buyers only under "Royalty Free License (no AI)" (T&C 21A.7), which rule 5 excludes, and 21A.3 requires protecting the file from extraction. The same models on 3DModels.org, where hum3d.com now redirects (USD 295 and USD 95 according to a search summary), couldn't be opened either (Cloudflare), and neither could 3DModels.org's licence. A search summary says it requires projects "protected from extraction", which would also rule out a plain GLB. The old prices and polycounts were not re-verified.
- [2002-2008 Nissan 350z (stecki)](https://sketchfab.com/3d-models/2002-2008-nissan-350z-fd5937a191c640f0b50ebed311a1399b): moved from the usable list. The licence is **Editorial**, not Royalty Free as the old list said (the page title still says "Buy Royalty Free"), and it's no longer for sale (no Buy button). It's the author's own old game asset for racer.nl, 14.2k triangles. Verified 2026-09-27.
- [Nissan 350Z (Z33) (Mona x Supercars, @Car2022)](https://sketchfab.com/3d-models/nissan-350z-z33-0bd921be48f442a7b138c5169b7d0d2f): moved from needs-your-call. It's CC-BY with 21.8k triangles, but another upload on the same account says "Model from: Need for Speed: Shift & Shift 2: Unleashed", and this one's texture names (`Meshpart15_diff`, `Meshes350zfrontlight350zfrontlight0011_diff`) look extracted. Verified 2026-09-27.
- [3ds Nissan 350z (TurboSquid 378483)](https://www.turbosquid.com/3d-models/3ds-nissan-350z/378483) and [nissan 350z 3d model (TurboSquid 235037)](https://www.turbosquid.com/3d-models/nissan-350z-3d-model/235037): moved from needs-your-call. **Couldn't be opened** (403, DataDome). Whatever the listings say, TurboSquid licence 7(b) forbids open formats in WebGL other than Unity, Unreal or Lumberyard exports without written approval, and both were Editorial per the Phase 0 summary. The "engine and undercarriage" on 378483 comes only from that summary.
- [Nissan 350z Japanese Sports Coupe With Interior Model (Bbenedict, CGTrader)](https://www.cgtrader.com/free-3d-models/car/sport-car/nissan-350z-japanese-sports-coupe-with-interior-model) and its TurboSquid copy (2049724): couldn't be opened. CGTrader's "Royalty Free License (no AI)" rules it out anyway.
- Ddiaz Design's [Nissan 350Z](https://sketchfab.com/3d-models/nissan-350z-05e7604a0f4643ab87c141e244813e9a), [2008 Voltex 350Z](https://sketchfab.com/3d-models/2008-voltex-350z-z33-bodykit-wing-type-2-c1c5eb14e492434683381879b468b3f1) and [Rachel's Nissan 350z](https://sketchfab.com/3d-models/rachels-nissan-350z-nfs-underground-2-5b41f9a218624deaa1202efb6ff5a779): confirmed CC BY-NC-SA, "Based on a Need For Speed Heat 3d model" (the first two) and "Based on a Need For Speed Mobile 3d model". Verified 2026-09-27.
- [Nissan 350Z (SÄNTI MILOS)](https://sketchfab.com/3d-models/nissan-350z-2f967462b67e4bd8b94c6abde1d1e07a): gone (the API and viewer answer 404).
- Other free 350Zs checked this session and rejected:
  - Merc_TV (@szymonpasterczyk) "Nismo S Tune": the uploader's profile says "Importing Beamng.Drive,Assetto corsa,GTA San Andreas.", and the source list contains BeamNG mod files;
  - ffincognito98 and tangwang920 "2003 Nissan 350Z": game-style `Nissan_350ZF3_2003_*` textures; tangwang920's source is Sketchfab's own `scene.gltf`;
  - adrianaflak09 "2007 Nissan 350Z": "Model from Need For Speed Heat";
  - romanian_guy_0069: a re-upload of the Ddiaz NFS mesh;
  - Kalihail, seibold1simon, BlackSnow02, ClumsyLlama: Rocket Bunny kits (Kalihail also "borrowed ready-made wheel models");
  - Lambo_SC04's second tuned car, Socksthecat "Custom", Texas Drift Academy's rough photo-model: not stock;
  - Blueberry12, metehanyilmaz33, andywangqe2, code.aggregator: low-poly, no interior;
  - David_Holiday: origin not stated, 66k triangles;
  - waleguene "Project N8-z33": a robot, not a car.

  The URLs are in the JSON.

### BMW 3 Series E46 330i (sedan or coupe, 1998-2006)

Re-checked on 2026-09-27 by opening the listing pages (same method as the 350Z). 3DModels.org couldn't be opened. No CC0 E46 exists on Sketchfab.

**The best free 330i is still Ricy's mid-poly M Sport sedan, and it has no interior.** The three Merc_TV sedans from the old needs-your-call list are game imports by the uploader's own statement.

Free, licence allowed (CC0/CC-BY):

| Model                                                                                                                     | Where, by                  | Licence as seen                 | Price | Polycount                        | Interior                                      | Engine bay | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------- | -------------------------- | ------------------------------- | ----- | -------------------------------- | --------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [BMW E46 MSport](https://sketchfab.com/3d-models/bmw-e46-msport-614c2f1660474178a1d4717b7492d1c7)                         | Sketchfab, Ricy (@ngon_3d) | CC Attribution 4.0, no noai tag | Free  | 50.7k triangles / 30.1k vertices | No (the source file is `e46_no_interior.fbx`) | No         | Verified on the listing page 2026-09-27. **Recommended free 330i.** "based on my 2001 bmw e46 330i (sedan 3 series pre-facelift)". Asked in the comments whether it's original, the author answered "yes all of my models are my works". The textures are placeholders (five screenshots, a web BMW logo and a tyre tread), so plan new PBR materials, a cabin and a bay. Published 2024-12-19. Credit Ricy on /credits (the listing asks "CREDIT ME (Ricy) IF USED"). |
| [Low Poly Car - BMW E46 1998](https://sketchfab.com/3d-models/low-poly-car-bmw-e46-1998-d9bfd8126e754164b48ded833c017bbf) | Sketchfab, ROH3D           | CC Attribution 4.0, no noai tag | Free  | 18.4k triangles / 10k vertices   | Basic (seats and wheel visible)               | No         | Verified on the listing page 2026-09-27. Fallback or distant LOD. A stock-looking pre-facelift sedan with one 4096 px PBR texture set; trim not stated. Asked if it can be used in a game, the author replied "Ya, sure". Published 2025-05-25. Credit on /credits. The old note was wrong: slowpoly's 'BMW E46 1998' isn't a near-identical listing (different description, 1,420 triangles).                                                                         |

Needs your call:

| Model                                                                    | Where, by    | Licence as seen | Price   | Polycount | Interior | Engine bay | Notes                                                                                                                                                                                                                                              |
| ------------------------------------------------------------------------ | ------------ | --------------- | ------- | --------- | -------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [BMW 3 Series sedan (E46) 2006](https://3dmodels.org/360-view/?id=38073) | 3DModels.org | unknown         | unknown | unknown   | Unknown  | Unknown    | **Couldn't be opened** on 2026-09-27 (Cloudflare security check), and neither could the 3DModels.org licence. A search summary says the licence requires projects "protected from extraction by other users"; if so, it doesn't allow a plain GLB. |

Avoid:

- The three Merc_TV (@szymonpasterczyk) sedans: [BMW 3-Series E46 1998-2006 (pre-facelift)](https://sketchfab.com/3d-models/bmw-3-series-e46-1998-2006-7df0ea780a1b464bba53b515e7fcdbca), [BMW 3-Series E46 1998-2006 (facelift)](https://sketchfab.com/3d-models/bmw-3-series-e46-1998-2006-2e32a3e273ab482b83970603539de06a) and [BMW 3 Series (E46) 1998-2002](https://sketchfab.com/3d-models/bmw-3-series-e46-1998-2002-7846a8c9431648c1857546632c8ffa3c). Moved from needs-your-call. The uploader's profile says "Importing Beamng.Drive,Assetto corsa,GTA San Andreas.", and two of its other uploads have BeamNG mod files in their source lists. The same goes for its other E46s (Touring, Coupe, Compact, Convertible, "Junk Builds"). Verified 2026-09-27.
- [BMW E46 1998 (slowpoly)](https://sketchfab.com/3d-models/bmw-e46-1998-ecc42a37c7e2409b9fd05665512843ce): 1,420 triangles.
- [BMW 3 Series E46 Coupe And Touring](https://sketchfab.com/3d-models/bmw-3-series-e46-coupe-and-touring-388d4f257a81451a9ad5677fbfa5ee73) and [BMW 318i E46](https://sketchfab.com/3d-models/bmw-318i-e46-81827129d1f34aa7a13ab1131fd1cf37) (Nieve5677, @niev): confirmed. The profile says "I did not make any of these models but feel free to use them for anything."
- [1999 BMW E46 328i Sport (Ddiaz Design)](https://sketchfab.com/3d-models/1999-bmw-e46-328i-sport-5fce3b693344450380b0112a4d21cfe5): confirmed CC BY-NC-SA and "Based on a Need For Speed 3d model".
- [BMW E46 HGK](https://sketchfab.com/3d-models/bmw-e46-hgk-d4e63d61b4a54befbb9daa62c8ff3a4f): confirmed CC BY-NC, a widebody kit, 171.5k triangles. The uploader now shows as Quore (@Quoreder).
- [2001 BMW 3-Series (E46) (ImperialBlue3D)](https://sketchfab.com/3d-models/2001-bmw-3-series-e46-24a2b709937f4629b9fd2a7afa54e609): 1,302 triangles, no interior. The old list's "AI traffic car" means a game NPC car ("a traffic car driven by AI"); it isn't AI-generated.
- Reference only, not render assets: modception's [E46 body/chassis scan](https://sketchfab.com/3d-models/bmw-3-series-e46-body-chassis-3d-scan-11cb6c0433254eb58398cc0732ab0185) (no licence, not downloadable, sold on request), GoodScan 3D's [lidar point cloud](https://sketchfab.com/3d-models/bmw-series-3-e46-lidar-scan-dd9b15dad87a46f88080f081c1586800) (CC-BY, points only) and spiiiiicy's [Photoscanned BMW 3 Series (E46)](https://sketchfab.com/3d-models/photoscanned-bmw-3-series-e46-7a56b85808504b5f846b102183c97b28) (CC-BY, 68.8k triangles, "properly scaled", meant as a modelling reference). The Cults3D E46 engine-bay scan couldn't be opened (Cloudflare).
- Other free E46s checked this session and rejected:
  - speedmodel "BMW 3 Series touring (E46) 2001": a commenter says "This work is done by hum3d. He/she only edied it a bit", and the source is a Hum3D-named .max file;
  - sz00: a lowered drift build of unknown origin (a commenter's "its ur work or?" is unanswered);
  - tonielpro520 "2006 BMW 330i": 445 uploads in under a year, a UUID-named source file;
  - homicivan53: file and texture names match AI-generator output (`Image_0_0.jpeg`);
  - unitygtt34 and ArezaStudios: the same Unity-pack texture set;
  - tangwang920's 328i: a re-upload of the Ddiaz NFS model;
  - karimijannes0: widebody kit;
  - Ricy's E46 Compact: the wrong body.

  The URLs are in the JSON.

### BMW M3 E46 coupe (2000-2006)

Re-checked on 2026-09-27 by opening the listing pages (same method as the 350Z). SQUIR and Blend Swap opened; cgmood (403) and CGTrader didn't. No CC0 E46 M3 exists on Sketchfab.

**The two free M3s both need work:** the better-documented one carries a NoAI clause and its author says the measurements aren't accurate; the other has no description and no textures.

Free, licence allowed (CC0/CC-BY):

| Model                                                                                     | Where, by                                 | Licence as seen                                                                                                                                                                  | Price | Polycount                          | Interior                 | Engine bay    | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ----------------------------------------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ---------------------------------- | ------------------------ | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [BMW M3 E46](https://sketchfab.com/3d-models/bmw-m3-e46-f1b00ff37d504629b10031da32bc7497) | Sketchfab, MMC Works (@mmcworks)          | CC Attribution 4.0, **with NoAI** (tag `noai`; the page says "NoAI: This model may not be used in datasets for, in the development of, or as inputs to generative AI programs.") | Free  | 846.9k triangles / 442.4k vertices | Rough ("Rough interior") | Not mentioned | Verified on the listing page 2026-09-27, from text only: it's NoAI, so no thumbnail or render was viewed. **Recommended free M3**, with caveats. The author says "the measurements are not accurate, I've used a blueprint that was slightly different on views". The stainless-steel texture comes from a texture library and should be replaced. Own work ("3D modeled using Blender 3D just for practicing", with a modelling timelapse); the source is the native .blend (40 MB). Published 2021-07-19. It's also listed on Fab (not opened). Handle as NoAI: record `noAi: true`, process it only with the asset scripts, never show it to an AI model. Credit on /credits. An uncredited near-copy by mahdiadib99 exists; don't use that one. |
| [BMW M3 E46](https://sketchfab.com/3d-models/bmw-m3-e46-5399b1833e6a4c06af6b11b03832aed7) | Sketchfab, pIxEL183 (@vladislav.varankin) | CC Attribution 4.0, no noai tag                                                                                                                                                  | Free  | 352.2k triangles / 178.8k vertices | Unknown                  | Unknown       | Verified on the listing page 2026-09-27. The non-NoAI alternative. The cover image shows a stock-looking M3 coupe body on multi-spoke wheels I couldn't identify. "No description provided."; no textures (colour-only materials); the account has three uploads, so provenance can't be judged. Source is an 8.4 MB FBX. Published 2025-01-26. Credit on /credits.                                                                                                                                                                                                                                                                                                                                                                                 |

Paid: licence check for real-time web use:

| Model                                                                        | Where, by               | Licence as seen                    | Price           | Polycount                           | Interior   | Engine bay | Real-time web use allowed?                                                                                                                                                                                                       | Notes                                                                                                                                                                                                                                                                                                   |
| ---------------------------------------------------------------------------- | ----------------------- | ---------------------------------- | --------------- | ----------------------------------- | ---------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [BMW M3 e46 2000-2005](https://squir.com/bmw-m3-e46-2000-2005-3d-model.html) | SQUIR (in-house studio) | **Editorial** (SQUIR's About page) | EUR 99.00 shown | 320,000 polygons / 320,000 vertices | Not stated | Not stated | **No.** "The models are sold under general Editorial license"; buyers may not "Provide any free download of the models at any website or throgh any app"; sharing online or game use "would need a special licensing agreement". | Verified 2026-09-27. The product page also says "BMW group refuse to grant a license to sell BMW/Mini/Rolls 3d models" and offers BMWs only as custom jobs. Formats: 3DS, C4D, FBX, LWO, MAX 2009, OBJ. The [CSL page](https://squir.com/bmw-m3-e46-csl.html) is the same: EUR 99.00, 500,000 polygons. |

Avoid:

- [BMW M3 E46 (Blend Swap 10588)](https://blendswap.com/blend/10588): moved from needs-your-call. The licence is **CC-BY-SA**, and ShareAlike isn't allowed. The [Sketchfab copy](https://sketchfab.com/3d-models/bmw-m3-e46-6c1b23073ba34b5c9ef86152092a7af5) by Andrei Maximov is view-only with no licence. Verified 2026-09-27.
- [BMW M3 E46 CSL (cgmood)](https://cgmood.com/3d-model/bmw-m3-e46-csl): couldn't be opened (403). It's the CSL variant anyway.
- [Low Poly Gameready BMW M3 E46 (CGTrader)](https://www.cgtrader.com/3d-models/car/racing-car/low-poly-sport-car-600aa237-d74b-4b96-a5f4-09a406a0b855): moved from the usable list. Couldn't be opened; CGTrader's "Royalty Free License (no AI)" rules it out, and it's 6.8k triangles per the Phase 0 summary.
- [CR's BMW E46 M3 Sports Car (BaseOptimal)](https://sketchfab.com/3d-models/crs-bmw-e46-m3-sports-car-b99dd46e63fa4f6cbb952e41695c079e): the licence is **Editorial**, not Store royalty-free as the old list said. It's tagged noai and not for sale.
- [BMW E46 M3 Sports Car Red (BaseOptimal)](https://sketchfab.com/3d-models/bmw-e46-m3-sports-car-red-74916396475b414f8dbcb580621a5010) and 'NightRyder': now labelled CC Attribution, but the description still says "within the bounds of the Editorial License" and credits parts from another uploader's M3 GTR (now deleted) and a 3D Warehouse model.
- [BMW E46 M3 CSL (nikki_st)](https://sketchfab.com/3d-models/bmw-e46-m3-csl-4fcff8ef8e31483d85a044ae5142850e): the licence, now seen, is **Editorial**, and it's not for sale; stylised.
- [BMW M3 E46 (BRIKKER)](https://sketchfab.com/3d-models/bmw-m3-e46-a0cc623fe4ec4b96bc0137b152279321): the licence, now seen, is CC-BY, but it's 8k triangles with no textures.
- [BMW M3 E46 (Lexyc16)](https://sketchfab.com/3d-models/bmw-m3-e46-a067132c75f5456daa4f60c4001337d7): confirmed CC BY-NC.
- Ddiaz Design's [2003 BMW M3 E46 Coupé](https://sketchfab.com/3d-models/2003-bmw-m3-e46-coupe-7b43e776153f4dc199f564469cedbaa0) (NFS Heat), [2005 BMW M3 (E46)](https://sketchfab.com/3d-models/2005-bmw-m3-e46-50549fe15a294acd8a8340988a943eae) (Forza Motorsport 4) and [2005 BMW M3 E46 GTR - NFS Most Wanted](https://sketchfab.com/3d-models/2005-bmw-m3-e46-gtr-nfs-most-wanted-2999936a393340c0a389c6bd31961a63): all confirmed CC BY-NC-SA game rips. Verified 2026-09-27.
- [BMW M3 GTR - E46 (Need for Speed - Mostwanted) (Allay Design)](https://sketchfab.com/3d-models/bmw-m3-gtr-e46-need-for-speed-mostwanted-dc847838a5c84d94ab3a138c0f89191b): Editorial, tagged noai, not for sale; a race car.
- [BMW M3 E46 (Most Wanted edition), BlenderKit](https://www.blenderkit.com/asset-gallery-detail/2c049d4b-6acb-47e6-bef2-b2f3325124b2/): confirmed. It's the GTR race car, "royalty_free" on the paid plan, 173,894 faces. blenderkit.com now redirects to blendkit.com.
- Phase 0 leads, now checked: BadKarma's M3 is gone (404); DisneyCars' [2002 BMW M3 (E46)](https://sketchfab.com/3d-models/2002-bmw-m3-e46-cc948b0e391b42c1bae76daaebd2f219) has the same mesh as a Car2022 upload that says "Model from: Need for Speed: Shift & Shift 2: Unleashed"; [TurboSquid 1690326](https://www.turbosquid.com/3d-models/bmw-m3-e46-model-1690326) couldn't be opened.
- Other free M3s checked this session and rejected:
  - mahdiadib99 "bmw-m3-e46": an uncredited near-copy of MMC Works' NoAI model (the same 413,484 quads and textures);
  - vasilebetivu62, and a re-upload by romanian_guy_0069: a GTA San Andreas mod ("he didnt its a gta san anderas mod");
  - Car2022's M3 Coupe and M3 Coupe Aerokit: Forza and NFS Shift sources;
  - B4_Cobra: a re-upload of the Ddiaz NFS coupe;
  - Ddiaz's CC-BY Pandem M3: based on NFS Heat;
  - ArezaStudios: a Unity-pack car;
  - Merc_TV's M3: BeamNG mod files;
  - tahseen's CC0 "BMW M3" on Blend Swap: an E92, not an E46;
  - about 25 "M3 GTR" race-car uploads.

  The URLs are in the JSON.

### Mazda RX-7 FD3S (1992-2002)

Licence looks usable (still confirm on the page):

| Model                                                                                                                                         | Where, by                   | Licence as listed              | Price     | Polycount                                                                   | Interior | Engine bay | Notes                                                                                                                                                                                                                                                                                                                                           |
| --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | ------------------------------ | --------- | --------------------------------------------------------------------------- | -------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Jackboys Mazda RX7 FD High Detailed 3D Model](https://www.cgtrader.com/3d-models/car/sport-car/jackboys-mazda-rx7-fd-high-detailed-3d-model) | CGTrader, hlol911           | Royalty Free                   | unknown   | 174,484 vertices (triangle count not seen)                                  | Yes      | Yes        | This is the only RX-7 found that confirms both an engine under the hood and an interior. How detailed the engine and bay are isn't stated. 'Jackboys' refers to the RX-7 in the Travis Scott JackBoys video, and 'JDM styled interior' suggests aftermarket styling, so check it against a stock FD3S (wheels, aero, cabin). Price not seen.    |
| [Mazda RX-7 FD3S Efini](https://sketchfab.com/3d-models/mazda-rx-7-fd3s-efini-61c7faa539424486aff840b78d7d6459)                               | Sketchfab, MGR '99 (@MGR99) | Royalty Free (Sketchfab Store) | unknown   | 4.5M triangles / 2.4M vertices                                              | Unknown  | Unknown    | The Efini badge is correct for the Japanese-market FD3S, and the seller describes it as stock. At 4.5M triangles it's far over budget and would need heavy decimation and baking to fit 25 MB, though the detail suggests a real interior (not confirmed). Buy the current Efini listing, not the outdated one. Price and NoAI status not seen. |
| [Mazda RX7 FD Turbo 1995 JDM](https://www.cgtrader.com/3d-models/car/racing-car/mazda-rx7-fd-turbo-1995)                                      | CGTrader, unknown           | Royalty Free                   | USD 40.00 | unknown (the free sister listing gives 279,970 polygons / 171,883 vertices) | Unknown  | Unknown    | It has aftermarket TE37 wheels and modified headlights, so it's not fully stock and the wheels would need swapping for stock FD rims. Interior and engine bay aren't stated. The free listing's licence wasn't seen, so use the paid Royalty Free one.                                                                                          |

Needs your call (Editorial licence, or licence not seen):

| Model                                                                                           | Where, by           | Licence as listed | Price   | Polycount | Interior | Engine bay | Notes                                                                                                                                                                                                                                               |
| ----------------------------------------------------------------------------------------------- | ------------------- | ----------------- | ------- | --------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Mazda RX-7 FD Full Ready](https://www.cgtrader.com/3d-models/car/sport-car/rx-7-fd-full-ready) | CGTrader, unknown   | unknown           | unknown | unknown   | Yes      | Unknown    | The interior is confirmed, but licence and price weren't visible, so check whether it's Royalty Free or Editorial on the page. The custom spoiler and bumpers may mean it's not a stock body.                                                       |
| [RX7 FD3S BN Sport bodykit](https://www.turbosquid.com/FullPreview/1715974)                     | TurboSquid, unknown | unknown           | USD 32  | unknown   | Unknown  | Unknown    | The BN Sports aero kit is a real aftermarket kit, but it isn't stock. Licence not seen; TurboSquid branded cars are often Editorial, so check before buying. A 'RX7 FD Pandem V3' listing also appeared on TurboSquid (widebody; details not seen). |

Avoid:

- [Mazda RX-7 Panspeed (FD3S)](https://sketchfab.com/3d-models/mazda-rx-7-panspeed-fd3s-745eac0542eb470f9d88b6215f33ee93): Taken from Grid Autosport (mobile), so it's a game rip.
- [Mazda RX7 FD 1999](https://sketchfab.com/3d-models/mazda-rx7-fd-1999-06986b70c65b44c5a7315ed467b621a6): Uploaded by Nieve5677 (@niev), whose profile says they 'did not make any of these models', so the licence isn't from the real author.
- [2023 LB SUPER SILHOUETTE MAZDA FD3S RX-7](https://sketchfab.com/3d-models/2023-lbsuper-silhouette-mazda-fd3s-rx-7-c5c5ad569240468e9f58a8f88e7aaaf0): A heavy Liberty Walk Super Silhouette widebody, not stock. The same uploader (Ddiaz Design) says several of their other models come from NFS or Forza under CC BY-NC-SA. I didn't verify this one's source or licence.

## Engines (not researched yet)

The search budget ran out before these could be researched: 2JZ-GTE, 1JZ-GTE, SR20DET, RB25DET NEO, RB26DETT, VQ35HR, LS3 6.2, LS1 5.7, K24, S54B32, 13B-REW, 20B-REW.

Leads the car researchers spotted in passing, **not checked**:

- 2JZ-GTE standalone engine models on TurboSquid (product IDs 1274111 and 1515225) and on CGTrader.
- VQ35DE engine models: a CGTrader listing "Nissan 350z VQ35DE engine", and TurboSquid 1480000 (67 parts, listed royalty-free). Neither could be opened on 2026-09-27, and both stores' licences exclude them (see "Paid licence terms").
- The CGTrader "Jackboys Mazda RX7 FD" car says it includes a rotary engine under the hood (see RX-7 above).

Leads from the 2026-09-27 re-check, not yet checked in the viewer:

- **S54 (M3):** [S54-presentation](https://sketchfab.com/3d-models/s54-presentation-8e75841b9852413d86bf14ed3a540d47) (rezasaffar, Sketchfab, CC-BY, 1.77M triangles, an STL with no description, UVs or materials) is the only whole S54 found; its origin is unknown and the cover image shows nothing, so look at it in the viewer. Altrous's scanned [S54 piston](https://sketchfab.com/3d-models/bmw-m3-s54-piston-e2f54827ddfd435f9f60a5d371017638) and [front timing cover](https://sketchfab.com/3d-models/bmw-m3-s54-front-timing-cover-9c981e3ef78a4c03a7d798dac5da0552) are CC-BY **with NoAI** (measured from real parts).
- **VQ35DE (350Z):** the most complete free one is kev's [Nissan 350Z VQ35DE Engine Block](https://grabcad.com/library/nissan-350z-vq35de-engine-block-1) on GrabCAD (2014, Inventor; the render shows block, crank, pistons, rods, rings and bearings). But GrabCAD's terms only license other users for "non-commercial, internal use", so it's usable only with kev's permission. A [CadCrowd upload labelled CC-BY](https://www.cadcrowd.com/3d-models/nissan-350z-vq35de-engine-block-and-components) (InnovativeDesignSolutions, 2020) shows a very similar block and may be a re-upload of it (not proven). The CGTrader and TurboSquid VQ35DE listings couldn't be opened, and their licences exclude them anyway.
- **M54 (330i) and VQ35HR:** nothing found beyond small parts.

For the cutaway (Phase 5), engines need separate internals (pistons, rods, crank, valves, cams; rotors and eccentric shaft for the 13B/20B). Most store engines are exterior shells, so check the part list.

## Parts (not researched yet)

Still needed, 2-3 candidates each: turbocharger, supercharger (roots or twin-screw, and centrifugal), front-mount intercooler, aluminium radiator with shroud, drift wheels with tyres, bucket seats, and aero (lip, skirts, diffuser, wing; chassis-specific kits are a bonus).

## Also worth sourcing (not on the brief's list)

The brief opens on "the car on the lift", so a **two-post lift** model is needed for the showroom, along with a few shop props (tool chest, tyre rack). I've added these to `docs/ideas.md` for your approval.

## Raw research data

- `docs/research/asset-candidates-2026-09-26.json`: the Phase 0 search pass, with the search evidence behind each field.
- `docs/research/asset-recheck-silvia-supra-2026-09-26.json`: the S15 and Supra re-check on the live pages, including rejected candidates, licence quotes and the hosts that couldn't be opened.
- `docs/research/asset-recheck-350z-e46-2026-09-27.json`: the 350Z, E46 330i and M3 re-check on the live pages, with the same fields (evidence-file paths from the session scratchpad removed).
