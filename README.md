# MetroMate — Offline Metro Companion

An offline-first React Native (Expo) app for the **Ahmedabad–Gandhinagar Metro**, built for *Road to DevFest: Metro Hacks* (GDG Gandhinagar). Pick a start and destination; MetroMate shows the route, which way the train is heading, where to change, and what it does and doesn't know — with no backend, API key, account or network request.

> **Data honesty:** network structure and train timings come from official GMRC material. Fares, gates, platforms, lifts per station, coordinates and per-station travel times are **not** in the dataset yet, and the app says so instead of guessing. See [`docs/data-gaps.md`](docs/data-gaps.md).

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

- **Plan** — searchable station pickers (names, aliases such as "PDPU" or "Secretariat", and place names such as "Akshardham Temple"), swap, favourites, recent journeys, offline badge.
- **Route** — stops, changes, vertical station timeline, "Board the train towards …" derived from the line's station order, "Change trains at …" steps, optional collapsed stops, published (static) first/last train and frequency per line used, ticket rules from GMRC, data-confidence note, save, reverse, show on map.
- **Map** — an original schematic drawn by the app from the station data (not a copy of GMRC's map): three corridors, interchanges, start/destination markers, highlighted journey, zoom.
- **Stations** — directory with search and line filters; station page with neighbours (and direction), gates/platforms/lifts status ("not verified yet"), network-wide facility list (clearly not station-specific), nearby places, source and freshness.
- **Saved** — favourites and recents (open, reverse, remove, clear), dataset info, **Reset local data**.
- **Data & sources** — every source, its limits, and what is unavailable.

### Network covered (54 stations)

North–South corridor APMC ↔ Mahatma Mandir (35 stations incl. Motera Stadium, Koteshwar Road, GNLU, Infocity, Sachivalaya, Akshardham, Sector-16/24); GIFT City branch GNLU ↔ PDEU ↔ GIFT City; East–West corridor Thaltej Gam ↔ Vastral Gam (18 stations). Interchanges: **Old High Court** and **GNLU**.

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
scripts/generate-initial-data.mjs   one-shot generator (re-running overwrites data/)
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
- **Gates** — append to `gates.json`: `{ id, stationId, gateNumber, publishedDescription, verifiedDirection (null until independently verified), accessibilityNotes, sourceUrl, verificationStatus }`. Keep the published description separate from the verified direction.
- **Coordinates** — set `latitude`, `longitude` and `coordinateStatus` (`verified`/`estimated`) on a station.
- **Travel times** — set `estimatedTravelMinutes` on each connection (both directions); journey time appears only when every hop on the route has one.

## Status

### Implemented
Route planning; interchange and direction logic; station search with aliases and landmarks; fare lookup (no verified fares yet); static timetable info; SQLite storage with favourites, recents, reset; original SVG-based map; station details; data/sources screen; data validation.

### Tested
- **56 automated tests pass** (`npm test`): routing (including all 2,862 ordered station pairs and their reverses, interchanges at Old High Court and GNLU, same-station, unknown ids, no-route, dangling connections), fare and journey-time honesty, search aliases, the schematic layout, dataset validation including negative cases, and the SQLite repository (seeding, re-seeding, favourites, recents limit, clear, reset, and **persistence after closing and reopening the database**) run against a real SQLite engine.
- `tsc --noEmit` clean; Android bundle exports (`expo export --platform android`).
- A **web preview in headless Chromium at a 390×844 viewport** was driven through plan → route → favourite → map → station → offline emulation. That confirms layout and logic, with no console errors. Browser network emulation is **not** the same as airplane mode on a phone.

### Not verified
- **Airplane mode on a real device was not performed.** Persistence across app restarts on a device and the Expo Go experience are untested here; `docs/demo-script.md` has the checklist.
- Acceptance tests that need a device (airplane-mode shell reload, real-device refresh persistence) remain for you to run. Service-worker/PWA caching no longer applies: the app is native, with assets and data bundled in the binary.

### Known limitations
- No fares, journey-time estimates, coordinates, gates, platforms, per-station lift data or station type (see `docs/data-gaps.md`).
- Some Phase-1/Phase-2 ticketing text was not available; a neutral warning is shown on those routes.
- English search only; landmark links come from station names and are unverified.
- Optional step-free routing and alternative routes are not implemented (the former needs verified lift data; the network is a tree, so there is one route per pair).
- Web build has no persistent storage.
