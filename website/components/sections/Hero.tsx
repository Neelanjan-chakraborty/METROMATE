'use client';

import { motion } from 'framer-motion';
import { Fragment, type ReactNode } from 'react';
import { HeroCity, useStillMotion } from '@/components/art/HeroCity';
import { CALM, FloatBlob } from '@/components/motion';
import { Button, Pill } from '@/components/ui';

/*
 * The opening view: an eyebrow, an oversized editorial headline with a hand-drawn coral underline under
 * "calmer", two real in-page actions, three benefit chips, and the riverfront city illustration with a few
 * floating editorial labels. Everything is above the fold, so nothing here is lazy-loaded.
 */

function useIntro() {
  const reduced = useStillMotion();
  return (delay: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 22 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.85, delay, ease: CALM },
        };
}

function Underline() {
  const reduced = useStillMotion();
  return (
    <svg aria-hidden viewBox="0 0 300 26" preserveAspectRatio="none" className="pointer-events-none absolute -bottom-[0.1em] left-[-2%] -z-10 h-[0.3em] w-[104%]">
      <motion.path
        d="M5 17 C 70 7, 170 4, 294 10 M 30 21 C 110 14, 200 13, 262 16"
        fill="none"
        stroke="#FFB7B2"
        strokeWidth={6.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduced ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, delay: 0.75, ease: CALM }}
      />
    </svg>
  );
}

const iconCls = 'size-4 shrink-0 sm:size-5';

function MapIcon() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={iconCls} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.8 5.4 7.4 3.6l5.2 1.8 4.6-1.8v11l-4.6 1.8-5.2-1.8-4.6 1.8z" fill="#EFEDF4" stroke="#44403C" strokeWidth={1.5} />
      <path d="M7.4 3.6v11M12.6 5.4v11" stroke="#44403C" strokeWidth={1.2} opacity={0.5} />
      <path d="M4.6 12.2c2-.4 3.4-3.2 5.6-3 2 .2 2.6-2.2 5-2.6" stroke="#5140E8" strokeWidth={1.7} />
    </svg>
  );
}

function JourneyIcon() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={iconCls} fill="none" strokeLinecap="round">
      <path d="M4.5 6.5h5.5" stroke="#5140E8" strokeWidth={2} />
      <path d="M10 6.5c3.5 0 4.8 1.8 4.8 4.4v2.6" stroke="#2783F5" strokeWidth={2} strokeDasharray="0.1 3.2" />
      <circle cx={4.2} cy={6.5} r={2.4} fill="#fff" stroke="#5140E8" strokeWidth={1.6} />
      <rect x={11.6} y={12.6} width={6.4} height={4.6} rx={1.4} fill="#2783F5" />
    </svg>
  );
}

function StationIcon() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={iconCls} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx={10} cy={8.6} r={6.2} fill="#fff" stroke="#5140E8" strokeWidth={1.6} />
      <path d="M7.2 11V6.6l2.8 2.8 2.8-2.8V11" stroke="#5140E8" strokeWidth={1.6} />
      <path d="M10 14.8v3" stroke="#44403C" strokeWidth={1.6} />
    </svg>
  );
}

/** A small white editorial label that floats gently over the art. Decorative (the art's label already describes it). */
function FloatLabel({ children, dot, className, duration = 7, delay = 0 }: { children: ReactNode; dot: string; className: string; duration?: number; delay?: number }) {
  const reduced = useStillMotion();
  return (
    <motion.div
      aria-hidden
      className={`pointer-events-none absolute flex items-center gap-2 whitespace-nowrap rounded-2xl bg-white px-3 py-2 text-[0.74rem] font-semibold text-ink shadow-soft ring-1 ring-line sm:px-2.5 sm:py-1.5 sm:text-[0.72rem] lg:px-3.5 lg:py-2 lg:text-[0.8rem] ${className}`}
      initial={reduced ? false : { opacity: 0, y: 10 }}
      animate={reduced ? { opacity: 1 } : { opacity: [0, 1], y: [0, -6, 0, 6, 0] }}
      transition={
        reduced
          ? undefined
          : {
              opacity: { duration: 0.8, delay: 1.4 + delay, ease: CALM },
              y: {
                duration,
                delay: 1.4 + delay,
                repeat: Infinity,
                ease: 'easeInOut',
              },
            }
      }
    >
      <span className="flex size-3.5 items-center justify-center rounded-full border-2 bg-white" style={{ borderColor: dot }}>
        <span className="size-1.5 rounded-full" style={{ background: dot }} />
      </span>
      {children}
    </motion.div>
  );
}

export function Hero() {
  const intro = useIntro();
  const still = useStillMotion();
  return (
    <section id="top" aria-labelledby="hero-title" className="relative isolate overflow-hidden pt-28 pb-16 sm:pt-32 sm:pb-24">
      <FloatBlob className="-left-24 top-10 size-72 opacity-70 sm:size-96" color="#FFE3D1" duration={9} />
      <FloatBlob className="-right-28 top-40 size-80 opacity-70 sm:size-[26rem]" color="#EFEDF4" duration={10} delay={1} />
      <FloatBlob className="bottom-10 left-1/3 size-80 opacity-60 sm:size-[30rem]" color="#E8EFE8" duration={8} delay={0.5} />

      {/* Remounted once if the visitor prefers reduced motion, so everything shows in its final state. */}
      <Fragment key={String(still)}>
        <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 text-center sm:px-6">
          <motion.p className="eyebrow" {...intro(0.05)}>
            Made for your everyday commute
          </motion.p>
          <motion.h1 id="hero-title" className="display mt-5 max-w-[12ch] text-[clamp(3rem,9vw,7.5rem)] text-balance text-ink sm:max-w-none" {...intro(0.15)}>
            A{' '}
            <span className="relative inline-block">
              calmer
              <Underline />
            </span>{' '}
            way through the city.
          </motion.h1>
          <motion.p className="mt-6 max-w-xl text-pretty text-[1.05rem] leading-relaxed text-ink-soft sm:mt-7 sm:text-lg" {...intro(0.3)}>
            Metro routes, bus connections and station details — everything you need to find your way, without the everyday confusion.
          </motion.p>
          <motion.div className="mt-8 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center" {...intro(0.42)}>
            <Button href="#features" tone="dark">
              Explore MetroMate
            </Button>
            <Button href="#how-it-works" tone="ghost">
              See how it works
            </Button>
          </motion.div>
          <motion.ul className="mt-6 flex flex-wrap justify-center gap-1.5 sm:gap-2" aria-label="Highlights" {...intro(0.54)}>
            <li>
              <Pill className="gap-1.5 px-2.5 py-1.5 text-[0.78rem] sm:gap-2 sm:px-3.5 sm:py-2 sm:text-sm" icon={<MapIcon />}>
                Offline-ready maps
              </Pill>
            </li>
            <li>
              <Pill className="gap-1.5 px-2.5 py-1.5 text-[0.78rem] sm:gap-2 sm:px-3.5 sm:py-2 sm:text-sm" icon={<JourneyIcon />}>
                Metro + bus journeys
              </Pill>
            </li>
            <li>
              <Pill className="gap-1.5 px-2.5 py-1.5 text-[0.78rem] sm:gap-2 sm:px-3.5 sm:py-2 sm:text-sm" icon={<StationIcon />}>
                Station-level guidance
              </Pill>
            </li>
          </motion.ul>
        </div>

        <motion.div className="relative mx-auto mt-10 max-w-[1240px] px-3 sm:mt-14 sm:px-6" {...intro(0.35)}>
          <div className="relative overflow-hidden rounded-[32px] shadow-lift ring-1 ring-line sm:rounded-[44px]">
            <HeroCity />
          </div>
          <FloatLabel dot="#5140E8" className="left-7 top-[4%] sm:left-[4%] sm:top-[7%]" duration={7.5}>
            Your route, simplified
          </FloatLabel>
          <FloatLabel dot="#8FBF9F" className="hidden sm:right-[24%] sm:top-[8%] sm:flex" duration={8.5} delay={0.4}>
            Save it for offline
          </FloatLabel>
          <FloatLabel dot="#2783F5" className="bottom-[2.5%] left-7 sm:hidden lg:bottom-[4%] lg:left-[5%] lg:flex" duration={6.5} delay={0.8}>
            Every stop, easier
          </FloatLabel>
        </motion.div>
      </Fragment>
    </section>
  );
}
