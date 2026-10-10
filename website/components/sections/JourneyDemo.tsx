'use client';

import { useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useSpring } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { JourneyArt, stepAt } from '@/components/art/JourneyArt';

/*
 * How it works: a scroll-driven walk through one trip. On wide screens with motion allowed the section is tall
 * and its content sticks to the viewport while the scroll position drives the scene (normal page scrolling, never
 * hijacked). On phones and with reduced motion the same scene renders complete and still, at normal height.
 * Heights are set in CSS (motion-safe + sm), so the server render already has the final layout: no shift.
 */

const STEPS = [
  { title: 'Choose your destination.', body: 'Search any of the 54 metro stations, or tap Home, Campus or Work.' },
  { title: 'Follow the route.', body: 'Every metro leg, stop by stop, with the line and direction to take.' },
  { title: 'Make the connection.', body: 'Where to change lines, or where to pick up a scheduled bus.' },
  { title: 'Arrive with confidence.', body: 'The last stop and the short walk at the end, so nothing is a surprise.' },
] as const;

export function JourneyDemo() {
  const reduced = useReducedMotion();
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)');
    const sync = () => setWide(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  const live = wide && !reduced;

  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  // The scene reads this value: the finished journey (1) when still, the scroll position when live.
  const source = useMotionValue(1);
  const progress = useSpring(source, { stiffness: 170, damping: 32, mass: 0.5, restDelta: 0.0005 });
  useEffect(() => {
    if (!live) {
      source.set(1);
      progress.jump(1);
      return;
    }
    source.set(scrollYProgress.get());
    progress.jump(scrollYProgress.get());
    return scrollYProgress.on('change', (v) => source.set(v));
  }, [live, scrollYProgress, source, progress]);

  const [step, setStep] = useState(0);
  useMotionValueEvent(progress, 'change', (v) => {
    if (live) setStep(stepAt(v));
  });

  return (
    <section ref={ref} id="how-it-works" aria-labelledby="how-it-works-title" className="relative bg-paper motion-safe:sm:h-[300vh]">
      <div className="py-20 sm:py-28 motion-safe:sm:sticky motion-safe:sm:top-0 motion-safe:sm:flex motion-safe:sm:h-svh motion-safe:sm:items-center motion-safe:sm:pb-8 motion-safe:sm:pt-24">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-8 px-5 sm:px-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
          <div className="flex flex-col gap-6 lg:gap-8">
            <div className="flex max-w-xl flex-col gap-3">
              <p className="eyebrow">How it works</p>
              <h2 id="how-it-works-title" className="headline text-[2.3rem] text-ink sm:text-[2.8rem] lg:text-[3.3rem]">
                One journey, clearly connected.
              </h2>
              <p className="max-w-md text-[1.05rem] leading-relaxed text-muted motion-safe:sm:max-lg:hidden">Metro, interchange, bus and the walk in between, laid out as one calm sequence.</p>
            </div>
            <ol className="hidden gap-1 lg:flex lg:flex-col" aria-label="Steps of a journey">
              {STEPS.map((s, i) => (
                <StepItem key={s.title} index={i} title={s.title} body={s.body} state={live ? (i === step ? 'active' : i < step ? 'done' : 'next') : 'still'} />
              ))}
            </ol>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="w-full overflow-hidden rounded-[28px] shadow-soft ring-1 ring-line sm:rounded-[36px] motion-safe:sm:w-[min(100%,calc((100svh-21rem)*1.667))] motion-safe:lg:w-[min(100%,calc((100svh-12rem)*1.667))]">
              <JourneyArt key={live ? 'live' : 'still'} progress={progress} live={live} />
            </div>
            <p className="text-center text-[0.8rem] text-muted">Illustration of how a trip is planned — not live vehicle positions.</p>
          </div>

          <ol className="grid gap-x-4 gap-y-2 sm:grid-cols-2 md:grid-cols-4 lg:hidden" aria-label="Steps of a journey">
            {STEPS.map((s, i) => (
              <StepItem key={s.title} index={i} title={s.title} body={s.body} compact={live} state={live ? (i === step ? 'active' : i < step ? 'done' : 'next') : 'still'} />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function StepItem({ index, title, body, state, compact = false }: { index: number; title: string; body: string; state: 'active' | 'done' | 'next' | 'still'; compact?: boolean }) {
  const strong = state === 'active' || state === 'still';
  return (
    <li aria-current={state === 'active' ? 'step' : undefined} className={`relative flex gap-4 rounded-[22px] p-3 transition-colors duration-500 lg:p-4 ${state === 'active' ? 'bg-lavender' : ''}`}>
      <span aria-hidden className="relative mt-1 flex size-7 shrink-0 items-center justify-center">
        <span
          className={`flex size-7 items-center justify-center rounded-full text-[0.78rem] font-semibold transition-[background-color,color,box-shadow] duration-500 ${
            strong ? 'bg-violet text-white shadow-[0_6px_14px_-6px_rgb(81_64_232/0.7)]' : state === 'done' ? 'bg-violet-soft text-violet-deep' : 'bg-white text-ink-soft ring-2 ring-line'
          }`}
        >
          {index + 1}
        </span>
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className={`font-display text-[1.15rem] font-semibold leading-snug tracking-tight transition-colors duration-500 lg:text-[1.25rem] ${strong ? 'text-ink' : 'text-muted'}`}>{title}</span>
        <span className={`text-[0.92rem] leading-relaxed transition-colors duration-500 ${strong ? 'text-ink-soft' : 'text-muted'} ${compact ? 'max-md:hidden' : ''}`}>{body}</span>
      </span>
    </li>
  );
}
