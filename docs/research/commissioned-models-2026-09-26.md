# Commissioning original S15 and JZA80 models: prices, terms and IP

Research for Swap Lab (commissioned-models research agent, reviewed by the lead), read on **2026-09-26** (every "date read" below is 2026-09-26 unless noted). "Page date" is the date printed on the page, where there is one.

- **Published** means a figure or sentence I read on the page myself, quoted exactly.
- **Search summary only** means I saw it only in a search-engine summary because the page itself was blocked. Treat those as leads, not facts.
- **Inference** is my own reasoning, always labelled.
- Web searches used: 18 of 20. Everything else was opened directly (curl, or headless Chromium for JavaScript pages).
- Supporting data, also in `docs/research/` (the raw pages stayed in the session scratchpad):
  - `fiverr_car_gig_tiers_2026-09-26.csv`: every package tier of 141 Fiverr car/vehicle gigs;
  - `cgtrader_car_jobs_2026-09-26.csv`: client-posted CGTrader jobs matched on car keywords (includes some false positives);

## 0. What a commission has to deliver (from the repo)

This defines the deliverables priced in section 5.

- **Format and budget** (BUILD_PROMPT 4): glTF/GLB with Meshopt or Draco and KTX2. **Car GLB ≤ 25 MB, engine GLB ≤ 8 MB**, with LODs: a light showroom model plus a detailed one for the bay or cutaway.
- **Mount points** (CLAUDE.md): `mount_engine`, `mount_turbo`, `mount_intercooler`, `mount_seat_driver`, `mount_wheel_fl|fr|rl|rr` and so on.
- **Camera modes** (BUILD_PROMPT 8):
  - Showroom: PBR exterior.
  - Engine bay: the bonnet opens on a hinge, and the parts are clickable.
  - Cutaway: pistons, rods and crank move with RPM and firing order; valves open on cam timing; the turbo turbine spins; flow paths run through the manifold, turbo, downpipe, intercooler and coolant circuit.
  - Cabin: first person, with a moving tach, boost, oil-pressure and water-temperature gauges.
  - Dyno: the car on rollers.
- **Licence:** per `docs/asset-shopping-list.md` ("Paid licence terms"), none of the stock licences checked (Sketchfab Standard, CGTrader Royalty Free / No AI, TurboSquid) allows a plain GLB served from a public repo. That is the main reason to consider commissioning.
- **CLAUDE.md:** no AI-generated models and no game rips. Rule 10: ask before adding paid services.

## 1. Published prices and rate cards for custom car modelling

### 1.1 Specialist car-model studios

| Studio                                          | URL                                                                                                      | What the page says (quoted)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Page date  | Price published?                                                                           |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------ |
| **Squir** (3d Studio Tomasz Rozkosz)            | https://squir.com/about-us                                                                               | "We do custom jobs on demand ... Provide short brief what is needed, what is your budget and deadline, and we will reply as soon possible. We can make the all-new model or just modify one from our existing library to fit your needs." / "Price depend mostly from the working hours needed to build the model and also by overall work schedule. Usually we are loaded with jobs for several weeks ahead. So if you ask us for a rush, the price will be higher." / "Our native software is 3dsmax 2015." / "Other formats are just conversions from 3dsmax, so they will include only basic materials setup like color and texture, without advanced shadders like reflections." | none shown | **No price.** Quote on request.                                                            |
| Squir (licence)                                 | https://squir.com/about-us                                                                               | "The models are sold under general Editorial license" / "Of course we can discuss a custom copyright agreement if you need to use the models in a commercial project."                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | none       | n/a                                                                                        |
| Squir (existing stock of our two cars)          | https://squir.com/toyota-supra-1993-2002.html, https://squir.com/nissan-240-sx-silvia-s15-1999-2002.html | Supra 1993-2002: "€59.00", "Polygons: 320000 Vertices: 320000 Textures: Yes Materials: No". Silvia S15 1999-2002: "€99.00", "Polygons: 350000 ... Materials: Only for the 3dsmax mentalray". Interior and engine bay aren't stated.                                                                                                                                                                                                                                                                                                                                                                                                                                                   | none       | Stock prices, Editorial licence.                                                           |
| **3DModels.org** (hum3d.com now redirects here) | https://3dmodels.org/custom-3d/                                                                          | **Couldn't open** (HTTP 403 Cloudflare check, for curl, headless Chromium and WebFetch alike). Search summary only: the team "can create a custom 3D model of any car or vehicle you need, using reference images, drawings, technical documentation", and "If you send them a request they will give you the price and time frames".                                                                                                                                                                                                                                                                                                                                                 | n/a        | **Not found** (quote on request, per the search summary).                                  |
| Hum3D catalogue add-ons (second-hand)           | https://diecast.org/community/1_43/3d-models-from-hum3d/                                                 | A forum post dated 06/07/2023 about Hum3D's site: "Shows a price of $95 but a detailed interior at $1200 ??". A reply: "the quoted base price of £83 ... the "print-ready" version costs an eye-watering £795 and the "detailed interior" version is £1060."                                                                                                                                                                                                                                                                                                                                                                                                                          | 2023       | A forum user's reading of Hum3D's 3D-print options, not a custom rate card. Weak evidence. |
| Hum3D on Clutch                                 | https://clutch.co/profile/hum3d                                                                          | Couldn't open (Cloudflare). A search didn't show a rate either.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | n/a        | **Not found.**                                                                             |
| **Nasty Rodent** (game vehicle studio)          | https://nastyrodent.com/3d-vehicles/                                                                     | "Most vehicle quotes cover the exterior. Then the interior turns out to be a second full asset, the moving parts need a rig, the damage states need variants, and the physics body needs someone to set it up." / "An interior is effectively a second asset per vehicle" / "Reference-accurate vehicles built from photo reference and technical drawings"                                                                                                                                                                                                                                                                                                                           | none       | **No price.**                                                                              |
| SunStrike Studios                               | https://sunstrikestudios.com/en/blog/3d-game-art-outsourcing-guide/                                      | Vehicles are listed as a service, with no vehicle price.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | none       | **Not found.**                                                                             |
| "Ultimate Car Models" / Evermotion-type         | n/a                                                                                                      | Didn't find a custom car-modelling service with prices under these names.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | n/a        | **Not found.**                                                                             |

### 1.2 Game-art outsourcing studios (published rate cards)

**RocketBrush Studio (Limassol, Cyprus), vehicles** ([source](https://rocketbrush.com/blog/3d-weapon-vehicle-art-price-what-studios-should-expect); page says "Prices updated September 2025"):

- Table headed "Estimates for optimized, game-ready models of weapons and vehicles":
  - "Game-ready weapon $1,500–3,000"
  - "Vehicle (optimized) $4,000–8,000+"
- "We offer a flexible rate system of $35–37/h, with reduced per-asset costs on bulk orders."
- Tiers: "Vehicles (low-to-mid complexity): Cars, bikes and small transports with functional wheels or simple rigs"; "Vehicles (complex or hero level) ... require detailed interiors, advanced shaders and full rigging".
- Doesn't say whether the vehicle price includes an interior or turnaround.

**RocketBrush, general 3D** ([source](https://rocketbrush.com/blog/how-much-does-3d-modeling-cost-rates-and-budget-management-tips); "Prices updated May 2025"):

- Time estimate: "Complex Vehicles/Machinery 2-6 weeks".
- Regional hourly rates: "United States $70 - $150 / hr", "United Kingdom $40 - $130 / hr", "Eastern Europe $25 - $100 / hr", "India $15 - $50 / hr", "Global Freelancers $50 - $100 / hr".
- Its own rate: "our 3D modeling cost per hour is from 30 to 60 dollars".

**Pixune (Warsaw)** ([source](https://pixune.com/blog/game-art-outsourcing-price/); page modified 2026-09-06):

- "3D game art outsourcing usually falls between $40 and $150 per hour".
- "Props such as weapons, vehicles, or interactive objects are usually priced $500 to $2,500 per asset, depending on the level of detail, required rigging, and animation states."
- "Studios in North America or Western Europe often charge $60–$150+ per hour, Eastern Europe $30–$80, Southeast Asia $20–$60, and Latin America $30–$90."
- Interior and turnaround are not stated.

### 1.3 Web car-configurator studios (the closest match to real-time web delivery)

**Yord Studio** ([source](https://yordstudio.com/3d-car-configurators-how-they-work-and-what-they-cost/); published 2026-09-04, modified 2026-09-16):

- "Pilot / single model One vehicle, configurator app, core exterior and interior customisation options ... From €20,000".
- "Each additional model Extra vehicle added to an existing build, reusing the established pipeline and UI +€5,000 per model".
- "Where CAD is unavailable or unusable, vehicles can be modelled from reference — this adds cost and time to the project."
- These prices include the app and assume manufacturer CAD. The S15 and JZA80 have no CAD available to us.

**Visartech** ([source](https://www.visartech.com/blog/cost-of-custom-car-interior-made-with-webgl/); no date shown):

- A WebGL car interior built from scratch. Task table: "Create a model with normal maps 56 80" (hours; the columns are labelled pessimistic and optimistic). Total "112 168" hours including the configurator code.
- "building a 3D interactive car interior from scratch can take 3-5 weeks".
- "Let's take the minimum rate of $80 per hour in North America. The approximate budget you need to build a 3D constructor and an immersive car interior varies from $8,960 (optimistic) to $13,440 (pessimistic)."

**Eyedex, 3D model cost calculator** ([source](https://eyedex.co/tools/3d-model-calculator/); published 2026-03-11):

- Category table: "Automotive $500 – $1,500" per model, "$20 – $80" per variant.
- "Creating 3D models for a product catalog typically costs $140–1,500 per base model".
- It's a product-catalogue tool, so it's unclear whether "Automotive" means whole cars.

### 1.4 Marketplace custom-modelling services

**CGTrader "3D Projects"**

- Pages: https://www.cgtrader.com/3d-modeling-jobs and /browse. The old URL `/3d-modeling-services` now goes to `not_found`.
- "Home to 40,000 freelance 3D designers". Clients post a budget, and designers apply. "Securely prepay the budget to CGTrader ... Release the payment when you're happy with the end result." The board showed "1 - 10 of 4198 jobs".
- **No rate card.** Budgets are set by the client and show what clients offer, not accepted prices.
- Examples, taken through the page's own jobs API:
  - "Nissan Y33 Cedric" (2024-03-11): budget **$200**. "It would just be a stock exterior model. The interior doesn't need to be modelled at the moment ... Have a flexible budget for good work."
  - "Toyota Crown Interior" (2024-02-13): **$70**, interior only, "Low/MidPoly Model (20-40k) Tri ... GAME READY MODEL ... We can start with 70USD and I can pay more if you meet the criteria."
  - "Stylized Porsche Car Model" (2023-03-30): "I am looking to spend around $300 - $400 a car ... This would involve creating an exterior and interior, but the interior does not need to be highly detailed."
  - "Navistar MV 5000 ... for American truck Simulator" (2022-01-20): **$300**, "Full interior and exterior."
  - "GMC Savana" (2022-01-27): **$350**, "Vehicle with Interior ... it needs Textures too".
  - "Racing Game Car and Driver Designer" (2024-05-23): **$800**.
  - "Vehicle Artists" (2025-03-13): **$200**, "able to keep models under 250k, ideally under 200k tris textures under 4096".
  - "Vehicle modellers" (2024-08-05): **$100**, "optimized for Unreal Engine, with a poly count below 180,000 polygons".
  - Many posts show $50 or $70. They look like placeholder minimums; I haven't verified that.
- The **"Resell"** tag on a job means: "Client renounced exclusive rights to content created with this 3D Project, furthermore the designer is allowed to retain the Intellectual property rights and publish Project results on the marketplace."

**TurboSquid**

- "TurboSquid specializes in offering ready-made, pre-designed 3D models ... They do not directly cater to requests for custom model creation, animation services, or freelance artist hiring. For customers seeking custom 3D work or contract-based collaboration, TurboSquid recommends using CGHero.com." ([help article](https://www.turbosquid.com/help/en/articles/9937516-can-i-contact-a-turbosquid-artist-directly), page date April 29, 2026)
- CGHero's partner page (https://cghero.com/turbosquid): "Complete the form to request custom 3D models, model customization, file conversion, and more." **No price.**

**Sketchfab / Fab:** no commissioning service or price found. I didn't open fab.com this session; the repo's earlier check found it behind Cloudflare.

### 1.5 Freelance platforms

**Fiverr: 141 gig pages parsed** (package JSON read directly from each gig page).

- Category pages used:
  - https://www.fiverr.com/gigs/3d-car-modeling ("12788 services available")
  - /gigs/game-ready-car
  - /gigs/game-ready-vehicle
  - /gigs/3d-vehicle-modeling
  - /gigs/3d-car-model
- Prices are the sellers' listed package prices. Platform fees were not checked.

Summary (my arithmetic on the published tiers; the full list is in the CSV). For the **107 car or vehicle gigs that aren't 3D-print, STL, body-kit or product-render gigs**:

- Cheapest tier: median **$30**.
- Top tier: median **$150**, quartiles **$80 / $150 / $300**, maximum **$1,350** (that's a five-car pack).
- **52 tiers** explicitly include an interior:
  - the **43 not labelled "basic"** have a median of **$180**, quartiles **$120 / $180 / $275**, range **$40 to $800**;
  - delivery median **7 days** (range 3 to 60);
  - source file: included in 16, a paid extra in 1, not listed in 35.
- **Engine bays are not priced in any tier.** One seller writes: "If you need a fully functional, interactive 3D interior with dashboard components or 3D engine bays, please message me for a custom quote." ([dudu_santana](https://www.fiverr.com/dudu_santana/create-low-poly-and-mid-poly-3d-car-models-for-games))

Representative tiers (quoted):

| Gig                                                                                                                                      | Tier: price, delivery                                     | Includes (quoted)                                                                                                                                                                            | Source file             |
| ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| [vlatkoart](https://www.fiverr.com/vlatkoart/3d-model-and-render-vehicles)                                                               | Basic $130/3 d; Standard $400/6 d; **Premium $800/10 d**  | "Basic Level of Detail Only Exterior" / "Detailed Exterior" / "Detailed Exterior and Interior"; the gig text also lists "Detailed Engine bays" as a service                                  | **extra $25**           |
| [stefaniesanger](https://www.fiverr.com/stefaniesanger/create-game-ready-3d-car-models-and-vehicle-assets-for-games)                     | $60/4 d; $200/7 d; **$450/14 d**                          | "Detailed exterior \| Optimized topology \| UV mapping \| PBR textures" ($200); "Detailed exterior + interior \| High/low poly \| UVs \| PBR textures \| Optimization \| Source file" ($450) | in the $450 description |
| [jawadahmad2](https://www.fiverr.com/jawadahmad2/model-cars-in-blender-for-printing-or-renders)                                          | $150/5 d; $250/10 d; **$500/14 d**                        | "High Detail Exterior" ($250); "This service will provide exterior and interior of the car." ($500)                                                                                          | included                |
| [rezamedika](https://www.fiverr.com/rezamedika/create-any-3d-vehicle-or-part-of-vehicle-with-high-quality)                               | $100/7 d; $300/14 d; **$700/30 d**                        | "Medium Detailed of vehicle with accurate silhouette and Basic Interior" ($300); "Highly Detailed of vehicle with its interior" ($700)                                                       | not listed              |
| [charfivem](https://www.fiverr.com/charfivem/create-game-ready-3d-vehicles-cars-fivem-custom-game-vehicle-assets-gta-v)                  | $45/3 d; $120/7 d; **$350/10 d**                          | "Detailed custom 3D vehicle, Full exterior + interior, UV mapping, Vehicle rigging, LOD preparation"                                                                                         | not listed              |
| [vkymdr](https://www.fiverr.com/vkymdr/create-3d-vehicle-for-you) (gig title mentions "glb, gltf, web configurator")                     | $100/4 d; $200/7 d; **$350/10 d**                         | "High-detail 3D vehicle model with both interior and exterior, realistic materials."                                                                                                         | included                |
| [munna4020](https://www.fiverr.com/munna4020/do-3d-vehicle-modeling)                                                                     | $85/4 d; $195/7 d; **$350/14 d**                          | "Detailed Exterior" ($195); "Detailed Exterior and Interior" ($350)                                                                                                                          | not listed              |
| [daniel_olatoro1](https://www.fiverr.com/daniel_olatoro1/create-game-ready-car-models-with-realistic-3d-vehicle-design-for-game-engines) | $100/5 d; $300/10 d; **$700/21 d**                        | "Full vehicle package with modeling, textures, rigging, optimization, and engine setup."                                                                                                     | not listed              |
| [studio57_3dviz](https://www.fiverr.com/studio57_3dviz/do-3d-car-modeling-3d-vehicle-and-realistic-renders) (render-oriented)            | $300/4 d (1 car); $850/7 d (3 cars); $1,350/10 d (5 cars) | "creation of one 3D car model and render"                                                                                                                                                    | included                |
| [lj_works](https://www.fiverr.com/lj_works/do-realistic-3d-renders-of-your-vehicle) (render-oriented, Blender)                           | $50/3 d; $120/5 d; $250/7 d                               | "Highly realistic exterior and interior 3D car model with premium detailing and a cinematic video" ($250)                                                                                    | included in $250 only   |
| [mrsonusapkal](https://www.fiverr.com/mrsonusapkal/model-cars-for-3d-print) (add-on prices)                                              | extras                                                    | "High Car Interior" **$150**, "Mid Car Interior" **$80** (a 3D-print gig)                                                                                                                    | n/a                     |

Several gigs are aimed at GTA V / FiveM modding (for example charfivem, janpeters3, tina_v_florez). **Inference:** that matters for CLAUDE.md's no-game-rip rule, so provenance has to be warranted in the contract (section 3).

**Upwork** ([source](https://www.upwork.com/resources/upwork-hourly-rates); page date "May 12, 2026"):

- Design and creative rates: "3D Animators: $17-$30/hr", "3D Artists: $25-$40/hr", "3D Designers: $17-$30/hr", "3D Modelers: $17-$30/hr", "2D Game Artists: $15-$30/hr". Also "3D Rendering Artists: $25-$40/hr".
- These "reflect typical public hourly rates on freelancer profiles by skill and category".
- The hire and cost pages (https://www.upwork.com/hire/3d-modelers/cost/, /hire/car-modeling-freelancers/) **couldn't be opened** (Cloudflare). Search summary only: "The median hourly rate for 3D Modelers on Upwork is $25".
- No per-car price published.

### 1.6 Rate surveys and published hourly rates

**Polycount wiki, "Freelance"** ([source](http://wiki.polycount.com/wiki/Freelance); page last modified 1 September 2024; the table itself isn't dated). "The following numbers are averages, posted by Polycount members":

| Freelancer type                | Day rate       | Hourly      |
| ------------------------------ | -------------- | ----------- |
| Offshore individual contractor | $120 - 375/day | $15 - 47/hr |
| U.S.A. individual contractor   | $300/day       | $37.50/hr   |
| U.S.A. average studio          | $500/day       | $62.50/hr   |
| U.S.A. high-end studio         | $800/day       | $100/hr     |

The page adds: "Individual contractors in the USA generally range from $275 - 500 per day ($34.50 - 62.50 per hour)".

**Twine** (freelance marketplace blog, not a survey; [source](https://www.twine.net/blog/3d-designer-hourly-rates/); published 2026-04-08, modified 2026-08-18):

- By experience: "Junior Designers ... $25 to $50 per hour"; "Mid-Level ... between $50 and $100 per hour"; "Senior ... from $100 to $200 per hour or more".
- By region: "In the US and Canada, freelance 3D designer rates often range from $50 to $200 per hour"; "Western Europe, clients may pay €40 to €150 per hour, while many Eastern European freelancers offer ... €20 to €70 per hour".

**ITJobsWatch UK, "3D Artist" contracts** ([source](https://www.itjobswatch.co.uk/contracts/uk/3d%20artist.do)): "The median 3D Artist daily rate in the UK is £310". But the table shows "Number of daily rates quoted 1", so it's too thin to use.

**No survey specific to vehicle or hard-surface artists was found.**

### 1.7 AAA reference points (build time, not price)

- Gran Turismo 7: "it takes 270 days to make one such car" (Kazunori Yamauchi, via [80.lv](https://80.lv/articles/one-gran-turismo-7-car-takes-270-days-to-make), 2023-01-13).
- Forza Motorsport 5: "It takes more than six months to build every car." (Dan Greenawalt, [Shacknews](https://www.shacknews.com/article/82173/interview-forza-motorsport-5-creative-director-defends-in-game-economy), 2013-11-26).
- Both are elapsed times for AAA simulator cars with manufacturer data. They're an upper bound, not a comparable scope.

### 1.8 Real-time (game-ready) versus high-poly render models

|                        | Real-time / game-ready (low-poly, baked normals, PBR)                                                                                                                                                       | High-poly render models                                                                                                 |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Studio figures         | RocketBrush "Vehicle (optimized) $4,000–8,000+" (interior not stated); Pixune "$500 to $2,500 per asset"; Yord from €20,000 incl. app, +€5,000 per extra model (from CAD); Visartech interior model 56–80 h | Squir: custom on request, 3ds Max with V-Ray or Corona; other formats are "just conversions", with basic materials only |
| Marketplace figures    | Fiverr game-ready tiers, e.g. $200 "Detailed exterior ... PBR textures", $350 to $450 exterior + interior with LOD or high/low bake (table above)                                                           | Fiverr render gigs, e.g. $300 per car including a render, and $250 to $800 exterior + interior                          |
| What's usually missing | Engine bays (quote only); moving internals (not offered); LODs appear as extras (e.g. "Additional Lods $10", "Lod $30")                                                                                     | Real-time budgets, glTF-ready PBR                                                                                       |

## 2. Detailed engine with separate internals

**Commission price: not found.** No studio, marketplace or freelance page I could open publishes a price for commissioning an engine with separate, animatable internals. Fiverr only offers engine bays as "message me for a custom quote" (quoted in 1.5).

Stock listings with internals (these are price anchors, not commissions, and their licences have the problems described in the repo):

| Listing                                | URL                                                                                                                | Quoted details                                                                                                                                                                                                                                                                                                                                                                | Price                                 | Licence as shown                                                                              |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------- |
| Toyota 2JZ-GTE Engine (100by100Studio) | https://www.cgtrader.com/3d-models/vehicle/vehicle-part/toyota-2jz-gte-engine-2932b715-2f42-4ecd-93ce-df9507c67ce8 | "2jz-GTE 3000 VVT-i Twin Turbo Engine ... Ready for game engines. Rigged and animated." "It consists of 90 parts." "4 sets of 2K textures, PBR Metalness. Only .max file and FBX file has animation setup." "35834 polygons / 40198 vertices". Published 2020-02-26. A buyer: "Rare to find a mechanical model with the internal details and rigging for such a great price." | **$48.00** (list $80.00, -40%)        | "Royalty Free License (no AI)": still excluded, because rule 5 accepts NoAI only on CC0/CC-BY |
| 1zz 4 cylinder animated engine         | https://www.cgtrader.com/3d-models/car/car/1zz-4-cylinder-animated-engine                                          | "Textured, animated. rigged ... Detalization and sepateted crankshft,camshafts, pistons, pulleys." "50000 polygons / 30000 vertices"                                                                                                                                                                                                                                          | **$17.50** (list $34.99)              | "Royalty Free License (no AI)"                                                                |
| Animated V8 Engine (3D Horse)          | https://www.3dhorse.com/products/animated-v8-engine                                                                | "High quality, fully detailed and animated V8 engine 3d model. Animated model has accurate timing. All required parts: (crank, connecting rods, pistons, cam, valves) conform to this timing." "Polygons: 8,856,770"                                                                                                                                                          | **$449.00** list, **$229.00** shown   | Not checked on 3dhorse.com                                                                    |
| Same V8 on RenderHub                   | https://www.renderhub.com/3d-horse/v8-engine                                                                       | "Extended Use License"; "Game Ready: –"; "PBR: –"; "Published: Aug 30, 2019"                                                                                                                                                                                                                                                                                                  | $449.00 list, **$269.40** ("40% OFF") | "Extended Use License", terms not read                                                        |

Related:

- Other 2JZ engine shells on the CGTrader 2JZ tag page (https://www.cgtrader.com/3d-models/2jz) show "$52.50" and "$40.60" after discounts. I didn't open them to check for internals.
- Reference scanning of an engine (Formeon, UK, [source](https://formeon.co.uk/posts/costs-of-3d-scanning/), 2024-01-23): "Scanning a vintage motorcycle engine ... would cost around £300-£450 in our studio."

## 3. Licence and contract terms for commissioned 3D work

### 3.1 Work-for-hire versus assignment (US law)

US Copyright Office, Circular 30 "Works Made for Hire" ([PDF](https://www.copyright.gov/circs/circ30.pdf), "REVISED: 08/2024"):

- A commissioned work is work-for-hire only if it is "specially ordered or commissioned for use" in one of nine categories:
  - "a contribution to a collective work",
  - "a part of a motion picture or other audiovisual work",
  - "a translation", "a supplementary work", "a compilation", "an instructional text", "a test", "answer material for a test", or "an atlas";
  - and only "if the parties expressly agree in a written instrument signed by them".
- "If a work fails to satisfy any of these requirements, it is not a work made for hire."

**Inference:** a 3D car model for a web app doesn't clearly fit those categories. That's why the platform contracts below state that the client owns the work and then also _assign_ it as a fallback. Saudi law (the owner's jurisdiction) was not researched.

### 3.2 Platform defaults

**Upwork, Optional Service Contract Terms** (https://www.upwork.com/legal#optional-service-contract-terms, "Effective November 21st 2025"). These apply unless the parties agree otherwise.

- **6.4:** "Upon Freelancer's receipt of full payment from Client, the Work Product (except for any Background Technology), including without limitation all Intellectual Property Rights in the Work Product ... will be the sole and exclusive property of Client, and Client will be deemed to be the author thereof. If Freelancer has any Intellectual Property Rights to the Work Product that are not owned by Client ... Freelancer hereby automatically irrevocably assigns to Client all right, title and interest worldwide ... Freelancer retains no rights to use ... Freelancer hereby waives any moral rights".
- **6.2:** "Freelancer will separately provide, with each delivery of Work Product to Client, a bill of materials that identifies all Background Technology and other third-party materials that have been incorporated into the Work Product and provides, for each item ... (b) the applicable license or licensing terms".
- **6.1:** the freelancer "will not incorporate or use the materials of any third party ... that are not generally available for use by the public or have not been legally transferred to the Client."
- **6.5:** background technology is licensed to the client: "exclusive, perpetual, fully-paid and royalty-free, irrevocable and worldwide right, with rights to sublicense".
- **7.3:** "Client and Freelancer will not publish, or cause to be published, any other party's Confidential Information or Work Product".

**Fiverr, Terms of Service** (https://www.fiverr.com/legal-portal/legal-terms/terms-of-service, "Last update: January 2026"), section 10:

- "When purchasing a Service on Fiverr, unless clearly stated otherwise on the Seller's Gig page/description or in the Custom Offer, when the work is delivered, and subject to payment, the Buyer is granted all intellectual property rights, including but not limited to, copyright in the work delivered from the Seller, and the Seller waives any and all moral rights ... Accordingly, the Seller expressly assigns to the Buyer the copyright in the delivered work."
- "in custom created work (such as art work, design work, report generation etc.), the delivered work and its copyright shall be the exclusive property of the Buyer".
- But: "Some Gigs (including for custom created work) charge additional payments (through Gig Extras) for a Commercial Use License ... If you intend to use it ... for any purpose that is directly or indirectly in connection with any business ... you will need to buy the Commercial Use License".
- **10.2:** "the Seller grants you a perpetual, exclusive, non-transferable, worldwide license to use the purchased delivery for Permitted Commercial Purposes. For the avoidance of doubt, the Seller retains all ownership rights. "Permitted Commercial Purposes" means any business related use, such as ... creating web pages, integration into product, software".
- Of the 141 car gigs, only one ([haylego](https://www.fiverr.com/haylego/create-game-ready-3d-car-model-gig-racing-vehicle-for-unity-and-unreal-engine)) mentions a "Commercial use license" in its description.

**CGTrader, 3D Projects Terms of Use** (https://www.cgtrader.com/pages/3d-projects-agreement; no date shown):

- **6.2:** "Buyer may obtain exclusive or non-exclusive license to the Products as it is agreed between the Designer and the Buyer."
- **6.3:** "In case the Buyer obtains a non-exclusive license to the Products, the General Terms of Licensing in the General Terms and Conditions shall apply".
  - In the General T&C (https://www.cgtrader.com/pages/terms-and-conditions), 20.2 makes Royalty Free the default licence.
  - 21A.3 says: "If you use any Product in software products (such as video games, simulations, or VR-worlds) you must take all commercially reasonable measures to prevent the end user from gaining access to the Product."
- **6.4:** "If the Buyer marks "I allow the Designer to sell 3D project results on the marketplace" checkbox he/she is thereby explicitly allowing the Designer to edit, modify and publish 3D project results for sale on the marketplace in the future."
- **6.5 (exclusive):**
  - "valid within the whole territory of the world";
  - "for the maximum validity of the author's economic rights";
  - "The Buyer is granted all author's economic rights, including ... the making available to the public of the Product over computer networks (on the Internet)";
  - "The Buyer has the right to transfer or sub-licence the license to third parties."
- **6.6:** under an exclusive licence, "the Designer has no right to provide the license of the Product to any third party or to use any of the author's economic rights himself".
- **6.7:** under a non-exclusive licence, "the Designer has the right to provide a non-exclusive license of the Product to any third party".
- **3.6:** "If the Buyer himself or herself orders the Product to include third party copyrighted, industrial property or trademarked images, logos, brand names, etc, it is the responsibility of the Buyer to determine ... whether additional licensing, rights, permissions, releases, or clearance are necessary".
- **7.1:** "Buyer is deemed to have accepted it if he or she has opened the submitted Product and has not lodged an objection regarding the quality in 10 business days."

**CGHero, Terms of Service** (the TurboSquid partner; https://cghero.com/terms-of-service, "Last modified: August 13, 2026"):

- "Unless otherwise agreed in writing, Intellectual Property Rights in Deliverables created specifically for a Client will transfer to the Client when the relevant Project, milestone, Task or separately priced portion of the work has been paid for in full."
- "Where Deliverables contain third-party materials, software, fonts, stock assets or other third-party Intellectual Property Rights, the Client receives only the rights available under the applicable third-party licence."
- "Heroes may use AI Tools in performing work unless the relevant Project, Task or agreed requirements restrict or prohibit their use."

**RocketBrush, terms of work** (https://rocketbrush.com/blog/terms-of-work-on-new-projects-rocketbrush-studio):

- "Under no circumstances can we submit the exports (source files) before they are paid for."
- "We reserve the right to publish the results of our work in our portfolio. However, we respect your needs to publish the game without untimely exposure of the assets, so we always check it with you first."
- Payment is by milestone, "each milestone being paid in advance", or "50% advance payment for the milestone".

**Squir:** stock is Editorial. For commercial use, "we can discuss a custom copyright agreement" (quoted in 1.1).

### 3.3 Do artists usually keep the right to resell?

**Published:**

- It depends on the platform default. Upwork (6.4), Fiverr (section 10) and CGHero transfer IP to the buyer on payment unless agreed otherwise.
- CGTrader makes resale an explicit choice: the 6.4 checkbox and the "Resell" tag. A non-exclusive project licence (6.7) lets the designer license the work to others.
- Fiverr's paid "Commercial Use License" is exclusive, but "the Seller retains all ownership rights".
- Studios keep portfolio rights (RocketBrush, after checking with the client).

**Not found:** any published discount for allowing resale.

### 3.4 Source files (.blend / .max / .spp)

**Published:**

- On Fiverr, "Source file" is a per-tier feature or a paid extra. Vlatkoart charges **$25**. Of the 52 interior tiers, 16 include it, 1 charges extra and 35 don't list it.
- RocketBrush releases source files only after payment.
- Squir works natively in 3ds Max 2015, and other formats are "just conversions".

**Not found:** any published term that mentions Substance Painter (.spp) files specifically.

**Inference:** list every source type by name in the contract: .blend or .max, .spp, texture sources at full resolution, and bake cages.

### 3.5 Real-time or web use

**Published:**

- CGTrader's exclusive project licence (6.5) explicitly covers "making available to the public ... over computer networks (on the Internet)".
- A non-exclusive project licence falls back to 21A.3's duty to prevent end users getting at the model. That is the same problem as the stock licence.
- Fiverr's Commercial Use License names "creating web pages, integration into product, software".

**Inference:** only an assignment, or an exclusive licence that explicitly allows public distribution of an unprotected GLB, fits Swap Lab's public-repo GitHub Pages delivery.

## 4. Modelling real branded cars

### 4.1 Commissioning doesn't clear the carmaker's IP

**TurboSquid 3D Model License** (https://blog.turbosquid.com/turbosquid-3d-model-license/, effective March 16, 2023):

- ""Depicted Intellectual Property" means any intellectual property depicted in the 3D Model, including any copyright, trademark, trade dress, right of publicity, or any other proprietary right".
- "TurboSquid does not own or license any Depicted Intellectual Property."
- "TurboSquid has an official license agreement with many companies. Each company has specified allowed uses for 3D Models depicting their brands. As an example, here are the uses from Ford Motor Company . After Purchase, each requested use will be reviewed on a case-by-case basis and approved or denied at each company's sole discretion."

**TurboSquid, "Associated Brands Information"** (https://www.turbosquid.com/help/en/articles/9937426-associated-brands-information, March 20, 2025):

- "while the artist owns the 3D model itself, another group may claim ownership in the subject matter depicted."
- "In some cases such as with Honda, the company has notified TurboSquid that Honda will not allow its products to be used for any purpose other than under the Editorial Use restrictions."
- "It is wholly your responsibility to ensure that you are properly using any intellectual property depicted in the 3D Model. **This applies equally whether you license a 3D model or create it yourself.**"

**TurboSquid, "Editorial Use Information"** (https://www.turbosquid.com/help/en/articles/9937424-editorial-use-information, April 27, 2026):

- "Can I use "Editorial Use Only" models in a video game? No, using these models in video games is considered a commercial use and is prohibited unless you obtain explicit permission from the IP owner."
- "Modifying the model to remove or obscure the depicted intellectual property is prohibited."

**CGTrader 3D Projects 3.6** (quoted in 3.2): trademark clearance is the buyer's responsibility.

### 4.2 Trade dress and case law (US)

**Ferrari S.p.A. v. Roberts**, 944 F.2d 1235 (6th Cir. 1991) (https://cyber.harvard.edu/IPCoop/91ferr1.html):

- "the unique and distinctive exterior shape and design of the Daytona Spyder and the Testarossa are protected trade dress which Roberts has infringed by copying them and marketing his replicas."
- The court affirmed. The case was about physical kit-car replicas.

**AM General v. Activision** (Humvees in Call of Duty; S.D.N.Y. No. 17-8644):

- The court granted summary judgment for Activision on all trademark and trade-dress claims. [MSK](https://blogmsk.com/2020/04/02/msk-scores-a-win-for-activision-in-call-of-duty-trademark-litigation/) dates it "March 31, 2020"; [AIPLA](https://www.aipla.org/detail/news/2020/04/08/activision-beats-humvee-trademark-claims-over-call-of-duty) says "Opinion 4/1/20".
- The court applied the Rogers test: "[i]f realism is an artistic goal, then the presence in modern warfare games of vehicles employed by actual militaries undoubtedly furthers that goal."

**Bloomberg Law on the same case** ([source](https://news.bloomberglaw.com/ip-law/court-weighs-if-get-in-the-humvee-takes-trademark-law-off-road), July 25, 2019):

- "AM General has licensed the Humvee to other game makers".
- A lawyer quoted there "doesn't see the Humvee, however exact in depiction, as central to the user experience the way a specific car can be in a racing game".

**Jack Daniel's Properties v. VIP Products**, US Supreme Court, "Decided June 8, 2023" (https://www.supremecourt.gov/opinions/22pdf/22-148_3e04.pdf):

- "When an alleged infringer uses a trademark as a designation of source for the infringer's own goods, the Rogers test does not apply."

**Inference, not legal advice:**

- In Swap Lab the specific car is central to the product.
- The US Rogers defence is narrower after 2023 and doesn't apply outside the US.
- BUILD_PROMPT 5.5 (descriptive names, no logos as branding, no implied endorsement) is the right posture.
- Get a lawyer's view for the owner's jurisdiction before relying on it.

### 4.3 Design patents

US design patents from applications "filed before May 13, 2015 have a 14 year term from the date of grant" (USPTO MPEP 1505, https://www.uspto.gov/web/offices/pac/mpep/s1505.html).

**Inference:** any US design patent on the 1993 A80 or 1999 S15 body would have expired. I didn't look up specific patents, and Japanese design rights weren't researched. Trademarks and trade dress don't expire while they're in use.

### 4.4 Badges

**Published:**

- TurboSquid's generic-content policy (https://resources.turbosquid.com/general-info/terms-agreements/turbosquids-policy-on-publishing-generic-content/; no date shown): "Trade dress refers to visual characteristics of a product, its packaging, and/or its design ... This means that simply removing logos and brand references from a branded model may not be enough to accurately call a product generic." Also: "If your product claims to be a generic car, but has the word "Ford" within the product file itself, this will instantly disqualify your product for generic status."
- Game-mod clients commission de-branded ("lore friendly") versions. A CGTrader job ([source](https://www.cgtrader.com/3d-modeling-jobs/browse/336590-remake-of-mercedes-firetruk-to-lore-friendly-generic), 2026-04-01, $70) asks: "What need to be changed: Front(Lightning, Grill, Mirror) Back(lights), wheels and all brand logos need to be changed".
- Another job ("Vehicle Artists", 2025-03-13) lists "Able to modify existing car designs to be copyright free for game use".

**Not found:** any studio policy on whether badges are modelled by default.

**Inference:** ask for badges and script lettering as separate, named meshes and decals, so they can be hidden. That doesn't remove the trade-dress question.

### 4.5 References: blueprints, photos, scans

**Published:**

- Squir: "The model can be build without the blueprints, basing on photos only. But of course the blueprints or a scan will help us to make the model more accurate."
- Nasty Rodent works from "photo reference and technical drawings".
- Yord: without CAD, modelling "from reference ... adds cost and time".
- Formeon (UK): "full car 3D scan, which we conduct on-site. This service ranges from £800-£1000" (2024-01-23). Scanning prices in Saudi Arabia were not researched.
- the-blueprints.com: the first catalogue page for Nissan lists "Nissan CUSCO S15 Silvia 575 x 309" (a race car). The Toyota page lists only race-car Supras ("Minolta Toms Supra", "SupraSnake drift car"). I didn't page through the full catalogue.

**Inference:** accurate stock-body references for these two cars may have to come from photos plus measurements, or a scan of a local car.

## 5. What the numbers suggest

### 5.1 Published figures, by deliverable (nothing added)

| Deliverable                        | Marketplace (listed tiers or budgets)                                                                                                                                                     | Studio or agency                                                                                                                                                                        | Time                                                                          |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **Exterior only**                  | Fiverr "Detailed Exterior" $195 to $400 (munna4020, stefaniesanger, jawadahmad2, vlatkoart); a CGTrader client budget of $200 for a stock exterior                                        | RocketBrush "Vehicle (optimized) $4,000–8,000+" (interior not stated); Pixune "$500 to $2,500 per asset"                                                                                | RocketBrush "Complex Vehicles/Machinery 2-6 weeks"; Fiverr tiers 3 to 10 days |
| **Exterior + interior**            | Fiverr detailed-interior tiers: median $180, quartiles $120–$275, top $800; Fiverr add-on "High Car Interior" $150; Hum3D detailed interior $1,200 (catalogue, 2023 forum, print context) | Visartech WebGL car interior model 56–80 h (total $8,960–$13,440 including configurator code at $80/h); Yord from €20,000 per vehicle including app (from CAD), +€5,000 per extra model | Fiverr median 7 days; Visartech 3–5 weeks                                     |
| **Engine bay**                     | "message me for a custom quote"; no tier prices                                                                                                                                           | **Not found**                                                                                                                                                                           | **Not found**                                                                 |
| **Separate engine with internals** | No commission price found. Stock: $17.50 (1ZZ), $48 (2JZ-GTE, 90 parts, 35.8k polys), $229 to $449 (V8, 8.86M polys)                                                                      | **Not found**                                                                                                                                                                           | **Not found**                                                                 |
| **Rates**                          | Upwork profiles: 3D Modelers $17–30/h, 3D Artists $25–40/h                                                                                                                                | RocketBrush $35–37/h ($30–60/h); Pixune studios $40–150/h; Polycount members' averages: US individual $34.50–62.50/h, US average studio $62.50/h                                        |                                                                               |

### 5.2 My estimate for Swap Lab's scope (inference)

**Assumptions** (inference): a stock-bodied, reference-accurate, real-time model. That means:

- exterior with LODs, glTF metal/roughness PBR, baked normals, and hinged doors, bonnet and boot with correct pivots;
- a first-person-grade cabin with separate gauge needles;
- an engine bay with every part separate and named for picking;
- an engine with internals (crank, rods, pistons, cams, valves, turbo wheels) pivoted on true axes and sectionable, within 8 MB.

**Hours:**

| Part                  | Hours    | Basis                                                                                                                                            |
| --------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Exterior              | 80–200 h | RocketBrush's $4,000–8,000 ÷ $35–37/h ≈ 108–229 h, and its "2-6 weeks" (arithmetic mine)                                                         |
| Interior              | 60–120 h | Visartech 56–80 h, plus gauge work                                                                                                               |
| Engine bay            | 40–100 h | No published anchor. My estimate, by analogy with the interior                                                                                   |
| Engine with internals | 60–150 h | No published anchor. The closest published analogue is RocketBrush's "Game-ready weapon $1,500–3,000" ≈ 40–86 h; an engine has more unique parts |

**Cost bands:** "freelancer" = vetted vehicle artist at $30–50/h; "studio" = $35–60/h. Both are hourly bands from the published figures above.

| Deliverable                                    | Marketplace floor (published tiers)                                 | Vetted freelancer (inference)                                                 | Studio (inference, except the published RocketBrush band)                |
| ---------------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Exterior only, per car                         | $200–$400                                                           | $2,400–$10,000                                                                | $4,000–$8,000+ (published)                                               |
| Exterior + interior, per car                   | $250–$800                                                           | $4,200–$16,000                                                                | ~$6,100–$15,200 (RocketBrush band plus 60–120 h of interior at $35–60/h) |
| Engine bay (add-on), per car                   | quote only                                                          | $1,200–$5,000                                                                 | ~$1,400–$6,000                                                           |
| Engine with internals, each (SR20DET, 2JZ-GTE) | not offered                                                         | $1,800–$7,500                                                                 | ~$2,100–$9,000                                                           |
| **Both cars, full scope + both engines**       | ~$500–$1,600 for exterior + interior only; bay and engines by quote | **~$14k–$57k** (≈ SAR 54k–214k)                                               | **~$19k–$60k** (≈ SAR 72k–225k)                                          |
| Schedule, one artist                           | Fiverr tiers 3–30 days                                              | ~4.5–10.5 weeks per car (180–420 h at 40 h/week), plus 1.5–4 weeks per engine | similar, with more parallel staff                                        |

SAR figures use the 3.75 SAR/USD peg (not re-checked this session).

**What the numbers mean (inference):**

- **Freelancer and studio bands overlap** because RocketBrush's published rate ($35–37/h) sits inside the freelancer band. The difference is management, QA and how much is in scope, not the hourly rate.
- **The Fiverr tiers are 10 to 50 times below the studio figures.** At $120–$800 for exterior plus interior in 5 to 14 days, they can't be meeting the same accuracy and real-time spec. The likely explanations are simplified geometry, reused bases, or low accuracy. So treat them as a floor, vet portfolios hard, and require originality warranties.
- **The uncertain items are the ones unique to Swap Lab:** the clickable engine bay and the cutaway internals. Nobody publishes a price for them.
- **A cheaper hybrid route exists:** keep the CC-BY exteriors already found (TinoD2's Supra, zhe_kan's S15 with its kit) and commission only what they lack: cabin, engine bay and engines. By the same hours that's roughly 160–370 h per car, about **$4,800–$18,500 per car**.
  - The catch: those exteriors aren't stock-bodied (the S15), and the CC-BY credit stays.
- **Negotiating a custom licence for an existing studio model** is another route. Squir says it will discuss one, and it lists an A80 at €59 and an S15 at €99. But those are older 3ds Max / mental ray models with no PBR stated, and they'd still need the bay, cabin and engine work.

### 5.3 Contract points the evidence supports (inference, drawn from the quoted terms)

1. **Rights.** Take an assignment of all IP on payment, with a work-for-hire clause as backup (Circular 30 and Upwork 6.4 pattern). At minimum, get an exclusive licence that names public web distribution of an unprotected GLB in a public repository (CGTrader 6.5 wording), plus modification and sublicensing. **Don't tick** CGTrader's resale checkbox.
2. **Provenance.** Require:
   - an originality warranty and a bill of materials for any third-party content (Upwork 6.1 and 6.2), with every item CC0 or CC-BY and disclosed;
   - **no AI tools** (CGHero allows them unless the brief prohibits them);
   - no game rips or purchased kitbash models;
   - no trademarked textures unless the owner asks for them.
3. **Deliverables.** Name each one:
   - source files by type (.blend or .max, .spp, full-resolution textures, bake cages);
   - glTF-ready PBR materials;
   - triangle and texture budgets that fit ≤ 25 MB car and ≤ 8 MB engine after `npm run assets`;
   - LOD levels;
   - the CLAUDE.md naming and `mount_*` empties;
   - pivots for doors, bonnet, wheels and gauge needles;
   - engine parts on true rotation axes, with firing-order-ready naming.
4. **Acceptance.** Build a test into acceptance (load in the Swap Lab pipeline, check budgets and naming). On CGTrader, remember the 10-business-day deemed-acceptance clause (7.1).
5. **Payment.** Pay by milestone (RocketBrush pattern), with source files delivered on payment.
6. **Portfolio.** Agree portfolio use explicitly: RocketBrush reserves it, while Upwork 7.3 forbids publishing by default.

## 6. Couldn't open, or not found

**Couldn't open:**

- 3dmodels.org (ex-Hum3D): all pages, including /custom-3d/ and /enterprise-solutions/. Cloudflare 403 for curl, headless Chromium and WebFetch; the proxy returned 502 for Cloudflare's challenge host.
- clutch.co/profile/hum3d (Cloudflare).
- Upwork /hire/3d-modelers/, /hire/3d-modelers/cost/, /hire/car-modeling-freelancers/ (Cloudflare). The Upwork legal and resources pages did open.
- Fiverr search results (PerimeterX). Category pages and gig pages did open.
- AIGA Standard Form of Agreement (Cloudflare).
- polycount.com forum threads (Cloudflare). The polycount wiki did open.
- fastcompany.com, finnegan.com, juegostudio.com, aaagameartstudio.com, polygamestudio.com (403).
- The Forza forum thread redirected to the forum index.
- web.archive.org: the proxy closed the connection, so no archived copies were available.
- pes-scanning.com and scalebuildersguild.com (captcha).
- ZipRecruiter (403).

**Not found (no published figure anywhere I could read):**

- a custom-modelling rate card from any specialist car-model studio (Squir and 3DModels.org quote on request);
- any published price for an engine bay, or for a commissioned engine with internals;
- a vehicle-artist rate survey;
- a published discount for allowing resale;
- any term mentioning .spp files;
- Hum3D's Clutch rate;
- a custom service from Sketchfab or Fab.

**Not researched:** Saudi copyright or trademark law on commissioned works; Japanese design rights; platform buyer fees.

**Seen only in search summaries, not verified:**

- Upwork "median hourly rate for 3D Modelers ... is $25";
- 3DModels.org's custom-modelling wording;
- a claim that "Lamborghini asked for $400,000" for a game licence (source page not opened, so not used).
