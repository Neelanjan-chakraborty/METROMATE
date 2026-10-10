'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { PhoneFrame } from '@/components/PhoneFrame';
import { art, NoSignal } from './kit';
import { useStillMotion } from '../motion';

/*
 * The offline scene: the real network-map screenshot (it carries the app's own "Offline · all features work"
 * badge) on a phone, layered over a calm backdrop of route lines and stops, with a no-signal mark and two saved
 * route chips drifting slowly around it. Still when reduced motion is requested.
 */

function Float({ children, className = '', duration = 8, delay = 0, distance = 8 }: { children: ReactNode; className?: string; duration?: number; delay?: number; distance?: number }) {
  const reduced = useStillMotion();
  return (
    <motion.div className={className} animate={reduced ? { y: 0 } : { y: [0, -distance, 0] }} transition={reduced ? { duration: 0.3 } : { duration, delay, repeat: Infinity, ease: 'easeInOut' }}>
      {children}
    </motion.div>
  );
}

const VIOLET_D = 'M40 470 C 110 468 130 385 200 352 S 330 330 380 250 S 450 128 520 122';
const BLUE_D = 'M36 172 C 100 178 140 232 210 260 S 360 300 410 380 S 460 500 524 498';

export function OfflineScene() {
  const reduced = useStillMotion();
  return (
    <div className="relative mx-auto aspect-[56/64] w-full max-w-[560px]">
      {/* backdrop */}
      <svg viewBox="0 0 560 600" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full" aria-hidden>
        <circle cx={280} cy={300} r={236} fill="#FFFFFF" opacity={0.42} />
        <circle cx={280} cy={300} r={276} fill="none" stroke={art.leafDeep} strokeOpacity={0.35} strokeWidth={1.5} strokeDasharray="2 10" strokeLinecap="round" />
        <path d={BLUE_D} fill="none" stroke="#FFFFFF" strokeWidth={12} strokeLinecap="round" />
        <path d={BLUE_D} fill="none" stroke={art.busBlue} strokeOpacity={0.55} strokeWidth={5} strokeLinecap="round" />
        <path d={VIOLET_D} fill="none" stroke="#FFFFFF" strokeWidth={12} strokeLinecap="round" />
        <path d={VIOLET_D} fill="none" stroke={art.violet} strokeOpacity={0.75} strokeWidth={5} strokeLinecap="round" />
        {[
          [40, 470, art.violet],
          [520, 122, art.violet],
          [36, 172, art.busBlue],
          [524, 498, art.busBlue],
          [148, 404, art.violet],
          [452, 448, art.busBlue],
        ].map(([x, y, c]) => (
          <circle key={`${x}`} cx={x as number} cy={y as number} r={7} fill="#FFFFFF" stroke={c as string} strokeWidth={3.4} />
        ))}
      </svg>

      {/* gently drifting stops */}
      {[
        { l: '10%', t: '24%', c: art.violet, d: 7 },
        { l: '86%', t: '14%', c: art.violet, d: 9 },
        { l: '88%', t: '80%', c: art.busBlue, d: 8 },
      ].map((n, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="absolute size-3.5 rounded-full border-[3px] bg-white"
          style={{ left: n.l, top: n.t, borderColor: n.c }}
          initial={{ y: 0, opacity: 1 }}
          animate={reduced ? { y: 0, opacity: 1 } : { y: [0, -10, 0], opacity: [0.6, 1, 0.6] }}
          transition={reduced ? { duration: 0.3 } : { duration: n.d, repeat: Infinity, ease: 'easeInOut', delay: i * 0.8 }}
        />
      ))}

      {/* the phone */}
      <div className="absolute left-1/2 top-1/2 w-[50%] sm:w-[46%] -translate-x-1/2 -translate-y-1/2 rotate-[-2.5deg]">
        <PhoneFrame src="/screens/map.webp" alt="MetroMate's network map on a phone, working offline" width={280} sizes="(min-width: 1024px) 290px, 50vw" />
      </div>

      {/* no-signal mark */}
      <Float className="absolute left-0 top-[34%] origin-left max-sm:scale-90 sm:left-[1%]" duration={9}>
        <div className="flex items-center gap-2.5 rounded-[20px] bg-white/95 py-2.5 pl-2.5 pr-4 shadow-soft ring-1 ring-black/[0.04]">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-coral/35">
            <svg viewBox="-20 -20 40 40" className="size-7" aria-hidden>
              <NoSignal x={0} y={-1} s={0.85} color={art.ink} />
            </svg>
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-[0.82rem] font-semibold text-ink">No signal</span>
            <span className="text-[0.74rem] text-ink-soft">Your map is still here</span>
          </span>
        </div>
      </Float>

      {/* saved route chips */}
      <Float className="absolute right-0 top-[56%] origin-right max-sm:scale-90 sm:right-[1%]" duration={8} delay={1.2} distance={7}>
        <div className="flex items-center gap-2.5 rounded-full bg-white/95 py-2 pl-2 pr-4 shadow-soft ring-1 ring-black/[0.04]">
          <span className="flex size-8 items-center justify-center rounded-full bg-violet text-white">
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z" />
            </svg>
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-[0.82rem] font-semibold text-ink">Home → Campus</span>
            <span className="text-[0.72rem] text-ink-soft">Saved quick route</span>
          </span>
        </div>
      </Float>
      <Float className="absolute bottom-[3%] left-0 origin-left max-sm:scale-90 sm:left-[3%]" duration={10} delay={0.6} distance={6}>
        <div className="flex items-center gap-2.5 rounded-full bg-white/95 py-2 pl-2 pr-4 shadow-soft ring-1 ring-black/[0.04]">
          <span className="flex size-8 items-center justify-center rounded-full bg-peach text-coral-deep">
            <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
              <path d="M12 3.6l2.5 5.3 5.7.7-4.2 3.9 1.1 5.7L12 16.4l-5.1 2.8 1.1-5.7-4.2-3.9 5.7-.7z" />
            </svg>
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-[0.82rem] font-semibold text-ink">Thaltej → Old High Court</span>
            <span className="text-[0.72rem] text-ink-soft">Favourite route</span>
          </span>
        </div>
      </Float>
    </div>
  );
}
