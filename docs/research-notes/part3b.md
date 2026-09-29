# Phase 1, part 3b research notes: 1JZ-GTE, RB25DET NEO, RB26DETT, LS1, LS3, K24 and the LS swaps

Written 2026-09-29 from the nine research passes' reports. The data and every source are in `src/data/engines/` and `src/data/swaps/`; this file keeps what doesn't fit there: the conflicts between sources and how each was settled, and the leads for Phase 3. Every page was read on 2026-09-29.

## Engines

### 1JZ-GTE

- **Primary sources:**
  - Toyota's September 1996 JZX100 repair book, an English machine translation on archive.org (text layer; the oil table and model list are page images).
  - Toyota's parts catalogue, from the japan-parts.eu mirror (public pages only).
  - toyota.jp and goo-net grade pages. They share catalogue ids, so they're probably one upstream dataset; key values have a third source where one was found.
  - The 1992 and 2001 Chaser brochures.
- **Settled by the catalogue:**
  - Pans: 12102-46011 (JZX81/90/100, front sump), 12102-46040 (JZS171 and the JZX110 family, front sump), 12102-46030 then -46031 (JZA70 and JZZ30, rear sump). ESB's "VVT-i 97+" label for 12102-46040 is wrong, and so is its upper-pan number.
  - The same R154 bellhousing (31111-14110), manual flywheel (13405-46030) and starter (28100-46130/46140) on the JZX90 and JZX100.
  - The same rod (13201-46030) and rod bolt (13265-46020) on the JZX90, JZX100 and JZX110. So the "weaker VVT-i rods" story doesn't apply to the 1JZ.
  - The pistons changed with VVT-i (13101-88400 to 13101-88410), and so did the head, head gasket and cams.
  - Both generations are shim-over-bucket, per the repair book (shims replaced from above with a lifter press). motorreviewer's "solid shimless buckets" is wrong.
- **Conflicts:**
  - Displacement: Toyota's 2,491 cc against 2,492 cc (Wikipedia, engine-specs.net). Toyota's figure is used.
  - Pistons: cast (engine-specs.net, 8020) against forged or semi-forged (motorreviewer, CARPRIME, Japanese Wikipedia). Stored as cast, dispute noted.
  - Weight: 207, 210 or 225 kg.
  - drifted.com is discarded: it prints 2,498 cc and a "Hitachi CT15B".
- **Gaps:**
  - twin-turbo boost;
  - injector flow (380 cc per two secondary sources, not split by generation);
  - VVT-i cam figures;
  - redline;
  - intercooler position for the JZZ30, JZS171 and JZX110;
  - automatic bellhousings;
  - the 300 PS Modellista/Yamaha specials.

### RB25DET NEO

- **Primary sources:**
  - Nissan's 1998-05-25 Skyline and 1998-08-31 Stagea releases: the inline page images. The PDF attachments sit behind a licence prompt and were not opened (rule 13).
  - Nissan's 2000-08-28 release.
  - The R34 service manual (archive.org; pages GI-3, SD-6, SD-7, SD-8).
  - Nissan's parts catalogue, from megazip.net.
- **The engine:**
  - It launched on the ER34 on 1998-05-25, then went into the WC34 Stagea (1998-08), the C35 Laurel (1998-09) and the Y34 Cedric/Gloria 4WD (1999-06).
  - No 4WD R34 had the NEO turbo: the 25GT FOUR is an RB25DE.
  - Solid lifters: the manual gives valve clearances, and the catalogue lists shims 13229-AA000 to -AA067.
  - The R34 turbo manual has a pull-type clutch (Nissan 1998 release p. 5); the R33 has a push type.
- **Turbos** (catalogue, confirmed by dg-works):

  | Turbo       | Fitted                    | Compressor wheel |
  | ----------- | ------------------------- | ---------------- |
  | 14411-AA100 | to 2000-07                | resin            |
  | 14411-AA110 | from 2000-07, and the Y34 | aluminium        |
  | 14411-AB000 | late 5MT only             | aluminium        |

  All three have ceramic turbine wheels. The late 5MT also has its own camshaft (13020-AB000) and ECM (23710-AA560).

- **Conflicts:**
  - The usual 34.0 kgf·m is the automatic's figure. The 5MT is 35.0 kgf·m, then 37.0 kgf·m from 2000-08.
  - Stagea 5MT torque: goo-net's 34.0 against Car Sensor and carview's 35.0. 35.0 is used.
  - Y34 from 2002-09: goo-net gives 250 PS / 32.5 kgf·m on three pages. That is used, as single-source.
  - Compressor wheel material: Japanese Wikipedia's "ceramic, then aluminium from 1999-09" loses to dg-works and the catalogue.
  - Weight: figures run from 180 to 260 kg.
  - Whether all NEO engines or only the late 37 kgf·m engine have RB26 rods is unresolved.
- **Gaps:**
  - injector flow (a forum claim of 370 cc cites a 306 cc/min part);
  - cam durations;
  - redline;
  - boost except on the 1998 5MT;
  - the 4WD pan part number;
  - aftermarket pans (Aeroflow AF82-2017 seen in search results only).

### RB26DETT

- **Primary sources:**
  - Nissan's English R32 GT-R service manual (archive.org item `nissan-skyline-r-32-gt-r-workshop-manual`): EN-3 main specifications, EN-75 cam lift, EN-19 firing order, EN-92/95 oil pan, CH-23 FS5R30A.
  - The 1999 R34 supplement (`r-34-servicesupplement-ocr`): GI-3 ETX13A gearbox; SD-3 oil 4.2/4.6 L standard, 4.5/4.9 L N1.
  - NISMO's Omori Factory blog and 2020 catalogues:
    - the standard block is 11000-05U00, the N1 block 24U;
    - N1 rings are 1.2 mm against 1.5 mm standard;
    - the BNR32 NISMO turbo is 14411-06U00 and the BCNR33 N1 turbo 14411-24U10, both with a T25 turbine and an Inconel wheel;
    - flywheel 12310-RSR21 fits the RB20DET, RB25DET and the BNR32/BCNR33/260RS RB26, and 12310-RSR41 the BNR34.
- **Clutch:** the BNR32 moved from a push-type to a pull-type clutch at the 1993-02 update.
- **Conflicts:**
  - Stroke: Narumi's 73.3 mm is a typo for 73.7.
  - Turbo type: English Wikipedia's infobox says "T28". Its own text, Narumi and 8020 say T25/T3, which is used.
  - R32 boost: 570 mmHg (Narumi), 10 psi (Wikipedia, 8020) or 0.8 bar (gtrusablog).
  - Injectors: 444 against 440 cc.
  - Intake lift: 8.58 mm (manual) against 8.55 mm.
  - Pistons: cast, against 8020's hypereutectic.
- **Unreliable pages:** DRIFTED contradicts itself on the block material, and NEXTAGE calls the R32 N1 engine an RB25DET.
- **Gaps:**
  - redline (only uncited Wikipedia gives 7,500/8,000 rpm);
  - ECU part numbers;
  - pan part numbers (an Amazon listing of 11110-08U00 as an RB25/RB26 pan is only a lead);
  - export-market versions;
  - the rpm at which the oil-pump drive fails (sources describe the failure without a number).

### LS1

- **Primary sources:**
  - GM Heritage vehicle-information kits on gm.com (scans with no text layer, read as page images): 1997 Corvette with GM Powertrain engine sheets; 1998 and 1999 Camaro with the MVMA/AAMA specification forms; 2000, 2001 and 2004 Corvette and 2002 Camaro.
  - GM service information for the 1998-2004 Corvette, as reproduced by Mitchell (a third-party upload on archive.org).
  - Holden owner's handbooks and the VT II (1999) and VZ Monaro (2004) brochures.
- **Conflicts:**
  - 2001-04 Corvette rpm points: GM's 2001 kit gives 350 hp @ 5,600 and 375 lb-ft @ 4,400 (manual), 360 lb-ft @ 4,000 (automatic). GM's 2004 kit prints 350 @ 5,200 and 375 @ 4,000. The 2001 kit is used, and the 2001 brochure supports it.
  - VT II power rpm: 5,000 (brochure) against 5,200 (handbook). 5,200 is used.
  - VY torque: the June 2002 handbook prints 450/455 Nm, the March 2003 printing 460/465. 460/465 is used.
  - GMPP's crate LS1 (25534322) is 10.25:1; every production document says 10.1:1. 10.1:1 is used.
  - Pistons: "cast aluminum" (GM service information) against "hypereutectic" (GMPP). Hypereutectic is used; the MVMA form says only "Aluminum".
- **Gaps:**
  - GM injector flow (only an undated "28-pound");
  - cams beyond the 2001-04 C5;
  - torque curves (charts only);
  - PCM numbers except 1999-2000;
  - the C5 and Gen III truck pans (no stated sump position);
  - the HSV 255/285 kW and the Callaway 300 kW (modified internals);
  - a GMPP crate LS1 rating.

### LS3

- **Primary sources:**
  - Chevrolet Performance's 2026 catalogue, as page images: the crate LS3 p. 34, the LS376s pp. 38 and 42, accessory drives pp. 70-71.
  - Crate spec sheets 19329243, 19419889, 19419890 and 19420381.
  - E-ROD and controller-kit instructions.
  - GM's 2008-2010 Corvette press kits, reproduced by Corvette Action Center.
  - GM brochures, and GM Authority for GM Powertrain's engine mass (183 kg / 403 lb; 211 kg for the dry-sump Grand Sport manual).
- **Conflicts:**
  - Crate cam duration: 204/211 (chevrolet.com, the catalogue) against 202/212 (spec sheets). 204/211 is used.
  - LS376/525 lobe separation: 110° against 112°.
  - C6 redline: 6,500 in the 2013 brochure, against the 6,600 limiter.
  - GM 2008 Nm typos: 586/592 against the table's 575/580.
  - Pre-production Camaro (422 hp) and G8 GXP (402 hp) figures were pending SAE certification. The certified 426 and 415 are used.
  - The crate engine's pan: GM says "Gen IV F-Car" (ICT Billet: 12628771). Dirty Dingo and TPS warn that many crate and E-ROD engines arrive with the non-swap Zeta pan.
- **Gaps:**
  - the HSV 340 kW (2016-17) version;
  - the E-ROD as its own variant;
  - ECU, redline and cam data outside the Corvette and crate engines;
  - torque curves (charts only);
  - the bare long-block width.
- **Hand-check needed:** the Dirty Dingo pan drawings were read as images.

### K24

- **Why these variants:** vendors name the same list.
  - KPower calls the K24A2 "the most potent K24 in stock form", and says the JDM K24A is "nearly identical" if it has the RBB head and the 200 PS rating.
  - Hybrid Racing ranks the JDM K24A first, recommends the K24Z7 for RWD swaps, and says the K24A1 is the block for K24/K20 builds (its pistons clear K20 valves; the K24A4/A8's don't).
- **Honda re-rating:** Honda's 2006 re-rating (SAE J1349 Rev 8/04) took the K24A1 from 160 to 156 hp with no hardware change. The 2006 TSX's rise from 200 to 205 hp mixes the new procedure with hardware changes: a 36 mm intake valve, more lift, stronger rods and a 64 mm throttle.
- **Conflicts:**
  - K24Z3 torque rpm: 4,400 (press kit, 6MT) against 4,300 (brochure). 4,400 is used.
  - Accord K24Z3 compression: 10.7 against 10.5 (not modelled).
  - TF-Works pan: its text says both front and rear sump. Front is used.
  - K24A1 VTEC switch point: 2,200 against 2,750 rpm (omitted).
  - enginetechspecs.com is not used anywhere: its dimensions are inconsistent and it reads like generated text.
- **Gaps:**
  - rev limit;
  - ECU part numbers;
  - cams;
  - injector flow except the K24A2 (310 cc/min, no test pressure);
  - pan depths;
  - the deck type (open deck likely).
- **Blocked:** k20a.org redirects to a pay-per-crawl gateway (TollBit), which was not followed.

## Swaps

### All LS swaps (common hardware)

- **ECU routes:**
  - GM's controller kit is 58x only (LS3). No 24x Chevrolet Performance kit was found.
  - Its instruction sheet 19171935 asks for "400 kPa (60 psi) constant pressure", 40 gph and no vacuum reference. The usual Corvette filter-regulator is fixed at 58 psi. No source says whether 58 psi is inside GM's tolerance.
  - Holley's non-Max 58x Terminator X kits won't run a factory drive-by-wire LS3 throttle (Pro Touring Store). The Max 550-931 is the LS3 match.
  - HP Tuners needs 2 credits per GM ECM ($49.99 each) on top of the MPVI4 ($399.99). The MPVI1 loses support on 2027-01-01.
- **Gearboxes:**
  - Tremec's Magnum TUET11009 is rated at 700 lb-ft and 7,800 rpm. Its GM input shaft is 6.52 in from the case face, with shifter positions at 21.05, 17.53 and 13.25 in (catalogue p. 6, page image, needs a hand check).
  - The Magnum-F TUET16362 puts the shifter at 23.89 in, and American Powertrain names the A80 Supra and FD RX-7 for it.
  - The TR6060 has an integrated clutch housing, so the T56 LS bellhousing doesn't fit it. It is rated at 455 lb-ft (Camaro SS), and Tremec sells no new TR6060.
- **Price conflicts:** the T56 LS bellhousing 1386-212-005 is $309 at PTS against $650 at Collins.
- **LS-to-Toyota gearbox adapters:** none exists that could be verified. A forum lead, Advance Adapters 712567V, is a Jeep AX15 kit, and Advance Adapters' 712560 says it is "not intended for use with any LS engine".
- **Blocked:** Summit Racing and JEGS both blocked curl and WebFetch this session.

### S15

- **Kit sources:** Sikky's RHD S15 packages are built from its RHD S14 parts (mounts MK001-RHD named "S14/S15", crossmembers CM25/CM28, driveshaft SKNISH2), and its only install guide is the S13/S14 one.
- **The shared S14/S15 member is single-source:** 3G Spares says the S14 member also suits the S15. nissanpartsdeal.com ties 54401-85F00 to the 240SX only. BE FORWARD appears to list an S15 member as 5440185F00 but served a bot check.
- **S15 fitment conflicts:**
  - Collins lists ISR-made headers for the S15, while ISR's own pages name only the S13/S14.
  - Sikky and Street Machine say RHD cars need different headers.
- **Speedo and tach:** Wiring Specialties says the S15 gearbox has no speed sensor, so the speedo needs working S15 ABS or a signal conditioner. The tach needs a Dakota Digital SGi-100BT.
- **Gaps:**
  - a factory GM pan that clears (KE Conversions requires sump modification or crossmember notching; one Street Machine S14 build used a Holden VX pan);
  - any Japanese vendor;
  - an adapter for the S15's own gearboxes (NZ Performance Car quotes Sikky advising against Nissan gearboxes behind an LS).

### Supra (JZA80)

- **Sikky is the only complete MKIV kit found:**
  - its Stage 1 is T56/Magnum only, and the SKTOSH1 shaft is T56 only;
  - its pan OP005T is titled "Mid Sump" but described as front sump;
  - it publishes no Supra install guide.
- **Collins:** its LS-to-CD009 kit was "developed using the GM F-body (Camaro 98-00) oil pan and stock headers". It uses SC400 engine brackets with the stock SC400 isolators 12361-50101, and a guibo adapter for a custom shaft.
- **Gaps:**
  - a V160/V161 or W58 adapter (none found at Collins, XAT Racing or SupraStore);
  - a Supra LS power-steering line;
  - a radiator;
  - a harness (Wiring Specialties' Supra harnesses are 1JZ only).

### 350Z

- **VQ35DE and VQ35HR cars:** no vendor splits the mounts, pans or headers between DE and HR cars. They differ at the gearbox:
  - Sikky sells DE (TAK002) and HR (TAK001) adapters, with the DE dowel pins in the lower holes and the HR's in the upper;
  - DE bellhousings may need sanding for flywheel clearance, and HR bellhousings a small cut for the starter.
- **Wiring:** Wiring Specialties prices its harnesses for 2003-2006 cars, with a +$75 option for 2007-2008. Its LS1 harness page says there are "ZERO fault lights" for traction and stability control, and also that traction control is "not functional". Both are recorded.
- **Pan capacity conflict:** 5 qt on the Sikky pan's own page against 6 qt on the kit pages. The pan page is used.
- **Gaps:**
  - a factory GM pan that clears;
  - an LS route for the RE5R05A automatic;
  - an RHD harness.

### E46

- **The M3 differs from the 330i in three sourced ways:**
  - its own control-arm bushings (Sikky CA-Bushing3);
  - M3/SMG harness options;
  - the Getrag 420G adapters (PMC A-LS-E46-240 at 1,048 EUR and A-LS-E46-184S at 1,098 EUR, Rank One at 2,499 EUR).

  No source says whether the mounts or subframe differ.

- **Keeping the ZF box:** it moves the engine 1.25 in forward (Pennsyltucky).
- **Gearbox rating:** BMW's training manual reads the "37" in GS6-37BZ as a type code, so the often-quoted 370 Nm rating is unconfirmed and isn't stored.
- **Instruments:** the tach needs an SGi-8 because the cylinder count changes, and the speedo reads from the ABS. No vendor claims DSC works.
- **Unresolved:** the Wiring Specialties E46 LS3 page says "CABLE THROTTLE CONVERSION ONLY" but offers a stock E46 pedal option.

### RX-7 (FD3S)

- **Two layouts:**
  - Sikky keeps the factory subframe, with firewall clearancing, and sells a brace (DBA-01) in place of the power-plant frame.
  - Hinson replaces the subframe and adds a torque arm (package FDME-375-T56, which needs C6 pedestals and Hinson 4050 urethane mounts), which changes the steering rack's height.
- **Driveshaft flange:** it depends on the car's factory gearbox, 3.75 in for manual cars and 4.125 in for automatics (Hinson).
- **Wiring:** Wiring Specialties covers only US 1993-1995 left-hand-drive cars.
- **Gaps:**
  - LS1 against LS3 bonnet clearance (no vendor mentions it; the forums that might were blocked);
  - a factory GM pan that clears;
  - an adapter to keep the Mazda gearbox;
  - JDM or RHD harnesses.
