import type { ReactNode } from 'react';
import { Info } from 'lucide-react';
import { OfflineScene } from '@/components/art/OfflineArt';
import { Reveal } from '@/components/motion';

/*
 * Offline: an honest account of what works without a connection. MetroMate ships its data inside the app, so
 * nothing needs downloading first; the only things that need internet are two optional outbound links.
 */

const BENEFITS: { title: string; body: string; icon: ReactNode }[] = [
  {
    title: 'Saved station information',
    body: 'Exits, lifts and nearby stops for all 54 stations.',
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="10" r="6.2" />
        <path d="M9.4 12.4V8l2.6 2.6L14.6 8v4.4" />
        <path d="M12 16.2V21M8.5 21h7" />
      </svg>
    ),
  },
  {
    title: 'Favourite routes',
    body: 'Favourites, recent trips and Home, Campus and Work shortcuts.',
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="5" cy="18" r="2" />
        <path d="M7 18h4.5a3.5 3.5 0 0 0 0-7H10a3 3 0 0 1 0-6h1" />
        <path d="m17.6 3.2 1.1 2.3 2.5.3-1.8 1.7.5 2.5-2.3-1.2-2.2 1.2.4-2.5-1.8-1.7 2.5-.3z" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    title: 'Offline map access',
    body: 'The full metro network map and the bus & metro map, no data needed.',
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3.5 6.2 9 4l6 2.2 5.5-2.2v13.8L15 20l-6-2.2-5.5 2.2z" />
        <path d="M9 4v13.8M15 6.2V20" />
      </svg>
    ),
  },
];

export function OfflineSection() {
  return (
    <section id="offline" aria-labelledby="offline-title" className="px-3 py-10 sm:px-5 sm:py-16">
      <div className="relative mx-auto max-w-[1360px] overflow-hidden rounded-[32px] bg-sage sm:rounded-[40px]">
        {/* soft light in the panel */}
        <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 size-[420px] rounded-full bg-white/50 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 right-[10%] size-[380px] rounded-full bg-sage-deep/60 blur-3xl" />

        <div className="relative grid items-center gap-6 px-5 pb-10 pt-14 sm:px-10 sm:pb-14 sm:pt-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10 lg:px-16 lg:py-24 xl:px-20">
          <div className="flex flex-col gap-7">
            <Reveal className="flex flex-col gap-4">
              <p className="eyebrow text-ink-soft">Offline mode</p>
              <h2 id="offline-title" className="headline max-w-[15ch] text-[2.35rem] text-ink sm:text-5xl lg:text-[3.5rem]">
                The city doesn&apos;t disappear when your internet does.
              </h2>
              <p className="max-w-[34rem] text-[1.08rem] leading-relaxed text-ink-soft">
                Keep the information you need within reach. Maps, timetables and station details come built into MetroMate, and the routes you save stay on your phone. Nothing to download before you travel.
              </p>
            </Reveal>

            <Reveal delay={0.1}>
              <ul className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 lg:gap-0 lg:divide-y lg:divide-ink/[0.07] lg:rounded-[26px] lg:bg-white/55 lg:px-5 lg:ring-1 lg:ring-white/80">
                {BENEFITS.map((b) => (
                  <li key={b.title} className="flex gap-3.5 rounded-[22px] bg-white/60 p-4 ring-1 ring-white/80 sm:flex-col sm:gap-3 lg:flex-row lg:items-center lg:gap-4 lg:rounded-none lg:bg-transparent lg:px-0 lg:py-4 lg:ring-0">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-[14px] bg-white text-violet shadow-[0_6px_14px_-8px_rgb(41_37_36/0.25)]">{b.icon}</span>
                    <span className="flex flex-col gap-0.5">
                      <span className="text-[0.95rem] font-semibold leading-snug text-ink">{b.title}</span>
                      <span className="text-[0.86rem] leading-relaxed text-ink-soft">{b.body}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={0.16}>
              <p className="flex max-w-[36rem] gap-2.5 text-[0.82rem] leading-relaxed text-ink-soft">
                <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-soft" />
                <span>
                  Live location uses your phone&apos;s GPS. MetroMate has no live arrivals: bus times are scheduled and metro frequencies come from GMRC&apos;s published timetable. Two optional links (directions in your maps app and the GMRC website) need internet.
                </span>
              </p>
            </Reveal>
          </div>

          <Reveal delay={0.08} y={32} className="relative -mx-2 sm:mx-0">
            <OfflineScene />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
