# Data gaps

Updated after the project team supplied the GMRC gate table, a Google My Maps KML export and two PDFs (see `research-sources.md`). The app shows "not verified yet" or "unavailable" for everything below instead of guessing. To fill a gap, edit the matching file in `data/` (see README, "Adding verified data") and run `npm test`.

## Still blocking features

| Gap | Effect in the app | How to close it |
|---|---|---|
| **Fare amounts** | Every route shows "Fare unavailable offline". **The pipeline to fill this is built and tested on synthetic data; the real capture has not been run yet.** GMRC's fare calculator returns fare, km, minutes, station count and interchanges per pair (one real sample response was supplied: ₹10, 7 stations, 7.10 km, 14 min, 0 interchanges — but the calculator's station IDs for that sample are unknown, so it is not stored). | Run `scripts/capture-fares.browser.js` in a browser on the route-and-fares page, then `npm run import:fares -- <file>` (see README). |
| **Journey time** | No journey-time figure until fares are captured (the calculator's `station_min` becomes "GMRC estimate"). Only the published end-to-end time per line is shown otherwise. | Same capture. |
| **Fare ticket type / validity** | The calculator does not say whether the fare is for a token, card or QR ticket, nor from when it applies. The app says so and does not claim a ticket product. | Confirm with GMRC. |
| **Hidden start of the Phase-1/Phase-2 fare-rule bullet** | Routes crossing Motera Stadium ↔ Koteshwar Road show a neutral warning quoting the visible text. | Get the full sentence from GMRC's Fare Rules page and update `data/fare-rules.json` and the warning in `src/lib/routing.ts`. |

## Station data

- **Coordinates are estimates, not verified.** All 54 stations have coordinates from the supplied Google My Maps KML, an *unofficial* map. They are stored as `estimated`. The pins look like station-area points (adjacent stations are 571 m–2.5 km apart), but any pin may be tens to a few hundred metres from the actual entrance or platform. The Live screen lets riders record better positions with GPS (stored on the phone, shareable as JSON).
- **Gate directions: not published.** GMRC's gate table gives gate *numbers* (129 gates at 53 stations) but no street or landmark direction, so `verifiedDirection` is `null` everywhere. A gate number is never treated as proof of a direction.
- **Gate connectivity notes** (e.g. "Lift and Skywalk connecting BRTS" at Vadaj gate 5) come from the unofficial map and are shown as *unverified*. They agree with the official gate numbers where a number is named.
- **Platforms and boarding sides**: none. The route screen tells passengers to look for "Towards <terminal>" signs instead.
- **Lift working status**: GMRC lists 98 lifts with ramp near entrance gates but not whether they are working, nor platform-level step-free access. The optional "prefer step-free routes" feature is therefore **not implemented**.
- **Sabarmati Railway Station** is on the route map and the 2015 DPR but is **not in GMRC's table of operational entry/exit gates** (and has a blank cell in the older route PDF). Its station type is `unknown` and routes through it show a warning. Confirm whether it is open.
- **Shahpur gates**: the GMRC table lists "Gate No. 3" twice (probable typo upstream); only gates 3 and 4 are recorded.
- **Integration icons** (BRTS, AMTS, railway) on the route map: not transcribed.
- **Gujarati / Hindi names**: visible on the route map, not transcribed; search is English-only.

- **Station thumbnails: none bundled yet.** Photos need internet; run `npm run fetch:thumbs` (README, "Stations screen and thumbnails"). Until then every station shows a generic drawn illustration, labelled as such. Commons has few or no photos for some stations, which keep the illustration.
- **Per-station escalators, parking and facilities: not published.** GMRC's facility galleries are network-wide, so the Stations cards show only exits, lifts and (unverified) BRTS/rail/bus links.
- **Station area names / street addresses: not in the data.** The card's place line uses a landmark named like the station, an alias, or the stop number, never an invented neighbourhood.

- **Which frequency applies right now** is derived from GMRC's frequency labels via structured windows (`frequency[].when`). For Line 1, "non-peak" is read as the service hours that are neither peak (08:00–11:00, 17:00–20:00) nor in the 20-minute early/late band (06:20–07:00, 22:00–23:00); that is an interpretation of the published text. A test checks no minute matches two bands.
- **Next train / platform: not available.** No live feed and no platform data, so the Route screen shows the schedule (every N min, first, last) and "Towards <terminal>", never a next-train time or platform number. First/last times are for the terminal the train leaves from; mid-line stations are later/earlier by an unpublished amount.
- **Per-stop minutes** on the Route screen are estimates (published line time spread by distance between approximate pins) and exclude waiting and the time to change trains.

- **Station opening hours: not published.** The station hero shows the line hours (first and last trains at each line's end stations), labelled as such.
- **Gate illustration is generic.** Gate layout, which street a gate faces, stairs and escalator positions and platform numbers are not published; the scene shows only the gate number, the lifts GMRC lists near that gate and (dashed, unverified) the connection the unofficial map names at that gate.
- **Amenities per station**: only lifts (with ramp) and gate counts are per-station. Everything else GMRC lists is network-wide and shown faded. Toilets, parking, ATM, Wi-Fi and shops have no data.
- **Nearby places** have no photos, distances or walking times.

## Bus, BRTS and Gandhinagar buses (GTFS)

- **Not scraped:** no internet in the build environment; only the supplied GTFS is used. GSRTC intercity buses and any agency not in the feed are absent.
- **Third-party, unofficial feed** (BLRTransit), licence unknown, valid 2026-09-30 to 2027-03-29; accuracy against real services is unverified.
- **Fares:** only BRTS (AJL) fares exist (by fare area pair). AMTS and Gandhinagar bus fares are not in the feed and are shown as unavailable; so are metro fares, so multi-mode totals are partial.
- **Scheduled, not live:** no vehicle positions or delays.
- **Metro↔bus links are estimates:** station pins are estimated (±100–250 m), so "bus stop within N m" and walking times (straight line × 1.3 ÷ 5 km/h) are approximate. 11 metro stations (Gandhinagar side and GIFT City) have no bus stop within 600 m in the feed.
- **BRTS coverage near the metro is thin:** a BRTS stop within 600 m for only 11 of 54 stations; most metro–bus connections are AMTS.
- **Bus lines on the map are partly matched, not published:** the feed's route shapes are not linked to trips. The build matches a pattern to the shape its stops lie on (≥ 90 % of stops within 80 m): 610 of 970 patterns (63 %; BRTS 132/149, AMTS 478/809, Gandhinagar 0/12). Those are drawn on the road; the other 360 are drawn as dashed straight segments between stops. A wrong match is possible and was not compared with real roads.
- **No base map:** the Bus & metro map has no tiles, streets or place names (offline); only a grid, a scale bar, the bus lines and the metro stations. Metro lines pass through *estimated* station pins and are approximate.
- **No GSRTC:** state intercity (GSRTC) buses are not in the feed. The "GSRTC" lettering on the Bus tab's animated bus is decorative.
- **Headway and offsets are summaries of the schedule:** "how often" uses the gaps between scheduled starts at a pattern's first stop; stop minutes use the most common run of the pattern. Real buses vary.
- **Dropped data:** 77 trips with impossible durations.

## Resolved by the newly supplied data

- Station **type** (elevated / underground) for 53 stations: four underground (Kankaria East, Kalupur, Gheekanta, Shahpur), the rest elevated.
- **Lifts with ramp** near gates, per station.
- **Coordinates** for all stations (as estimates).
- The East–West station-count discrepancy: the 2015 DPR table says 17, the current gate table and route map list 18 (the DPR is older). The app follows the current official sources.

## Timetable

- Per-train departure times are not stored (screenshot was too low-resolution).
- **GNLU through-running**: the timetable grid appears to show some trains continuing GNLU → GIFT City. MetroMate does not claim through-trains; it marks GNLU as an interchange per the route map and tells passengers to check the station display.
- Frequencies are subject to change (per GMRC); the app labels them as a static schedule effective 18 May 2026.

## Live location (new)

- **No live train feed**: the Live screen tracks the *rider's phone*, not trains. No train positions or arrival times are shown.
- **No cell-tower IDs**: apps cannot read them in Expo Go and iOS has no public API. "Battery saver" mode asks the OS for balanced accuracy, which may use network (cell/Wi-Fi) positioning; fixes are labelled by accuracy radius, not by source.
- **GPS is unavailable underground** (Shahpur, Ghee Kanta, Kalupur, Kankaria East). If the last position was in a tunnel, the live view shows a position **estimated** from GMRC's published line times (labelled, dashed, capped before the portal, corrected when GPS returns). On the surface, lost GPS shows "last seen" with no extrapolation. Per-station travel times are not published, so the estimate spreads each line's end-to-end time over the hops by (estimated) distance.
- **Live journey view data limits**: no track alignment (straight runs with softened corners), no tunnel portal positions (drawn mid-hop), no river/bridge, road or building data (the surroundings are procedural and illustrative), no live delays or service alerts, no transfer/walking time between platforms, no dwell times beyond the published line averages. Landmarks are chosen from station names only.
- **Foreground only**: tracking and the arrival vibration work only while the app is open.
- **Not verified on a real device** — see README.

## Network structure

- **Excluded from routing**: depots (Gyaspur, Indroda, Apparel Park Depot) and the planned/other-line placemarks on the unofficial map (Ashram Road, Koteshwar Prachin Mandir, Sabarmati River, Sardarnagar, Airport, GIFT City House, Gujarat Biotechnology University, a second "Shahpur" near GIFT City). Their operational status is unknown.

## Landmarks

All 17 landmark entries are `unverified`: the link to a station comes only from the station's own name. No walking distance, time, gate or coordinates are stored.

## Not built

- Live train status (no verified live source).
- Turn-by-turn walking directions.
- Online map tiles / interactive geographic map.
- Background tracking (needs a development build and extra permissions).
- Bundled offline cell-tower database (would need a licensed dataset and a native module).
- Gujarati/Hindi UI, step-free routing, alternative routes (the network is a tree, so each pair of stations has one route).

## Languages (Hindi and Gujarati)

- **Not reviewed by a native speaker.** The Hindi and Gujarati interface text was written by Antigravity. It follows a shared glossary and is checked automatically for script, placeholders and plurals, but tone and word choice need a native read-through before release.
- **Station, stop, place and route names, GMRC notes, fare rules, source descriptions and line names stay in English** (they come from the data). Transliterated station names in Devanagari/Gujarati are not provided, so search is English only. "Gandhinagar" is also left in Latin script inside translated labels (e.g. "Gandhinagar बस").
- **Phrases to check first:** "Yesterday" = "कल" (also means tomorrow in Hindi); the from/to labels ("कहाँ से/कहाँ तक", "ક્યાંથી/ક્યાં સુધી", and the bare "से/तक", "થી/સુધી" on pickers); "Frequency" as "अंतराल/અંતરાલ"; "Changes" tile as "बदलाव/બદલાવ"; "Rides" as "सवारी/સવારી"; peak/non-peak hours; "Phase" as "फेज़/ફેઝ"; amenity names (tactile path, low counter, accessible toilets, braille lifts); "how often" and band names on the bus route screen; "Maps" button; the long Gujarati exits chip; "Quick routes" (transliterated); the explanatory sentences on the station Gates/Amenities/Nearby cards and the three journey-time notes on the route screen.
- **Not verified on a device:** Devanagari/Gujarati glyph rendering and line heights on real Android/iOS fonts; locale detection (`Intl`) on a phone.
