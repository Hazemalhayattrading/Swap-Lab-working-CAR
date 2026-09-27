# Phase 1, part 3a research notes: RX-7 FD3S, 13B-REW, 20B-REW (paused)

Written 2026-09-27, when the owner paused the project. Seven research agents were stopped part-way; none got as far as writing its structured output or its final report. This file keeps what they had gathered, with sources, so the next session can pick up without redoing it.

**How much to trust what's here:**

- **Section 1 was checked by hand** against the page scans of Mazda's own documents.
- **Everything else is raw research, not yet checked.** The tables in section 4 were parsed by script from pages the agents saved (goo-net, Car Sensor, carview), so they show what those pages print, but nobody has compared them with a Mazda brochure yet. None of it is in `src/data/` yet.
- **Access date** for every page: 2026-09-27.
- **Terms and log-ins (CLAUDE.md rule 13):** every agent was given the rule. None reported stopping at a terms, licence, download or log-in gate before it was stopped. Because no final reports were written, that isn't confirmed.

## 1. Checked by hand: Mazda's 1993 US workshop manual, technical data (TD) chapter

Source: _Mazda: 1993 RX-7 Workshop Manual, section TD Technical Data_, a scan hosted by foxed.ca: https://www.foxed.ca/rx7manual/manuals/1993FSM/(TD)technical_data.pdf. I read pages TD-2, 3, 4, 6, 8, 13 and 15 myself. The US agent's transcription (appendix A) matches them row for row.

| Page  | Item                                       | As printed                                                                                                    |
| ----- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| TD-2  | Engine model, type                         | 13B (Turbo), rotary engine                                                                                    |
| TD-2  | Displacement                               | 654 × 2 cc {40.0 × 2 cu in}                                                                                   |
| TD-2  | Rotors                                     | 2 rotors, longitudinal                                                                                        |
| TD-2  | Combustion chamber; compression ratio      | Bathtub; 9.0:1                                                                                                |
| TD-2  | Port timing, intake open                   | Primary 45° BTDC, secondary 32° BTDC                                                                          |
| TD-2  | Port timing, intake close                  | Primary 50° ABDC, secondary 50° ABDC                                                                          |
| TD-2  | Port timing, exhaust                       | Opens 75° BBDC, closes 48° ATDC                                                                               |
| TD-2  | Rotor housing width                        | 80 mm                                                                                                         |
| TD-2  | Apex seal width; height                    | 2.0 mm; 8.5 mm standard (7.5 mm minimum)                                                                      |
| TD-2  | Compression pressure                       | 686 kPa {7.0 kgf/cm², 100 psi} minimum at 250 rpm; 147 kPa maximum difference between chambers                |
| TD-3  | Eccentric shaft journals                   | Main 43 mm, rotor 74 mm                                                                                       |
| TD-3  | Engine oil, total (dry engine)             | 4.9 L {5.2 US qt}; 5.4 L {5.7 US qt} on the R1 model (footnote); oil pan 4.2 L, oil cooler 0.85 L             |
| TD-4  | Coolant capacity                           | 8.8 L                                                                                                         |
| TD-4  | Ignition timing (idle)                     | Leading 5° ATDC, trailing 20° ATDC                                                                            |
| TD-4  | Throttle body                              | Horizontal draft, 2-stage 3-barrel; primary 45 mm, secondary 50 mm × 2                                        |
| TD-4  | Intercooler                                | Air cooled; core 294 × 114 × 65 mm                                                                            |
| TD-4  | Turbocharger                               | Sequential twin turbocharged; water + engine oil cooled; turbo precontrol + wastegate; 2 duty-solenoid valves |
| TD-4  | Fuel tank; regulated fuel pressure         | 76 L; 250-260 kPa {2.5-2.6 kgf/cm², 35.6-37.0 psi}                                                            |
| TD-6  | Clutch disc                                | Single dry plate, 236 mm outer / 160 mm inner; cover set load 7,220 N                                         |
| TD-6  | Manual gearbox R15M-D (R5M-D), gear ratios | 3.483 / 2.015 / 1.391 / 1.000 / 0.719, reverse 3.288                                                          |
| TD-6  | Manual gearbox final gear ratio            | 4.100                                                                                                         |
| TD-8  | Automatic RB4A-EL, gear ratios             | 3.027 / 1.619 / 1.000 / 0.694 (O/D), reverse 2.272                                                            |
| TD-8  | Automatic final gear ratio; stall          | 3.909; torque converter stall torque ratio 2.200, stall speed 3,000-3,300 rpm                                 |
| TD-13 | Propeller shaft (manual)                   | 863 mm long, 75 mm diameter                                                                                   |
| TD-15 | Standard tyres                             | P225/50R16 91V; P225/50ZR16                                                                                   |
| TD-15 | Wheels                                     | 16 × 8JJ aluminium alloy, offset 50.0 mm, PCD 114.3 mm                                                        |
| TD-15 | Suspension                                 | Double wishbone front and rear                                                                                |

The 1993 TD chapter has no dimensions or weights. The US agent also read the 1994 TD chapter (https://www.foxed.ca/rx7manual/manuals/tech/94TD.pdf), which I didn't check by hand. It prints the same engine data and gear ratios, and adds the injectors: side-feed, **primary 550 cc/min, secondary 850 cc/min** (the agent checked this on a 300 dpi crop), and the spark plugs (leading NGK BUR7EQP, trailing BUR9EQ as standard). See appendix A.

## 2. Where the sources are

### Mazda documents (primary)

- **foxed.ca's Mazda manual collection** (https://www.foxed.ca/index.php?page=rx7manual). The download links sit in `javascript:displayDownloadLinks(...)` calls, and the last argument is the local path under https://www.foxed.ca/rx7manual/.
  - 1993 Workshop Manual, by section: https://www.foxed.ca/rx7manual/manuals/1993FSM/, including (A) general info, (C) engine, (D) lubrication, (E) cooling, (F) fuel and emissions, (H) clutch, (J) manual transmission, (M) axles, (Q) wheels and tyres, (TD) technical data. Section (G) engine electrical downloaded as a corrupt file.
  - 1994 Workshop Manual: https://www.foxed.ca/rx7manual/manuals/94_workshop_manual.pdf (1,063 pages)
  - 1994 Technical Data: https://www.foxed.ca/rx7manual/manuals/tech/94TD.pdf
  - 1993 Service Highlights (Mazda technician training, 413 pages): https://www.foxed.ca/rx7manual/manuals/93_service_highlights.pdf
  - 1993 US brochure: https://www.foxed.ca/rx7manual/manuals/93_brochure.pdf
  - Also listed there: 1993 service bulletins, the 1992 body shop manual, 1993-1995 parts fiche (https://www.foxed.ca/rx7manual/manuals/parts_manuals/93 and /94, /95), Kenichi Yamamoto's _Rotary Engine_ (1971 and 1981: https://www.foxed.ca/rx7manual/manuals/REbyKenichiYamamoto-1981.pdf), the RE Vehicle Album (https://www.foxed.ca/rx7manual/manuals/rotary-album.pdf) and the 1997 Mazdaspeed competition catalogue.
  - Every file is a scan with no text layer. `tesseract` OCR is poor on the tables, so read the page images.
- **Mazda brochures scanned on archive.org** (item pages at https://archive.org/details/ followed by the id):
  - `101_20260806_20260806_1440`: 1992 Efini RX-7, Japan, 11-1991
  - `101_20260806_20260806_1213`: Efini RX-7 Type RZ limited edition (the item title says 10-1991; the catalogues date the first RZ to 1992-10, so check the brochure's own print code)
  - `101_20260806_20260806_1251`: 1994 Efini RX-7 Optional Selection brochure, Japan, 8-1993
  - `1995-efini-rx-7-leaflet-1`: 1995 Type R-II Bathurst limited-edition leaflet, Japan, 8-1994
  - `0ae-559b-0-01`: 1996 Efini RX-7 brochure, Japan, 9-1995
  - `1999-mazda-rx-7-brochure.-japan-2-1999.-mkj-01-e-9902-mi-01`: Series 5, Japan, 2-1999
  - `101_20260310_202603`: Series 6, Japan, 11-2000
  - `mazda-rx-7-2002`: "Mazda RX 7 2002" (no files listed yet)
  - `101_20260721_20260721`: 1992 Netherlands brochure (it has an OCR text layer)
  - `1994-mazda-speed-ms-02-efini-rx-7-fd-3-s-brochure.-japan.-translation-1`: Mazdaspeed MS-02 aero parts brochure (not a factory grade)
- **Mazda Germany's workshop and training handbooks** on archive.org, a new find: `rx-7-kundendienstschule-egi` ("Mazda RX 7 Werkstatt- & Schulungshandbücher"). It holds _RX-7 FC und FD Schulungshandbuch_ (FC and FD training handbook), _RX-7 FC und FD Fehlersuche und Kennfelder_ (troubleshooting and maps), _Motorhandbuch 13B_ (13B engine handbook) and others, with text layers. This is exactly the "technical training guide" kind of source you asked for, and it hasn't been read yet.
- **Mazda's English newsroom**: the 1997-2002 agent saved Mazda's release lists for 1997-2003 and the releases of 2000-10-18, 2001-08-30, 2001-12-10 and 2002-03-25 (English), plus 2002-03-25 (Japanese). The URLs are in section 4.
- **Magazines**: _Autocar & Motor_, 10 March 1993, on archive.org (`autocar-motor-10-march-1993`), picked up by the Europe agent.

### Catalogue databases (they transcribe Mazda's catalogue data per grade)

- **goo-net:** grade pages at https://www.goo-net.com/catalog/MAZDA/EFINI_RX7/<id>/ (1991-12 to 1997-10), https://www.goo-net.com/catalog/MAZDA/RX7/<id>/ (1997-10 to 2002) and https://www.goo-net.com/catalog/EUNOS/EUNOS_COSMO/<id>/ (Cosmo). The pages are EUC-JP, and the spec table is in `<th>`/`<td>` cells. GAZOO is the same dataset, so it counts as the same source.
- **Car Sensor:** https://www.carsensor.net/catalog/mazda/efini_rx-7/F001/M00nG00n/ and https://www.carsensor.net/catalog/mazda/rx-7/F001/M00nG00n/.
- **carview:** grade pages at https://carview.yahoo.co.jp/ncar/catalog/mazda/rx-7/gradeid/<n>/ (both eras sit under `rx-7`).

### Reachability from this environment (2026-09-27)

- **Unreachable:** web.archive.org (tunnel closes), pdf.textfiles.com.
- **Blocked (403 or 502):** rx7club.com, turbosquid.com, fab.com, redbook.com.au, carsales.com.au, amayama.com, automobile-catalog.com, www2.mazda.co.jp, www.mazda.com/ja/.
- **Reachable:** archive.org, foxed.ca, goo-net, Car Sensor, carview, newsroom.mazda.com, the Sketchfab Data API, cgtrader.com (it answers with a WAF challenge).

## 3. What each agent had when it was stopped

Their last reported step is quoted in each entry.

- **JDM 1991-1997 (Efini RX-7).**
  - Saved all 22 goo-net grade pages, 28 Car Sensor grade pages and 17 carview grade pages, and parsed them into tables (section 4).
  - Found the Japanese brochures listed above.
  - Last step: "Let me view that page to read the exact wording around the 1230 kg figure" (probably the 1992 Type RZ, whose goo-net weight is blank).
- **JDM 1997-2002 (Mazda RX-7).**
  - Saved all 17 goo-net grade pages (tables in section 4), the Car Sensor and carview grade pages, and Mazda's English releases for 2000-10, 2001-08, 2001-12 and 2002-03.
  - No findings were written up.
- **US and Canada.**
  - Transcribed the 1993 and 1994 TD chapters (appendix A).
  - Last step: reading the 1993 US brochure for the R1, Touring, weight-distribution and seating passages.
  - Canada was not reached.
- **Europe, UK, Australia, NZ.**
  - Saved 29 pages (list in section 4): auto motor und sport's FD3S test and data pages, Auto Bild, evo, PistonHeads, Classic & Sports Car, Hagerty, Mazda UK and Inside Mazda heritage pages, the Australian RX-7 SP pages (Shannons, AusRotary), and NZ Performance Car.
  - Found the Mazda Germany handbooks and the _Autocar & Motor_ issue.
  - Last step: "NZ remains unconfirmed … Search 9 of 20, for French-market data."
- **13B-REW.**
  - Saved the catalogue pages for both eras and started on the 1993 manual's engine section and Yamamoto's 1981 book.
  - Last step: "Table 2.1 lists V_H 654 cc with e = 15.0, R = 102, a = 3, b = 80 (it doesn't name the 13B, so I'll note that)." Unverified; see section 5.
- **20B-REW and the Eunos Cosmo.**
  - Saved all 20 goo-net Cosmo grade pages (table in section 4), the Car Sensor and carview Cosmo pages, and Mazdatrix 20B parts pages.
  - Also saved: 20B-into-FD swap pages (Xcessive, Hinson, rotaryengine.com, Defined Autoworks), NOSWEB's Cosmo article, projectjdm and drifted.com guides, and the foxed.ca RE Vehicle Album and 1997 Mazdaspeed catalogue.
  - Last step: "NOSWEB (Hachimaru Hero, 2012) independently prints the same 20B ratings and AT ratios. Next, let me pull the exact Mazdatrix product titles and part numbers".
- **Shopping list re-check.**
  - Opened 14 Sketchfab listings through the Data API. It worked from text only and viewed no images (table in section 4).
  - Last step: "realwallon's RX-7 is a clean, self-made CC-BY upload (Blender + Substance), though tagged 'stance'. Next batch: the re-upload clusters (53.8k and 203k meshes) and their probable Ddiaz sources."
  - Verdicts per model were not written.

## 4. Salvaged tables and page lists

Parsed by script from the pages the agents saved: goo-net from its `<th>`/`<td>` spec cells, and Car Sensor and carview by the Efini agent's own parser. Values are exactly as each page prints them, including "----" where the page is blank. Every row links the page it came from. Nothing here has been compared with a Mazda brochure yet.

### goo-net: Efini RX-7 grade pages (1991-12 to 1997-10), saved by the Efini agent

| Page (goo-net)                                                      | Grade and sale month                                          | Seats | Gearbox | Weight | Power                 | Torque                       | 1st-5th / reverse                               | Final drive | Tyres F / R                   | LSD  | L x W x H        | Wheelbase | Track F/R   |
| ------------------------------------------------------------------- | ------------------------------------------------------------- | ----- | ------- | ------ | --------------------- | ---------------------------- | ----------------------------------------------- | ----------- | ----------------------------- | ---- | ---------------- | --------- | ----------- |
| [2501180](https://www.goo-net.com/catalog/MAZDA/EFINI_RX7/2501180/) | アンフィニＲＸ−７（MAZDA）タイプＲ（1993年8月）               | 4名   | ５MT    | 1260kg | 255ps(188kW)/6500rpm  | 30.0kg・m(294.2N・m)/5000rpm | 3.483 / 2.015 / 1.391 / 1.000 / 0.806 / R 3.288 | 4.100       | 225/50ZR16 / 225/50ZR16       | 標準 | 4280×1760×1230mm | 2425mm    | 1460/1460mm |
| [2501181](https://www.goo-net.com/catalog/MAZDA/EFINI_RX7/2501181/) | アンフィニＲＸ−７（MAZDA）タイプＲII（1993年8月）             | 2名   | ５MT    | 1250kg | 255ps(188kW)/6500rpm  | 30.0kg・m(294.2N・m)/5000rpm | 3.483 / 2.015 / 1.391 / 1.000 / 0.806 / R 3.288 | 4.100       | 225/50R16 92V / 225/50R16 92V | 標準 | 4280×1760×1230mm | 2425mm    | 1460/1460mm |
| [2501182](https://www.goo-net.com/catalog/MAZDA/EFINI_RX7/2501182/) | アンフィニＲＸ−７（MAZDA）ツーリングＸ（1993年8月）           | 4名   | ４AT    | 1330kg | 255ps(188kW)/6500rpm  | 30.0kg・m(294.2N・m)/5000rpm | 3.027 / 1.619 / 1.000 / 0.694 / R 2.272         | 3.909       | 225/50R16 92V / 225/50R16 92V | 標準 | 4280×1760×1230mm | 2425mm    | 1460/1460mm |
| [2501183](https://www.goo-net.com/catalog/MAZDA/EFINI_RX7/2501183/) | アンフィニＲＸ−７（MAZDA）ツーリングＳ（1993年8月）           | 4名   | ４AT    | 1290kg | 255ps(188kW)/6500rpm  | 30.0kg・m(294.2N・m)/5000rpm | 3.027 / 1.619 / 1.000 / 0.694 / R 2.272         | 3.909       | 225/50R16 92V / 225/50R16 92V | 標準 | 4280×1760×1230mm | 2425mm    | 1460/1460mm |
| [2501184](https://www.goo-net.com/catalog/MAZDA/EFINI_RX7/2501184/) | アンフィニＲＸ−７（MAZDA）タイプＲＺ（1995年3月）             | 2名   | ５MT    | 1250kg | 255ps(188kW)/6500rpm  | 30.0kg・m(294.2N・m)/5000rpm | 3.483 / 2.015 / 1.391 / 1.000 / 0.762 / R 3.288 | 4.300       | 235/45ZR17 / 255/40ZR17       | 標準 | 4280×1760×1230mm | 2425mm    | 1460/1460mm |
| [2501185](https://www.goo-net.com/catalog/MAZDA/EFINI_RX7/2501185/) | アンフィニＲＸ−７（MAZDA）タイプＲ−Ｓ（1995年3月）            | 4名   | ５MT    | 1260kg | 255ps(188kW)/6500rpm  | 30.0kg・m(294.2N・m)/5000rpm | 3.483 / 2.015 / 1.391 / 1.000 / 0.806 / R 3.288 | 4.100       | 235/45ZR17 / 255/40ZR17       | 標準 | 4280×1760×1230mm | 2425mm    | 1460/1460mm |
| [2501186](https://www.goo-net.com/catalog/MAZDA/EFINI_RX7/2501186/) | アンフィニＲＸ−７（MAZDA）タイプＲバサースト（1995年3月）     | 4名   | ５MT    | 1260kg | 255ps(188kW)/6500rpm  | 30.0kg・m(294.2N・m)/5000rpm | 3.483 / 2.015 / 1.391 / 1.000 / 0.806 / R 3.288 | 4.100       | 225/50R16 92V / 225/50R16 92V | 標準 | 4280×1760×1230mm | 2425mm    | 1460/1460mm |
| [2501187](https://www.goo-net.com/catalog/MAZDA/EFINI_RX7/2501187/) | アンフィニＲＸ−７（MAZDA）ツーリングＸ（1995年3月）           | 4名   | ４AT    | 1330kg | 255ps(188kW)/6500rpm  | 30.0kg・m(294.2N・m)/5000rpm | 3.027 / 1.619 / 1.000 / 0.694 / R 2.272         | 3.909       | 225/50R16 92V / 225/50R16 92V | 標準 | 4280×1760×1230mm | 2425mm    | 1460/1460mm |
| [2501588](https://www.goo-net.com/catalog/MAZDA/EFINI_RX7/2501588/) | アンフィニＲＸ−７（MAZDA）タイプＸ（1991年12月）              | 4名   | ５MT    | 1290kg | 255ps(188kW)/6500rpm  | 30.0kg・m(294.2N・m)/5000rpm | 3.483 / 2.015 / 1.391 / 1.000 / 0.806 / R 3.288 | 3.909       | 225/50R16 92V / 225/50R16 92V | 標準 | 4295×1760×1230mm | 2425mm    | 1460/1460mm |
| [2501589](https://www.goo-net.com/catalog/MAZDA/EFINI_RX7/2501589/) | アンフィニＲＸ−７（MAZDA）タイプＸ（1991年12月）              | 4名   | ４AT    | 1320kg | 255ps(188kW)/6500rpm  | 30.0kg・m(294.2N・m)/5000rpm | 3.027 / 1.619 / 1.000 / 0.694 / R 2.272         | 3.909       | 225/50R16 92V / 225/50R16 92V | 標準 | 4295×1760×1230mm | 2425mm    | 1460/1460mm |
| [2501590](https://www.goo-net.com/catalog/MAZDA/EFINI_RX7/2501590/) | アンフィニＲＸ−７（MAZDA）タイプＲ（1991年12月）              | 4名   | ５MT    | 1260kg | 255ps(188kW)/6500rpm  | 30.0kg・m(294.2N・m)/5000rpm | 3.483 / 2.015 / 1.391 / 1.000 / 0.806 / R 3.288 | 4.100       | 225/50ZR16 / 225/50ZR16       | 標準 | 4295×1760×1230mm | 2425mm    | 1460/1460mm |
| [2501591](https://www.goo-net.com/catalog/MAZDA/EFINI_RX7/2501591/) | アンフィニＲＸ−７（MAZDA）タイプＳ（1991年12月）              | 4名   | ５MT    | 1250kg | 255ps(188kW)/6500rpm  | 30.0kg・m(294.2N・m)/5000rpm | 3.483 / 2.015 / 1.391 / 1.000 / 0.806 / R 3.288 | 3.909       | 225/50R16 92V / 225/50R16 92V | 標準 | 4295×1760×1230mm | 2425mm    | 1460/1460mm |
| [2501592](https://www.goo-net.com/catalog/MAZDA/EFINI_RX7/2501592/) | アンフィニＲＸ−７（MAZDA）タイプＳ（1991年12月）              | 4名   | ４AT    | 1280kg | 255ps(188kW)/6500rpm  | 30.0kg・m(294.2N・m)/5000rpm | 3.027 / 1.619 / 1.000 / 0.694 / R 2.272         | 3.909       | 225/50R16 92V / 225/50R16 92V | 標準 | 4295×1760×1230mm | 2425mm    | 1460/1460mm |
| [2502192](https://www.goo-net.com/catalog/MAZDA/EFINI_RX7/2502192/) | アンフィニＲＸ−７（MAZDA）タイプＲＢバサーストＸ（1997年1月） | 4名   | ５MT    | 1260kg | 265ps(----kW)/6500rpm | 30.0kg・m(294.2N・m)/5000rpm | / R ----                                        |             | 225/50R16 92V / 225/50R16 92V | 標準 | 4280×1760×1230mm | 2425mm    | 1460/1460mm |
| [2502419](https://www.goo-net.com/catalog/MAZDA/EFINI_RX7/2502419/) | アンフィニＲＸ−７（MAZDA）タイプＲＺ（1992年10月）            | 2名   | ５MT    | ----kg | 255ps(188kW)/6500rpm  | 30.0kg・m(294.2N・m)/5000rpm | / R ----                                        |             | 225/50ZR16 / 225/50ZR16       | 標準 | 4295×1760×1230mm | 2425mm    | 1460/1460mm |
| [2502532](https://www.goo-net.com/catalog/MAZDA/EFINI_RX7/2502532/) | アンフィニＲＸ−７（MAZDA）タイプＲIIバサースト（1994年8月）   | 2名   | ５MT    | 1250kg | 255ps(188kW)/6500rpm  | 30.0kg・m(294.2N・m)/5000rpm | / R ----                                        |             | 225/50R16 92V / 225/50R16 92V | 標準 | 4280×1760×1230mm | 2425mm    | 1460/1460mm |
| [2502630](https://www.goo-net.com/catalog/MAZDA/EFINI_RX7/2502630/) | アンフィニＲＸ−７（MAZDA）タイプＲバサーストＸ（1995年7月）   | 4名   | ５MT    | 1260kg | 255ps(188kW)/6500rpm  | 30.0kg・m(294.2N・m)/5000rpm | / R ----                                        |             | 225/50R16 92V / 225/50R16 92V | 標準 | 4280×1760×1230mm | 2425mm    | 1460/1460mm |
| [2503199](https://www.goo-net.com/catalog/MAZDA/EFINI_RX7/2503199/) | アンフィニＲＸ−７（MAZDA）タイプＲＢ（1996年1月）             | 4名   | ５MT    | 1260kg | 265ps(195kW)/6500rpm  | 30.0kg・m(294.2N・m)/5000rpm | 3.483 / 2.015 / 1.391 / 1.000 / 0.806 / R 3.288 | 4.100       | 225/50R16 92V / 225/50R16 92V | 標準 | 4280×1760×1230mm | 2425mm    | 1460/1460mm |
| [2503200](https://www.goo-net.com/catalog/MAZDA/EFINI_RX7/2503200/) | アンフィニＲＸ−７（MAZDA）タイプＲＢバサースト（1996年1月）   | 4名   | ５MT    | 1260kg | 265ps(195kW)/6500rpm  | 30.0kg・m(294.2N・m)/5000rpm | 3.483 / 2.015 / 1.391 / 1.000 / 0.806 / R 3.288 | 4.100       | 225/50ZR16 / 225/50ZR16       | 標準 | 4280×1760×1230mm | 2425mm    | 1460/1460mm |
| [2503201](https://www.goo-net.com/catalog/MAZDA/EFINI_RX7/2503201/) | アンフィニＲＸ−７（MAZDA）タイプＲＳ（1996年1月）             | 4名   | ５MT    | 1280kg | 265ps(195kW)/6500rpm  | 30.0kg・m(294.2N・m)/5000rpm | 3.483 / 2.015 / 1.391 / 1.000 / 0.762 / R 3.288 | 4.300       | 235/45ZR17 / 255/40ZR17       | 標準 | 4280×1760×1230mm | 2425mm    | 1460/1460mm |
| [2503202](https://www.goo-net.com/catalog/MAZDA/EFINI_RX7/2503202/) | アンフィニＲＸ−７（MAZDA）タイプＲＺ（1996年1月）             | 2名   | ５MT    | 1250kg | 265ps(195kW)/6500rpm  | 30.0kg・m(294.2N・m)/5000rpm | 3.483 / 2.015 / 1.391 / 1.000 / 0.762 / R 3.288 | 4.300       | 235/45ZR17 / 255/40ZR17       | 標準 | 4280×1760×1230mm | 2425mm    | 1460/1460mm |
| [2503203](https://www.goo-net.com/catalog/MAZDA/EFINI_RX7/2503203/) | アンフィニＲＸ−７（MAZDA）ツーリングＸ（1996年1月）           | 4名   | ４AT    | 1330kg | 255ps(188kW)/6500rpm  | 30.0kg・m(294.2N・m)/5000rpm | 3.027 / 1.619 / 1.000 / 0.694 / R 2.272         | 3.909       | 225/50R16 92V / 225/50R16 92V | 標準 | 4280×1760×1230mm | 2425mm    | 1460/1460mm |

### goo-net: Mazda RX-7 grade pages (1997-10 to 2002), saved by the 1997-2002 agent

| Page (goo-net)                                                | Grade and sale month                                  | Seats | Gearbox | Weight | Power                 | Torque                       | 1st-5th / reverse                               | Final drive | Tyres F / R                   | LSD  | L x W x H        | Wheelbase | Track F/R   |
| ------------------------------------------------------------- | ----------------------------------------------------- | ----- | ------- | ------ | --------------------- | ---------------------------- | ----------------------------------------------- | ----------- | ----------------------------- | ---- | ---------------- | --------- | ----------- |
| [2500960](https://www.goo-net.com/catalog/MAZDA/RX7/2500960/) | ＲＸ−７（MAZDA）タイプＲＢ Ｓパッケージ（1999年1月）  | 4名   | ５MT    | 1240kg | 265ps(195kW)/6500rpm  | 30.0kg・m(294.2N・m)/5000rpm | 3.483 / 2.015 / 1.391 / 1.000 / 0.806 / R 3.288 | 4.100       | 225/50ZR16 / 225/50ZR16       | 標準 | 4285×1760×1230mm | 2425mm    | 1460/1460mm |
| [2500962](https://www.goo-net.com/catalog/MAZDA/RX7/2500962/) | ＲＸ−７（MAZDA）タイプＲＢ（1999年1月）               | 4名   | ５MT    | 1240kg | 265ps(195kW)/6500rpm  | 30.0kg・m(294.2N・m)/5000rpm | 3.483 / 2.015 / 1.391 / 1.000 / 0.806 / R 3.288 | 4.100       | 225/50R16 92V / 225/50R16 92V | 標準 | 4285×1760×1230mm | 2425mm    | 1460/1460mm |
| [2500963](https://www.goo-net.com/catalog/MAZDA/RX7/2500963/) | ＲＸ−７（MAZDA）タイプＲ（1999年1月）                 | 4名   | ５MT    | 1260kg | 280ps(206kW)/6500rpm  | 32.0kg・m(313.8N・m)/5000rpm | 3.483 / 2.015 / 1.391 / 1.000 / 0.806 / R 3.288 | 4.100       | 225/50ZR16 / 225/50ZR16       | 標準 | 4285×1760×1230mm | 2425mm    | 1460/1460mm |
| [2500970](https://www.goo-net.com/catalog/MAZDA/RX7/2500970/) | ＲＸ−７（MAZDA）タイプＲＳ（1999年1月）               | 4名   | ５MT    | 1280kg | 280ps(206kW)/6500rpm  | 32.0kg・m(313.8N・m)/5000rpm | 3.483 / 2.015 / 1.391 / 1.000 / 0.762 / R 3.288 | 4.300       | 235/45ZR17 / 255/40ZR17       | 標準 | 4285×1760×1230mm | 2425mm    | 1460/1460mm |
| [2500977](https://www.goo-net.com/catalog/MAZDA/RX7/2500977/) | ＲＸ−７（MAZDA）タイプＲＢ（1999年1月）               | 4名   | ４AT    | 1280kg | 255ps(188kW)/6500rpm  | 30.0kg・m(294.2N・m)/5000rpm | 3.027 / 1.619 / 1.000 / 0.694 / R 2.272         | 3.909       | 225/50R16 92V / 225/50R16 92V | 標準 | 4285×1760×1230mm | 2425mm    | 1460/1460mm |
| [2502193](https://www.goo-net.com/catalog/MAZDA/RX7/2502193/) | ＲＸ−７（MAZDA）タイプＲＳ−Ｒ（1997年10月）           | 4名   | ５MT    | 1280kg | 265ps(----kW)/6500rpm | 30.0kg・m(----N・m)/5000rpm  | / R ----                                        |             | 235/45ZR17 / 255/40ZR17       | 標準 | 4280×1760×1230mm | 2425mm    | 1460/1460mm |
| [2502436](https://www.goo-net.com/catalog/MAZDA/RX7/2502436/) | ＲＸ−７（MAZDA）タイプＲＳ（2000年10月）              | 4名   | ５MT    | 1280kg | 280ps(206kW)/6500rpm  | 32.0kg・m(314N・m)/5000rpm   | 3.483 / 2.015 / 1.391 / 1.000 / 0.762 / R 3.288 | 4.300       | 235/45ZR17 / 255/40ZR17       | 標準 | 4285×1760×1230mm | 2425mm    | 1460/1460mm |
| [2502437](https://www.goo-net.com/catalog/MAZDA/RX7/2502437/) | ＲＸ−７（MAZDA）タイプＲ（2000年10月）                | 4名   | ５MT    | 1260kg | 280ps(206kW)/6500rpm  | 32.0kg・m(314N・m)/5000rpm   | 3.483 / 2.015 / 1.391 / 1.000 / 0.806 / R 3.288 | 4.100       | 225/50ZR16 / 225/50ZR16       | 標準 | 4285×1760×1230mm | 2425mm    | 1460/1460mm |
| [2502438](https://www.goo-net.com/catalog/MAZDA/RX7/2502438/) | ＲＸ−７（MAZDA）タイプＲＢ（2000年10月）              | 4名   | ５MT    | 1240kg | 265ps(195kW)/6500rpm  | 30.0kg・m(294N・m)/5000rpm   | 3.483 / 2.015 / 1.391 / 1.000 / 0.806 / R 3.288 | 4.100       | 225/50R16 92V / 225/50R16 92V | 標準 | 4285×1760×1230mm | 2425mm    | 1460/1460mm |
| [2502439](https://www.goo-net.com/catalog/MAZDA/RX7/2502439/) | ＲＸ−７（MAZDA）タイプＲＢ Ｓパッケージ（2000年10月） | 4名   | ５MT    | 1240kg | 265ps(195kW)/6500rpm  | 30.0kg・m(294N・m)/5000rpm   | 3.483 / 2.015 / 1.391 / 1.000 / 0.806 / R 3.288 | 4.100       | 225/50ZR16 / 225/50ZR16       | 標準 | 4285×1760×1230mm | 2425mm    | 1460/1460mm |
| [2502440](https://www.goo-net.com/catalog/MAZDA/RX7/2502440/) | ＲＸ−７（MAZDA）タイプＲＢ（2000年10月）              | 4名   | ４AT    | 1280kg | 255ps(188kW)/6500rpm  | 30.0kg・m(294N・m)/5000rpm   | 3.027 / 1.619 / 1.000 / 0.694 / R 2.272         | 3.909       | 225/50R16 92V / 225/50R16 92V | 標準 | 4285×1760×1230mm | 2425mm    | 1460/1460mm |
| [2502441](https://www.goo-net.com/catalog/MAZDA/RX7/2502441/) | ＲＸ−７（MAZDA）タイプＲＺ（2000年10月）              | 2名   | ５MT    | 1270kg | 280ps(206kW)/6500rpm  | 32.0kg・m(314N・m)/5000rpm   | 3.483 / 2.015 / 1.391 / 1.000 / 0.762 / R 3.288 | 4.300       | 235/45ZR17 / 255/40ZR17       | 標準 | 4285×1760×1230mm | 2425mm    | 1460/1460mm |
| [2502763](https://www.goo-net.com/catalog/MAZDA/RX7/2502763/) | ＲＸ−７（MAZDA）タイプＲバサーストＲ（2001年8月）     | 4名   | ５MT    | 1260kg | 280ps(206kW)/6500rpm  | 32.0kg・m(314N・m)/5000rpm   | / R ----                                        |             | 225/50ZR16 / 225/50ZR16       | 標準 | 4285×1760×1230mm | 2425mm    | 1460/1460mm |
| [2502912](https://www.goo-net.com/catalog/MAZDA/RX7/2502912/) | ＲＸ−７（MAZDA）タイプＲバサースト（2001年12月）      | 4名   | ５MT    | 1260kg | 280ps(206kW)/6500rpm  | 32.0kg・m(314N・m)/5000rpm   | 3.483 / 2.015 / 1.391 / 1.000 / 0.806 / R 3.288 | 4.100       | 225/50ZR16 / 225/50ZR16       | 標準 | 4285×1760×1230mm | 2425mm    | 1460/1460mm |
| [2502954](https://www.goo-net.com/catalog/MAZDA/RX7/2502954/) | ＲＸ−７（MAZDA）スピリットＲ タイプＡ（2002年4月）    | 2名   | ５MT    | 1270kg | 280ps(206kW)/6500rpm  | 32.0kg・m(314N・m)/5000rpm   | 3.483 / 2.015 / 1.391 / 1.000 / 0.762 / R 3.288 | 4.300       | 235/45ZR17 / 255/40ZR17       | 標準 | 4285×1760×1230mm | 2425mm    | 1460/1460mm |
| [2502955](https://www.goo-net.com/catalog/MAZDA/RX7/2502955/) | ＲＸ−７（MAZDA）スピリットＲ タイプＢ（2002年4月）    | 4名   | ５MT    | 1280kg | 280ps(206kW)/6500rpm  | 32.0kg・m(314N・m)/5000rpm   | 3.483 / 2.015 / 1.391 / 1.000 / 0.762 / R 3.288 | 4.300       | 235/45ZR17 / 255/40ZR17       | 標準 | 4285×1760×1230mm | 2425mm    | 1460/1460mm |
| [2502956](https://www.goo-net.com/catalog/MAZDA/RX7/2502956/) | ＲＸ−７（MAZDA）スピリットＲ タイプＣ（2002年4月）    | 4名   | ４AT    | 1280kg | 255ps(188kW)/6500rpm  | 30.0kg・m(294N・m)/5000rpm   | 3.027 / 1.619 / 1.000 / 0.694 / R 2.272         | 3.909       | 235/45ZR17 / 255/40ZR17       | 標準 | 4285×1760×1230mm | 2425mm    | 1460/1460mm |

### Car Sensor: Efini RX-7 grade pages (parsed by the Efini agent)

| Page                                                                          | Grade                                       | Gearbox | Seats | Weight | Power | Torque  | Tyres                       | LSD |
| ----------------------------------------------------------------------------- | ------------------------------------------- | ------- | ----- | ------ | ----- | ------- | --------------------------- | --- |
| [M001G001](https://www.carsensor.net/catalog/mazda/efini_rx-7/F001/M001G001/) | マツダ アンフィニRX-7 タイプX               | 5MT     | 4名   | 1290kg | 255ps | 30/5000 | 前 225/50R16 後 225/50R16   | ◯   |
| [M001G002](https://www.carsensor.net/catalog/mazda/efini_rx-7/F001/M001G002/) | マツダ アンフィニRX-7 タイプX               | 4AT     | 4名   | 1320kg | 255ps | 30/5000 | 前 225/50R16 後 225/50R16   | ◯   |
| [M001G003](https://www.carsensor.net/catalog/mazda/efini_rx-7/F001/M001G003/) | マツダ アンフィニRX-7 タイプR               | 5MT     | 4名   | 1260kg | 255ps | 30/5000 | 前 225/50ZR16 後 225/50ZR16 | ◯   |
| [M001G004](https://www.carsensor.net/catalog/mazda/efini_rx-7/F001/M001G004/) | マツダ アンフィニRX-7 タイプS               | 5MT     | 4名   | 1250kg | 255ps | 30/5000 | 前 225/50R16 後 225/50R16   | ◯   |
| [M001G005](https://www.carsensor.net/catalog/mazda/efini_rx-7/F001/M001G005/) | マツダ アンフィニRX-7 タイプS               | 4AT     | 4名   | 1280kg | 255ps | 30/5000 | 前 225/50R16 後 225/50R16   | ◯   |
| [M001G006](https://www.carsensor.net/catalog/mazda/efini_rx-7/F001/M001G006/) | マツダ アンフィニRX-7 タイプRZ              | 5MT     | 2名   | -kg    | 255ps | 30/5000 | 前 225/50ZR16 後 225/50ZR16 | ◯   |
| [M002G001](https://www.carsensor.net/catalog/mazda/efini_rx-7/F001/M002G001/) | マツダ アンフィニRX-7 タイプR               | 5MT     | 4名   | 1260kg | 255ps | 30/5000 | 前 225/50ZR16 後 225/50ZR16 | ◯   |
| [M002G002](https://www.carsensor.net/catalog/mazda/efini_rx-7/F001/M002G002/) | マツダ アンフィニRX-7 タイプR II            | 5MT     | 4名   | 1250kg | 255ps | 30/5000 | 前 225/50R16 後 225/50R16   | ◯   |
| [M002G003](https://www.carsensor.net/catalog/mazda/efini_rx-7/F001/M002G003/) | マツダ アンフィニRX-7 ツーリングX           | 4AT     | 4名   | 1330kg | 255ps | 30/5000 | 前 225/50R16 後 225/50R16   | ◯   |
| [M002G004](https://www.carsensor.net/catalog/mazda/efini_rx-7/F001/M002G004/) | マツダ アンフィニRX-7 ツーリングS           | 4AT     | 4名   | 1290kg | 255ps | 30/5000 | 前 225/50R16 後 225/50R16   | ◯   |
| [M002G005](https://www.carsensor.net/catalog/mazda/efini_rx-7/F001/M002G005/) | マツダ アンフィニRX-7 タイプRZ              | 5MT     | 2名   | -kg    | 255ps | 30/5000 | 前 - 後 255/40ZR17          | ◯   |
| [M002G006](https://www.carsensor.net/catalog/mazda/efini_rx-7/F001/M002G006/) | マツダ アンフィニRX-7 タイプR II バサースト | 5MT     | 2名   | 1250kg | 255ps | 30/5000 | 前 225/50R16 後 225/50R16   | ◯   |
| [M002G007](https://www.carsensor.net/catalog/mazda/efini_rx-7/F001/M002G007/) | マツダ アンフィニRX-7 タイプR バサースト    | 5MT     | 4名   | 1260kg | 255ps | 30/5000 | 前 225/50ZR16 後 225/50ZR16 | ◯   |
| [M003G001](https://www.carsensor.net/catalog/mazda/efini_rx-7/F001/M003G001/) | マツダ アンフィニRX-7 タイプRZ              | 5MT     | 2名   | 1250kg | 255ps | 30/5000 | 前 235/45ZR17 後 235/45ZR17 | ◯   |
| [M003G002](https://www.carsensor.net/catalog/mazda/efini_rx-7/F001/M003G002/) | マツダ アンフィニRX-7 タイプR-S             | 5MT     | 4名   | 1260kg | 255ps | 30/5000 | 前 235/45ZR17 後 235/45ZR17 | ◯   |
| [M003G003](https://www.carsensor.net/catalog/mazda/efini_rx-7/F001/M003G003/) | マツダ アンフィニRX-7 タイプR バサースト    | 5MT     | 4名   | 1260kg | 255ps | 30/5000 | 前 225/50R16 後 225/50R16   | ◯   |
| [M003G004](https://www.carsensor.net/catalog/mazda/efini_rx-7/F001/M003G004/) | マツダ アンフィニRX-7 ツーリングX           | 4AT     | 4名   | 1330kg | 255ps | 30/5000 | 前 225/50R16 後 225/50R16   | ◯   |
| [M003G005](https://www.carsensor.net/catalog/mazda/efini_rx-7/F001/M003G005/) | マツダ アンフィニRX-7 タイプR バサーストX   | 5MT     | 4名   | 1260kg | 255ps | 30/5000 | 前 225/50R16 後 225/50R16   | ◯   |
| [M004G001](https://www.carsensor.net/catalog/mazda/efini_rx-7/F001/M004G001/) | マツダ アンフィニRX-7 タイプRZ              | 5MT     | 2名   | 1250kg | 265ps | 30/5000 | 前 235/45ZR17 後 235/45ZR17 | ◯   |
| [M004G002](https://www.carsensor.net/catalog/mazda/efini_rx-7/F001/M004G002/) | マツダ アンフィニRX-7 タイプRS              | 5MT     | 4名   | 1280kg | 265ps | 30/5000 | 前 235/45ZR17 後 235/45ZR17 | ◯   |
| [M004G003](https://www.carsensor.net/catalog/mazda/efini_rx-7/F001/M004G003/) | マツダ アンフィニRX-7 タイプRB バサースト   | 5MT     | 4名   | 1260kg | 265ps | 30/5000 | 前 225/50ZR16 後 225/50ZR16 | ◯   |
| [M004G004](https://www.carsensor.net/catalog/mazda/efini_rx-7/F001/M004G004/) | マツダ アンフィニRX-7 タイプRB              | 5MT     | 4名   | 1260kg | 265ps | 30/5000 | 前 225/50R16 後 225/50R16   | ◯   |
| [M004G005](https://www.carsensor.net/catalog/mazda/efini_rx-7/F001/M004G005/) | マツダ アンフィニRX-7 ツーリングX           | 4AT     | 4名   | 1330kg | 255ps | 30/5000 | 前 225/50R16 後 225/50R16   | ◯   |
| [M005G001](https://www.carsensor.net/catalog/mazda/efini_rx-7/F001/M005G001/) | マツダ アンフィニRX-7 タイプRZ              | 5MT     | 2名   | 1250kg | 265ps | 30/5000 | 前 235/45ZR17 後 235/45ZR17 | ◯   |
| [M005G002](https://www.carsensor.net/catalog/mazda/efini_rx-7/F001/M005G002/) | マツダ アンフィニRX-7 タイプRS              | 5MT     | 4名   | 1280kg | 265ps | 30/5000 | 前 235/45ZR17 後 235/45ZR17 | ◯   |
| [M005G003](https://www.carsensor.net/catalog/mazda/efini_rx-7/F001/M005G003/) | マツダ アンフィニRX-7 タイプRB バサースト   | 5MT     | 4名   | 1260kg | 265ps | 30/5000 | 前 225/50ZR16 後 225/50ZR16 | ◯   |
| [M005G004](https://www.carsensor.net/catalog/mazda/efini_rx-7/F001/M005G004/) | マツダ アンフィニRX-7 タイプRB              | 5MT     | 4名   | 1260kg | 265ps | 30/5000 | 前 225/50R16 後 225/50R16   | ◯   |
| [M005G005](https://www.carsensor.net/catalog/mazda/efini_rx-7/F001/M005G005/) | マツダ アンフィニRX-7 ツーリングX           | 4AT     | 4名   | 1330kg | 255ps | 30/5000 | 前 225/50R16 後 225/50R16   | ◯   |

### carview: Efini RX-7 grade pages (parsed by the Efini agent)

| Page                                                                          | Grade                                | Sale month | Gearbox | Seats | Weight  | Power                   | Torque                      | Tyres F / R                   | Track F / R       | Dimensions                            |
| ----------------------------------------------------------------------------- | ------------------------------------ | ---------- | ------- | ----- | ------- | ----------------------- | --------------------------- | ----------------------------- | ----------------- | ------------------------------------- |
| [136650](https://carview.yahoo.co.jp/ncar/catalog/mazda/rx-7/gradeid/136650/) | アンフィニRX-7 TYPE_X(MT)            | 1991年10月 | 5MT     | 4名   | 1,290kg | 255ps（-kw）/6,500rpm   | 30.0kg・m（-N・m）/5,000rpm | 225/50R16 92V / 225/50R16 92V | 1,460mm / 1,460mm | 全高1,230mm, 全幅1,760mm, 全長4,295mm |
| [136651](https://carview.yahoo.co.jp/ncar/catalog/mazda/rx-7/gradeid/136651/) | アンフィニRX-7 TYPE_X(AT)            | 1991年10月 | 4AT     | 4名   | 1,320kg | 255ps（-kw）/6,500rpm   | 30.0kg・m（-N・m）/5,000rpm | 225/50R16 92V / 225/50R16 92V | 1,460mm / 1,460mm | 全高1,230mm, 全幅1,760mm, 全長4,295mm |
| [136652](https://carview.yahoo.co.jp/ncar/catalog/mazda/rx-7/gradeid/136652/) | アンフィニRX-7 TYPE_R(MT)            | 1991年10月 | 5MT     | 4名   | 1,260kg | 255ps（-kw）/6,500rpm   | 30.0kg・m（-N・m）/5,000rpm | 225/50R16 92V / 225/50R16 92V | 1,460mm / 1,460mm | 全高1,230mm, 全幅1,760mm, 全長4,295mm |
| [136653](https://carview.yahoo.co.jp/ncar/catalog/mazda/rx-7/gradeid/136653/) | アンフィニRX-7 TYPE_S(MT)            | 1991年10月 | 5MT     | 4名   | 1,250kg | 255ps（-kw）/6,500rpm   | 30.0kg・m（-N・m）/5,000rpm | 225/50R16 92V / 225/50R16 92V | 1,460mm / 1,460mm | 全高1,230mm, 全幅1,760mm, 全長4,295mm |
| [136654](https://carview.yahoo.co.jp/ncar/catalog/mazda/rx-7/gradeid/136654/) | アンフィニRX-7 TYPE_S(AT)            | 1991年10月 | 4AT     | 4名   | 1,280kg | 255ps（-kw）/6,500rpm   | 30.0kg・m（-N・m）/5,000rpm | 225/50R16 92V / 225/50R16 92V | 1,460mm / 1,460mm | 全高1,230mm, 全幅1,760mm, 全長4,295mm |
| [136655](https://carview.yahoo.co.jp/ncar/catalog/mazda/rx-7/gradeid/136655/) | アンフィニRX-7 Type-RⅡ               | 1991年10月 | 5MT     | 2名   | 1,260kg | 255ps（-kw）/6,500rpm   | 30.0kg・m（-N・m）/-rpm     | - / -                         | 1,460mm / 1,460mm | 全高1,230mm, 全幅1,760mm, 全長4,295mm |
| [136656](https://carview.yahoo.co.jp/ncar/catalog/mazda/rx-7/gradeid/136656/) | アンフィニRX-7 Type-RZ(MT)           | 1991年10月 | 5MT     | 2名   | 1,270kg | 255ps（-kw）/-rpm       | -                           | 235/45ZR17 / 255/40ZR17       | - / -             | 全高-, 全幅-, 全長-                   |
| [136657](https://carview.yahoo.co.jp/ncar/catalog/mazda/rx-7/gradeid/136657/) | アンフィニRX-7 Type-RBバサースト(MT) | 1991年10月 | 5MT     | 4名   | 1,260kg | 265ps（195kw）/6,500rpm | 30.0kg・m（294N・m）/-rpm   | 225/50ZR16 / 225/50ZR16       | 1,460mm / 1,460mm | 全高1,230mm, 全幅176mm, 全長4,280mm   |
| [135939](https://carview.yahoo.co.jp/ncar/catalog/mazda/rx-7/gradeid/135939/) | タイプR                              | 1991年12月 | 5MT     | 4名   | 1,260kg | 255ps（188kw）/6,500rpm | 30.0kg・m（-N・m）/-rpm     | - / -                         | 1,460mm / 1,460mm | 全高1,230mm, 全幅1,760mm, 全長4,295mm |
| [136659](https://carview.yahoo.co.jp/ncar/catalog/mazda/rx-7/gradeid/136659/) | アンフィニRX-7 タイプRBバサースト    | 1995年7月  | 5MT     | 4名   | 1,260kg | 265ps（-kw）/6,500rpm   | 30.0kg・m（-N・m）/-rpm     | 225/50ZR16 / 225/50ZR16       | 1,460mm / 1,460mm | 全高1,230mm, 全幅1,760mm, 全長4,280mm |
| [136661](https://carview.yahoo.co.jp/ncar/catalog/mazda/rx-7/gradeid/136661/) | アンフィニRX-7 タイプRS              | 1995年7月  | 5MT     | 4名   | 1,260kg | 265ps（188kw）/6,500rpm | 30.0kg・m（294N・m）/-rpm   | 235/45ZR17 / 255/40ZR17       | 1,460mm / 1,460mm | 全高1,230mm, 全幅1,760mm, 全長4,280mm |
| [136664](https://carview.yahoo.co.jp/ncar/catalog/mazda/rx-7/gradeid/136664/) | アンフィニRX-7 タイプRバサーストX    | 1995年7月  | 5MT     | 2名   | 1,260kg | 255ps（-kw）/6,500rpm   | 30.0kg・m（-N・m）/-rpm     | - / -                         | 1,460mm / 1,460mm | 全高1,230mm, 全幅1,760mm, 全長4,295mm |
| [135709](https://carview.yahoo.co.jp/ncar/catalog/mazda/rx-7/gradeid/135709/) | Type_R_バサーストX(MT)               | 1995年7月  | 5MT     | 4名   | 1,260kg | 255ps（188kw）/6,500rpm | 30.0kg・m（-N・m）/-rpm     | - / -                         | 1,460mm / 1,460mm | 全高1,230mm, 全幅1,760mm, 全長4,280mm |
| [136666](https://carview.yahoo.co.jp/ncar/catalog/mazda/rx-7/gradeid/136666/) | アンフィニRX-7 タイプRBバサーストX   | 1996年1月  | 5MT     | 4名   | 1,260kg | 265ps（-kw）/6,500rpm   | 30.0kg・m（-N・m）/5,000rpm | 225/50ZR16 / 225/50ZR16       | 1,460mm / 1,460mm | 全高1,230mm, 全幅1,760mm, 全長4,280mm |
| [136669](https://carview.yahoo.co.jp/ncar/catalog/mazda/rx-7/gradeid/136669/) | アンフィニRX-7 RZ                    | 1996年1月  | 5MT     | 2名   | 1,250kg | 265ps（-kw）/6,500rpm   | 30.0kg・m（-N・m）/5,000rpm | 235/45R17 / 255/40R17         | 1,460mm / 1,460mm | 全高1,230mm, 全幅1,760mm, 全長4,280mm |
| [136670](https://carview.yahoo.co.jp/ncar/catalog/mazda/rx-7/gradeid/136670/) | アンフィニRX-7 タイプRBバサースト    | 1996年1月  | 5MT     | 4名   | 1,260kg | 265ps（195kw）/6,500rpm | 30.0kg・m（-N・m）/-rpm     | - / -                         | 1,460mm / 1,460mm | 全高1,230mm, 全幅1,760mm, 全長4,280mm |
| [157244](https://carview.yahoo.co.jp/ncar/catalog/mazda/rx-7/gradeid/157244/) | アンフィニRX-7 ツーリングＸ          | 1996年1月  | 4AT     | 4名   | 1,330kg | 255ps（188kw）/600rpm   | 30.0kg・m（-N・m）/-rpm     | - / -                         | 1,460mm / 1,460mm | 全高1,230mm, 全幅1,760mm, 全長4,280mm |

### goo-net: Eunos Cosmo grade pages (20B-REW and 13B-REW), saved by the 20B agent

| Page (goo-net)                                                        | Grade and sale month                                       | Seats | Gearbox | Weight | Power                | Torque                       | 1st-5th / reverse                       | Final drive | Tyres F / R                   | LSD        | L x W x H        | Wheelbase | Track F/R   |
| --------------------------------------------------------------------- | ---------------------------------------------------------- | ----- | ------- | ------ | -------------------- | ---------------------------- | --------------------------------------- | ----------- | ----------------------------- | ---------- | ---------------- | --------- | ----------- |
| [3000105](https://www.goo-net.com/catalog/EUNOS/EUNOS_COSMO/3000105/) | ユーノスコスモ（EUNOS）２０Ｂ タイプＥ（1990年3月）        | 4名   | ４AT    | 1610kg | 280ps(206kW)/6500rpm | 41.0kg・m(402.1N・m)/3000rpm | 2.784 / 1.544 / 1.000 / 0.694 / R 2.275 | 3.909       | 215/60R15 90H / 215/60R15 90H | 標準       | 4815×1795×1305mm | 2750mm    | 1520/1510mm |
| [3000106](https://www.goo-net.com/catalog/EUNOS/EUNOS_COSMO/3000106/) | ユーノスコスモ（EUNOS）２０Ｂ タイプＳ（1990年3月）        | 4名   | ４AT    | 1590kg | 280ps(206kW)/6500rpm | 41.0kg・m(402.1N・m)/3000rpm | 2.784 / 1.544 / 1.000 / 0.694 / R 2.275 | 3.909       | 225/50R16 92V / 225/50R16 92V | 標準       | 4815×1795×1305mm | 2750mm    | 1520/1510mm |
| [3000107](https://www.goo-net.com/catalog/EUNOS/EUNOS_COSMO/3000107/) | ユーノスコスモ（EUNOS）２０Ｂ タイプＥ ＣＣＳ（1990年3月） | 4名   | ４AT    | 1640kg | 280ps(206kW)/6500rpm | 41.0kg・m(402.1N・m)/3000rpm | 2.784 / 1.544 / 1.000 / 0.694 / R 2.275 | 3.909       | 215/60R15 90H / 215/60R15 90H | 標準       | 4815×1795×1305mm | 2750mm    | 1520/1510mm |
| [3000108](https://www.goo-net.com/catalog/EUNOS/EUNOS_COSMO/3000108/) | ユーノスコスモ（EUNOS）１３Ｂ タイプＥ（1990年3月）        | 4名   | ４AT    | 1510kg | 230ps(169kW)/6500rpm | 30.0kg・m(294.2N・m)/3500rpm | 3.027 / 1.619 / 1.000 / 0.694 / R 2.272 | 4.300       | 215/60R15 90H / 215/60R15 90H | ----       | 4815×1795×1305mm | 2750mm    | 1520/1510mm |
| [3000109](https://www.goo-net.com/catalog/EUNOS/EUNOS_COSMO/3000109/) | ユーノスコスモ（EUNOS）１３Ｂ タイプＳ（1990年3月）        | 4名   | ４AT    | 1490kg | 230ps(169kW)/6500rpm | 30.0kg・m(294.2N・m)/3500rpm | 3.027 / 1.619 / 1.000 / 0.694 / R 2.272 | 4.300       | 225/50R16 92V / 225/50R16 92V | ----       | 4815×1795×1305mm | 2750mm    | 1520/1510mm |
| [3000207](https://www.goo-net.com/catalog/EUNOS/EUNOS_COSMO/3000207/) | ユーノスコスモ（EUNOS）タイプＳＸ（1991年9月）             | 4名   | ４AT    | 1490kg | 230ps(169kW)/6500rpm | 30.0kg・m(294.2N・m)/3500rpm | 3.027 / 1.619 / 1.000 / 0.601 / R 2.272 | 4.300       | 225/50ZR16 / 225/50ZR16       | 標準       | 4815×1795×1305mm | 2750mm    | 1520/1510mm |
| [3000215](https://www.goo-net.com/catalog/EUNOS/EUNOS_COSMO/3000215/) | ユーノスコスモ（EUNOS）２０Ｂ タイプＥ（1991年1月）        | 4名   | ４AT    | 1610kg | 280ps(206kW)/6500rpm | 41.0kg・m(402.1N・m)/3000rpm | 2.784 / 1.544 / 1.000 / 0.694 / R 2.275 | 3.909       | 215/60R15 90H / 215/60R15 90H | 標準       | 4815×1795×1305mm | 2750mm    | 1520/1510mm |
| [3000216](https://www.goo-net.com/catalog/EUNOS/EUNOS_COSMO/3000216/) | ユーノスコスモ（EUNOS）２０Ｂ タイプＳ（1991年1月）        | 4名   | ４AT    | 1590kg | 280ps(206kW)/6500rpm | 41.0kg・m(402.1N・m)/3000rpm | 2.784 / 1.544 / 1.000 / 0.694 / R 2.275 | 3.909       | 225/50R16 92V / 225/50R16 92V | 標準       | 4815×1795×1305mm | 2750mm    | 1520/1510mm |
| [3000217](https://www.goo-net.com/catalog/EUNOS/EUNOS_COSMO/3000217/) | ユーノスコスモ（EUNOS）２０Ｂ タイプＥ ＣＣＳ（1991年1月） | 4名   | ４AT    | 1640kg | 280ps(206kW)/6500rpm | 41.0kg・m(402.1N・m)/3000rpm | 2.784 / 1.544 / 1.000 / 0.694 / R 2.275 | 3.909       | 215/60R15 90H / 215/60R15 90H | 標準       | 4815×1795×1305mm | 2750mm    | 1520/1510mm |
| [3000218](https://www.goo-net.com/catalog/EUNOS/EUNOS_COSMO/3000218/) | ユーノスコスモ（EUNOS）１３Ｂ タイプＥ（1991年1月）        | 4名   | ４AT    | 1510kg | 230ps(169kW)/6500rpm | 30.0kg・m(294.2N・m)/3500rpm | 3.027 / 1.619 / 1.000 / 0.694 / R 2.272 | 4.300       | 215/60R15 90H / 215/60R15 90H | オプション | 4815×1795×1305mm | 2750mm    | 1520/1510mm |
| [3000219](https://www.goo-net.com/catalog/EUNOS/EUNOS_COSMO/3000219/) | ユーノスコスモ（EUNOS）１３Ｂ タイプＳ（1991年1月）        | 4名   | ４AT    | 1490kg | 230ps(169kW)/6500rpm | 30.0kg・m(294.2N・m)/3500rpm | 3.027 / 1.619 / 1.000 / 0.694 / R 2.272 | 4.300       | 225/50R16 92V / 225/50R16 92V | オプション | 4815×1795×1305mm | 2750mm    | 1520/1510mm |
| [3000249](https://www.goo-net.com/catalog/EUNOS/EUNOS_COSMO/3000249/) | ユーノスコスモ（EUNOS）１３Ｂ タイプＳ（1991年9月）        | 4名   | ４AT    | 1490kg | 230ps(169kW)/6500rpm | 30.0kg・m(294.2N・m)/3500rpm | 3.027 / 1.619 / 1.000 / 0.694 / R 2.272 | 4.300       | 225/50R16 92V / 225/50R16 92V | ----       | 4815×1795×1305mm | 2750mm    | 1520/1510mm |
| [3000250](https://www.goo-net.com/catalog/EUNOS/EUNOS_COSMO/3000250/) | ユーノスコスモ（EUNOS）１３Ｂ タイプＥ（1991年9月）        | 4名   | ４AT    | 1510kg | 230ps(169kW)/6500rpm | 30.0kg・m(294.2N・m)/3500rpm | 3.027 / 1.619 / 1.000 / 0.694 / R 2.272 | 4.300       | 215/60R15 90H / 215/60R15 90H | ----       | 4815×1795×1305mm | 2750mm    | 1520/1510mm |
| [3000251](https://www.goo-net.com/catalog/EUNOS/EUNOS_COSMO/3000251/) | ユーノスコスモ（EUNOS）２０Ｂ タイプＳ（1991年9月）        | 4名   | ４AT    | 1590kg | 280ps(206kW)/6500rpm | 41.0kg・m(402.1N・m)/3000rpm | 2.784 / 1.544 / 1.000 / 0.694 / R 2.275 | 3.909       | 225/50R16 92V / 225/50R16 92V | 標準       | 4815×1795×1305mm | 2750mm    | 1520/1510mm |
| [3000252](https://www.goo-net.com/catalog/EUNOS/EUNOS_COSMO/3000252/) | ユーノスコスモ（EUNOS）２０Ｂ タイプＥ（1991年9月）        | 4名   | ４AT    | 1610kg | 280ps(206kW)/6500rpm | 41.0kg・m(402.1N・m)/3000rpm | 2.784 / 1.544 / 1.000 / 0.694 / R 2.275 | 3.909       | 215/60R15 90H / 215/60R15 90H | 標準       | 4815×1795×1305mm | 2750mm    | 1520/1510mm |
| [3000253](https://www.goo-net.com/catalog/EUNOS/EUNOS_COSMO/3000253/) | ユーノスコスモ（EUNOS）２０Ｂ タイプＥ ＣＣＳ（1991年9月） | 4名   | ４AT    | 1640kg | 280ps(206kW)/6500rpm | 41.0kg・m(402.1N・m)/3000rpm | 2.784 / 1.544 / 1.000 / 0.694 / R 2.275 | 3.909       | 215/60R15 90H / 215/60R15 90H | 標準       | 4815×1795×1305mm | 2750mm    | 1520/1510mm |
| [3000254](https://www.goo-net.com/catalog/EUNOS/EUNOS_COSMO/3000254/) | ユーノスコスモ（EUNOS）１３Ｂ タイプＳＸ（1994年3月）      | 4名   | ４AT    | 1490kg | 230ps(169kW)/6500rpm | 30.0kg・m(294.2N・m)/3500rpm | 3.027 / 1.619 / 1.000 / 0.694 / R 2.272 | 4.300       | 225/50R16 92V / 225/50R16 92V | 標準       | 4815×1795×1305mm | 2750mm    | 1520/1510mm |
| [3000255](https://www.goo-net.com/catalog/EUNOS/EUNOS_COSMO/3000255/) | ユーノスコスモ（EUNOS）１３Ｂ タイプＳ ＣＣＳ（1994年3月） | 4名   | ４AT    | 1520kg | 230ps(169kW)/6500rpm | 30.0kg・m(294.2N・m)/3500rpm | 3.027 / 1.619 / 1.000 / 0.694 / R 2.272 | 4.300       | 215/60R15 94H / 215/60R15 94H | 標準       | 4815×1795×1305mm | 2750mm    | 1520/1510mm |
| [3000256](https://www.goo-net.com/catalog/EUNOS/EUNOS_COSMO/3000256/) | ユーノスコスモ（EUNOS）２０Ｂ タイプＳＸ（1994年3月）      | 4名   | ４AT    | 1590kg | 280ps(206kW)/6500rpm | 41.0kg・m(402.1N・m)/3000rpm | 2.784 / 1.544 / 1.000 / 0.694 / R 2.275 | 3.909       | 225/50R16 92V / 225/50R16 92V | 標準       | 4815×1795×1305mm | 2750mm    | 1520/1510mm |
| [3000257](https://www.goo-net.com/catalog/EUNOS/EUNOS_COSMO/3000257/) | ユーノスコスモ（EUNOS）２０Ｂ タイプＥ ＣＣＳ（1994年3月） | 4名   | ４AT    | 1640kg | 280ps(206kW)/6500rpm | 41.0kg・m(402.1N・m)/3000rpm | 2.784 / 1.544 / 1.000 / 0.694 / R 2.275 | 3.909       | 215/60R15 94H / 215/60R15 94H | 標準       | 4815×1795×1305mm | 2750mm    | 1520/1510mm |

### Other pages the 1997-2002 agent saved (Mazda releases, catalogue indexes, Car Sensor and carview grade pages)

- carsensor-rx7-F001.html: [RX-7（マツダ）1997年10月～2002年8月生産モデルのカタログ｜中古車なら【カーセンサー】](https://www.carsensor.net/catalog/mazda/rx-7/F001/)
- carsensor-rx7.html: [RX-7（マツダ）のカタログ｜中古車なら【カーセンサー】](https://www.carsensor.net/catalog/mazda/rx-7/)
- carview-g14311.html: [マツダ RX-7Type_R_バサーストR(MT) の新車情報・カタログ - carview!](https://carview.yahoo.co.jp/ncar/catalog/mazda/rx-7/gradeid/14311/)
- carview-g21933.html: [マツダ RX-7Type_R_バサースト(MT) の新車情報・カタログ - carview!](https://carview.yahoo.co.jp/ncar/catalog/mazda/rx-7/gradeid/21933/)
- carview-g22934.html: [マツダ RX-7スピリットR_タイプA(MT) の新車情報・カタログ - carview!](https://carview.yahoo.co.jp/ncar/catalog/mazda/rx-7/gradeid/22934/)
- carview-g22935.html: [マツダ RX-7スピリットR_タイプB(MT) の新車情報・カタログ - carview!](https://carview.yahoo.co.jp/ncar/catalog/mazda/rx-7/gradeid/22935/)
- carview-g22936.html: [マツダ RX-7スピリットR_タイプC(AT) の新車情報・カタログ - carview!](https://carview.yahoo.co.jp/ncar/catalog/mazda/rx-7/gradeid/22936/)
- carview-g7837.html: [マツダ RX-7TypeRS(MT) の新車情報・カタログ - carview!](https://carview.yahoo.co.jp/ncar/catalog/mazda/rx-7/gradeid/7837/)
- carview-g7843.html: [マツダ RX-7TypeRB(MT) の新車情報・カタログ - carview!](https://carview.yahoo.co.jp/ncar/catalog/mazda/rx-7/gradeid/7843/)
- carview-g7870.html: [マツダ RX-7TypeR(MT) の新車情報・カタログ - carview!](https://carview.yahoo.co.jp/ncar/catalog/mazda/rx-7/gradeid/7870/)
- carview-g7871.html: [マツダ RX-7TypeRB(AT) の新車情報・カタログ - carview!](https://carview.yahoo.co.jp/ncar/catalog/mazda/rx-7/gradeid/7871/)
- carview-g7872.html: [マツダ RX-7TypeRB_Sパッケージ(MT) の新車情報・カタログ - carview!](https://carview.yahoo.co.jp/ncar/catalog/mazda/rx-7/gradeid/7872/)
- carview-mc001-grade.html: [マツダ RX-7(1991年10月モデル) のグレード一覧 - carview!](https://carview.yahoo.co.jp/ncar/catalog/mazda/rx-7/FMC003-MC001/grade/)
- carview-mc002-grade.html: [マツダ RX-7(1995年7月モデル) のグレード一覧 - carview!](https://carview.yahoo.co.jp/ncar/catalog/mazda/rx-7/FMC003-MC002/grade/)
- carview-mc003-grade.html: [マツダ RX-7(1996年1月モデル) のグレード一覧 - carview!](https://carview.yahoo.co.jp/ncar/catalog/mazda/rx-7/FMC003-MC003/grade/)
- carview-mc004-grade.html: [マツダ RX-7(1999年1月モデル) のグレード一覧 - carview!](https://carview.yahoo.co.jp/ncar/catalog/mazda/rx-7/FMC003-MC004/grade/)
- carview-mc005-grade.html: 指定された情報はすでに削除されているか、まだ提供を開始していません。【 carview! 】 (canonical URL not in the saved file)
- carview-mc006-grade.html: 指定された情報はすでに削除されているか、まだ提供を開始していません。【 carview! 】 (canonical URL not in the saved file)
- carview-rx7.html: [マツダ RX-7 新車情報・カタログ - carview!](https://carview.yahoo.co.jp/ncar/catalog/mazda/rx-7/)
- cs-M001G001.html: [マツダ RX-7 タイプRSの基本スペック｜中古車なら【カーセンサー】](https://www.carsensor.net/catalog/mazda/rx-7/F001/M001G001/)
- cs-M001G002.html: [マツダ RX-7 タイプRの基本スペック｜中古車なら【カーセンサー】](https://www.carsensor.net/catalog/mazda/rx-7/F001/M001G002/)
- cs-M001G003.html: [マツダ RX-7 タイプRBの基本スペック｜中古車なら【カーセンサー】](https://www.carsensor.net/catalog/mazda/rx-7/F001/M001G003/)
- cs-M001G004.html: [マツダ RX-7 タイプRB Sパッケージの基本スペック｜中古車なら【カーセンサー】](https://www.carsensor.net/catalog/mazda/rx-7/F001/M001G004/)
- cs-M001G005.html: [マツダ RX-7 タイプRBの基本スペック｜中古車なら【カーセンサー】](https://www.carsensor.net/catalog/mazda/rx-7/F001/M001G005/)
- cs-M002G001.html: [マツダ RX-7 タイプRSの基本スペック｜中古車なら【カーセンサー】](https://www.carsensor.net/catalog/mazda/rx-7/F001/M002G001/)
- cs-M002G002.html: [マツダ RX-7 タイプRの基本スペック｜中古車なら【カーセンサー】](https://www.carsensor.net/catalog/mazda/rx-7/F001/M002G002/)
- cs-M002G003.html: [マツダ RX-7 タイプRBの基本スペック｜中古車なら【カーセンサー】](https://www.carsensor.net/catalog/mazda/rx-7/F001/M002G003/)
- cs-M002G004.html: [マツダ RX-7 タイプRB Sパッケージの基本スペック｜中古車なら【カーセンサー】](https://www.carsensor.net/catalog/mazda/rx-7/F001/M002G004/)
- cs-M002G005.html: [マツダ RX-7 タイプRBの基本スペック｜中古車なら【カーセンサー】](https://www.carsensor.net/catalog/mazda/rx-7/F001/M002G005/)
- cs-M002G006.html: [マツダ RX-7 タイプR バサーストの基本スペック｜中古車なら【カーセンサー】](https://www.carsensor.net/catalog/mazda/rx-7/F001/M002G006/)
- cs-M002G007.html: [マツダ RX-7 スピリットR タイプAの基本スペック｜中古車なら【カーセンサー】](https://www.carsensor.net/catalog/mazda/rx-7/F001/M002G007/)
- cs-M002G008.html: [マツダ RX-7 スピリットR タイプBの基本スペック｜中古車なら【カーセンサー】](https://www.carsensor.net/catalog/mazda/rx-7/F001/M002G008/)
- cs-M002G009.html: [マツダ RX-7 スピリットR タイプCの基本スペック｜中古車なら【カーセンサー】](https://www.carsensor.net/catalog/mazda/rx-7/F001/M002G009/)
- cs-M002G010.html: [マツダ RX-7 タイプRZの基本スペック｜中古車なら【カーセンサー】](https://www.carsensor.net/catalog/mazda/rx-7/F001/M002G010/)
- cs-M002G011.html: [マツダ RX-7 タイプR バサーストRの基本スペック｜中古車なら【カーセンサー】](https://www.carsensor.net/catalog/mazda/rx-7/F001/M002G011/)
- cs-M003G001.html: [マツダ RX-7 タイプRZの基本スペック｜中古車なら【カーセンサー】](https://www.carsensor.net/catalog/mazda/rx-7/F001/M003G001/)
- cs-M003G002.html: [マツダ RX-7 タイプRSの基本スペック｜中古車なら【カーセンサー】](https://www.carsensor.net/catalog/mazda/rx-7/F001/M003G002/)
- cs-M003G003.html: [マツダ RX-7 タイプRB バサーストの基本スペック｜中古車なら【カーセンサー】](https://www.carsensor.net/catalog/mazda/rx-7/F001/M003G003/)
- cs-M003G004.html: [マツダ RX-7 タイプRBの基本スペック｜中古車なら【カーセンサー】](https://www.carsensor.net/catalog/mazda/rx-7/F001/M003G004/)
- cs-M003G005.html: [マツダ RX-7 ツーリングXの基本スペック｜中古車なら【カーセンサー】](https://www.carsensor.net/catalog/mazda/rx-7/F001/M003G005/)
- cs-M003G006.html: [マツダ RX-7 タイプRS-Rの基本スペック｜中古車なら【カーセンサー】](https://www.carsensor.net/catalog/mazda/rx-7/F001/M003G006/)
- goonet-efini-rx7.html: [アンフィニＲＸ−７（マツダ）の歴代モデル・グレード別カタログ情報｜中古車なら【グーネット】](https://www.goo-net.com/catalog/MAZDA/EFINI_RX7/)
- goonet-rx7.html: [ＲＸ−７（マツダ）の歴代モデル・グレード別カタログ情報｜中古車なら【グーネット】](https://www.goo-net.com/catalog/MAZDA/RX7/)
- mazda-en-2000-1018.html: MAZDA:Backnumber | News Releases (canonical URL not in the saved file)
- mazda-en-2001-0830.html: MAZDA:Backnumber | News Releases (canonical URL not in the saved file)
- mazda-en-2001-1210.html: MAZDA:Backnumber | News Releases (canonical URL not in the saved file)
- mazda-en-2002-0325.html: MAZDA:Backnumber | News Releases (canonical URL not in the saved file)
- mazda-en-release-1997.html: MAZDA: 1997 News Releases (canonical URL not in the saved file)
- mazda-en-release-1998.html: Access Denied (canonical URL not in the saved file)
- mazda-en-release-1999.html: MAZDA: 1999 News Releases (canonical URL not in the saved file)
- mazda-en-release-2000.html: MAZDA: 2000 News Releases (canonical URL not in the saved file)
- mazda-en-release-2001.html: MAZDA: 2001 News Releases (canonical URL not in the saved file)
- mazda-en-release-2002.html: MAZDA: 2002 News Releases (canonical URL not in the saved file)
- mazda-en-release-2003.html: Access Denied (canonical URL not in the saved file)
- mazda-ja-2002-0325.html: 【MAZDA】バックナンバー｜ニュースリリース (canonical URL not in the saved file)

### Pages the Europe/UK/Australia/NZ agent saved

- acr-fd-review.html: [Review: Mazda FD RX-7 (1992-98) – Australian Car.Reviews](https://www.australiancar.reviews/review-mazda-fd-rx-7-1992-98/)
- ams-fd3s-daten.html: [Mazda RX-7 Typ FD3S, Baujahr 1992 bis 1996 ► Technische Daten zu allen Motorisierungen](https://www.auto-motor-und-sport.de/marken-modelle/mazda/rx-7/typ-fd3s/technische-daten/)
- ams-kaufberatung.html: [Kaufberatung Mazda RX-7 FD: Wankel-Winzling mit Fahrspaß-Garantie](https://www.auto-motor-und-sport.de/oldtimer/mazda-rx-7-kaufberatung-wankelmotor-japan-gebrauchte-sportwagen/)
- ams-test-1992-daten.html: [Mazda RX-7 FD3S (1992) im Test (Technische Daten)](https://www.auto-motor-und-sport.de/marken-modelle/mazda/rx-7/typ-fd3s/technische-daten/)
- ams-test-1992.html: [Mazda RX-7 FD3S (1992) im Test](https://www.auto-motor-und-sport.de/test/mazda-rx-7-1992/)
- ausrotary-sp-p1.html: [Mazda RX-7 SP (1995) - AusRotary](http://www.ausrotary.com/viewtopic.php?t=157658)
- ausrotary-sp-p2.html: [Mazda RX-7 SP (1995) - Page 2 - AusRotary](https://www.ausrotary.com/viewtopic.php?t=157658&start=15)
- ausrotary-sp-p3.html: [Mazda RX-7 SP (1995) - Page 3 - AusRotary](https://www.ausrotary.com/viewtopic.php?t=157658&start=30)
- autobild-kaufberatung.html: [Kaufberatung: Mazda RX-7 (FD3S) - AUTO BILD KLASSIK](https://www.autobild.de/klassik/artikel/mazda-rx-7-fd3s--4579424.html)
- autobild-wankel-superstar.html: [Mazda RX-7 FD: Wankel-Superstar - AUTO BILD KLASSIK](https://www.autobild.de/artikel/mazda-rx-7-fd-der-populaerste-japaner-ueberhaupt-14848253.html)
- autosportive-rx7fd.html: [MAZDA RX-7 FD biturbo (1992-2002) - GUIDE OCCASION](https://www.automobile-sportive.com/guide/mazda/rx7fd.php)
- carenthusiast-retro.html: Retro road test: Mazda RX-7 FD | Car Reviews | by Car Enthusiast (canonical URL not in the saved file)
- csc-rx7-guide.html: [Mazda RX-7 buyer’s guide: what to pay and what to look for | Classic & Sports Car](https://www.classicandsportscar.com/features/buyers-guide-mazda-rx-7)
- evo-rx7-icon.html: [Mazda RX-7 FD (1992 - 2002): a '90s Japanese icon | evo](https://www.evo.co.uk/mazda/rx-7)
- fdrx7-home.html: [FDRX7.com - Mazda 3rd-Gen RX7 Forums](https://fdrx7.com/)
- fdrx7-library.html: [Library - FDRX7.com](https://fdrx7.com/library/)
- hagerty-fd-guide.html: [Your definitive Mazda RX-7 FD buyer's guide - Hagerty Media](https://www.hagerty.com/media/buying-and-selling/fd-mazda-rx-7-buyers-guide/)
- insidemazda-100y-rx7.html: [100 years of Mazda | The Mazda RX-7 | Inside Mazda](https://www.insidemazda.co.uk/2020/04/06/100-years-of-mazda-the-mazda-rx-7/)
- insidemazda-heritage-fleet.html: [Mazda UK Heritage Fleet switches to sustainable petrol from Coryton Fuels | Inside Mazda](https://www.insidemazda.co.uk/2023/06/29/mazda-uk-heritage-fleet-switches-to-sustainable-petrol-from-coryton-fuels/)
- insidemazda-mazda-uk.html: [Mazda at 100 | Mazda in the UK | Inside Mazda](https://www.insidemazda.co.uk/2020/06/26/mazda-at-100-mazda-in-the-uk/)
- insidemazda-rx7-40.html: [The Mazda RX-7: celebrating an icon at 40 | Inside Mazda](https://www.insidemazda.co.uk/2018/06/18/the-mazda-rx-7-celebrating-an-icon-at-40/)
- insidemazda-rx7-owners.html: [Mazda RX-7 at 40: owners’ stories | Inside Mazda](https://www.insidemazda.co.uk/2018/06/15/rx-7-at-40-owner-stories/)
- mazdauk-100y-rx7.html: [100 years of Mazda | The Mazda RX-7](https://www.mazda.co.uk/why-mazda/news-and-events/mazda-news/articles/100-years-of-mazda--the-mazda-rx-7/)
- nzpc-vinny.html: [Vinny Fabbed - 1992 Mazda RX-7 | NZ Performance Car](https://nzperformancecar.co.nz/vinny-fabbed-1992-mazda-rx-7/)
- ph-rx7-guide.html: [Mazda RX-7: PH Buying Guide - PistonHeads UK](https://www.pistonheads.com/news/ph-buying-guides/mazda-rx-7-ph-buying-guide/36919)
- shannons-rx7-sp.html: [Mazda RX-7 SP: The Aussie-designed supercar that conquered Porsche - Shannons Club](https://club.shannons.com.au/club/news/racing-garage/mazda-rx-7-sp-the-aussie-designed-supercar-that-conquered-porsche/)
- topgear-fd-guide.html: Access Denied (canonical URL not in the saved file)
- whichcar-modern-classic.html: Just a moment... (canonical URL not in the saved file)

### 13B-REW agent: saved pages other than catalogue grade pages

### 20B-REW agent: saved pages other than goo-net grade pages

- atkins-20b-center-gear-bolt.html: Just a moment... (canonical URL not in the saved file)
- atkins-20b-eshaft.html: Just a moment... (canonical URL not in the saved file)
- bestcar-146343.html: [マツダ ユーノスコスモの衝撃 量産世界初の3ローター搭載！【偉大な生産終了車】 - 自動車情報誌「ベストカー」](https://bestcarweb.jp/feature/column/146343)
- bestcar-255888.html: [ユーノスコスモは今しか乗れない!? 極悪燃費3ロータリーの20Bはまだ生き残っているのか？ - 自動車情報誌「ベストカー」](https://bestcarweb.jp/usedcar/255888)
- bestcar-846887.html: [見かけによらず超じゃじゃ馬!! 唯一無二の3ローター搭載市販車 ユーノスコスモの衝撃が忘れられん!! - 自動車情報誌「ベストカー」](https://bestcarweb.jp/feature/column/846887)
- carsensor-cosmo-F001.html: [ユーノスコスモ（マツダ）1990年4月～1995年8月生産モデルのカタログ｜中古車なら【カーセンサー】](https://www.carsensor.net/catalog/mazda/eunos_cosmo/F001/)
- carsensor-cosmo-F001M004.html: [マツダ ユーノスコスモのグレード一覧｜中古車なら【カーセンサー】](https://www.carsensor.net/catalog/mazda/eunos_cosmo/F001M004/list.html)
- carsensor-cosmo-M004G001.html: [マツダ ユーノスコスモ 13Bロータリーターボ タイプEの基本スペック｜中古車なら【カーセンサー】](https://www.carsensor.net/catalog/mazda/eunos_cosmo/F001/M004G001/)
- carsensor-cosmo-M004G002.html: [マツダ ユーノスコスモ 13Bロータリーターボ タイプSの基本スペック｜中古車なら【カーセンサー】](https://www.carsensor.net/catalog/mazda/eunos_cosmo/F001/M004G002/)
- carsensor-cosmo-M004G003.html: [マツダ ユーノスコスモ 20Bロータリーターボ タイプEの基本スペック｜中古車なら【カーセンサー】](https://www.carsensor.net/catalog/mazda/eunos_cosmo/F001/M004G003/)
- carsensor-cosmo-M004G004.html: [マツダ ユーノスコスモ 20Bロータリーターボ タイプE CCSの基本スペック｜中古車なら【カーセンサー】](https://www.carsensor.net/catalog/mazda/eunos_cosmo/F001/M004G004/)
- carsensor-cosmo-M004G005.html: [マツダ ユーノスコスモ 20Bロータリーターボ タイプSの基本スペック｜中古車なら【カーセンサー】](https://www.carsensor.net/catalog/mazda/eunos_cosmo/F001/M004G005/)
- carsensor-cosmo-M004G006.html: [マツダ ユーノスコスモ 20Bロータリーターボ タイプSXの基本スペック｜中古車なら【カーセンサー】](https://www.carsensor.net/catalog/mazda/eunos_cosmo/F001/M004G006/)
- carsensor-cosmo-M004G007.html: [マツダ ユーノスコスモ 13Bロータリーターボ タイプS CCSの基本スペック｜中古車なら【カーセンサー】](https://www.carsensor.net/catalog/mazda/eunos_cosmo/F001/M004G007/)
- carsensor-cosmo-M004G008.html: [マツダ ユーノスコスモ 13Bロータリーターボ タイプSXの基本スペック｜中古車なら【カーセンサー】](https://www.carsensor.net/catalog/mazda/eunos_cosmo/F001/M004G008/)
- carsensor-cosmo-index.html: [ユーノスコスモ（マツダ）のカタログ｜中古車なら【カーセンサー】](https://www.carsensor.net/catalog/mazda/eunos_cosmo/)
- carview-cosmo-20018.html: [マツダ ユーノスコスモ20B_TYPE-E_CCS(AT_3ローター) の新車情報・カタログ - carview!](https://carview.yahoo.co.jp/ncar/catalog/mazda/eunos_cosmo/gradeid/20018/)
- carview-cosmo-20019.html: [マツダ ユーノスコスモ20B_TYPE-E(AT_3ローター) の新車情報・カタログ - carview!](https://carview.yahoo.co.jp/ncar/catalog/mazda/eunos_cosmo/gradeid/20019/)
- carview-cosmo-20020.html: [マツダ ユーノスコスモ20B_TYPE-S(AT_3ローター) の新車情報・カタログ - carview!](https://carview.yahoo.co.jp/ncar/catalog/mazda/eunos_cosmo/gradeid/20020/)
- carview-cosmo-20021.html: [マツダ ユーノスコスモ13B_TYPE-E(AT_2ローター) の新車情報・カタログ - carview!](https://carview.yahoo.co.jp/ncar/catalog/mazda/eunos_cosmo/gradeid/20021/)
- carview-cosmo-20022.html: [マツダ ユーノスコスモ13B_TYPE-S(AT_2ローター) の新車情報・カタログ - carview!](https://carview.yahoo.co.jp/ncar/catalog/mazda/eunos_cosmo/gradeid/20022/)
- carview-cosmo-grades.html: [マツダ ユーノスコスモ(1990年4月モデル) のグレード一覧 - carview!](https://carview.yahoo.co.jp/ncar/catalog/mazda/eunos_cosmo/FMC001-MC001/grade/)
- carview-cosmo-index.html: [マツダ ユーノスコスモ 新車情報・カタログ - carview!](https://carview.yahoo.co.jp/ncar/catalog/mazda/eunos_cosmo/)
- collins-13b-20b-cd009.html: [Mazda Rotary 13B, 20B, 26B to CD009 (350Z/370Z 6-Speed) Manual Transmi – Collins Performance Technologies](https://collinsperformancetechnologies.com/products/mazda-rotary-13b-to-350z-partial-swap-kit)
- dae.html: 400 Error: Bad Request (canonical URL not in the saved file)
- dae2.html: DEFINED AUTOWORKS | Service Repair Upgrades | Performance for Mazda RX7 | RX-7 | RX8 (canonical URL not in the saved file)
- definedautoworks-3-rotor.html: 400 Error: Bad Request (canonical URL not in the saved file)
- definedautoworks-conversions-copy.html: DEFINED AUTOWORKS | Service Repair Upgrades | Performance for Mazda RX7 | RX-7 | RX8 (canonical URL not in the saved file)
- drifted-20b-guide.html: [Ultimate Mazda 20B Engine Guide - DRIFTED](https://www.drifted.com/20b-engine/)
- drifthq-xcessive-20b-xmember.html: [404 Not Found – Drift HQ](https://drifthq.com/404)
- enginecode-uk-20b-rew.html: [Mazda 20B-REW Engine Guide 2025 | Specs, Issues, Models](https://www.enginecode.uk/mazda/20b-rew-specs)
- foxed-rx7manual-index.html: Foxed.ca - Mazda RX-7 Manuals (canonical URL not in the saved file)
- goonet-cosmo-index.html: [コスモ（ユーノス）の歴代モデル・グレード別カタログ情報｜中古車なら【グーネット】](https://www.goo-net.com/catalog/EUNOS/EUNOS_COSMO/)
- hinson-fd-20b-mounting.html: [Hinson Motorsports FD20B FD RX7 20B 3 Rotor Engine Mounting Equipment – HINSONMotorsports.com](https://hinsonmotorsports.com/products/hinson-fd-rx7-20b-3-rotor-engine-mounting-equipment)
- jawiki-eunos-cosmo.html: [マツダ・コスモ - Wikipedia](https://ja.wikipedia.org/wiki/%E3%83%9E%E3%83%84%E3%83%80%E3%83%BB%E3%82%B3%E3%82%B9%E3%83%A2)
- jawiki-mazda-20b.html: [マツダ・20B - Wikipedia](https://ja.wikipedia.org/wiki/%E3%83%9E%E3%83%84%E3%83%80%E3%83%BB20B)
- meisha-cosmo.html: [コスモ | 名車文化研究所](https://meisha.co.jp/?p=4118)
- mes-cosmo-feature.html: MES|コスモ特集/スペシャルメニュー (canonical URL not in the saved file)
- motorfan-archive-cosmo-1990.html: [MotorFan最新情報｜保険・ランキング・求人｜Motor-Fan[モーターファン]](https://car.motor-fan.jp/articles)
- motorz-46949.html: [3ローターエンジンには夢があった！？マツダの名車ユーノスコスモってどんな車？ - Motorz（モーターズ）- クルマ・バイクをもっと楽しくするメディア -](https://motorz.jp/feature/46949/)
- mz_home.html: [Buy Genuine OEM Parts Online from Japan | MegaZip](https://www.megazip.net/)
- mz_probe.html: (canonical URL not in the saved file)
- mzt-3r-bearing-main-center.html: [3 ROTOR BEARING MAIN, CENTER—NLA— - Mazdatrix](https://mazdatrix.com/product/3r-bearing-main-center/)
- mzt-3r-bolt-tension-10mm-4-to-1-need-9.html: [3 ROTOR TENSION BOLT 10MM, #4 TO #1 (NEED 9) - Mazdatrix](https://mazdatrix.com/product/3r-bolt-tension-10mm-4-to-1-need-9/)
- mzt-3r-counterweight-front.html: [3 ROTOR COUNTERWEIGHT, FRONT - Mazdatrix](https://mazdatrix.com/product/3r-counterweight-front/)
- mzt-3r-counterweight-rear.html: [3 ROTOR COUNTERWEIGHT, REAR - Mazdatrix](https://mazdatrix.com/product/3r-counterweight-rear/)
- mzt-3r-eccentric-shaft-nla.html: [3 ROTOR ECCENTRIC SHAFT, —NLA— - Mazdatrix](https://mazdatrix.com/product/3r-eccentric-shaft-nla/)
- mzt-3r-gear-stationary-nla-center.html: [3 ROTOR STATIONARY GEAR, —NLA— CENTER - Mazdatrix](https://mazdatrix.com/product/3r-gear-stationary-nla-center/)
- mzt-3r-housing-1-nla-20b-front.html: [20B FRONT HOUSING #1, —NLA— - Mazdatrix](https://mazdatrix.com/product/3r-housing-1-nla-20b-front/)
- mzt-3r-housing-2-housing-second.html: [20B CENTER HOUSING #2, SECOND (Thick) - Mazdatrix](https://mazdatrix.com/product/3r-housing-2-housing-second/)
- mzt-3r-keyway-center-shaft-center-key.html: [3 ROTOR KEYWAY, SHAFT CENTER KEY —NLA— - Mazdatrix](https://mazdatrix.com/product/3r-keyway-center-shaft-center-key/)
- mzt-3r-oil-pan-nla-oil-pan.html: [3 ROTOR OIL PAN —NLA— - Mazdatrix](https://mazdatrix.com/product/3r-oil-pan-nla-oil-pan/)
- mzt-3r-oil-pick-up-tube-pick-up-tube.html: [3 ROTOR OIL PICK UP TUBE —NLA— - Mazdatrix](https://mazdatrix.com/product/3r-oil-pick-up-tube-pick-up-tube/)
- mzt-3r-rotor-housing-front-20b-rotor-hsg.html: [20B FRONT ROTOR HOUSING (3 ROTOR)—NLA— - Mazdatrix](https://mazdatrix.com/product/3r-rotor-housing-front-20b-rotor-hsg/)
- mzt-3r-rotor-housing-nla-ctr-rear.html: [3 ROTOR ROTOR HOUSING, —NLA— CENTER, REAR - Mazdatrix](https://mazdatrix.com/product/3r-rotor-housing-nla-ctr-rear/)
- mzt-apex-seals-i-rotary-2-piece-2mm-steel-86-02-20b-9-seals.html: [APEX SEALS, I-ROTARY, 2 PIECE, 2MM STEEL 86-02 20B (9 SEALS) - Mazdatrix](https://mazdatrix.com/product/apex-seals-i-rotary-2-piece-2mm-steel-86-02-20b-9-seals/)
- mzt-housing-center-13b-cosmo-20b-3.html: [HOUSING CENTER, 13B COSMO + 20B #3 —NLA— - Mazdatrix](https://mazdatrix.com/product/housing-center-13b-cosmo-20b-3/)
- mzt-housing-front-13b-cosmo.html: [HOUSING FRONT, 13B COSMO—NLA— - Mazdatrix](https://mazdatrix.com/product/housing-front-13b-cosmo/)
- mzt-housing-rear-13b-cosmo-20b-at.html: [HOUSING REAR —NLA— 13B COSMO + 20B (AUTOMATIC TRANSMISSION) - Mazdatrix](https://mazdatrix.com/product/housing-rear-13b-cosmo-20b-at/)
- mzt-housing-rear-20b-aluminum.html: [HOUSING REAR 20B, ALUMINUM —NLA— - Mazdatrix](https://mazdatrix.com/product/housing-rear-20b-aluminum/)
- mzt-rotor-kit-20b-2mm-steel-apex.html: [ROTOR KIT, 20B 2MM STEEL APEX SEAL - Mazdatrix](https://mazdatrix.com/product/rotor-kit-20b-2mm-steel-apex/)
- mzt-service-balance-eng-3-rotor-engine.html: [SERVICE BALANCE ENGINE, 3-ROTOR 20B - Mazdatrix](https://mazdatrix.com/product/service-balance-eng-3-rotor-engine/)
- mzt.html: [Home - Mazdatrix Mazdatrix](https://mazdatrix.com/)
- nosweb-cosmo-20b-vol3.html: [優美さの奥に無敵の力を秘めた1台。バブルで最も華やかに踊った自動車メーカーはマツダだったかもしれない｜1990年式 ユーノス コスモ 20B Vol.3｜バブルでGO!! | NostalgicHero [ノスタルジックヒーロー] | 日本の旧車Webマガジン｜NOSWEB](https://nosweb.jp/nostalgichero/articles/detail/1970)
- platinum-radium-20b-secondary-rail.html: [Radium Secondary Fuel Rail - Mazda Cosmo JC (20B-REW) 20-0465 — Platinum Racing Products](https://www.platinumracingproducts.com/en-us/products/radium-secondary-fuel-rail-mazda-cosmo-jc-20b-rew-20-0465)
- probe.html: Banzai Store (canonical URL not in the saved file)
- projectjdm-cosmo-20b.html: [Mazda Eunos Cosmo 20B: Only Production Three-Rotor Car | Project JDM](https://projectjdm.org/blog/rare-mazda-eunos-cosmo-20b-profile)
- rotaryengine-20b-fd-conversions.html: [20B/FD Conversions - RotaryEngine.com | RX-7 Specialties](https://rotaryengine.com/20b-fd-conversions/)
- rotarypowercrew-20b.html: 403 Forbidden (canonical URL not in the saved file)
- xcessive-20b-fd-mount-kit-old.html: [20B to RX7 FD chassis Mount kit – Xcessive Manufacturing](https://xcessivemanufacturing.com/products/20b-m-20b-fd-mmb-k)
- xcessive-20b-fd-mount-kit.html: [20B to RX7 FD chassis Mount kit – Xcessive Manufacturing](https://xcessivemanufacturing.com/products/20b-m-20b-fd-mmb-k)

### Sketchfab models the assets agent opened (Data API metadata only; no images were viewed)

| Model                                                                                                                                                | Uploader      | Licence (API)                           | Faces  | Vertices | Downloadable | Published  |
| ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | --------------------------------------- | ------ | -------- | ------------ | ---------- |
| [Mazda RX7 FD 1999](https://sketchfab.com/3d-models/mazda-rx7-fd-1999-06986b70c65b44c5a7315ed467b621a6)                                              | niev          | CC Attribution                          | 650294 | 389514   | True         | 2025-04-10 |
| [Mazda RX-7 FD3S Abflug](https://sketchfab.com/3d-models/mazda-rx-7-fd3s-abflug-37c4551451c342ada3d8593956e23f35)                                    | 0verly        | CC Attribution-NonCommercial            | 563505 | 305475   | True         | 2025-01-04 |
| [Mazda RX-7](https://sketchfab.com/3d-models/mazda-rx-7-45cb02e634ed477a9a04bb19813443f2)                                                            | realwallon    | CC Attribution                          | 361462 | 185448   | True         | 2022-06-06 |
| [2002 Mazda RX-7 Spirit R (FD)](https://sketchfab.com/3d-models/2002-mazda-rx-7-spirit-r-fd-5d3422f5a933442b94fd85b97dd97aab)                        | adrianaflak09 | CC Attribution                          | 56574  | 38437    | True         | 2026-03-20 |
| [2002 Mazda RX-7 Spirit R Type A (FD)](https://sketchfab.com/3d-models/2002-mazda-rx-7-spirit-r-type-a-fd-60b2b5e9f5ce45cbb41832793d0e0e68)          | ddiaz-design  | CC Attribution-NonCommercial-ShareAlike | 53817  | 36302    | True         | 2025-09-30 |
| [Mazda RX-7 FD3S Efini](https://sketchfab.com/3d-models/mazda-rx-7-fd3s-efini-61c7faa539424486aff840b78d7d6459)                                      | MGR99         | Editorial                               | 48578  | 26255    | False        | 2018-11-18 |
| [Mazda RX-7 Type-RS (FD3S)](https://sketchfab.com/3d-models/mazda-rx-7-type-rs-fd3s-6941f12139cc4c18b81875947cdf5256)                                | Car2022       | CC Attribution                          | 78464  | 68045    | True         | 2023-12-20 |
| [Mazda RX-7 Panspeed (FD3S)](https://sketchfab.com/3d-models/mazda-rx-7-panspeed-fd3s-745eac0542eb470f9d88b6215f33ee93)                              | VuckyZ123     | CC Attribution                          | 30610  | 19579    | True         | 2025-04-19 |
| [Mazda RX7 FD](https://sketchfab.com/3d-models/mazda-rx7-fd-90597e9ed8e74937a4ae8de016bfccf5)                                                        | MGR99         | Editorial                               | 28718  | 16607    | False        | 2018-05-16 |
| [Mazda RX-7 Custom](https://sketchfab.com/3d-models/mazda-rx-7-custom-b4988cf04b0e48d78a6ee9c8a4169994)                                              | Naudaff3D     | Editorial                               | 938643 | 483113   | False        | 2024-01-19 |
| [2023 LB★SUPER SILHOUETTE MAZDA FD3S RX-7](https://sketchfab.com/3d-models/2023-lbsuper-silhouette-mazda-fd3s-rx-7-c5c5ad569240468e9f58a8f88e7aaaf0) | ddiaz-design  | CC Attribution-NonCommercial-ShareAlike | 139460 | 78918    | True         | 2026-01-15 |
| [Mazda RX-7 FD](https://sketchfab.com/3d-models/mazda-rx-7-fd-d35ff630df614771b82e7b2f59035b1e)                                                      | Lexyc16       | CC Attribution                          | 37114  | 21767    | True         | 2020-05-22 |
| [Mazda RX-7 Spirit R (FD3S)](https://sketchfab.com/3d-models/mazda-rx-7-spirit-r-fd3s-e9c3394294104838bfc89b226f93a52a)                              | Car2022       | CC Attribution                          | 49688  | 29882    | True         | 2024-12-16 |
| [1999 Mazda RX-7 FD](https://sketchfab.com/3d-models/1999-mazda-rx-7-fd-ff9c8b4fd8124cb1b54211baff7d6444)                                            | Res1n         | CC Attribution                          | 650294 | 389514   | True         | 2026-08-03 |

## 5. Things spotted that need checking before any of this goes into `src/data/`

1. **Gearing differs by market.**
   - goo-net prints the JDM 5MT as 3.483 / 2.015 / 1.391 / 1.000 / **0.806**, reverse 3.288.
   - The final drive is 3.909 on the 1991-12 Type S and Type X 5MT, and 4.100 on the Type R and later 5MT grades.
   - The Type RZ (1995-03, 1996-01, 2000-10), the Type RS (1996-01 on) and the Spirit R Type A and B use a **0.762** fifth gear with a **4.300** final drive. The 1995-03 Type R-S has the 17-inch tyres but keeps 0.806 and 4.100.
   - Mazda's US manual prints **0.719** and **4.100** for the US car.
   - Every automatic shows 3.027 / 1.619 / 1.000 / 0.694 with a 3.909 final drive.
2. **Length:** 4,295 mm (1991-12 grades), 4,280 mm (1993-08 to 1998) and 4,285 mm (1999 on), all in goo-net.
3. **Two-seaters:** the Type R-II, the Type RZ editions, the Type R-II Bathurst and the Spirit R Type A are listed with 2 seats.
4. **Output steps (goo-net):**
   - 255 PS on every grade from 1991-12 to 1995.
   - 265 PS on every 1996-01 5MT grade, the 1997-01 Type RB Bathurst X and the 1997-10 Type RS-R.
   - 280 PS / 32.0 kgf·m from 1999-01 on the Type RS and Type R, and later the Type RZ, the Bathurst R, the Bathurst and the Spirit R Type A and B.
   - The Type RB 5MT stays at 265 PS, and every automatic stays at 255 PS, including the Spirit R Type C (which also has the 17-inch tyres).
5. **Wankel chamber formula.** Yamamoto's Table 2.1 (quoted by the 13B-REW agent, unverified) gives R = 102 mm plus a "parallel transfer" a = 3 mm for a 654 cc chamber.
   - That suggests Mazda's 654 cc uses the effective radius R + a = 105 mm.
   - The schema's 3·√3·R·e·B check gives 654.7 cc with R = 105 mm, and 636 cc with R = 102 mm.
   - Read the table and decide which R to store before writing the engine file (it may need both).
6. **Eunos Cosmo** (goo-net):
   - 20B-REW: 280 PS / 6,500 rpm and 41.0 kgf·m / 3,000 rpm. Its 4AT is 2.784 / 1.544 / 1.000 / 0.694, reverse 2.275, with a 3.909 final drive.
   - 13B-REW: 230 PS / 6,500 rpm and 30.0 kgf·m / 3,500 rpm. Its 4AT is 3.027 / 1.619 / 1.000 / 0.694 with a 4.300 final drive.
7. **Shopping list: changes visible in the API metadata**, not yet judged by the agent:
   - MGR99's "Mazda RX-7 FD3S Efini" now reports an **Editorial** licence, not downloadable, 48,578 faces. The old entry said Royalty Free, 4.5M triangles.
   - niev's "Mazda RX7 FD 1999" (on the Avoid list) and Res1n's "1999 Mazda RX-7 FD" have identical face and vertex counts, which suggests a re-upload.
   - adrianaflak09's CC-BY "2002 Mazda RX-7 Spirit R (FD)" is close in size to ddiaz-design's CC BY-NC-SA Spirit R Type A. It may be a re-upload of it; not proven.
   - realwallon's CC-BY "Mazda RX-7" looks like the best free lead (self-made, 361k faces).

## Appendix A: Mazda 1993 and 1994 technical data, transcribed by the US agent

Written by the `usdm-cdm` agent before it was stopped. I checked TD-2, 3, 4, 6, 8, 13 and 15 of the 1993 chapter against the scans (section 1), and they match. The 1994 chapter was not checked by hand. The "local copy" paths it mentions were in the stopped session's scratchpad and no longer exist; use the foxed.ca URLs.

### Transcription: Mazda RX-7 (US) Technical Data (TD) sections, 1993 and 1994

Transcribed by agent `usdm-cdm` on 2026-09-27 by viewing page renders (PNG) of the foxed.ca scans.
Values are copied exactly as printed, including apparent misprints (flagged with "[sic]").
Table layout is flattened to "Item | sub-item | value" rows. `{}` braces are as printed (Mazda's
secondary units). "..." inside a row means the scan prints dot leaders.

- 1993: "Mazda: 1993 RX-7 Workshop Manual, section TD Technical Data (hosted by foxed.ca)",
  https://www.foxed.ca/rx7manual/manuals/1993FSM/(TD)technical_data.pdf (local copy
  docs/foxed/1993FSM_TDtechnical_data.pdf, 17 PDF pages; page renders docs/foxed/ocr/1993FSM_TDtechnical_data-p0NN.png)
- 1994: "Mazda: 1994 RX-7 Workshop Manual, section TD Technical Data (hosted by foxed.ca)",
  https://www.foxed.ca/rx7manual/manuals/tech/94TD.pdf (local copy docs/foxed/tech_94TD.pdf, 18 PDF pages)

---

#### 1993 TD

##### PDF page 1 (section title page, no TD number printed)

TECHNICAL DATA (contents)

- ENGINE ... TD- 2
- LUBRICATING SYSTEM ... TD- 3
- COOLING SYSTEM ... TD- 4
- FUEL AND EMISSION CONTROL SYSTEMS ... TD- 4
- ENGINE ELECTRICAL SYSTEM ... TD- 5
- CLUTCH ... TD- 5
- MANUAL TRANSMISSION ... TD- 6
- AUTOMATIC TRANSMISSION ... TD- 8
- PROPELLER SHAFT ... TD-13
- FRONT AND REAR AXLES ... TD-13
- STEERING SYSTEM ... TD-13
- BRAKING SYSTEM ... TD-14
- WHEELS AND TIRES ... TD-15
- SUSPENSION ... TD-15
- BODY ELECTRICAL SYSTEM ... TD-16
- HEATING AND AIR CONDITIONING SYSTEMS ... TD-17
- STANDARD BOLT AND NUT TIGHTENING TORQUE ... TD-17

Code under the list: 37UTDX-001

(Note: this contents list has no vehicle dimensions or weight section.)

##### PDF page 2 = TD-2 — C. ENGINE

Column header: Item / Engine model | 13B (Turbo)

- Type | Rotary engine
- Displacement cc {cu in} | 654 × 2 {40.0 × 2}
- Number of rotors and arrangement | 2 rotors, longitudinal
- Combustion chamber type | Bathtub
- Compression ratio | 9.0: 1
- Port timing | Intake | Open | Primary | 45° BTDC
- Port timing | Intake | Open | Secondary | 32° BTDC
- Port timing | Intake | Close | Primary | 50° ABDC
- Port timing | Intake | Close | Secondary | 50° ABDC
- Port timing | Exhaust | Open | 75° BBDC
- Port timing | Exhaust | Close | 48° ATDC
- Compression pressure kPa {kgf/cm², psi}-rpm | Minimum | 686 {7.0, 100}-250
- Compression pressure | Maximum difference between chambers | 147 {1.5, 21}-250
- Side housing (Front, intermediate and rear housing) | Distortion limit mm {in} | 0.04 {0.002}
- Side housing | Side seal wear limit mm {in} | 0.10 {0.004}
- Side housing | Side seal wear limit, overlapping oil seal wear mm {in} | 0.01 {0.0004}
- Side housing | Side seal wear limit, outside oil seal wear mm {in} | 0.10 {0.004}
- Side housing | Oil seal wear limit mm {in} | 0.02 {0.0008}
- Rotor housing | Width mm {in} | 80 {3.1}
- Rotor housing | Maximum width difference mm {in} | 0.06 {0.0024}
- Rotor | Width (Apex) mm {in} | 79.675 {3.1368}
- Rotor | Clearance of side housing to rotor mm {in} | Standard | 0.12–0.21 {0.0047–0.0083}
- Rotor | Clearance of side housing to rotor | Min. | 0.10 {0.0039}
- Rotor | Diameter of corner seal groove mm {in} | 11.000–11.018 {0.4331–0.4338}
- Rotor | Width of side seal groove mm {in} | 0.714–0.739 {0.0281–0.0291}
- Rotor | Width of apex seal groove mm {in} | 1.995–2.012 {0.0785–0.0792}
- Apex seal and spring | Width mm {in} | 2.0 {0.079}
- Apex seal and spring | Height (upper and lower) mm {in} | Standard | 8.5 {0.33}
- Apex seal and spring | Height (upper and lower) | Min. | 7.5 {0.295}-Refer to ENGINE INSPECTION section
- Apex seal and spring | Clearance of apex seal and rotor groove mm {in} | Standard | 0.051–0.101 {0.002–0.004}
- Apex seal and spring | Clearance of apex seal and rotor groove | Max. | 0.15 {0.0059}
- Apex seal and spring | Spring free height mm {in} | Long | Standard | 6.25 {0.246}
- Apex seal and spring | Spring free height | Long | Min. | 3.5 {0.138}
- Apex seal and spring | Spring free height | Short | Standard | 3.3 {0.130}
- Side seal and spring | Thickness mm {in} | 0.661–0.686 {0.0260–0.0270}
- Side seal and spring | Clearance of side seal to rotor groove mm {in} | Standard | 0.028–0.078 {0.0011–0.0031}
- Side seal and spring | Clearance of side seal to rotor groove | Max. | 0.10 {0.0039}
- Side seal and spring | Height mm {in} | 3.0 {0.118}
- Side seal and spring | Protrusion min. mm {in} | 0.50 {0.020}
- Side seal and spring | Clearance of side seal to corner seal mm {in} | Standard | 0.05–0.15 {0.0020–0.0059}
- Side seal and spring | Clearance of side seal to corner seal | Max. | 0.40 {0.016}
- Corner seal and spring | Outer diameter mm {in} | 10.990–11.014 {0.4327–0.4336}
- Corner seal and spring | Height mm {in} | 7.0 {0.276}
- Corner seal and spring | Protrusion min. mm {in} | 0.50 {0.020}
- Rotor oil seal and spring | Height mm {in} | 5.6–5.8 {0.220–0.228}
- Rotor oil seal and spring | Oil seal lip width max. mm {in} | 0.50 {0.020}
- Rotor oil seal and spring | Protrusion min. mm {in} | 0.50 {0.020}
- Main bearing | Inner diameter mm {in} | 43.025–43.050 {1.6939–1.6949}
- Rotor bearing | Inner diameter mm {in} | 74.025–74.050 {2.9144–2.9153}

(Note: no rated power or torque is printed on TD-2.)

##### PDF page 3 = TD-3 — C. ENGINE (continued) and D. LUBRICATING SYSTEM

Column header: Item / Engine model | 13B (Turbo)

- Eccentric shaft | Runout max. mm {in} | 0.06 {0.0027}
- Eccentric shaft | End play mm {in} | Standard | 0.040–0.070 {0.0016–0.0028}
- Eccentric shaft | End play | Limit | 0.09 {0.0035}
- Eccentric shaft | Main journal diameter mm {in} | 43 {0.37} [sic, as printed]
- Eccentric shaft | Clearance of main journal mm {in} | Standard | 0.08–0.11 {0.0031–0.0043}...outside / 0.06–0.08 {0.0023–0.0031}...inside
- Eccentric shaft | Clearance of main journal | Limit | 0.13 {0.0051}...outside / 0.11 {0.0043}...inside
- Eccentric shaft | Rotor journal diameter mm {in} | 74 {2.9}
- Eccentric shaft | Clearance of rotor journal mm {in} | Standard | 0.060–0.080 {0.0023–0.0031}
- Eccentric shaft | Clearance of rotor journal | Limit | 0.10 {0.0039}
- Drive belt deflection at 98 N {10 kgf, 22 lbf} mm {in} | Alternator and Air pump | Used | 7.0–7.5 {0.28–0.29}
- Drive belt deflection | P/S pump and A/C compressor | Used | 4.5–5.0 {0.18–0.19}

D. LUBRICATING SYSTEM — Item / Engine model | 13B (Turbo)

- Lubrication system | Forced-fed
- Oil pump | Type | Trochoid
- Oil pump | Lobe clearance of outer rotor to inner rotor mm {in} | Standard | 0.03–0.12 {0.0012–0.0047}
- Oil pump | Lobe clearance | Max. | 0.15 {0.0059}
- Oil pump | Clearance of outer rotor to pump body mm {in} | Standard | 0.20–0.25 {0.0079–0.0098}
- Oil pump | Clearance of outer rotor to pump body | Max. | 0.30 {0.0118}
- Oil pump | End float mm {in} | Standard | 0.03–0.125 {0.0012–0.0049}
- Oil pump | End float | Max. | 0.15 {0.0059}
- Pressure control valve | Relief pressure kPa {kgf/cm², psi} | 1,080 {11.0, 156}
- Oil cooler | Type | Air-cooled, with bypass valve
- Oil cooler | Relief temperature °C {°F} | 60–65 {140–149} or below
- Oil cooler | Relief pressure dif. kPa {kgf/cm², psi} | 349 {3.56, 50} at 60°C {140°F}
- Oil cooler | Bypass valve protrusion mm {in} | 5 {0.2} or more
- Regulator valve | Relief pressure kPa {kgf/cm², psi} | 490 {5.0, 71}
- Oil filter | Type | Full flow, paper element
- Oil filter | Relief pressure dif. kPa {kgf/cm², psi} | 98 {1.0, 14}
- Eccentric shaft bypass valve | Relief temperature °C {°F} | 60 {140} or below
- Eccentric shaft bypass valve | Protrusion mm {in} | 6 {0.24} or more
- Engine oil | Capacity L {US qt, Imp qt} | Total (dry engine) | 4.9 {5.2, 4.3} *5.4 {5.7, 4.8}
- Engine oil | Capacity | Oil pan | 4.2 {4.4, 3.7}
- Engine oil | Capacity | Oil cooler | 0.85 {0.90, 0.75}
- Engine oil | Capacity | Oil filter | 0.19 {0.20, 0.17} (first line) / 0.17 {0.18, 0.15} (second line; no label printed for which filter)
- Engine oil | Classification | API Service SG Energy Conserving II (ECII)
- Engine oil | Above – 25°C {– 10°F} | 10W-30
- Engine oil | Below 0°C {32°F} | 5W-30

Footnote: * R1 model

##### PDF page 4 = TD-4 — E. COOLING SYSTEM and F. FUEL AND EMISSION CONTROL SYSTEMS

E. COOLING SYSTEM — Item / Engine model | 13B (Turbo)

- Cooling method | Water-cooled, forced circulation
- Water pump | Type | Centrifugal
- Water pump | Pulley ratio (Speed) | 1: 1.22
- Thermostat | Type | Wax, bottom bypass
- Thermostat | Opening temperature °C {°F} | 80.5–83.5 {177–182}
- Thermostat | Full-open temperature °C {°F} | 95 {203}
- Thermostat | Full-open lift min. mm {in} | 8–10 {0.31–0.39}
- Radiator | Type | Corrugated fin
- Coolant filler cap | Relief pressure kPa {kgf/cm², psi} | 115–145 {1.15–1.45, 16.4–20.6}
- Electric cooling fan | Type | Electrical
- Electric cooling fan | Capacity W | 160 × 2
- Electric cooling fan | Number of blades | No1: 5, No2: 4
- Electric cooling fan | Outer diameter mm {in} | 300 {11.8}
- Drive belt deflection at 98 N {10 kgf, 22 lbf} mm {in} | Alternator and air pump | Used | 7.0–7.5 {0.28–0.29}
- Coolant | Capacity L {US qt, Imp qt} | 8.8 {9.3, 7.7}
- Antifreeze solution | Protection / Mixture percentage % Water / Antifreeze / Specific gravity at 20°C {68°F}
  - Above – 16°C {3°F} | 65 | 35 | 1.054
  - Above – 26°C {– 15°F} | 55 | 45 | 1.066
  - Above – 40°C {–40°} | 45 | 55 | 1.078

F. FUEL AND EMISSION CONTROL SYSTEMS — Item | Specification

- Idle speed* rpm | 700–750
- Ignition timing | Leading ATDC | 5°
- Ignition timing | Trailing ATDC | 20°
- Air cleaner | Element type | Oil permeated
- Throttle body | Type | Horizontal draft (2 stage-3 barrel)
- Throttle body | Throat diameter | Primary mm {in} | 45 {1.772}
- Throttle body | Throat diameter | Secondary mm {in} | 50 {1.969} × 2
- Dashpot touch angle | 8
- Water thermovalve Operation (full open) temperature °C {°F} | 55–65 {131–149} or more
- Intercooler | Type | Air cooled
- Intercooler | Core size {w × h × t} mm {in} | 294 × 114 × 65 {11.575 × 4.4882 × 2.5591}
- Turbocharger | System type | Sequential twin turbocharged
- Turbocharger | Cooling method | Water + engine oil
- Turbocharger | Boost control actuator | Turbo precontrol + wastegate control
- Turbocharger | Boost control method | Solenoid valve (duty-controled) × 2 [sic]
- Fuel tank | Capacity L {US gal, Imp gal} | 76 {20.1, 16.7}
- Fuel filter | Type | Low-pressure | Nylon element
- Fuel filter | Type | High-pressure | Paper element
- Pressure regulator | Type | Diaphragm
- Pressure regulator | Regulated pressure kPa {kgf/cm², psi} | 250–260 {2.5–2.6, 35.6–37.0}

Footnote: * TEN terminal of diagnosis connector grounded

##### PDF page 5 = TD-5 — F. (continued), G. ENGINE ELECTRICAL SYSTEM, H. CLUTCH

F. (continued) — Item | Specification

- Fuel pump | Type | Impeller (In tank)
- Fuel pump | Output pressure kPa {kgf/cm², psi} | 490–740 {5.0–7.5, 71.1–106.7}
- Injector | Type | Side-feeding
- Injector | Injection volume | Primary cm³{cc, cu in}/min | 550 {550, 33.5}
- Injector | Injection volume | Secondary cm³{cc, cu in}/min | 850 {850, 51.8}
- Catalytic converter | Type | Pri-converter | Metal
- Catalytic converter | Type | Main converter | Monolithic
- Air pump | Capacity cm³{cc}/rev | 375 {375}
- Air pump | Output L/min | MT 140–200, AT 160–200
- Fuel | Specification | Unleaded premium (RON95 or higher)

G. ENGINE ELECTRICAL SYSTEM — Item / Transmission | MT | AT

- voltage V | 12, negative ground (both)
- Battery | Type and capacity (20-hour rate) | MT: 55D23L (60Ah) / 65D23L (55Ah)*1 | AT: 55D23L (60Ah) / 75D26L (65Ah)*1
- Ignition system | Spark timing (test connector grounded) | Leading : ATDC 5° (BTDC – 5°) / Trailing : ATDC 20° (BTDC – 20°) at idle (AT: P range)
- Ignition system | Spark advance | Electronic spark advance (ESA)
- Ignition system | Spark plug | Type | Leading | NGK : BUR7EQP*2, BUR6EQP, BUR7EQ, BUR6EQ
- Ignition system | Spark plug | Type | Trailing | NGK : BUR9EQP*2, BUR8EQP, BUR9EQ, BUR8EQ
- Ignition system | Spark plug | Plug gap mm {in} | 1.1–1.7 {0.044–0.066}
- Alternator | Output V-A | 12–100
- Alternator | Regulated voltage V | 14.1–14.7 (With temperature gradient characteristics)
- Alternator | Brush length | Standard mm {in} | 21.5 {0.846}
- Alternator | Brush length | Minimum mm {in} | 8.0 {0.315}
- Stater [sic] | Type | MT: Direct | AT: Reduction
- Stater | Output V-kW | MT: 12–1.2 | AT: 12–2.0
- Stater | Output (no load) | Voltage V | 11
- Stater | Output (no load) | Current A | Max 90
- Stater | Output (no load) | Speed rpm | MT: Min 3000 | AT: Min 2200
- Stater | Brush length | Standard mm {in} | MT: 17.5 {0.689} | AT: 18 {0.71}
- Stater | Brush length | Minimum mm {in} | MT: 12 {0.47} | AT: 11 {0.43}

Footnotes: *1 Cold area *2 Standard plug

H. CLUTCH — Item / Transmission | R15M-D (R5M-D)

- Clutch control | Hydraulic
- Clutch pedal | Type | Suspended
- Clutch pedal | Pedal ratio | 6.35
- Clutch pedal | Full stroke mm {in} | 135 {5.32}
- Clutch pedal | Height (with carpet) mm {in} | 165.5–177.0 {6.516–6.968}
- Clutch pedal | Free play mm {in} | 0.6–3.2 {0.02–0.13}
- Clutch pedal | Distance from carpet when clutch is fully disengaged mm {in} | 48 {1.9} min.

##### PDF page 6 = TD-6 — H. CLUTCH (continued) and J. MANUAL TRANSMISSION (R15M-D)

H. (continued) — Item / Transmission | R15M-D (R5M-D)

- Flywheel | Runout limit mm {in} | 0.2 {0.008}
- Clutch disc | Type | Single dry-plate
- Clutch disc | Runout limit mm {in} | 0.6 {0.024}
- Clutch disc | Wear limit mm {in} | 0.3 {0.012} from rivet head
- Clutch disc | Outer diameter mm {in} | 236 {9.29}
- Clutch disc | Inner diameter mm {in} | 160 {6.30}
- Clutch disc | Facing thickness mm {in} | Flywheel side | 3.5 {0.14}
- Clutch disc | Facing thickness | Pressure plate side | 3.5 {0.14}
- Clutch cover | Type | Diaphragm spring
- Clutch cover | Set load N {kgf, lbf} | 7.220 {736, 1619} [as printed, with a point]
- Clutch master cylinder | Inner diameter mm {in} | 15.87 {0.625}
- Clutch release cylinder | Inner diameter mm {in} | 19.05 {0.750}
- Clutch fluid | FMVSS116 DOT-3

J. MANUAL TRANSMISSION (R15M-D) — Item / Engine | 13B

- Specifications | Transmission type | R15M-D (R5M-D)
- Transmission control | Floor shift
- Synchronization mechanism | Forward : Synchromesh / Reverse : Synchromesh
- Gear ratio | 1st | 3.483
- Gear ratio | 2nd | 2.015
- Gear ratio | 3rd | 1.391
- Gear ratio | 4th | 1.000
- Gear ratio | 5th | 0.719
- Gear ratio | Reverse | 3.288
- Fianl [sic] gear ratio | 4.100
- Speedometer gear ratio (driven gear/drive gear) | 0.304 (23/7)
- Oil | Grade | API service GL-4 or GL-5
- Oil | Viscosity | All-season | SAE 75W-90
- Oil | Viscosity | Above 10°C {50°F} | SAE 80W-90
- Oil | Capacity L {US qt, Imp qt} | 2.5 {2.6, 2.2}
- Runout | Mainshaft mm {in} | 0.03 {0.0012}
- Clearance | Each gear inner diameter and mainshaft outer diameter mm {in} | 0.15 {0.006}
- Clearance | Each clutch hub sleeve gloove [sic] and shift fork mm {in} | Standard | 0.2–0.3 {0.008–0.012}
- Clearance | Each clutch hub sleeve groove and shift fork | Maximum | 0.5 {0.020.
- Clearance | Reverse idler gear and shaft mm {in} | Standard | 0.02–0.05 {0.0008–0.0020}
- Clearance | Reverse idler gear and shaft | Maximum | 0.15 {0.006}
- Clearance | Synchronizer ring (all) and flank surface of gear mm {in} | Standard | 1.5 {0.059}
- Clearance | Synchronizer ring (all) and flank surface of gear | Minimum | 0.8 {0.031}
- Clearance | Control rod lever and shift rod gate mm {in} | 0.8 {0.031}
- Thrust plam [sic] | Synchronizer key and synchronizer ring (4th) mm {in} | Standard | 0.66–2.0 {0.026–0.079}
- Thrust plam | Synchronizer key and synchronizer ring (4th) | Available thrust washer thck-nesses | 2.5, 3.0, 3.5 {0.098, 0.118, 0.138}

##### PDF page 7 = TD-7 — J. MANUAL TRANSMISSION (continued)

Item / Engine | 13B

- Thrust lock washer and C-washers (5th gear thrust play) mm {in} | Standard | 0.1–0.2 {0.004–0.008}
- Thrust lock washer and C-washers | Available thrust lock washer thick | 6.2, 6.3, 6.4, 6.5, 6.6, 6.7 {0.244, 0.248, 0.252, 0.256, 0.260, 0.264}
- C-washers and mainshaft groove mm {in} | Standard | 0–0.1 {0–0.004}
- C-washers and mainshaft groove | Available C-washer thicknesses | 2.9, 3.0, 3.1, 3.2 {0.114, 0.118, 0.122, 0.126}
- Clutch housing and main drive gear bearing mm {in} | Standard | 0–0.1 {0–0.004}
- Clutch housing and main drive gear bearing | Available adjust shim thicknesses | 0.3, 0.4, 0.5, 0.6, 0.7 {0.012, 0.016, 0.020, 0.024, 0.028}
- Mainshaft front bearing mm {in} | Standard | 0–0.05 {0–0.002}
- Mainshaft front bearing | Available adjust shim thicknesses | 0.1, 0.3 {0.004, 0.012}
- Countershaft front bearing mm {in} | Bearing height | 0.9–1.0 {0.035–0.039.
- Countershaft front bearing | Available adjust shim thicknesses | 0.1, 0.3 {0.004, 0.012}
- Reference | Detent ball spring | Free length mm {in} | 22.5 {0.886}
- Reference | 5th/reverse retaining spring | Free length mm {in} | 73.00 {2.874}
- Reference | Select lock spindle spring | Free length mm {in} | 43.25 {1.703}
- Synchronizer key dimensions (diagram, mm {in}) | 1st and 2nd | ① 18.00 {0.709}, ② 5.45 {0.215} ③ 6.00 {0.236}
- Synchronizer key dimensions | 3rd, 4th 5th and Reverse | ① 17.00 {0.669} ② 4.25 {0.167} ③ 5.00 {0.197}

##### PDF page 8 = TD-8 — K. AUTOMATIC TRANSMISSION

Item / Transmission | RB4A-EL

- Gear ratio | 1st | 3.027
- Gear ratio | 2nd | 1.619
- Gear ratio | 3rd | 1.000
- Gear ratio | O/D | 0.694
- Gear ratio | Reverse | 2.272
- Final gear ratio | 3.909
- Automatic transmission fluid (ATF) | Type | Dexron®II or M-III
- ATF | Capacity L {US qt, Imp qt} | 8.6 {9.1, 7.6}
- Torque converter | Stall torque ratio | 2.200
- Number of drive plates / driven plates | Reverse clutch | 2/2
- Number of drive plates / driven plates | High clutch | 4/7
- Number of drive plates / driven plates | Forward clutch | 6/6
- Number of drive plates / driven plates | Overrunning clutch | 3/5
- Number of drive plates / driven plates | Low and reverse brake | 7/7
- Band servo mm {in} | Servo piston outer dia. / inner dia. | 80.0/50.0 {3.15/1.97}
- Band servo | O/D servo piston outer dia. | 72.0 {2.83}
- Mechanical system test | Engine stall speed rpm | D, S, L, R range | 3,000–3,300
- Time lag sec. | N → D range | Approx. below 1.0
- Time lag sec. | N → R range | Approx. below 1.2
- Line pressure kPa {kgf/cm², psi} | D range | Idle | 500–520 {5.0–5.4, 72–76}
- Line pressure | D range | Stall | 1,200–1,270 {12.2–13.0, 174–184}
- Line pressure | S range | Idle | 500–520 {5.0–5.4, 72–76}
- Line pressure | S range | Stall | 1,200–1,270 {12.2–13.0, 174–184}
- Line pressure | L range | Idle | 500–520 {5.0–5.4, 72–76}
- Line pressure | L range | Stall | 1,200–1,270 {12.2–13.0, 174–184}
- Line pressure | R range | Idle | 620–650 {6.3–6.7, 90–95}
- Line pressure | R range | Stall | 1,510–1,570 {15.3–16.1, 218–228}
- Shift point km/h {MPH} | POWER | D range | Fully open | D1 → D2 | 50–56 {31–35}
- Shift point | POWER | D range | Fully open | D2 → D3 | 103–111 {64–69}
- Shift point | POWER | D range | Fully open | D3 → O/D | 178–188 {111–117}
- Shift point | POWER | D range | Half throttle | D1 → D2 | 35–41 {22–25}
- Shift point | POWER | D range | Half throttle | D2 → D3 | 81–93 {50–58}
- Shift point | POWER | D range | Half throttle | D3 → O/D | 126–144 {78–99} [sic, as printed; checked on a 300 dpi crop]
- Shift point | POWER | D range | Half throttle | Lockup ON (D3 ) | 94–106 {58–66} (*81–93 {50–58})
- Shift point | POWER | D range | Half throttle | Lockup ON (O/D) | 174–192 {108–119} (*126–144 {78–89})
- Shift point | POWER | D range | Fully closed | O/D → D3 | 39–45 {24–28}
- Shift point | POWER | D range | Fully closed | D3 → D2 | 13–19 {8–12}
- Shift point | POWER | D range | Fully closed | D2 → D1 | 5–11 {3–7}
- Shift point | POWER | D range | Kickdown (Fully open) | O/D → D3 | 142–152 {88–94}
- Shift point | POWER | D range | Kickdown (Fully open) | D3 → D2 | 91–99 {57–62}
- Shift point | POWER | D range | Kickdown (Fully open) | D2 → D1 | 38–44 {24–27}

Caution

- Lockup indicates complete lockup.
- - mark indicates lockup points when the engine coolant temperature is above 115°C {239°F}.

##### PDF page 9 = TD-9 — K. AUTOMATIC TRANSMISSION (continued): shift points km/h {MPH}

Item / Transmission | RB4A-EL
NORMAL, D range (A/C ON):

- Fully open | D1 → D2 | 50–56 {31–35}
- Fully open | D2 → D3 | 103–111 {64–69}
- Fully open | D3 → O/D | 178–188 {111–117}
- Half throttle | D1 → D2 | 32–38 {20–24}
- Half throttle | D2 → D3 | 80–92 {50–57}
- Half throttle | D3 → O/D | 126–144 {78–89}
- Half throttle | Lockup ON (D3 ) | 94–106 {58–66} (* 80–92 {50–57})
- Half throttle | Lockup ON (O/D) | 174–192 {108–119} (*126–144 {78–89})
- Fully closed | O/D → D3 | 39–45 {24–28}
- Fully closed | D3 → D2 | 13–19 {8–12}
- Fully closed | D2 → D1 | 5–11 {3–7}
- Kickdown (Fully open) | O/D → D3 | 142–152 {88–94}
- Kickdown (Fully open) | D3 → D2 | 91–99 {57–62}
- Kickdown (Fully open) | D2 → D1 | 38–44 {24–27}
  NORMAL, D range (A/C OFF):
- Fully open | D1 → D2 | 50–56 {31–35}
- Fully open | D2 → D3 | 103–111 {64–69}
- Fully open | D3 → O/D | 178–188 {111–117}
- Half throttle | D1 → D2 | 32–38 {20–24}
- Half throttle | D2 → D3 | 80–92 {50–57}
- Half throttle | D3 → O/D | 126–144 {78–89}
- Half throttle | Lockup ON (D3 ) | 94–106 {58–66} (*80–92 {50–57})
- Half throttle | Lockup ON (O/D) | 174–192 {108–119} (*126–144 {78–89})
- Fully closed | O/D → D3 | 35–41 {22–25}
- Fully closed | D3 → D2 | 13–19 {8–12}
- Fully closed | D2 → D1 | 5–11 {3–7}
- Kickdown (Fully open) | O/D → D3 | 142–152 {88–94}
- Kickdown (Fully open) | D3 → D2 | 91–99 {57–62}
- Kickdown (Fully open) | D2 → D1 | 38–44 {24–27}
  HOLD, D range:
- – | O/D → D3 | 180–186 {112–116}
- – | D3 → D2 | 7–13 {4–8}
- – | D2 → D3 | 15–25 {9–16}
- – | Lockup ON (D3 ) | 94–106 {58–66} (*39–51 {24–32})
  NORMAL, S range:
- Fully open | S1 → S2 | 50–56 {31–35}
- Fully open | S2 → S3 | 103–111 {64–69}
- Half throttle | S1 → S2 | 35–41 {22–25}
- Half throttle | S2 → S3 | 81–93 {50–58}
- Half throttle | Lockup ON (S3 ) | 94–106 {58–66} (*81–93 {50–58})
- Fully closed | S3 → S2 | 13–19 {8–12}
- Fully closed | S2 → S1 | 5–11 {3–7}
- Kickdown (Fully open) | S3 → S2 | 91–99 {57–62}
- Kickdown (Fully open) | S2 → S1 | 38–44 {24–27}
  HOLD, S range:
- – | S3 → S2 | 112–118 {70–73}

Caution

- Lockup indicates complete lockup.
- - mark indicates lockup points when the engine coolant temperature is above 115°C {239°F}.

##### PDF page 10 = TD-10 — K. AUTOMATIC TRANSMISSION (continued)

Item / Transmission | RB4A-EL
L range shift points km/h {MPH}:

- NORMAL | L range | Fully open | L1 → L2 | 50–56 {31–35}
- NORMAL | L range | Half throttle | L1 → L2 | 35–41 {22–25}
- NORMAL | L range | Fully closed | L2 → L1 | 5–11 {3–7}
- NORMAL | L range | Kickdown (Fully open) | L2 → L1 | 38–44 {24–27}
- HOLD | L range | – | L2 → L1 | 45–51 {28–32}
  Control valve body (Upper control valve body), mm {in}: Outer diameter / Free length
- Torque converter relief valve spring | 9.2 {0.362} / 38.3 {1.508}
- Pressure regulator valve spring | 14.0 {0.551} / 29.0 {1.142}
- Pressure modifier valve spring* | (A) 6.8 {0.268} (B) 6.9 {0.272} (C) 6.9 {0.272} / (A) 31.95 {1.258} (B) 32.6 {1.283} (C) 32.8 {1.291}
- Accumulator control valve spring | 10.5 {0.413} / 17.0 {0.669}
- Shuttle shift valve D spring | 6.0 {0.236} / 26.5 {1.043}
- Shift valve B spring | 7.0 {0.276} / 25.0 {0.984}
- 4-2 sequence valve spring | 6.95 {0.274} / 29.1 {1.146}
- Shift valve A spring | 7.0 {0.276} / 25.0 {0.984}
- 4-2 relay valve spring | 6.95 {0.274} / 29.1 {1.146}
- Overrunning clutch control valve spring | 7.0 {0.276} / 23.6 {0.929}
- Overrunning clutch reducing valve spring | 7.0 {0.276} / 32.5 {1.280}
- Pilot valve spring | 9.1 {0.358} / 25.7 {1.012}
- Lockup control valve spring | 4.7 {0.185} / 23.4 {0.921}
- Lockup modifier valve spring | 4.2 {0.165} / 21.5 {0.846}
  (Lower control valve body), mm {in}: Outer diameter / Free length
- Modifier accumulator valve spring | 9.8 {0.39} / 30.5 {1.20}
- 1st reducing valve spring | 6.8 {0.27} / 25.4 {1.00}
- Servo charger valve spring | 6.5 {0.26} / 33.2 {1.31}

Footnote: *: Either A, B, or C type spring is installed at shipment. Only A type spring is available for replacement.

##### PDF pages 11-12 = TD-11, TD-12 — NOT TRANSCRIBED

Automatic transmission internals only (accumulator springs, oil pump clearances, clutch/brake
clearances, retaining plate sizes, end play). Not read in detail because no trim-level field
comes from them; only the OCR text was skimmed to confirm the subject.

##### PDF page 13 = TD-13 — L. PROPELLER SHAFT, M. FRONT AND REAR AXLES, N. STEERING SYSTEM

L. PROPELLER SHAFT — Item / Transmission model | R15M-D (R5M·D)

- Length mm {in} | 863 {33.98}
- Outer diameter mm {in} | 75 {3.0}
- Max. permissible runout mm {in} | 0.4 {0.02}
  (Note: only the manual-transmission column is printed.)

M. FRONT AND REAR AXLES — Item | Specifications

- Drive shaft | Type | Wheel side | BJ (bell joint)
- Drive shaft | Type | Differential side | TJ (Tripod joint)
- Drive shaft | Outer diameter of large boot end mm {in} | Wheel side | 105.3 {4.146}
- Drive shaft | Outer diameter of large boot end | Differential side | 100.5 {3.957}
- Drive shaft | Grease amount g {oz} | Wheel side | 100–120 {3.53–4.23}
- Drive shaft | Grease amount | Differential side | 170–190 {6.01–6.70}
- Drive shaft | Shaft length* mm {in} | 791.2–801.2 {31.15–31.54}
- Front axle | Bearing play axil [sic] direction mm {in} | 0.05 {0.002} max.
- Rear axle | Bearing play axil direction mm {in} | 0.05 {0.002} max.
- Differential | Backlash (Ring gear and drive pinion) mm {in} | 0.09–0.11 {0.0035–0.0043}
- Differential | Drive pinion preload (without oil seal) N·m {kgf·cm, in·lbf} | 1.3–1.7 {13–18, 12–15}
- Differential oil | Grade | API Service GL–4 or 5
- Differential oil | Viscosity | Above –18°C {0°F} : SAE 90 / Below –18°C {0°F} : SAE 80
- Differential oil | Capacity L {US qt, Imp qt} | 1.30 {1.38, 1.14}
  Footnote: * Before measuring the drive shaft length, lift the boot to equalize the pressure within it.
  (Note: no differential type (Torsen/LSD) and no final drive are printed in this table.)

N. STEERING SYSTEM — Item | Specifications

- Steering wheel | Outer diameter mm {in} | 380 {15.0}
- Steering wheel | Free play mm {in} | 0–30 {0–1.18}
- Steering wheel | Wheel effort N {kgf, lbf} | 30–38 {3.0–3.9, 6.6–8.5}
- Steering wheel | Lock-to-lock turns | 2.9
- Steering shaft | Shaft type | Collapsible
- Steering shaft | Joint type | 2-cross joint
- Power steering system | Gear type | Rack and pinion
- Power steering system | Gear ratio | ∞ (infinite)
- Power steering system | Rack stroke mm {in} | 160 {6.30}
- Power steering system | Power steering fluid | ATF DEXRON®II or M-III
- Power steering system | Fluid capacity L {US qt, Imp qt} | 0.96 {1.01, 0.84}
- Power steering system | Fluid pressure kPa {kgf/cm², psi} | 7620–8350 {77.7–85.2, 1110–1210}

##### PDF page 14 = TD-14 — P. BRAKING SYSTEM

Item | Specifications

- Brake pedal | Type | Suspended
- Brake pedal | Height (with carpet) mm {in} | 164.5–176.0 {6.48–6.92}
- Brake pedal | Free play mm {in} | 3–8 {0.12–0.31}
- Brake pedal | Reserve travel (When depressed at 590 N {60 kgf, 132 lbf}) (without carpet) mm {in} | 100 {3.94} min.
- Master cylinder | Type | Tandem (with level sensor) / Portless & recessed type
- Master cylinder | Push rod-to-piston clearance mm {in} | Power brake unit at 66.7 kPa {500 mmHg, 19.7 inHg} | 0.1–0.4 {0.004–0.015}
- Front brake | Type | Ventilated disc
- Front brake | Disc pad thickness | Standard mm {in} | Outer | 10.3 {0.41}
- Front brake | Disc pad thickness | Standard | Inner | 9.3 {0.37}
- Front brake | Disc pad thickness | Limit mm {in} | 1.0 {0.04}
- Front brake | Disc plate | Runout limit mm {in} | 0.1 { 0.004}
- Front brake | Disc plate | Thickness | Standard mm {in} | 22.0 {0.87}
- Front brake | Disc plate | Thickness | Limit mm {in} | 20.0 {0.79}
- Rear brake | Type | Ventilated disc
- Rear brake | Disc pad thickness | Standard mm {in} | 8.0 {0.31}
- Rear brake | Disc pad thickness | Limit mm {in} | 1.0 {0.04}
- Rear brake | Disc plate | Runout limit mm {in} | 0.1 {0.004}
- Rear brake | Disc plate | Thickness | Standard mm {in} | 20.0 {0.79}
- Rear brake | Disc plate | Thickness | Limit mm {in} | 18.0{0.71}
- Power brake unit | Type | Tandem diaphragm
- Power brake unit | Fluid pressure when pedal depressed at 200 N {20 kgf, 44 lbf} kPa {kgf/cm²} | Power brake unit at 0 kPa {0 mmHg, 0 inHg} | 590 {6} min.
- Power brake unit | Fluid pressure ... | Power brake unit at 66.7 kPa {500 mmHg, 19.7 inHg} | 7750 {79} min.
- Rear wheel hydraulic control system | Type | Proportioning bypass valve
- Rear wheel hydraulic control system | Switching point kPa {kgf/cm², psi} | 3900 {40.0, 570}
- Parking brake | Type | Mechanical, two-rear-wheel control
- Parking brake | Operation system | Hand lever type
- Parking brake | Parking lever stroke (When pulled at 200 N {20 kgf, 44 lbf}) notches | 7–10
- Brake fluid | Type | FMVSS 116 DOT-3
- Anti-lock brake system (ABS) | Type | 4-sensor, 3-channel system
- Anti-lock brake system (ABS) | Resistance between terminals of wheel speed sensor kΩ | 0.8–1.2
  (Note: no disc diameters are printed on this page.)

##### PDF page 15 = TD-15 — Q, WHEELS AND TIRES and R. SUSPENSION

Q, WHEELS AND TIRES [heading printed with a comma] — Item | Specifications

- Standard tire | Tires | Size | P225/50R16 91V / P225/50 ZR 16 (two lines, no trim named)
- Standard tire | Tires | Air pressure kPa {kgf/cm², psi} | 220 {2.2, 32}
- Standard tire | Tires | Remaining tread | Ordinary tires mm {in} | 1.6 {0.063} min.
- Standard tire | Tires | Remaining tread | Snow tires % | 50 min.
- Standard tire | Wheels | Size | 16 × 8JJ
- Standard tire | Wheels | Material | Aluminum alloy
- Standard tire | Wheels | Offset mm {in} | 50.0 {1.97}
- Standard tire | Wheels | Pitch circle diameter mm {in} | 114.3 {4.50}
- Temporary spare tire | Tires | Size | T135/70D16
- Temporary spare tire | Tires | Air pressure kPa {kgf/cm², psi} | 415 {4.2, 60}
- Temporary spare tire | Wheels | Size | 16 × 4T
- Temporary spare tire | Wheels | Material | Aluminum alloy
- Temporary spare tire | Wheels | Offset mm {in} | 40.0 {1.57}
- Temporary spare tire | Wheels | Pitch circle diameter mm {in} | 114.3 {4.50}
- Wheel and tire | Runout limit mm {in} | Horizontal | 2.0 {0.08}
- Wheel and tire | Runout limit | Vertical | 1.5 {0.06}
- Wheel and tire | Maximum unbalance (at rim edge) g {oz} | 8 {0.28}
  (Note: one size is printed for all four wheels; no front/rear split.)

R. SUSPENSION — Item | Specifications

- Front suspension | Suspension type | Double-wishbone
- Front suspension | Coil spring | Identification mark color | Blue
- Front suspension | Coil spring | Wire diameter mm {in} | 12.4 {0.49}
- Front suspension | Coil spring | Coil center diameter mm {in} | 104.9 {4.130}
- Front suspension | Coil spring | Free length mm {in} | 272.9 {10.74}
- Front suspension | Coil spring | Active coil number | 4.27
- Front suspension | Shock absorber type | Cylindrical, double-acting, low-pressure gas charged
- Front suspension | Stabilizer | Type | Torsion bar, hollow type
- Front suspension | Stabilizer | Diameter mm {in} | 28.6 {1.13}
- Front wheel alignment (Unladen*1) | Total toe-in mm {in} | 1 ± 3 {0.04 ± 0.11}
- Front wheel alignment | Toe-in (per side) degree | 0°03′ ± 08′
- Front wheel alignment | Maximum steering angle degree | Inner | 36° ± 2°
- Front wheel alignment | Maximum steering angle | Outer | 32° ± 2°
- Front wheel alignment | Camber angle*2 degree | 0°06′ ± 45′
- Front wheel alignment | Caster angle*2 degree | 6°05′ ± 1°
- Front wheel alignment | Kingpin angle degree | 13° 55′
- Rear suspension | Suspension type | Double-wishbone
- Rear suspension | Coil spring | Identification mark color | White
- Rear suspension | Coil spring | Wire diameter mm {in} | 12.2 {0.48}
- Rear suspension | Coil spring | Coil center diameter mm {in} | 114.7 {4.516}
- Rear suspension | Coil spring | Free length mm {in} | 299.0 {11.77}
- Rear suspension | Coil spring | Active coil number | 4.21
- Rear suspension | Shock absorber type | Cylindrical, double-acting, low-pressure gas charged
  (Note: a single spring specification is printed; no separate R1 spring is listed on this page.)

##### PDF page 16 = TD-16 — R. SUSPENSION (continued), T. BODY ELECTRICAL SYSTEM

Item | Specifications

- Stabilizer | Type | Torsion bar, hollow type
- Stabilizer | Diameter mm {in} | 17.3 {0.68}
- Rear wheel alignment (Unladen*1) | Total toe-in mm {in} | 2 ± 3 {0.08 ± 0.11}
- Rear wheel alignment | Toe-in (per side) degree | 0° 05′ ± 08′
- Rear wheel alignment | Camber angle*2 degree | –1° 13′ ± 45′
- Rear wheel alignment | Thrust angle degree | 0° ± 06′
  Footnotes: *1 Fuel tank full; radiator coolant and engine oil at specified levels ; spare tire, jack, and tools in designated positions.
  *2 Difference between left and right must not exceed 1°.

T. BODY ELECTRICAL SYSTEM — Item | Specification (W) (BULB TRADE NO.)

- Front exterior lights | Headlight (Halogen) | 60/55 (HB2)
- Front exterior lights | Parking light | 5
- Front exterior lights | Front turn signal | 27 {3497}
- Front exterior lights | Front fog light | 35
- Front exterior lights | Daytime running light (For Canada) | 27 {3496}
- Front exterior lights | Front side marker light | 4.9 {168}
- Rear exterior lights | Back-up light | 27 {1156}
- Rear exterior lights | License plate light | 5
- Rear exterior lights | Stop / Tail light | 27/8 {1157}
- Rear exterior lights | High-mount stoplight | 18.4 {921}
- Rear exterior lights | Rear turn signal light | 27 {1156}
- Rear exterior lights | Rear side marker light | 3.8 {194}
  Item | Specification (W) and Bulb trade number
- Interior lights | Interior lamp | 5
- Interior lights | Glove box lamp | 3.4
- Interior lights | Cargo compartment lamp | 8
- Warning lights | Seat belt / Anti-lock / Alternator / Brake | 1.4
- Warning lights | Engine oil level / Fuel level / Coolant level | 3
- Warning lights | Air-bag system | 2
- Indicator | Shift up | 2
- Indicator | High beam / Turn signal / Security lamp / Check / Rear window defroster / Cruise / Hold | 1.4

##### PDF page 17 = TD-17 — NOT TRANSCRIBED

Illumination bulbs, U. HEATING AND AIR CONDITIONING SYSTEMS, STANDARD BOLT AND NUT TIGHTENING
TORQUE (subject confirmed from the OCR text only; no trim-level field).

---

#### 1994 TD (tech_94TD.pdf; PDF page 1 is a scanner's cover sheet, PDF pages 2-18 = TD-1 ... TD-17)

##### PDF page 1 (not a Mazda page)

Cover sheet added by the scanner: "This file is available for free download at http://www.iluvmyrx7.com
... Many thanks to Lenny Terris for scanning this." (no technical data)

##### PDF page 2 (section title page)

TECHNICAL DATA (contents): ENGINE ... TD- 2; LUBRICATING SYSTEM ... TD- 3; COOLING SYSTEM ... TD- 4;
FUEL AND EMISSION CONTROL SYSTEMS ... TD- 4; ENGINE ELECTRICAL SYSTEM ... TD- 5; CLUTCH ... TD- 5;
MANUAL TRANSMISSION ... TD- 6; AUTOMATIC TRANSMISSION ... TD- 8; PROPELLER SHAFT ... TD-13;
FRONT AND REAR AXLES ... TD-13; STEERING SYSTEM ... TD-13; BRAKING SYSTEM ... TD-14;
WHEELS AND TIRES ... TD-15; SUSPENSION ... TD-15; BODY ELECTRICAL SYSTEM ... TD-16;
HEATER AND AIR CONDITIONER SYSTEMS ... TD-17; STANDARD BOLT AND NUT TIGHTENING TORQUE ... TD-17
(No part code printed on this page, unlike 1993's 37UTDX-001.)

##### PDF page 3 = TD-2 — C. ENGINE

Item / Engine | 13B (Turbo)

- Type | Rotary engine
- Displacement ml {cc, cu in} | 654 {654, 40.0} × 2
- Number of rotors and arrangement | 2 rotors, longitudinal
- Combustion chamber type | Bathtub
- Compression ratio | 9.0: 1
- Port timing | Intake | Open | Primary | 45° BTDC
- Port timing | Intake | Open | Secondary | 32° BTDC
- Port timing | Intake | Close | Primary | 50° ABDC
- Port timing | Intake | Close | Secondary | 50° ABDC
- Port timing | Exhaust | Open | 75° BBDC
- Port timing | Exhaust | Close | 48° ATDC
- Compression pressure kPa {kgf/cm², psi}-rpm | Minimum | 686 {7.0, 100}-250
- Compression pressure | Maximum difference between chambers | 147 {1.5, 21}-250
- Side housing (Front, intermediate and rear housing) | Distortion limit mm {in} | 0.04 {0.002}
- Side housing | Side seal wear limit mm {in} | 0.10 {0.004}
- Side housing | Side seal wear limit, overlapping oil seal wear mm {in} | 0.01 {0.0004}
- Side housing | Side seal wear limit, outside oil seal wear mm {in} | 0.10 {0.004}
- Side housing | Oil seal wear limit mm {in} | 0.02 {0.0008}
- Rotor housing | Width mm {in} | 80 {3.1}
- Rotor housing | Maximum width difference mm {in} | 0.06 {0.0024}
- Rotor | Width (Apex) mm {in} | 79.675 {3.1368}
- Rotor | Clearance of side housing to rotor mm {in} | Standard | 0.12–0.21 {0.0048–0.0082}
- Rotor | Clearance of side housing to rotor | Min. | 0.10 {0.0039}
- Rotor | Diameter of corner seal groove mm {in} | 11.000–11.018 {0.4331–0.4338}
- Rotor | Width of side seal groove mm {in} | 0.714–0.739 {0.0281–0.0291}
- Rotor | Width of apex seal groove mm {in} | 1.995–2.012 {0.0785–0.0792}
- Apex seal and spring | Width mm {in} | 2.0 {0.079}
- Apex seal and spring | Height (upper and lower) mm {in} | Standard | 8.5 {0.33}
- Apex seal and spring | Height (upper and lower) | Min. | 6.5 {0.256} (1993 printed 7.5 {0.295}-Refer to ENGINE INSPECTION section)
- Apex seal and spring | Clearance of apex seal and rotor groove mm {in} | Standard | 0.051–0.101 {0.002–0.039} [sic, as printed]
- Apex seal and spring | Clearance of apex seal and rotor groove | Max. | 0.15 {0.0059}
- Apex seal and spring | Spring free height mm {in} | Long | Standard | 6.25 {0.246}
- Apex seal and spring | Spring free height | Long | Min. | 3.5 {0.138}
- Apex seal and spring | Spring free height | Short | Standard | 3.3 {0.130}
- Side seal and spring | Thickness mm {in} | 0.661–0.686 {0.0260–0.0270}
- Side seal and spring | Clearance of side seal to rotor groove mm {in} | Standard | 0.028–0.078 {0.0011–0.0030}
- Side seal and spring | Clearance of side seal to rotor groove | Max. | 0.10 {0.0039}
- Side seal and spring | Height mm {in} | 3.0 {0.118}
- Side seal and spring | Protrusion min. mm {in} | 0.50 {0.020}
- Side seal and spring | Clearance of side seal to corner seal mm {in} | Standard | 0.05–0.15 {0.0020–0.0059}
- Side seal and spring | Clearance of side seal to corner seal | Max. | 0.40 {0.016}
- Corner seal and spring | Outer diameter mm {in} | 10.990–11.014 {0.4327–0.4336}
- Corner seal and spring | Height mm {in} | 7.0 {0.276}
- Corner seal and spring | Protrusion min. mm {in} | 0.50 {0.020}
- Rotor oil seal and spring | Height mm {in} | 5.6–5.8 {0.220–0.228}
- Rotor oil seal and spring | Oil seal lip width max. mm {in} | 0.50 {0.020}
- Rotor oil seal and spring | Protrusion min. mm {in} | 0.50 {0.020}
- Main bearing | Inner diameter mm {in} | 43.025–43.050 {1.6939–1.6949}
- Rotor bearing | Inner diameter mm {in} | 74.025–74.050 {2.9144–2.9153}

##### PDF page 4 = TD-3 — C. ENGINE (continued), D. LUBRICATING SYSTEM

Item / Engine | 13B (Turbo)

- Eccentric shaft | Runout max. mm {in} | 0.06 {0.0024}
- Eccentric shaft | End play mm {in} | Standard | 0.040–0.070 {0.0016–0.0027}
- Eccentric shaft | End play | Limit | 0.09 {0.0035}
- Eccentric shaft | Main journal diameter mm {in} | 43 {0.37} [sic, as printed]
- Eccentric shaft | Clearance of main journal mm {in} | Standard | 0.08–0.11 {0.0032–0.0043} . . . outside / 0.06–0.08 {0.0024–0.0031} . . . inside
- Eccentric shaft | Clearance of main journal | Limit | 0.13 {0.0051} . . outside / 0.11 {0.0043} . . . inside
- Eccentric shaft | Rotor journal diameter mm {in} | 74 {2.9}
- Eccentric shaft | Clearance of rotor journal mm {in} | Standard | 0.060–0.080 {0.0024–0.0031}
- Eccentric shaft | Clearance of rotor journal | Limit | 0.10 {0.0039}
- Drive belt deflection at 98 N {10 kgf, 22 lbf} mm {in} | Alternator and Air pump | Used | 7.0–7.5 {0.28–0.29}
- Drive belt deflection | P/S pump and A/C compressor | Used | 4.5–5.0 {0.18–0.19}

D. LUBRICATING SYSTEM — Item / Engine | 13B (Turbo)

- Lubrication system | Forced-fed
- Oil pump | Type | Trochoid
- Oil pump | Lobe clearance of outer rotor to inner rotor mm {in} | Standard | 0.03–0.12 {0.0012–0.0047}
- Oil pump | Lobe clearance | Max. | 0.15 {0.0059}
- Oil pump | Clearance of outer rotor to pump body mm {in} | Standard | 0.20–0.25 {0.0079–0.0098}
- Oil pump | Clearance of outer rotor to pump body | Max. | 0.30 {0.0118}
- Oil pump | End float mm {in} | Standard | 0.03–0.125 {0.0012–0.0049}
- Oil pump | End float | Max. | 0.15 {0.0059}
- Pressure control valve | Relief pressure kPa {kgf/cm², psi} | 1,080 {11.0, 156}
- Oil cooler | Type | Air-cooled, with bypass valve
- Oil cooler | Relief temperature °C {°F} | 60–65 {140–149} or below
- Oil cooler | Relief pressure dif. kPa {kgf/cm², psi} | 349 {3.56, 50} at 60°C {140°F}
- Oil cooler | Bypass valve protrusion mm {in} | 6 {0.24} min. (1993 printed 5 {0.2} or more)
- Regulator valve | Relief pressure kPa {kgf/cm², psi} | 490 {5.0, 71}
- Oil filter | Type | Full flow, paper element
- Oil filter | Relief pressure dif. kPa {kgf/cm², psi} | 98 {1.0, 14}
- Eccentric shaft bypass valve | Relief temperature °C {°F} | 60 {140} or below
- Eccentric shaft bypass valve | Protrusion mm {in} | 6 {0.24} or more
- Engine oil | Total (Dry engine) L {US qt, Imp qt} | 4.9 {5.2, 4.3} *5.4 {5.7, 4.8}
- Engine oil | Oil replacement L {US qt, Imp qt} | 3.6 {3.8, 3.2}
- Engine oil | Oil replacement (with oil filter) L {US qt, Imp qt} | 3.8 {4.0, 3.3}
- Engine oil | Oil filter L {US qt, Imp qt} | Factory installed | 0.19 {0.20, 0.17}
- Engine oil | Oil filter | Service part | 0.17 {0.18, 0.15}
- Engine oil | Grade | API Service SG, SH (EC II) ILSAC (Mineral oil only)
- Engine oil | Above –25°C {–10°F} | 10W-30
- Engine oil | Below 0°C {32°F} | 5W-30

Footnote: * R1 model (as printed in the 1994 manual, although the 1994 grade is sold as R2)

##### PDF page 5 = TD-4 — E. COOLING SYSTEM and F. FUEL AND EMISSION CONTROL SYSTEMS

E. COOLING SYSTEM — Item / Engine | 13B (Turbo)

- Cooling method | Water-cooled, forced circulation
- Water pump | Type | Centrifugal
- Water pump | Pulley ratio (Speed) | 1: 1.22
- Thermostat | Type | Wax, bottom bypass
- Thermostat | Opening temperature °C {°F} | 80.5–83.5 {177–182}
- Thermostat | Full-open temperature °C {°F} | 95 {203}
- Thermostat | Full-open lift min. mm {in} | 8–10 {0.31–0.39}
- Radiator | Type | Corrugated fin
- Coolant filler cap | Relief pressure kPa {kgf/cm², psi} | 115–145 {1.15–1.45, 16.4–20.6}
- Coolant fan [1993: "Electric cooling fan"] | Type | Electrical
- Coolant fan | Capacity W | 160 × 2
- Coolant fan | Number of blades | No1: 5, No2: 4
- Coolant fan | Outer diameter mm {in} | 300 {11.8}
- Drive belt deflection at 98 N {10 kgf, 22 lbf} mm {in} | Alternator and air pump | Used | 7.0–7.5 {0.28–0.29}
- Coolant | Capacity L {US qt, Imp qt} | 8.8 {9.3, 7.7}
- Antifreeze solution | Protection / Mixture percentage % Water / Antifreeze / Specific gravity at 20°C {68°F}
  - Above –16°C {3°F} | 65 | 35 | 1.054
  - Above –26°C {–15°F} | 55 | 45 | 1.066
  - Above –40°C {–40°} | 45 | 55 | 1.078

F. FUEL AND EMISSION CONTROL SYSTEMS — Item | Specification

- Idle speed* rpm | 700–750
- Ignition timing | Leading ATDC | 5°
- Ignition timing | Trailing ATDC | 20°
- Air cleaner housing | Element type | Oil permeated
- Throttle body | Type | Horizontal draft (2 stage-3 barrel)
- Throttle body | Throat diameter | Primary mm {in} | 45 {1.772}
- Throttle body | Throat diameter | Secondary mm {in} | 50 {1.969} × 2
- Dashpot touch angle | 8
- Water thermovalve operation (full open) temperature °C {°F} | 55–65 {131–149} or more
- Charge air cooler [1993: "Intercooler"] | Type | Air cooled
- Charge air cooler | Core size {w × h × t} mm {in} | 294 × 114 × 65 {11.575 × 4.4882 × 2.5591}
- Turbocharger | System type | Sequential twin turbocharged
- Turbocharger | Cooling method | Water + engine oil
- Turbocharger | Boost control actuator | Turbo precontrol + wastegate control
- Turbocharger | Boost control method | Solenoid valve (duty-controled) × 2 [sic]
- Fuel filter | Type | Low-pressure | Nylon element
- Fuel filter | Type | High-pressure | Paper element
- Pressure regulator | Type | Diaphragm
- Pressure regulator | Regulated pressure kPa {kgf/cm², psi} | 250–260 {2.5–2.6, 35.6–37.0}
  Footnote: * TEN terminal of data link connector grounded
  (Note: the 1994 table has no "Fuel tank" row; 1993 TD-4 printed 76 {20.1, 16.7} L {US gal, Imp gal}.)

##### PDF page 6 = TD-5 — F. (continued), G. ENGINE ELECTRICAL SYSTEM, H. CLUTCH

F. (continued) — Item | Specification

- Fuel pump | Type | Impeller (In tank)
- Fuel pump | Output pressure kPa {kgf/cm², psi} | 490–740 {5.0–7.5, 71.1–106.7}
- Injector | Type | Side-feeding
- Injector | Injection volume | Primary ml {cc, fl oz}/min | 550 {550, 165} [as printed; checked on a 300 dpi crop]
- Injector | Injection volume | Secondary ml {cc, fl oz}/min | 850 {850, 255} [as printed]
- Three-way catalyst | Type | Warm-up three-way catalyst | Metal
- Three-way catalyst | Type | Three-way catalyst | Monolithic
- Air pump | Capacity cm³ {cc}/rev | 375 {375}
- Air pump | Output L/min | MT 130–200, AT 160–200 (1993 printed MT 140–200)
- Fuel | Specification | Unleaded premium (RON95 or higher)

G. ENGINE ELECTRICAL SYSTEM — Item / Transmission | MT | AT

- Voltage V | 12, negative ground
- Battery | Type and capacity (5-hour rate) | MT: 65D23L (43Ah) | AT: 75D26L (52Ah)
- Ignition system | Spark timing (TEN terminal grounded) | Leading : ATDC 5° (BTDC – 5°) / Trailing : ATDC 20° (BTDC – 20°) at idle (AT: P range)
- Ignition system | Spark advance | Electronic spark advance (ESA)
- Ignition system | Spark plug | Type | Leading | NGK: BUR7EQP*1, BUR6EQP, BUR7EQ, BUR6EQ
- Ignition system | Spark plug | Type | Trailing | NGK: BUR9EQ*1, BUR8EQP, BUR9EQP, BUR8EQ [as printed; checked on a 300 dpi crop]
- Ignition system | Spark plug | Plug gap mm {in} | 1.1–1.7 {0.044–0.066}
- Alternator | Output V-A | 12–100
- Alternator | Regulated voltage V | 14.1–14.7 (With temperature gradient characteristics)
- Alternator | Brush length | Standard mm {in} | 21.5 {0.846}
- Alternator | Brush length | Minimum mm {in} | 8.0 {0.315}
- Stater [sic] | Type | MT: Direct | AT: Reduction
- Stater | Output V-kW | MT: 12–1.2 | AT: 12–2.0
- Stater | Output (no load) | Voltage V | 11
- Stater | Output (no load) | Current A | Max 90
- Stater | Output (no load) | Speed rpm | MT: Min 3000 | AT: Min 2200
- Stater | Brush length | Standard mm {in} | MT: 17.5 {0.689} | AT: 18 {0.71}
- Stater | Brush length | Minimum mm {in} | MT: 12 {0.47} | AT: 11 {0.43}
  Footnote: *1 Standard plug

H. CLUTCH — Item / Transmission | R15M-D

- Clutch control | Hydraulic
- Clutch pedal | Type | Suspended
- Clutch pedal | Pedal ratio | 6.35
- Clutch pedal | Full stroke mm {in} | 135 {5.32}
- Clutch pedal | Height (with carpet) mm {in} | 165.5–177.0 {6.516–6.968}
- Clutch pedal | Free play mm {in} | 0.6–3.2 {0.02–0.13}
- Clutch pedal | Distance from carpet when clutch is fully disengaged mm {in} | 48 {1.9} min.

##### PDF page 7 = TD-6 — H. CLUTCH (continued) and J. MANUAL TRANSMISSION (R15M-D)

H. (continued) — Item / Transmission | R15M-D

- Flywheel | Runout limit mm {in} | 0.2 {0.008}
- Clutch disc | Type | Single dry-plate
- Clutch disc | Runout limit mm {in} | 0.6 {0.024}
- Clutch disc | Wear limit mm {in} | 0.3 {0.012} from rivet head
- Clutch disc | Outer diameter mm {in} | 236 {9.29}
- Clutch disc | Inner diameter mm {in} | 160 {6.30}
- Clutch disc | Facing thickness mm {in} | Flywheel side | 3.5 {0.14}
- Clutch disc | Facing thickness | Pressure plate side | 3.5 {0.14}
- Clutch cover | Type | Diaphragm spring
- Clutch cover | Set load N {kgf, lbf} | 7220 {736, 1619}
- Clutch master cylinder | Inner diameter mm {in} | 15.87 {0.625}
- Clutch release cylinder | Inner diameter mm {in} | 19.05 {0.750}
- Clutch fluid | FMVSS116 DOT-3

J. MANUAL TRANSMISSION (R15M-D) — Item / Engine | 13B (Turbo)

- Specifications | Transmission type | R15M-D
- Transmission control | Floor shift
- Synchronization mechanism | Forward : Synchromesh / Reverse : Synchromesh
- Gear ratio | 1st | 3.483
- Gear ratio | 2nd | 2.015
- Gear ratio | 3rd | 1.391
- Gear ratio | 4th | 1.000
- Gear ratio | 5th | 0.719
- Gear ratio | Reverse | 3.288
- Final gear ratio | 4.100
- Speedometer gear ratio (driven gear/drive gear) | 0.304 (23/7)
- Oil | Grade | API service GL-4 or GL-5
- Oil | Viscosity | All-season | SAE 75W-90
- Oil | Viscosity | Above 10°C {50°F} | SAE 80W-90
- Oil | Capacity L {US qt, Imp qt} | 2.5 {2.6, 2.2}
- Runout | Mainshaft mm {in} | 0.03 {0.0012}
- Clearance | Each gear inner diameter and mainshaft outer diameter mm {in} | 0.15 {0.006}
- Clearance | Each clutch hub sleeve gtoove [sic] and shift fork mm {in} | Standard | 0.2–0.3 {0.008–0.012}
- Clearance | Each clutch hub sleeve groove and shift fork | Maximum | 0.5 {0.020}
- Clearance | Reverse idler gear and shaft mm {in} | Standard | 0.02–0.05 {0.0008–0.0020}
- Clearance | Reverse idler gear and shaft | Maximum | 0.15 {0.006}
- Clearance | Synchronizer ring (all) and flank surface of gear mm {in} | Standard | 1.5 {0.059}
- Clearance | Synchronizer ring (all) and flank surface of gear | Minimum | 0.8 {0.031}
- Clearance | Control rod lever and shift rod gate mm {in} | 0.8 {0.031}
- Thrust plam [sic] | Synchronizer key and synchronizer ring (4th) mm {in} | Standard | 0.66–2.0 {0.026–0.079}
- Thrust plam | Synchronizer key and synchronizer ring (4th) | Available thrust washer thicknesses | 2.5 {0.098}, 3.0 {0.118}, 3.5 {0.138}

##### PDF page 8 = TD-7 — NOT TRANSCRIBED (manual transmission shims and springs; not viewed)

##### PDF page 9 = TD-8 — K. AUTOMATIC TRANSMISSION

Item / Transmission | RB4A-EL

- Gear ratio | 1st gear | 3.027
- Gear ratio | 2nd gear | 1.619
- Gear ratio | Third gear | 1.000
- Gear ratio | Fourth gear | 0.694
- Gear ratio | Reverse | 2.272
- Final gear ratio | 3.909
- Automatic transmission fluid (ATF) | Type | Dexron®II or M-III
- ATF | Capacity L {US qt, Imp qt} | 8.6 {9.1, 7.6}
- Torque converter | Stall torque ratio | 2.200
- Number of drive plates / driven plates | Reverse clutch | 2/2
- Number of drive plates / driven plates | High clutch | 4/7
- Number of drive plates / driven plates | Forward clutch | 6/6
- Number of drive plates / driven plates | Overrunning clutch | 3/5
- Number of drive plates / driven plates | Low and reverse brake | 7/7
- Band servo mm {in} | Servo piston outer dia. / inner dia. | 80.0 {3.15} / 50.0 {1.97}
- Band servo | 4GR servo piston outer dia. | 72.0 {2.83}
- Mechanical system test | Engine stall speed rpm | D, S, L, R range | 3,000–3,300
- Time lag sec. | N → D range | Approx. below 1.0
- Time lag sec. | N → R range | Approx. below 1.2
- Line pressure kPa {kgf/cm², psi} | D range | Idle | 500–520 {5.0–5.4, 72–76}
- Line pressure | D range | Stall | 1,200–1,270 {12.2–13.0, 174–184}
- Line pressure | S range | Idle | 500–520 {5.0–5.4, 72–76}
- Line pressure | S range | Stall | 1,200–1,270 {12.2–13.0, 174–184}
- Line pressure | L range | Idle | 500–520 {5.0–5.4, 72–76}
- Line pressure | L range | Stall | 1,200–1,270 {12.2–13.0, 174–184}
- Line pressure | R range | Idle | 620–650 {6.3–6.7, 90–95}
- Line pressure | R range | Stall | 1,510–1,570 {15.3–16.1, 218–228}
- Shift point km/h {MPH} | POWER | D range | Wide open throttle | D1 → D2 | 50–56 {31–35}
- Shift point | POWER | D range | Wide open throttle | D2 → D3 | 103–111 {64–69}
- Shift point | POWER | D range | Wide open throttle | D3 → D4 | 178–188 {111–117}
- Shift point | POWER | D range | Half throttle | D1 → D2 | 35–41 {22–25}
- Shift point | POWER | D range | Half throttle | D2 → D3 | 81–93 {50–58}
- Shift point | POWER | D range | Half throttle | D3 → D4 | 126–144 {78–99} [as printed, same as 1993]
- Shift point | POWER | D range | Half throttle | Lockup ON (D3 ) | 94–106 {58–66} (*81–93 {50–58})
- Shift point | POWER | D range | Half throttle | Lockup ON (D4 ) | 174–192 {108–119} (*126–144 {78–89})
- Shift point | POWER | D range | Closed throttle position | D4 → D3 | 39–45 {24–28}
- Shift point | POWER | D range | Closed throttle position | D3 → D2 | 13–19 {8–12}
- Shift point | POWER | D range | Closed throttle position | D2 → D1 | 5–11 {3–7}
- Shift point | POWER | D range | Kickdown (Wide open throttle) | D4 → D3 | 142–152 {88–94}
- Shift point | POWER | D range | Kickdown (Wide open throttle) | D3 → D2 | 91–99 {57–62}
- Shift point | POWER | D range | Kickdown (Wide open throttle) | D2 → D1 | 38–44 {24–27}
  Caution
- Lockup indicates complete lockup.
- - mark indicates lockup points when the engine coolant temperature is above 115°C {239°F}.

##### PDF pages 10-13 = TD-9 ... TD-12 — NOT TRANSCRIBED (automatic transmission shift points and internals; not viewed)

##### PDF page 14 = TD-13 — L. PROPELLER SHAFT, M. FRONT AND REAR AXLES, N. STEERING SYSTEM

L. PROPELLER SHAFT — Item / Transmission | R15M-D

- Length mm {in} | 863 {33.98}
- Outer diameter mm {in} | 75 {3.0}
- Max. permissible runout mm {in} | 0.4 {0.02}

M. FRONT AND REAR AXLES — Item | Specifications

- Drive shaft | Type | Wheel side | BJ (bell joint)
- Drive shaft | Type | Differential side | TJ (Tripod joint)
- Drive shaft | Outer diameter of large boot end mm {in} | Wheel side | 105.3 {4.146}
- Drive shaft | Outer diameter of large boot end | Differential side | 100.5 {3.957}
- Drive shaft | Grease amount g {oz} | Wheel side | 100–120 {3.53–4.23}
- Drive shaft | Grease amount | Differential side | 170–190 {6.01–6.70}
- Drive shaft | Shaft length* mm {in} | 791.2–801.2 {31.15–31.54}
- Front axle | Bearing play axil [sic] direction mm {in} | 0.05 {0.002} max.
- Rear axle | Bearing play axil direction mm {in} | 0.05 {0.002} max.
- Differential | Backlash (Ring gear and drive pinion) mm {in} | 0.09–0.11 {0.0035–0.0043}
- Differential | Drive pinion preload (without oil seal) N·m {kgf·cm, in·lbf} | 1.3–1.7 {13–18, 12–15}
- Differential oil | Grade | API Service GL-4 or 5
- Differential oil | Viscosity | Above –18°C {0°F} : SAE 90 / Below –18°C {0°F} : SAE 80
- Differential oil | Capacity L {US qt, Imp qt} | 1.30 {1.38, 1.14}
  Footnote: * Before measuring the drive shaft length, lift the boot to equalize the pressure within it.
  (Note: no differential type and no final drive printed here.)

N. STEERING SYSTEM — Item | Specifications

- Steering wheel | Outer diameter mm {in} | 380 {15.0}
- Steering wheel | Free play mm {in} | 0–30 {0–1.18}
- Steering wheel | Wheel effort N {kgf, lbf} | 30–38 {3.0–3.9, 6.6–8.5}
- Steering wheel | Lock-to-lock turns | 2.9
- Steering shaft | Shaft type | Collapsible
- Steering shaft | Joint type | 2-cross joint
- Power steering system | Gear type | Rack and pinion
- Power steering system | Gear ratio | ∞ (infinite)
- Power steering system | Rack stroke mm {in} | 160 {6.30}
- Power steering system | Power steering fluid | ATF Dexron®II or M-III
- Power steering system | Fluid capacity L {US qt, Imp qt} | 0.96 {1.01, 0.84}
- Power steering system | Fluid pressure kPa {kgf/cm², psi} | 7620–8350 {77.7–85.2, 1110–1210}

##### PDF page 15 = TD-14 — P. BRAKING SYSTEM

(Identical in every row to 1993 TD-14.)

- Brake pedal | Type | Suspended
- Brake pedal | Height (with carpet) mm {in} | 164.5–176.0 {6.48–6.92}
- Brake pedal | Free play mm {in} | 3–8 {0.12–0.31}
- Brake pedal | Reserve travel (When depressed at 590 N {60 kgf, 132 lbf}) (without carpet) mm {in} | 100 {3.94} min.
- Master cylinder | Type | Tandem (with level sensor) / Portless & recessed type
- Master cylinder | Push rod-to-piston clearance mm {in} | Power brake unit at 66.7 kPa {500 mmHg, 19.7 inHg} | 0.1–0.4 {0.004–0.015}
- Front brake | Type | Ventilated disc
- Front brake | Disc pad thickness | Standard mm {in} | Outer | 10.3 {0.41}
- Front brake | Disc pad thickness | Standard | Inner | 9.3 {0.37}
- Front brake | Disc pad thickness | Limit mm {in} | 1.0 {0.04}
- Front brake | Disc plate | Runout limit mm {in} | 0.1 { 0.004}
- Front brake | Disc plate | Thickness | Standard mm {in} | 22.0 {0.87}
- Front brake | Disc plate | Thickness | Limit mm {in} | 20.0 {0.79}
- Rear brake | Type | Ventilated disc
- Rear brake | Disc pad thickness | Standard mm {in} | 8.0 {0.31}
- Rear brake | Disc pad thickness | Limit mm {in} | 1.0 {0.04}
- Rear brake | Disc plate | Runout limit mm {in} | 0.1 {0.004}
- Rear brake | Disc plate | Thickness | Standard mm {in} | 20.0 {0.79}
- Rear brake | Disc plate | Thickness | Limit mm {in} | 18.0 {0.71}
- Power brake unit | Type | Tandem diaphragm
- Power brake unit | Fluid pressure when pedal depressed at 200 N {20 kgf, 44 lbf} kPa {kgf/cm²} | Power brake unit at 0 kPa {0 mmHg, 0 inHg} | 590 {6} min.
- Power brake unit | Fluid pressure ... | Power brake unit at 66.7 kPa {500 mmHg, 19.7 inHg} | 7750 {79} min.
- Rear wheel hydraulic control system | Type | Proportioning bypass valve
- Rear wheel hydraulic control system | Switching point kPa {kgf/cm², psi} | 3900 {40.0, 570}
- Parking brake | Type | Mechanical, two-rear-wheel control
- Parking brake | Operation system | Hand lever type
- Parking brake | Parking lever stroke (When pulled at 200 N {20 kgf, 44 lbf}) notches | 7–10
- Brake fluid | Type | FMVSS 116 DOT-3
- Anti-lock brake system (ABS) | Type | 4-sensor, 3-channel system
- Anti-lock brake system (ABS) | Resistance between terminals of wheel speed sensor kΩ | 0.8–1.2

##### PDF page 16 = TD-15 — Q, WHEELS AND TIRES and R. SUSPENSION

Q, WHEELS AND TIRES — Item | Specifications (identical to 1993 TD-15)

- Standard tire | Tires | Size | P225/50R16 91V / P225/50 ZR 16
- Standard tire | Tires | Air pressure kPa {kgf/cm², psi} | 220 {2.2, 32}
- Standard tire | Tires | Remaining tread | Ordinary tires mm {in} | 1.6 {0.063} min.
- Standard tire | Tires | Remaining tread | Snow tires % | 50 min.
- Standard tire | Wheels | Size | 16 × 8JJ
- Standard tire | Wheels | Material | Aluminum alloy
- Standard tire | Wheels | Offset mm {in} | 50.0 {1.97}
- Standard tire | Wheels | Pitch circle diameter mm {in} | 114.3 {4.50}
- Temporary spare tire | Tires | Size | T135/70D16
- Temporary spare tire | Tires | Air pressure kPa {kgf/cm², psi} | 415 {4.2, 60}
- Temporary spare tire | Wheels | Size | 16 × 4T
- Temporary spare tire | Wheels | Material | Aluminum alloy
- Temporary spare tire | Wheels | Offset mm {in} | 40.0 {1.57}
- Temporary spare tire | Wheels | Pitch circle diameter mm {in} | 114.3 {4.50}
- Wheel and tire | Runout limit mm {in} | Horizontal | 2.0 {0.08}
- Wheel and tire | Runout limit | Vertical | 1.5 {0.06}
- Wheel and tire | Maximum unbalance (at rim edge) g {oz} | 8 {0.28}

R. SUSPENSION — columns: Transmission MT (Suspension: Standard | Hard) | AT (Suspension: Standard)

- Front suspension | Suspension type | Double-wishbone (all columns)
- Front suspension | Coil spring | Identification mark color | MT Standard+Hard (one cell): Red | AT Standard: Brown
- Front suspension | Coil spring | Wire diameter mm {in} | MT: 12.3 {0.48} | AT: 12.5 {0.49}
- Front suspension | Coil spring | Coil center diameter mm {in} | MT: 104.8 {4.126} | AT: 105.0 {4.134}
- Front suspension | Coil spring | Free length mm {in} | MT: 270.0 {10.63} | AT: 276.3 {10.88}
- Front suspension | Coil spring | Active coil number | MT: 4.14 | AT: 4.39
- Front suspension | Shock absorber | Type | Cylindrical, double-acting, low-pressure gas charged (all)
- Front suspension | Shock absorber | Damping force characteristics | MT Standard: Standard | MT Hard: Hard | AT Standard: Standard
- Front suspension | Stabilizer | Type | Torsion bar, hollow type
- Front suspension | Stabilizer | Diameter mm {in} | 28.6 {1.13} (all)
- Front weel [sic] alignment (unladen*1) | Inspection standard | Total toe-in mm {in} | 2 ± 3 {0.08 ± 0.11}
- Front wheel alignment | Inspection standard | Toe-in (per side) Degree | 0.1° ± 0.75°
- Front wheel alignment | Inspection standard | Maximum steering angle | in | 36° ± 2°
- Front wheel alignment | Inspection standard | Maximum steering angle | out | 32° ± 2°
- Front wheel alignment | Inspection standard | Camber angle Degree | 0.1° ± 0.75°
- Front wheel alignment | Inspection standard | Camber: Difference between left and right Degree | 1.0° max.
- Front wheel alignment | Inspection standard | Caster angle Degree | 6.08° ± 0.75°
- Front wheel alignment | Inspection standard | Caster: Difference between left and right Degree | 1.0° max.
- Front wheel alignment | Inspection standard | King pin angle Degree | 13°55′
- Front wheel alignment | Adjustment standard | Total toe-in mm {in} | 2 ± 1 {0.08 ± 0.04}
- Front wheel alignment | Adjustment standard | Toe-in (per side) Degree | 0.1° ± 0.05°
- Front wheel alignment | Adjustment standard | Maximum steering angle | in | 36° ± 2°
- Front wheel alignment | Adjustment standard | Maximum steering angle | out | 32° ± 2°
  Footnote: *1 Fuel tank full; radiator coolant and engine oil at specified levels; spare tire, jack, and tools in designated positions.
  (Note: 1993 TD-15 printed one front spring (Blue, 12.4, 104.9, 272.9, 4.27) with no MT/AT or Standard/Hard split, and front total toe-in 1 ± 3 {0.04 ± 0.11}.)

##### PDF page 17 = TD-16 — R. SUSPENSION (continued), T. BODY ELECTRICAL SYSTEM

Columns: Transmission MT (Suspension: Standard | Hard) | AT (Suspension: Standard)

- Front wheel alignment (unladen*1) [adjustment standard, continued] | Camber angle Degree | 0.1° ± 0.5°
- Front wheel alignment | Camber: Difference between left and right Degree | 1.0° max.
- Front wheel alignment | Caster angle Degree | 6.08° ± 0.5°
- Front wheel alignment | Caster: Difference between left and right Degree | 1.0° max.
- Front wheel alignment | King pin angle Degree | 13°55′
- Rear suspension | Suspension type | Double-wishbone
- Rear suspension | Coil spring | Identification mark color | Purple (all columns)
- Rear suspension | Coil spring | Wire diameter mm {in} | 12.2 {0.48}
- Rear suspension | Coil spring | Coil center diameter mm {in} | 114.7 {4.516}
- Rear suspension | Coil spring | Free length mm {in} | 303.0 {11.93}
- Rear suspension | Coil spring | Active coil number | 4.21
- Rear suspension | Shock absorber | Type | Cylindrical, double-acting, low-pressure gas charged
- Rear suspension | Shock absorber | Damping force characteristics | MT Standard: Standard | MT Hard: Hard | AT Standard: Standard
- Rear suspension | Stabilizer | Type | Torsion bar, hollow type
- Rear suspension | Stabilizer | Diameter mm {in} | 13.8 {0.54} (1993 TD-16 printed 17.3 {0.68})
- Rear wheel alignment (unladen*1) | Inspection standard | Total toe-in mm {in} | 2 ± 3 {0.08 ± 0.11}
- Rear wheel alignment | Inspection standard | Toe-in (per side) Degree | 0.1° ± 0.1°
- Rear wheel alignment | Inspection standard | Camber angle Degree | –1.22° ± 0.75°
- Rear wheel alignment | Inspection standard | Difference between left and right Degree | 1.0° max
- Rear wheel alignment | Inspection standard | Thrust angle Degree | 0° ± 0.1°
- Rear wheel alignment | Adjustment standard | Total toe-in mm {in} | 2 ± 1 {0.08 ± 0.04}
- Rear wheel alignment | Adjustment standard | Toe-in (per side) Degree | 0.1° ± 0.05°
- Rear wheel alignment | Adjustment standard | Camber angle Degree | –1.22° ± 0.5°
- Rear wheel alignment | Adjustment standard | Difference between left and right Degree | 1.0° max
- Rear wheel alignment | Adjustment standard | Thrust angle Degree | 0° ± 0.1°
  Footnote: *1 Fuel tank full; radiator coolant and engine oil at specified levels; spare tire, jack, and tools in designated positions.
  (Note: 1993 TD-15 printed the rear spring as White, 12.2, 114.7, 299.0 {11.77}, 4.21.)

T. BODY ELECTRICAL SYSTEM — Item | Specification (W) (BULB TRADE NO.)

- Front exterior lights | Headlight (Halogen) | 60/55 [HB2]
- Front exterior lights | Parking light | 5
- Front exterior lights | Front turn signal | 27 (3497)
- Front exterior lights | Front fog light | 35
- Front exterior lights | Daytime running light (For Canada) | 27 (3496)
- Front exterior lights | Front side marker light | 4.9 (168)
- Rear exterior lights | Back-up light | 27 (1156)
- Rear exterior lights | License plate light | 5
- Rear exterior lights | Stop / Tail light | 27/8 (1157)
- Rear exterior lights | High-mount stoplight | 18.4 (921)
- Rear exterior lights | Rear turn signal light | 27 (1156)
- Rear exterior lights | Rear side marker light | 3.8 (194)
- Interior lights | Interior light | 5
- Interior lights | Glove compartment light | 3.4
- Interior lights | Cargo compartment light | 8

##### PDF page 18 = TD-17 — NOT TRANSCRIBED (heater/air conditioner and standard bolt torque; not viewed)
