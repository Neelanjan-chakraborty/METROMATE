# Data gaps

Everything below is **unknown** in MetroMate. The app shows "not verified yet" or "unavailable" instead of guessing. To fill a gap, edit the matching file in `data/` (see README, "Adding verified data") and run `npm test`.

## Blocking features

| Gap | Effect in the app | How to close it |
|---|---|---|
| **Fare amounts / tariff rule** | Every route shows "Fare unavailable offline". | Add verified pairs (or a verified tariff) from GMRC to `data/fares.json`. |
| **Per-station travel times** | No journey-time figure. Only the published end-to-end time per line is shown, labelled as such. | Add `estimatedTravelMinutes` to connections once published or measured; the journey-time module sums them only if every hop has a value. |
| **Hidden start of the Phase-1/Phase-2 fare-rule bullet** | Routes crossing Motera Stadium ↔ Koteshwar Road show a neutral warning quoting the visible text. | Get the full sentence from the GMRC Fare Rules page and update `data/fare-rules.json` and the warning in `src/lib/routing.ts`. |

## Station-level data

- **Coordinates** (all 54 stations): none. No maps tiles or geographic features are used. Each station page offers an optional online "Search in Maps" link.
- **Entry/exit gates**: `data/gates.json` is empty. A gate number must never be treated as proof of a street direction; `verifiedDirection` is separate from `publishedDescription`.
- **Platforms and boarding sides**: none. The route screen tells passengers to look for "Towards <terminal>" signs instead.
- **Lifts / step-free access per station**: unknown; GMRC's facilities page is a network-wide gallery. The optional "prefer step-free routes" feature is therefore **not implemented**, because it would require verified per-station lift data.
- **Station type** (elevated / underground): unknown. (The interactive map draws some segments dashed, which may mean underground, but this was not treated as verification.)
- **Integration icons** (BRTS, AMTS, railway) on the route map: not transcribed; positions were ambiguous at screenshot resolution.
- **Gujarati / Hindi names**: visible on the route map, not transcribed (risk of typos); search is English-only.

## Timetable

- Per-train departure times are not stored (screenshot too low-resolution, partly hidden).
- **GNLU through-running**: the timetable grid appears to show some trains continuing GNLU → GIFT City and the GIFT City branch also has its own line timings (6 min, 5.8 km; bus-only 10:18–16:06). MetroMate does not claim through-trains; it marks GNLU as an interchange per the route map and tells passengers to check the station display.
- Frequencies are subject to change (per GMRC); the app labels them as a static schedule effective 18 May 2026.

## Network structure

- **East–West station count**: the route map shows 18 stations (Thaltej Gam to Vastral Gam); some secondary sources list 17 or 19. The app follows the official map. The order around the Kankaria East → Kalupur → Ghee Kanta → Shahpur bend was read by eye and matches the interactive-map links.
- **Excluded from routing**: depots (Gyaspur, Indroda, Apparel Park Depot) and the extra stations on GMRC's interactive map that are not on the official route map (Ashram Road, Koteshwar Prachin Mandir, Sabarmati River, Sardarnagar, Airport, GIFT City House, Gujarat Biotechnology University). Their operational status is unknown.
- **Sabarmati Railway Station** is on the route map; some secondary sources suggested it may not have been in service at one time. MetroMate follows the supplied official map and does not track opening status.

## Landmarks

All 17 landmark entries are `unverified`: the link to a station comes only from the station's own name (e.g. "Gujarat University" station). No walking distance, time, gate or coordinates are stored.

## Not built

- Live train status (no verified live source).
- Turn-by-turn walking directions.
- Online map tiles / interactive geographic map.
- Gujarati/Hindi UI, step-free routing, alternative routes (the network is a tree, so each pair of stations has one route).
