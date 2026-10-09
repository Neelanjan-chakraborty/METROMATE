# Research sources

Checked: **2026-10-09**. Dataset version: `2026.10.09-1`.

## How the research was done (and its limits)

The build environment's network policy **blocked `www.gujaratmetrorail.com`** (HTTP 403 on the proxy tunnel), and Wikipedia and OpenStreetMap hosts did not resolve. No access control was bypassed. Instead, the project team supplied **screenshots and markup taken from the official GMRC website**, and those are the primary source for every operational fact in the app. Web-search summaries of secondary sources were used only to cross-check station counts; **no data was copied from them** (see "Consulted but not used").

Everything transcribed from a screenshot was read by eye. Treat "verified" in the dataset as "matches the official GMRC material supplied on the date above", not as an independent field survey.

## Sources used

| # | Source | URL | Type of data | Checked | Limitations |
|---|---|---|---|---|---|
| 1 | GMRC Route Map (Gujarati / Hindi / English) | https://www.gujaratmetrorail.com/ (exact page not recorded) | Corridors, station names and order, interchanges (GNLU, Old High Court), legend lengths (41.71 km, 5.42 km, 21.16 km) | 2026-10-09 | User-supplied screenshot, fairly low resolution. No coordinates, gates, platforms, fares. Gujarati/Hindi names not transcribed. |
| 2 | GMRC interactive route map (SVG markup) | https://www.gujaratmetrorail.com/ (exact page not recorded) | GMRC station codes (e.g. `OHCI`, `GNLU`) and adjacent-station links; confirms the order read from source 1 | 2026-10-09 | Used for codes and adjacency only. It also contains stations/lines that are **not** on the official route map (Ashram Road, Koteshwar Prachin Mandir, Sabarmati River, Sardarnagar, Airport, GIFT City House, Gujarat Biotechnology University); these are excluded. Its pixel layout is not reused; MetroMate draws its own schematic. |
| 3 | GMRC Train Information | https://www.gujaratmetrorail.com/ahmedabad/train-information/ | Frequency bands, first/last train, end-to-end time and distance per line, effective 18/05/2026; page footer "Last Updated on 05-Oct-2026" | 2026-10-09 | User-supplied screenshot. The per-train timetable grid is low resolution and partly hidden by a navigation bar, so **per-train times are not stored**. |
| 4 | GMRC Fare Rules | https://www.gujaratmetrorail.com/ahmedabad/fare-rules/ | Fare media, products, selected rules, Phase-1/Phase-2 wording | 2026-10-09 | User-supplied screenshot. **No fare amounts.** The start of the Phase-1/Phase-2 bullet is hidden by a navigation bar. |
| 5 | GMRC Facilities (passengers / differently abled passengers) | https://www.gujaratmetrorail.com/ (exact page not recorded) | Network-wide facility categories | 2026-10-09 | Photo galleries only; does not say which station has which facility. |
| 6 | GMRC Information of Entry-Exit Gate at Entrance | https://www.gujaratmetrorail.com/ahmedabad/information-of-entry-exit-gate-at-entrance/ | Station type (elevated/underground), operational gate numbers and lifts with ramp near gates, for 53 stations | 2026-10-09 | PDF printout (page footer: last updated 05-Oct-2026), table extracted programmatically; Gheekanta and Kalupur corrected by viewing the rendered PDF. **Gate numbers only, no gate directions.** Sabarmati Railway Station is not listed. Lift working status not published. Shahpur lists Gate 3 twice. |
| 7 | Google My Maps "Ahmedabad Metro Rail" (KML + CSV export) | https://www.google.com/maps/d/viewer?mid=1ebnAmbRUbMyI_quB06reRZWcyfcLF8M | Station coordinates; gate connectivity notes (BRTS/GSRTC/railway) | 2026-10-09 | **Unofficial** map: coordinates stored as `estimated`. The KML and the CSV carry identical coordinates. The first KMZ supplied was only a NetworkLink to this live map, and the network policy blocked fetching it, so the full KML export was supplied instead. Planned-line placemarks are ignored. |
| 8 | GMRC route/timing sheet (older PDF) | https://www.gujaratmetrorail.com/ | Older frequency/run-time table | 2026-10-09 | Undated and superseded by source 3: **not used** for timings. Its blank cell for "Sabarmati Rly. Station" is consistent with that station not being in service. |
| 9 | MEGA "Alignment of Ahmedabad Metro Rail Project Phase I" (DPR, March 2015) | https://www.gujaratmetrorail.com/reports/ | Phase I alignment drawing: elevated vs underground lengths and station counts | 2026-10-09 | 2015 planning document, used only as corroboration that four East–West stations are underground and that Sabarmati Railway Station was planned. Its table says 17 East–West stations (current sources list 18). |

## Requested sources not inspected

| Source | URL | Status |
|---|---|---|
| Route and fares | https://www.gujaratmetrorail.com/ahmedabad/route-and-fares/ | Not reachable from the build environment; no fare chart supplied. |
| Know your stations | https://www.gujaratmetrorail.com/ahmedabad/know-your-stations/ | Not reachable; no per-station data supplied. |
| Reports / alignment maps | https://www.gujaratmetrorail.com/reports/ | Not inspected. |
| Phase II route map PDF | https://www.gujaratmetrorail.com/wp-content/uploads/Reports/Phase-II-Map-Final.pdf | Not inspected. |
| Multimodal integration | https://www.gujaratmetrorail.com/mmi-2/ | Not inspected. |
| OpenStreetMap, copyright, tile policy | https://www.openstreetmap.org/ , https://www.openstreetmap.org/copyright , https://operations.osmfoundation.org/policies/tiles/ | Not reachable. **No OSM data or tiles are used.** No coordinates are stored. |
| Official journey planner | (GMRC site) | Not inspected; no API was assumed. |

## Consulted but not used as data

Web-search summaries (Wikipedia list/line articles, news items, a GMRC press release repost, third-party fare sites such as Yometro) were read only to sanity-check station counts. Third-party fare figures (e.g. ₹25 for Motera Stadium–Sector 24) are **not** in the app: they are not GMRC-verified, so every route shows "Fare unavailable offline".

## Which dataset fields depend on which source

| Dataset file / field | Source |
|---|---|
| `corridors.json` (names, colours, lengths, sequence) | 1 (order cross-checked with 2) |
| `stations.json` id (GMRC code), name, sequence, `isInterchange` | 1 and 2 |
| `stations.json` `phase` (1 or 2) | 4 (phase wording) |
| `stations.json` `stationType`, `lifts`; `gates.json` | 6 (gate numbers and lifts); direction deliberately null |
| `stations.json` `latitude`/`longitude` (status `estimated`), `nearbyConnections` | 7 (unofficial; cross-checked: 54/54 matched, adjacent stations 571 m–2.5 km apart) |
| `stations.json` `aliases` | Spelling variants seen across sources 1–3, plus common alternative names (e.g. "Narendra Modi Stadium", "Secretariat"). Aliases are search aids only, not operational facts. |
| `connections.json` adjacency and direction labels | 1 and 2; direction label derived from corridor terminals |
| `timetable-metadata.json` | 3 |
| `fare-rules.json` | 4 |
| `facilities.json` | 5 |
| `landmarks.json` | **Inferred from official station names only**; all `unverified` |
| `fares.json` | Empty: no verified fare data |

## Fields that still require manual verification

- Fare amounts / tariff rule (source: route-and-fares page, GMRC app, ticket windows).
- Station coordinates (currently estimated from an unofficial map; replace with surveyed/official values).
- Gate directions (street or landmark each gate faces), platform numbers and boarding sides; lift working status.
- Station type for Sabarmati Railway Station, and whether it is in service.
- Per-station travel times (needed for journey-time estimates).
- The hidden start of the Phase-1/Phase-2 fare-rule bullet.
- Whether trains run through GNLU to GIFT City (see `data-gaps.md`).
- Exact page URLs for sources 1, 2 and 5.
- Gujarati and Hindi station names (visible on the route map, not transcribed).
- Landmark associations and walking distances.
