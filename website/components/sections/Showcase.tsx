'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { PhoneFrame } from '../PhoneFrame';
import { CALM, FloatBlob, Reveal } from '../motion';
import { SectionHeading } from '../ui';

/*
 * Three real MetroMate screens (captured from the app itself) in phone frames. On large screens the Plan
 * screen sits in front with the network map and the stations directory either side; on smaller screens the
 * same three devices become a swipeable gallery (native scroll-snap) with dots. Each device has an id, so
 * links such as #showcase-map land on it (and bring it into view inside the gallery).
 */

interface Device {
  id: string;
  src: string;
  alt: string;
  note: string;
  detail: string;
  glow: string;
  statusBg: string;
  statusInk: 'dark' | 'light';
}

const DEVICES: Device[] = [
  {
    id: 'showcase-map',
    src: '/screens/map.webp',
    alt: 'MetroMate network map: the North–South line in red, the East–West line in blue and the GIFT City branch in violet, with the Old High Court and GNLU interchanges, shown offline.',
    note: 'Keep the map close.',
    detail: 'All three lines and both interchanges, drawn on your phone. It keeps working offline.',
    glow: '#C9DCC9',
    statusBg: '#f6f7ff',
    statusInk: 'dark',
  },
  {
    id: 'showcase-plan',
    src: '/screens/plan.webp',
    alt: 'MetroMate Plan screen: a journey from Thaltej to Akshardham, the Find my route button, Home, Campus and Work quick routes and a recent trip.',
    note: 'Plan in seconds.',
    detail: 'Pick two stations, find your route, keep Home, Campus and Work one tap away.',
    glow: '#C9C2F6',
    statusBg: '#f5f2ff',
    statusInk: 'dark',
  },
  {
    id: 'showcase-stations',
    src: '/screens/stations.webp',
    alt: 'MetroMate Stations directory filtered to the East–West line: station photos, exits and lifts for Amraivadi, Apparel Park, Commerce Six Road and Doordarshan Kendra.',
    note: 'Explore every stop.',
    detail: 'Search 54 stations, filter by line, see exits and lifts at a glance.',
    glow: '#FFD3CC',
    statusBg: '#2a2464',
    statusInk: 'light',
  },
];

/** Order on small screens: lead with the Plan screen. On large screens: map, plan, stations. */
const MOBILE_ORDER = ['order-2', 'order-1', 'order-3'];

export function Showcase() {
  const rail = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(1);
  const reduced = useReducedMotion();

  // Which slide is centred in the gallery (small screens only; on large screens the rail does not scroll).
  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index));
      },
      { root: el, threshold: 0.6 },
    );
    el.querySelectorAll<HTMLElement>('[data-index]').forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  const go = (i: number) => {
    const el = rail.current?.querySelector<HTMLElement>(`[data-index="${i}"]`);
    el?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', inline: 'center', block: 'nearest' });
  };

  return (
    <section id="showcase" aria-labelledby="showcase-title" className="relative overflow-hidden py-24 sm:py-32">
      <FloatBlob className="left-[-10%] top-24 h-72 w-72 opacity-60" color="#EFEDF4" duration={9} />
      <FloatBlob className="right-[-8%] top-[40%] h-80 w-80 opacity-50" color="#FFE3D1" duration={10} delay={1} />
      <FloatBlob className="bottom-0 left-[30%] h-64 w-64 opacity-50" color="#E8EFE8" duration={8} delay={2} />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <SectionHeading eyebrow="The app" title={<span id="showcase-title">Less guesswork. Better journeys.</span>} align="center">
            Real screens from MetroMate. No mock dashboards: this is the planner, the network map and the stations directory as they look in the app.
          </SectionHeading>
        </Reveal>
      </div>

      <div className="relative mt-14 lg:mt-20">
        <div
          ref={rail}
          role="region"
          aria-label="MetroMate screens. Swipe or use the dots to change screen."
          tabIndex={0}
          className="flex snap-x snap-mandatory [scrollbar-width:none] gap-6 overflow-x-auto px-[max(1.25rem,calc(50vw_-_132px))] pb-10 pt-4 focus-visible:outline-offset-[-4px] lg:snap-none lg:items-start lg:justify-center lg:gap-0 lg:overflow-visible lg:px-8 lg:pb-16"
        >
          {DEVICES.map((d, i) => {
            const side = i !== 1;
            return (
              <motion.figure
                key={d.id}
                id={d.id}
                data-index={i}
                className={`relative flex shrink-0 snap-center flex-col items-center ${MOBILE_ORDER[i]} lg:order-none ${side ? 'lg:mt-24 lg:scale-[0.86]' : 'lg:z-10 lg:mx-[-28px]'}`}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '0px 0px -10% 0px' }}
                transition={reduced ? { duration: 0 } : { duration: 0.9, ease: CALM, delay: side ? 0.15 : 0 }}
              >
                <div aria-hidden className="absolute inset-x-[8%] top-[12%] bottom-[18%] rounded-[50%] opacity-80 blur-3xl" style={{ background: d.glow }} />
                <div className={`relative w-[264px] transition-transform duration-700 ease-[var(--ease-calm)] lg:w-auto ${side ? (i === 0 ? 'lg:-rotate-[3deg]' : 'lg:rotate-[3deg]') : ''} lg:hover:-translate-y-1.5`}>
                  <PhoneFrame src={d.src} alt={d.alt} width={side ? 270 : 290} statusBg={d.statusBg} statusInk={d.statusInk} sizes="(min-width: 1024px) 300px, 280px" />
                </div>
                <figcaption className="relative mt-6 max-w-[17rem] text-center">
                  <span className="font-display text-xl font-semibold tracking-tight text-ink">{d.note}</span>
                  <span className="mt-1.5 block text-[0.95rem] leading-relaxed text-ink-soft">{d.detail}</span>
                </figcaption>
              </motion.figure>
            );
          })}
        </div>

        <div className="flex justify-center gap-2 lg:hidden" role="group" aria-label="Choose a screen">
          {[1, 0, 2].map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              aria-label={`Show ${DEVICES[i].note.replace('.', '')}`}
              aria-current={active === i ? 'true' : undefined}
              className="flex size-11 items-center justify-center rounded-full"
            >
              <span className={`block h-2 rounded-full transition-all duration-500 ${active === i ? 'w-7 bg-violet' : 'w-2 bg-ink/20'}`} />
            </button>
          ))}
        </div>

        <p className="mx-auto mt-6 max-w-xl px-5 text-center text-xs leading-relaxed text-muted">
          Screens captured from MetroMate with sample saved routes. Station photos by Sanjeev4125 via Wikimedia Commons, CC BY-SA 4.0.
        </p>
      </div>
    </section>
  );
}
