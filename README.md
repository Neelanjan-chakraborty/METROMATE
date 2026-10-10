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
- **Route** — see “Route screen” below.
- **Map** — an original schematic drawn by the app from the station data (not a copy of GMRC's map): three corridors, interchanges, start/destination markers, highlighted journey, zoom.
- **Stations** — directory with search and line filters; station page with neighbours (and direction), gates/platforms/lifts status ("not verified yet"), network-wide facility list (clearly not station-specific), nearby places, source and freshness.
- **Saved** — favourites and recents (open, reverse, remove, clear), dataset info, **Reset local data**.
- **Data & sources** — every source, its limits, and what is unavailable.

### Network covered (54 stations)

North–South corridor APMC ↔ Mahatma Mandir (35 stations incl. Motera Stadium, Koteshwar Road, GNLU, Infocity, Sachivalaya, Akshardham, Sector-16/24); GIFT City branch GNLU ↔ PDEU ↔ GIFT City; East–West corridor Thaltej Gam ↔ Vastral Gam (18 stations). Interchanges: **Old High Court** and **GNLU**.

## Home screen design

The Plan (Home) screen follows a supplied design reference: lavender-white background, electric-violet primary (`#4F35E8`), a living vector skyline-and-metro hero (below), a journey card with a swap button, soft-illustrated shortcut cards, Quick routes, Recent trips and a custom bottom tab bar. All artwork is original vector drawing (`src/components/home/art.tsx`, custom train icon in `icons.tsx`), no raster images, so it works offline and scales crisply. Sizes are drawn for a 430 dp phone and scale down proportionally on narrower screens (checked at 430, 390 and 360 dp).

Where the reference showed placeholder content, the app shows **real data instead of inventing it**:
- **Recent trips** are the journeys you actually looked up, read from the on-device database. Line chips use the real corridors (North–South, East–West, GIFT City), “Today / Yesterday” comes from the saved time, and the right-hand figure is GMRC's published journey time once fares are imported, otherwise the stop count. With no trips yet, the card says so. (The reference's example trips use stations and lines that do not exist on this network.)
- **Living hero.** The sky, horizon glow, sun/moon, stars, clouds and city lights follow the phone's local clock (`src/lib/skyPalette.ts`, pure keyframe interpolation: dawn about 06:00, full day 10:00–16:00, golden hour 18:00, dusk 19:00, night after 21:30). Window lights switch on gradually through the evening, the train's windows and headlight glow after dark, and the MetroMate title and status-bar icons flip between navy and white so they stay readable. The metro glides across the viaduct on a loop, pauses, then comes back (`src/components/home/Hero.tsx`, React Native `Animated` on the native driver). Animation stops when you leave the Home tab or background the app, and with the system **Reduce motion** setting the train and clouds stay still while the colours still follow the time. This is decoration only: it does not represent live train positions or the real timetable. To preview any time, open Home with `?sky=HH:MM` (for example `/?sky=19:20` in the web build or `metromate:///?sky=02:00` via a link).
- **Quick routes** (Home / Campus / Work) are real shortcuts: choose two stations in the journey card, then tap an empty shortcut to save them. Tap a saved one to open it, or use its × to remove it. They are stored on the device.
- The header pill reads “Offline ready” because routes, search and saved journeys are stored on the phone; the app's online/offline state is still shown on the other tabs.

Typography uses the system font (SF Pro on iOS, Roboto on Android). Secondary text uses the reference's slate (`#78839D`); on white this is below the 4.5:1 contrast recommended for small text, so it is used only for secondary labels.

## Live location

The **Live** tab uses `expo-location` (foreground only) and works in airplane mode, because GPS needs no data connection and the station map is stored on the device.

- **Where am I?** The latest fix is matched against the stored station coordinates: *At X*, *Between X and Y (n %)*, *Near X*, or *Not on a metro line*. Every answer carries the fix’s accuracy radius and is never more precise than it.
- **Journey tracking:** choose a start and destination (or tap **Track live** on a route) and press **Start live tracking** to open the full-screen **live journey view** (below). It shows the next stop, stops to go, distance to the next station, and warns if you are off the route or moving the wrong way. Optional vibration alert near the destination while the app is open.
- **GPS vs cell towers:** the OS chooses the positioning source. MetroMate cannot read cell tower IDs (not possible in Expo Go; iOS has no public API). **Battery saver** asks for balanced accuracy so Android may use Wi‑Fi/cell positioning; fixes are labelled by accuracy (GPS-class, good, approximate/network-assisted, too inaccurate).
- **Underground (Kankaria East, Kalupur, Gheekanta, Shahpur) and signal loss:** GPS drops; the app says so, shows the last position, and offers **I’m here** check-ins. It never extrapolates a position — there are no verified per-station travel times.
- **Where am I? card:** shows the real result of the locator and nothing invented. Off the network it names the nearest station with the straight-line distance and a **~walking time at about 5 km/h** (an estimate: it ignores roads). “Get directions” opens a maps app with walking directions to that station's (estimated) pin, so it needs internet and is the one online-only link on this screen. “Use my current location” sets your start to the nearest station.
- **Live header:** the same hero as Home, but the train descends the viaduct, brakes into a station canopy, waits, then rolls away (`mode="arrive"` in `Hero.tsx`). The sky and lights follow the clock; reduced motion keeps the train resting at the station.
- **Station positions:** pins come from an unofficial map (estimated). On the Live tab, standing at a station you can **record** your GPS position (needs ±50 m or better; repeated fixes are averaged and preferred over the pin). Recorded positions stay on the phone, survive restarts, and can be **shared as JSON** to improve the dataset.
- **Demo ride:** steps through a chosen journey automatically, clearly labelled *simulated*, so the feature can be shown without riding.
- **Not included:** other trains’ positions or arrival times (there is no live feed), background tracking, turn-by-turn walking.

### Live journey view

Pressing **Start live tracking** opens a full-screen illustrated canvas (`src/components/journey/`). Everything on it is drawn with `react-native-svg`; there are no map tiles or images, so it works offline.

- **The train is you.** A top-down metro train (three carriages, cab, headlights, direction chevron) sits on the route at *your* position, from GPS, a check-in or the demo. MetroMate has **no live train feed**, so it never shows another train and the view says so. The header chip tells you the source: *GPS live*, *Check-in*, *Last seen*, *Estimated* (dashed halo) or *Demo*.
- **Real geometry.** Stations are placed from the station pins (estimated); the track between them is drawn straight with softened corners (GMRC's real alignment isn't in the data); the camera follows the train and looks ahead to the next station. Completed route glows violet, the rest stays soft in the corridor colour. Stations are miniature structures (canopy, platforms, entrance, footbridge); interchanges get a crossing canopy and a badge; the destination has a flag; some stations get a landmark chosen **from the station's name only** (e.g. a stadium at Motera Stadium).
- **Tunnels.** The dataset's four underground stations (Shahpur to Kankaria East) give the tunnel hops. Entering a tunnel fades the city to a lit underground cutaway; leaving it brings the surface back. Portals between an underground and an elevated station are drawn **at the middle of the hop, an approximation**, because their real positions aren't known.
- **Surroundings are illustrative.** Streets, blocks, parks, trees and flyovers are generated procedurally (`cityDecor.ts`), seamless across tiles and kept clear of the route. They are not a street map. Clouds drift with parallax, a time-of-day tint follows the clock, and everything respects **Reduce motion** (the camera and train then snap instead of tweening) and pauses when the screen isn't focused.
- **ETA you can trust.** `src/lib/eta.ts` spreads GMRC's published end-to-end time for each line over the hops in proportion to the distance between the (estimated) pins, or uses GMRC's calculator time for the pair if one has been imported. It is then nudged by your own pace once you're moving, with smoothing and a dead-band so it doesn't jump. It is always labelled an estimate (*GMRC published times*, *GMRC calculator time*, or *adjusted to your pace*); when you fall 3+ minutes behind the first estimate it says "Your arrival time has been updated". **Not included:** time to change trains, dwell beyond the line averages and live service delays; there is no verified data for them. Speed appears **only** when the phone reports a fresh, accurate one, otherwise it is omitted.
- **Underground GPS loss.** If your last position was inside a tunnel, the train keeps moving at the published pace until GPS should return (never past the portal), clearly labelled *Estimated position*, and corrects when GPS comes back. On the surface, lost GPS shows *last seen*; nothing is guessed.
- **States.** Waiting for a position, permission denied, location unavailable, stale and lost signal, off route, wrong direction, offline, demo, and "illustration unavailable" (the travel information still works if the canvas fails or station positions are missing).
- **Controls.** Close (keeps tracking; reopen from the Live page), zoom/recenter, mute the arrival alert, an expandable stop list with estimated times and "I'm here" check-ins, the demo ride, and End.

## App icon and launch video

- **Icons.** `assets/ios/` and `assets/android/` hold the supplied artwork. Expo generates the native icon sets itself (Continuous Native Generation: no `ios/` or `android/` folders are committed), so `python3 scripts/build-app-assets.py` derives what `app.json` points at: `assets/icon.png` (1024, full-bleed and opaque, because iOS applies its own corner mask), the Android adaptive icon (`android-icon-background.png` and `-foreground.png`, background colour `#2E24D6`), a glyph-only `android-icon-monochrome.png` for themed icons, and `favicon.png`. Re-run it if the artwork changes.
- **Launch video.** Every cold start of the native app plays the first **6 seconds** of `assets/splash.mp4` full screen (`src/components/SplashVideo.tsx`, `expo-video`), then fades into the app, which keeps loading underneath. It is muted (the file has a soundtrack; set `SPLASH_MUTED` to `false` to hear it), has no controls, and never blocks the app: a playback error, or a video that doesn't start, ends it after at most `6 s + 2.5 s`. The native splash is the video's first frame on iOS (`assets/splash-frame.png`) and the app icon on the brand colour on Android 12+, which can't show a full-screen image. The web preview skips the video. In Expo Go you see Expo Go's own splash first.
- Not verified here: playback on a real iPhone or Android phone (the video logic is covered by unit tests with a mocked player; a headless browser can't decode the H.264 file or autoplay it).

## Route screen

Built for a quick read: icons and short labels first, the detail behind a tap.
- **Header** reuses the animated Home hero (time-of-day sky). **Summary card**: From / To with line names, a proportional line overview (the change shown as a node), and four icon tiles: estimated minutes, stops, changes, fare (`N/A` when GMRC's fare isn't stored).
- **Train timings** (violet card): how often trains run **right now**, the **first** and **last** train, "Running now / Starts 06:20 / Ended for today", and the direction ("Towards …"). A switch appears when the trip uses more than one timetable line (e.g. Line 2 then Line 1). These come from GMRC's published schedule using structured time windows added to `data/timetable-metadata.json` (`frequency[].when`). It says "GMRC schedule, not live" on the card: MetroMate has **no live train feed**, so it never shows a "next train in N min" or platform number. First/last times are those of the terminal the train leaves from.
- **Journey**: start, change and destination are **photo banners** (the station's bundled photo, or the drawn illustration, fading into violet), with the line, exits count and estimated minutes. Stops in between are slim rows (collapsed when more than 4), and each stretch has a chip: line → direction · stops.
- **Estimated minutes** per stop: GMRC's published line time spread over the hops by distance between the (approximate) station pins, or scaled to GMRC's calculator time when stored. They exclude waiting and changing trains, are labelled estimates, and are omitted if a hop has no published line.
- **Warnings** (e.g. the Phase-1 / Phase-2 ticket rule) are one-line headings that open to the full text. **Train schedule**, **Ticket rules & fares** and **Good to know** (platforms, exits, how minutes are worked out) are collapsed sections.
- **Action bar**: reverse, map, share (system share sheet, plain-text summary), and Start tracking (opens Live with the route filled in).
- Not verified: behaviour on a real phone (share sheet, animation frame rate). The "non-peak" bands for Line 1 are read as the service hours that are neither peak nor in GMRC's 20-minute early/late band.

## Stations screen and thumbnails

- **Hero** (`StationsHero.tsx`): like the Home hero it follows the real time of day (sky, sun/moon, stars, lit windows, train lights; `?sky=HH:MM` previews a time), but here a fast metro runs at a fixed place on a viaduct while station canopies, pillars, lamps and skyline slide past in parallax layers (a canopy about every second), with faint speed streaks. The canopies are generic, not specific GMRC stations; their name boards use the line colours (only the chosen line's colour when a filter is on). Everything that moves is a native-driven translate of a seamless strip; it stops when the tab isn't focused, the app is in the background, or reduce-motion is on. Not measured: frame rate on a real phone.
- **Cards** (`src/app/(tabs)/stations.tsx`, `src/components/stations/`): thumbnail, name, line badges, location line, and three chips: **Exits** (GMRC's operational entry/exit gates, 53 stations), **Lifts** (GMRC's lift table) and, where recorded, a **BRTS / Rail / Bus stop** link. That link comes from an unofficial map, so its chip is dashed (= unverified). Escalators, parking and other per-station facilities are **not published per station**, so they are not shown (GMRC's facility lists are network-wide only).
- **Location line.** There is no verified street address in the data. The line is, in order: a landmark named like the station (association inferred from the official name, not a verified distance), an alias, or "Stop N of M · Phase P".
- **Thumbnails.** The app cannot download photos at runtime (it is offline-first) and the build container has no access to image sites, so photos are fetched **once, on a machine with internet**, then bundled:
  1. `npm run fetch:thumbs -- --dry-run` shows which free-licensed Wikimedia Commons photo it would use for each station (it rejects maps, logos, non-photos, small files and non-free licences, and will not use a longer-named neighbour's photo, e.g. "Sabarmati Railway Station" for "Sabarmati").
  2. `npm run fetch:thumbs` downloads and compresses them to 360×300 WebP (about 12–22 KB each, roughly 1 MB for all 54) into `assets/stations/`, records title, page, licence and author in `data/source/station-photos.json`, and regenerates `src/components/stations/thumbs.generated.ts`.
  3. Check the picks. To correct one, put the exact Commons title in `data/source/station-photo-overrides.json` (`{"AEC": "File:Name.jpg"}`, or `null` for the illustration) and re-run with `--only AEC --refresh`.
  The app shows the photographer, licence and a link to the Commons page under the photo on the station screen. Any station without an accepted photo shows a small **drawn illustration** (elevated or underground, in the line colour), captioned "Illustration. Not a photo of this station."
- **Not verified:** the script was tested against a local fake Commons server (matching, rejection rules, compression, manifest), not against the live Wikimedia API, and no photos are bundled yet. Match quality for obscure stations is unknown until you run it.

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
scripts/fetch-station-thumbs.mjs    Wikimedia Commons -> assets/stations/*.webp + credits (run with internet)
src/app/                    Expo Router screens (tabs: Plan, Map, Stations, Saved; route, station/[id], data)
src/components/             UI pieces (timeline, map, station picker …)
src/lib/                    routing, fareCalculator, journeyTime, search, schematic, dataValidation, dataset,
                            locator, position, journeyModel (route geometry), eta, journeyStatus, skyPalette
src/components/journey/     live journey canvas: scene, city tiles, route hops, stations, top-down train, screen
src/components/stations/    Stations screen: card, thumbnail (photo or illustration), animated express-train hero, generated photo list
src/db/                     SQLite repository (testable against node:sqlite) + expo-sqlite opener
src/state/AppProvider.tsx   loading, database, favourites/recents, online status
docs/                       research-sources, data-gaps, demo-script
```

## Routing rules

BFS-equivalent least-stops search over (station, line) states with fewer changes as tie-break. Connections exist only between stations adjacent on a line, in both directions. Direction labels come from the line's station order. Platform/boarding side is never inferred. Fares come only from verified pairs; journey time only from verified per-hop times. Both are currently absent, so both display "unavailable".

## Getting real fares (GMRC's own calculator)

GMRC's route-and-fares page answers fare questions through its own calculator
(`POST …/wp-admin/admin-ajax.php`, `action=get_fare&FromStation=…&ToStation=…`). It returns, per pair of stations, the **fare, distance (km), journey time (minutes), station count and interchange count**. That fills the "Fare unavailable offline" and journey-time gaps with GMRC-published numbers.

MetroMate cannot reach that site from the build environment, so the capture runs in **your own browser**:

1. Open <https://www.gujaratmetrorail.com/ahmedabad/route-and-fares/>, paste `scripts/capture-fares.browser.js` into the DevTools console (try `QUICK_TEST = true` first). It asks the page's calculator one pair per second (~1,450 requests, ~25 min), stops if the site refuses, and downloads `gmrc-fares-capture.json`. Be considerate: run it once, off-peak, and check the site's terms or ask GMRC if you plan to repeat it.
2. `npm run import:fares -- gmrc-fares-capture.json` maps the calculator's station names to ours (it **stops and lists** any it can't match; resolve with `--map 12=OHCI`), writes `data/fares.json`, registers the source and bumps the dataset version. Use `--dry-run` to preview.
3. `npm run check:fares` (also part of `npm test`) cross-checks every imported pair against MetroMate's own route graph: GMRC's station count and interchange count must agree with our routing, so wrong station matches or graph errors show up immediately.

What the app then shows: the fare and distance on the route screen, labelled as GMRC calculator output with the capture date (the calculator doesn't state the ticket type or a validity date, and fares can change), and **GMRC's journey time for that pair, labelled as GMRC's estimate**. Pairs that were not captured still say "Fare unavailable offline". A pair is used in the reverse direction only if the capture proved fares are symmetric (≥10 reversed pairs, all equal).

## Adding verified data

Edit the JSON in `data/`, then `npm test` (it validates the dataset) and bump `version` in `data/dataset.json` so existing installs re-seed.

- **Fares** — prefer the capture above. To add one by hand, append to `fares.json` → `pairs`: `{ fromStationId, toStationId, amountInr, fareType, validFrom, sourceUrl, verifiedAt, verificationStatus: "verified" }` and set `status` to `"available"`.
- **Coordinates** — `node scripts/import-coordinates.mjs <export.kml>` re-imports from a KML (stored as `estimated`). To use surveyed/official values, set `latitude`, `longitude`, `coordinateStatus: "verified"` and `coordinateSourceId` on a station.
- **Gates** — update `data/source/gates-table.json`, then `node scripts/import-gates.mjs`. Gate directions go in `verifiedDirection` only once independently verified.
- **Travel times** — set `estimatedTravelMinutes` on each connection (both directions); journey time appears only when every hop on the route has one.

## Status

### Implemented
Route planning; interchange and direction logic; station search with aliases and landmarks; fare lookup (no verified fares yet); static timetable info; SQLite storage with favourites, recents, reset; original SVG-based map; station details; data/sources screen; data validation.

### Tested
- **234 automated tests pass** (`npm test`): routing (including all 2,862 ordered station pairs and their reverses, interchanges at Old High Court and GNLU, same-station, unknown ids, no-route, dangling connections, Sabarmati Railway Station warning), fare and journey-time honesty, search aliases, the schematic layout, dataset validation including negative cases (the real gate/lift/coordinate data), the **live-location engine** (at-station / between / near / off-network, accuracy gating, journey progress, arriving/arrived, off-route, partial coverage, signal loss, wrong-way detection, position-source priority, averaging of recorded fixes) the **fare-import pipeline** (parsing GMRC's calculator response, name matching, symmetry check, route-graph cross-check, and the import CLI end to end on a synthetic capture), the **journey model** (route geometry, tunnel hops, distance/heading), the **ETA model** (published-line hop times, pace adjustment, smoothing, tunnel estimate), **speed/status/milestone logic**, the **city-tile generator** (determinism, seams, clear of the route), and the **time-of-day sky palette** (keyframe interpolation, header-ink contrast across all 24 hours, sun/moon arc, window lights), the **station card data** (exits and lifts from the real tables, no invented exits, unverified connections flagged), the **thumbnail matcher** (licence, map/logo rejection, whole-word names, longer-name neighbours, generated module), the **Route screen logic** (current frequency band by day and time, first/last train and running state, line order and direction, estimated stop minutes, share text, warning headings), and the SQLite repository (seeding, re-seeding, favourites, recents, recorded station positions, reset, and **persistence after closing and reopening the database**) run against a real SQLite engine.
- `tsc --noEmit` clean; Android bundle exports (`expo export --platform android`).
- A **web preview in headless Chromium at a 390×844 viewport** was driven through plan → route → favourite → map → station → offline emulation, and through the Live tab with **emulated GPS positions** (Playwright geolocation): at a station, mid-line, coarse fix, off-network, recording and averaging a station position, the demo ride, lost signal after 70 s (fake clock), and permission denied — 21/21 checks, no console errors. That confirms layout and logic. Emulated geolocation and browser network emulation are **not** a real GPS or airplane mode on a phone.

### Not verified
- **The live journey view was verified only in a headless web build** (layout, GPS-driven movement via emulated geolocation, tunnel estimate with a fake clock, arrival, permission-denied, offline, reduced motion, 360 dp). The native-driven animation, frame rate on a mid-range Android phone and battery use were **not** measured.
- **Live location on a real device was not tested** — real GPS accuracy in Ahmedabad, underground behaviour, the precision modes and the arrival vibration need a phone ride. The station pins are estimates, so real-world “at station” detection may need the recorded positions.
- **Airplane mode on a real device was not performed.** Persistence across app restarts on a device and the Expo Go experience are untested here; `docs/demo-script.md` has the checklist.
- Acceptance tests that need a device (airplane-mode shell reload, real-device refresh persistence) remain for you to run. Service-worker/PWA caching no longer applies: the app is native, with assets and data bundled in the binary.

### Known limitations
- No fares, journey-time estimates, gate directions or platforms; station coordinates are estimates; lift working status is unknown (see `docs/data-gaps.md`).
- Live tracking is foreground-only, tracks the rider (not trains), and cannot read cell tower IDs. The live view's ETA excludes time to change trains and has no live-service data; its track shape, tunnel portals and surroundings are illustrative.
- Some Phase-1/Phase-2 ticketing text was not available; a neutral warning is shown on those routes.
- English search only; landmark links come from station names and are unverified.
- Optional step-free routing and alternative routes are not implemented (the former needs verified lift data; the network is a tree, so there is one route per pair).
- Web build has no persistent storage.
