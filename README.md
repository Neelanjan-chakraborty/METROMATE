# MetroMate — Offline Metro Companion

An offline-first React Native (Expo) app for the **Ahmedabad–Gandhinagar Metro**, built for *Road to DevFest: Metro Hacks* (GDG Gandhinagar). Pick a start and destination; MetroMate shows the route, which way the train is heading, where to change, and what it does and doesn't know — with no backend, API key, account or network request.

> **Data honesty:** network structure, timings, station types, gate numbers and lifts come from official GMRC material. Station **coordinates are estimates** from an unofficial Google My Maps export. Fares, gate directions, platforms and per-station travel times are **not** in the dataset yet, and the app says so instead of guessing. See [`docs/data-gaps.md`](docs/data-gaps.md).

## Run it

Requires Node 22+ (the tests use Node's built-in SQLite) and the **Expo Go** app on your phone (SDK 57).

```bash
npm install
npm start          # scan the QR code with Expo Go
```

Other commands:

```bash
npm test               # unit + SQLite persistence tests (Jest)
npm run validate:data  # dataset consistency checks only
npm run typecheck      # tsc --noEmit
npm run lint           # ESLint (eslint-config-expo)
npm run export:android # confirm the Android bundle builds
npm run web            # optional browser preview (storage falls back to memory)
```

The web preview is a development convenience only: `expo-sqlite` has no web build here, so favourites/recents are not persisted there. The real target is Expo Go / a device.

## What it does

- **Live** — a “Find My Train”-style locator for *you*: reads the phone’s GPS (no internet needed), says which station you’re at or between, follows your progress along a chosen journey (next stop, stops to go, arriving alert), and handles signal loss honestly. See “Live location” below.
- **Plan** — searchable station pickers (names, aliases such as "PDPU" or "Secretariat", and place names such as "Akshardham Temple"), swap, favourites, recent journeys, offline badge.
- **Route** — stops, changes, vertical station timeline, "Board the train towards …" derived from the line's station order, "Change trains at …" steps, optional collapsed stops, published (static) first/last train and frequency per line used, ticket rules from GMRC, data-confidence note, save, reverse, show on map.
- **Map** — an original schematic drawn by the app from the station data (not a copy of GMRC's map): three corridors, interchanges, start/destination markers, highlighted journey, zoom.
- **Stations** — directory with search and line filters; station page with neighbours (and direction), gates/platforms/lifts status ("not verified yet"), network-wide facility list (clearly not station-specific), nearby places, source and freshness.
- **Saved** — favourites and recents (open, reverse, remove, clear), dataset info, **Reset local data**.
- **Data & sources** — every source, its limits, and what is unavailable.

### Network covered (54 stations)

North–South corridor APMC ↔ Mahatma Mandir (35 stations incl. Motera Stadium, Koteshwar Road, GNLU, Infocity, Sachivalaya, Akshardham, Sector-16/24); GIFT City branch GNLU ↔ PDEU ↔ GIFT City; East–West corridor Thaltej Gam ↔ Vastral Gam (18 stations). Interchanges: **Old High Court** and **GNLU**.

## Live location

The **Live** tab uses `expo-location` (foreground only) and works in airplane mode, because GPS needs no data connection and the station map is stored on the device.

- **Where am I?** The latest fix is matched against the stored station coordinates: *At X*, *Between X and Y (n %)*, *Near X*, or *Not on a metro line*. Every answer carries the fix’s accuracy radius and is never more precise than it.
- **Journey tracking:** choose a start and destination (or tap **Track live** on a route). MetroMate shows the next stop, stops to go, distance to the next station, and warns if you are off the route or moving the wrong way. Optional vibration alert near the destination while the app is open.
- **GPS vs cell towers:** the OS chooses the positioning source. MetroMate cannot read cell tower IDs (not possible in Expo Go; iOS has no public API). **Battery saver** asks for balanced accuracy so Android may use Wi‑Fi/cell positioning; fixes are labelled by accuracy (GPS-class, good, approximate/network-assisted, too inaccurate).
- **Underground (Kankaria East, Kalupur, Gheekanta, Shahpur) and signal loss:** GPS drops; the app says so, shows the last position, and offers **I’m here** check-ins. It never extrapolates a position — there are no verified per-station travel times.
- **Station positions:** pins come from an unofficial map (estimated). On the Live tab, standing at a station you can **record** your GPS position (needs ±50 m or better; repeated fixes are averaged and preferred over the pin). Recorded positions stay on the phone, survive restarts, and can be **shared as JSON** to improve the dataset.
- **Demo ride:** steps through a chosen journey automatically, clearly labelled *simulated*, so the feature can be shown without riding.
- **Not included:** other trains’ positions or arrival times (there is no live feed), background tracking, turn-by-turn walking.

## How offline works

- All code and data are bundled in the app. Route calculation, search, fares lookup and the map are pure local code (`src/lib`).
- On first launch the bundled dataset is written to an on-device **SQLite** database (`expo-sqlite`); the app then reads its station/connection data back from SQLite. Favourites and recents live in the same database. Bumping `data/dataset.json` → `version` re-seeds the dataset and keeps user data.
- If the database can't open, the app falls back to the bundled data and tells the user saved routes won't persist.
- The only network-dependent features are two optional links ("Search in Maps", "Open GMRC website"), labelled *needs internet*. There is no live train status.

## Project layout

```
data/                       dataset (source of truth after first generation)
  stations, connections, corridors, gates, landmarks, fares,
  fare-rules, timetable-metadata, facilities, sources, dataset .json
scripts/generate-initial-data.mjs   ORIGINAL one-shot generator. Do NOT re-run: it would discard the imports below.
scripts/import-coordinates.mjs      KML -> station coordinates (+ gate connectivity notes)
scripts/import-gates.mjs            GMRC gate table -> gates, station type, lifts
src/app/                    Expo Router screens (tabs: Plan, Map, Stations, Saved; route, station/[id], data)
src/components/             UI pieces (timeline, map, station picker …)
src/lib/                    routing, fareCalculator, journeyTime, search, schematic, dataValidation, dataset
src/db/                     SQLite repository (testable against node:sqlite) + expo-sqlite opener
src/state/AppProvider.tsx   loading, database, favourites/recents, online status
docs/                       research-sources, data-gaps, demo-script
```

## Routing rules

BFS-equivalent least-stops search over (station, line) states with fewer changes as tie-break. Connections exist only between stations adjacent on a line, in both directions. Direction labels come from the line's station order. Platform/boarding side is never inferred. Fares come only from verified pairs; journey time only from verified per-hop times. Both are currently absent, so both display "unavailable".

## Adding verified data

Edit the JSON in `data/`, then `npm test` (it validates the dataset) and bump `version` in `data/dataset.json` so existing installs re-seed.

- **Fares** — append to `fares.json` → `pairs`: `{ fromStationId, toStationId, amountInr, fareType, validFrom, sourceUrl, verifiedAt, verificationStatus: "verified" }` and set `status` to `"available"`.
- **Coordinates** — `node scripts/import-coordinates.mjs <export.kml>` re-imports from a KML (stored as `estimated`). To use surveyed/official values, set `latitude`, `longitude`, `coordinateStatus: "verified"` and `coordinateSourceId` on a station.
- **Gates** — update `data/source/gates-table.json`, then `node scripts/import-gates.mjs`. Gate directions go in `verifiedDirection` only once independently verified.
- **Travel times** — set `estimatedTravelMinutes` on each connection (both directions); journey time appears only when every hop on the route has one.

## Status

### Implemented
Route planning; interchange and direction logic; station search with aliases and landmarks; fare lookup (no verified fares yet); static timetable info; SQLite storage with favourites, recents, reset; original SVG-based map; station details; data/sources screen; data validation.

### Tested
- **104 automated tests pass** (`npm test`): routing (including all 2,862 ordered station pairs and their reverses, interchanges at Old High Court and GNLU, same-station, unknown ids, no-route, dangling connections, Sabarmati Railway Station warning), fare and journey-time honesty, search aliases, the schematic layout, dataset validation including negative cases (the real gate/lift/coordinate data), the **live-location engine** (at-station / between / near / off-network, accuracy gating, journey progress, arriving/arrived, off-route, partial coverage, signal loss, wrong-way detection, position-source priority, averaging of recorded fixes) and the SQLite repository (seeding, re-seeding, favourites, recents, recorded station positions, reset, and **persistence after closing and reopening the database**) run against a real SQLite engine.
- `tsc --noEmit` clean; Android bundle exports (`expo export --platform android`).
- A **web preview in headless Chromium at a 390×844 viewport** was driven through plan → route → favourite → map → station → offline emulation, and through the Live tab with **emulated GPS positions** (Playwright geolocation): at a station, mid-line, coarse fix, off-network, recording and averaging a station position, the demo ride, lost signal after 70 s (fake clock), and permission denied — 21/21 checks, no console errors. That confirms layout and logic. Emulated geolocation and browser network emulation are **not** a real GPS or airplane mode on a phone.

### Not verified
- **Live location on a real device was not tested** — real GPS accuracy in Ahmedabad, underground behaviour, the precision modes and the arrival vibration need a phone ride. The station pins are estimates, so real-world “at station” detection may need the recorded positions.
- **Airplane mode on a real device was not performed.** Persistence across app restarts on a device and the Expo Go experience are untested here; `docs/demo-script.md` has the checklist.
- Acceptance tests that need a device (airplane-mode shell reload, real-device refresh persistence) remain for you to run. Service-worker/PWA caching no longer applies: the app is native, with assets and data bundled in the binary.

### Known limitations
- No fares, journey-time estimates, gate directions or platforms; station coordinates are estimates; lift working status is unknown (see `docs/data-gaps.md`).
- Live tracking is foreground-only, tracks the rider (not trains), and cannot read cell tower IDs.
- Some Phase-1/Phase-2 ticketing text was not available; a neutral warning is shown on those routes.
- English search only; landmark links come from station names and are unverified.
- Optional step-free routing and alternative routes are not implemented (the former needs verified lift data; the network is a tree, so there is one route per pair).
- Web build has no persistent storage.
