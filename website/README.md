# MetroMate website

The public landing page for MetroMate: *a calmer way through the city*. It introduces the app, shows the real app screens and links to the Android preview build. It is a separate Next.js project from the Expo app in the repository root; the app's tooling ignores this folder.

## Run it

```bash
cd website
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm start          # serve the production build
npm run lint       # ESLint (next/core-web-vitals + TypeScript)
npm run typecheck  # tsc --noEmit
```

Stack: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Framer Motion, Lucide icons for interface controls only. Fonts (Outfit, Inter, Reenie Beanie) are self-hosted from `@fontsource` packages, so the build needs no font download and the page makes no third-party requests.

## Layout

```
app/layout.tsx            fonts, metadata, skip link, paper grain overlay
app/page.tsx              the landing page (section order)
app/privacy/page.tsx      privacy notes for the app and the site
app/globals.css           design tokens (@theme), type classes, grain
lib/site.ts               shared links (Android APK, repository, issues) and network facts
components/motion.tsx     the motion language: Reveal, FloatBlob, DrawPath
components/ui.tsx         Button (always a real link), SectionHeading, Pill, Hand
components/PhoneFrame.tsx phone frame around a real screenshot
components/art/kit.tsx    shared SVG art kit (train, bus, viaduct, buildings, trees, nodes…)
components/art/*.tsx      the section illustrations
components/sections/*.tsx one file per section
public/screens/*.webp     real MetroMate screens
```

## Design system

Warm paper (`#FDFCF8`), ink (`#292524`), muted (`#78716C`), MetroMate violet (`#5140E8`), lavender (`#EFEDF4`), sage (`#E8EFE8`), coral (`#FFB7B2`), metro red (`#D94343`), bus blue (`#2783F5`), defined once in `app/globals.css`. Outfit for headlines, Inter for text, Reenie Beanie only for small handwritten accents. Containers use 20–40 px radii; the grain is one tiled SVG noise texture at low opacity with `pointer-events: none`.

Motion is calm and slow: sections fade and rise 24 px over about 0.85 s once, blobs drift ±10 px on 6–10 s loops, routes draw as they enter the viewport, vehicles move slowly along their lines, and the hero uses gentle parallax. Everything respects `prefers-reduced-motion` (the scenes are shown complete and still), and the scroll-driven journey falls back to a static version on small screens.

## Content rules

The copy describes only what the app does today:

- Metro: the 54 GMRC stations on the North–South, East–West and GIFT City lines. Buses: scheduled AMTS, BRTS and Gandhinagar city bus timetables. No GSRTC intercity buses.
- Everything ships inside the app, so the site says nothing needs downloading before a trip. The Live tab uses the rider's own GPS; there are no live train or bus positions and no real-time arrivals.
- Station pages show GMRC gate numbers, lifts and nearby bus stops. Escalators and other facilities are not published per station and are not claimed.
- The "commuter notes" are labelled example scenarios, because there are no published user reviews yet. No ratings, user counts or endorsements.

## App screenshots

`public/screens/{plan,map,stations}.webp` are real screens captured from the MetroMate app (its web build at 390 × 844 pt, with sample saved routes), compressed to WebP. The map screen was captured offline and shows the app's own "Offline · all features work" badge. The Stations screen is filtered to the East–West line; the station photos in it are by Sanjeev4125 on Wikimedia Commons (CC BY-SA 4.0), credited in the footer.

## Downloads

"Get MetroMate" downloads the Android preview build (an APK hosted by Expo, set in `lib/site.ts`). There is no Play Store or App Store listing yet, and the page says so. Update `site.androidApk` when a new build is published.
