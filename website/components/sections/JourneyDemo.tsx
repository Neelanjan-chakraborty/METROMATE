'use client';

import { motion, useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { JourneyArt, stepAt } from '@/components/art/JourneyArt';
import { useStillMotion } from '../motion';

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
  const reduced = useStillMotion();
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
    // Sync on the next frame, once the live scene has mounted and subscribed to the value.
    const id = requestAnimationFrame(() => {
      source.set(scrollYProgress.get());
      progress.jump(scrollYProgress.get());
    });
    const off = scrollYProgress.on('change', (v) => source.set(v));
    return () => {
      cancelAnimationFrame(id);
      off();
    };
  }, [live, scrollYProgress, source, progress]);

  const [step, setStep] = useState(0);
  useMotionValueEvent(progress, 'change', (v) => {
    if (live) setStep(stepAt(v));
  });

  const track = useTransform(progress, [0, 0.12, 0.46, 0.8, 1], [0, 1 / 3, 2 / 3, 1, 1]);

  return (
    <section ref={ref} id="how-it-works" aria-labelledby="how-it-works-title" className="relative bg-paper motion-safe:sm:h-[300vh]">
      <div className="py-20 sm:py-28 motion-safe:sm:sticky motion-safe:sm:top-0 motion-safe:sm:h-svh motion-safe:sm:pb-6 motion-safe:sm:pt-[5.5rem] lg:motion-safe:pt-24">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-7 px-5 sm:px-8 motion-safe:sm:h-full motion-safe:sm:justify-center motion-safe:sm:gap-4 lg:motion-safe:gap-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
            <div className="flex flex-col gap-3">
              <p className="eyebrow">How it works</p>
              <h2 id="how-it-works-title" className="headline text-[2.3rem] text-ink sm:text-[2.6rem] lg:text-[3.1rem]">
                One journey, clearly connected.
              </h2>
            </div>
            <p className="max-w-sm text-[1.02rem] leading-relaxed text-muted motion-safe:sm:max-lg:landscape:hidden lg:pb-1.5">Metro, interchange, bus and the short walks in between, laid out as one calm sequence.</p>
          </div>

          <div className="flex w-full items-center justify-center motion-safe:sm:landscape:min-h-0 motion-safe:sm:landscape:flex-1 motion-safe:sm:landscape:[container-type:size]">
            <figure className="flex w-full flex-col items-center gap-2.5 motion-safe:sm:landscape:w-[min(100cqw,calc((100cqh-2rem)*2.04))]">
              <div className="w-full overflow-hidden rounded-[26px] bg-lavender shadow-soft ring-1 ring-line sm:rounded-[36px]">
                <JourneyArt key={live ? 'live' : 'still'} progress={progress} live={live} className="max-sm:hidden" />
                <JourneyArt progress={progress} live={false} variant="tall" className="sm:hidden" />
              </div>
              <figcaption className="text-center text-[0.8rem] text-muted">Illustration of how a trip is planned — not live vehicle positions.</figcaption>
            </figure>
          </div>

          <ol className="relative grid gap-x-6 gap-y-5 sm:grid-cols-4" aria-label="Steps of a journey">
            <span aria-hidden className="absolute bottom-3 left-[13px] top-3 w-[3px] rounded-full bg-line sm:bottom-auto sm:left-[14px] sm:right-[calc(25%-32px)] sm:top-[13px] sm:h-[3px] sm:w-auto">
              <motion.span className="absolute inset-0 origin-top rounded-full bg-violet sm:origin-left" style={live ? { scaleX: track } : undefined} />
            </span>
            {STEPS.map((s, i) => (
              <StepItem key={s.title} index={i} title={s.title} body={s.body} state={live ? (i === step ? 'active' : i < step ? 'done' : 'next') : 'still'} />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function StepItem({ index, title, body, state }: { index: number; title: string; body: string; state: 'active' | 'done' | 'next' | 'still' }) {
  const strong = state === 'active' || state === 'still';
  return (
    <li aria-current={state === 'active' ? 'step' : undefined} className="relative flex gap-4 sm:flex-col sm:gap-3">
      <span
        aria-hidden
        className={`relative z-[1] flex size-[29px] shrink-0 items-center justify-center rounded-full text-[0.78rem] font-semibold transition-[background-color,color,box-shadow,transform] duration-500 ${
          state === 'active'
            ? 'scale-110 bg-violet text-white shadow-[0_0_0_6px_rgb(81_64_232/0.14)]'
            : state === 'still'
              ? 'bg-violet text-white'
              : state === 'done'
                ? 'bg-violet-soft text-violet-deep ring-4 ring-paper'
                : 'bg-white text-ink-soft ring-2 ring-line'
        }`}
      >
        {index + 1}
      </span>
      <span className="flex min-w-0 flex-col gap-1">
        <span className={`font-display text-[1.15rem] font-semibold leading-snug tracking-tight transition-colors duration-500 lg:text-[1.2rem] ${strong ? 'text-ink' : 'text-muted'}`}>{title}</span>
        <span className={`max-w-[17rem] text-[0.9rem] leading-relaxed transition-colors duration-500 motion-safe:sm:max-md:hidden ${strong ? 'text-ink-soft' : 'text-muted'}`}>{body}</span>
      </span>
    </li>
  );
}
