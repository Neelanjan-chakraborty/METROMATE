# Two-minute demo script

**Before you start (once, with internet):** open the app in Expo Go on the phone so the dataset is seeded into the on-device SQLite database. Pre-save one favourite so the offline step is quick.

| Time | Do | Say |
|---|---|---|
| 0:00 | Show Plan tab. Point at the green/red "Online" badge. | "MetroMate is an offline metro companion for Ahmedabad–Gandhinagar commuters. Everything you're about to see runs from a database on the phone — no backend, no API key, no account." |
| 0:15 | **From**: type `motera`. **To**: type `gift city`. Tap **Find route**. | "Station search understands aliases and place names — GIFT City, PDPU, Secretariat." |
| 0:30 | Scroll the route. | "Motera Stadium to GIFT City: stops counted, direction taken from the line's order — 'Board the train towards Mahatma Mandir' — and a clear **Change at GNLU** step with the GIFT City branch direction." |
| 0:50 | Point at the fare and time cards. | "Fare shows 'Fare unavailable offline'. GMRC's fare page lists no amounts, and we refuse to multiply stops by a made-up rate. Journey time is likewise not guessed — GMRC publishes line times, not per-station times; those are shown under 'Published train timings', labelled static." |
| 1:05 | Tap **Show on map**, then tap the star. | "The map is our own schematic, drawn from the station data and bundled in the app. I'll save this route." |
| 1:15 | **Turn on airplane mode.** The badge turns red: "Offline · all features work". | "Now fully offline." |
| 1:25 | Saved tab → open the favourite. Then Stations tab → search `amraiwadi`. Open **Old High Court**. | "Saved routes, search, route planning, the map and station pages all still work. Unknown things — gates, platforms, lifts — say 'not verified yet' instead of guessing." |
| 1:45 | Open **Data & sources** (Plan tab footer). | "Every record carries its source and check date. The data comes from official GMRC material; what's missing is listed here and in `docs/data-gaps.md`." |
| 1:55 | Close. | "Next: add GMRC's fare chart, gates and coordinates to the JSON files — the app and its tests pick them up with no code changes." |

## Notes for the presenter

- Do not call the airplane-mode step "tested" unless you have just done it on the device: the repository's automated tests cover routing, search, the SQLite persistence layer and the bundle, but **not** an on-device airplane-mode run.
- If asked about live status: MetroMate shows a static GMRC schedule (effective 18 May 2026) and says so.
- If asked about the Phase-1/Phase-2 warning: it quotes GMRC's fare rules; part of that rule's text was not available, so the app asks passengers to confirm ticketing at the station.

## Pre-demo checklist (on the phone)

1. `npm install` then `npm start`; scan the QR code with Expo Go.
2. Plan a route, star it, close and reopen the app: the favourite and recent journey should still be there.
3. Enable airplane mode, reopen the app, repeat step 2 and the station search.
4. Record the result in the PR/notes — only then say offline mode is verified on device.
