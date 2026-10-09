# Data gaps

Updated after the project team supplied the GMRC gate table, a Google My Maps KML export and two PDFs (see `research-sources.md`). The app shows "not verified yet" or "unavailable" for everything below instead of guessing. To fill a gap, edit the matching file in `data/` (see README, "Adding verified data") and run `npm test`.

## Still blocking features

| Gap | Effect in the app | How to close it |
|---|---|---|
| **Fare amounts / tariff rule** | Every route shows "Fare unavailable offline". (The supplied "entry-exit gate" page and PDFs contain no fares.) | Add verified pairs (or a verified tariff) from GMRC's route-and-fares page / app to `data/fares.json`. |
| **Per-station travel times** | No journey-time figure. Only the published end-to-end time per line is shown, labelled as such. The older route PDF has run times, but it is undated and superseded. | Add `estimatedTravelMinutes` to connections once published or measured. |
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
- **GPS is unavailable underground**, so there is no position between Apparel Park and Old High Court (the underground stretch). The app says "signal lost" and shows the last position; it never extrapolates, because no verified per-station travel times exist.
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
