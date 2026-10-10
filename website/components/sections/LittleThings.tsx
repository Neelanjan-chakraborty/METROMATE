'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Reveal } from '@/components/motion';
import { Hand } from '@/components/ui';
import { RouteArt, EntranceArt, InterchangeArt, SavedArt } from '@/components/art/CardArt';
import { useStillMotion } from '../motion';

/*
 * "Little things": a horizontally scrolling rail of editorial cards. Native scrolling (touch, trackpad, the
 * keyboard once the rail is focused) with snap points, plus previous / next buttons on larger screens that
 * scroll by one card and switch off at either end. The rail bleeds to the viewport edge while its first card
 * lines up with the page container.
 */

interface Card {
  n: string;
  label: string;
  title: string;
  tint: string;
  art: ReactNode;
}

const CARDS: Card[] = [
  { n: '01', label: 'Find your way', title: 'Clear routes. Fewer wrong turns.', tint: 'bg-lavender', art: <RouteArt /> },
  { n: '02', label: 'Know your station', title: 'Find the exit that makes sense.', tint: 'bg-sage', art: <EntranceArt /> },
  { n: '03', label: 'Metro meets bus', title: 'Understand the connection.', tint: 'bg-peach/60', art: <InterchangeArt /> },
  { n: '04', label: 'Keep your routes close', title: 'Your essentials, ready offline.', tint: 'bg-paper-deep', art: <SavedArt /> },
];

// Page container: max-w-6xl (72rem) with a 20 px gutter, 32 px from `sm`. The rail spans the full width, so its
// start padding is the container's left edge, computed from the rail's own width.
const RAIL_PAD =
  '[--g:20px] sm:[--g:32px] pl-[max(var(--g),calc((100%-72rem)/2+var(--g)))] scroll-pl-[max(var(--g),calc((100%-72rem)/2+var(--g)))] pr-[var(--g)]';

export function LittleThings() {
  const rail = useRef<HTMLDivElement>(null);
  const reduced = useStillMotion();
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const update = useCallback(() => {
    const el = rail.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [update]);

  const step = (dir: 1 | -1) => {
    const el = rail.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-card]');
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    el.scrollBy({ left: dir * ((card?.offsetWidth ?? 320) + gap), behavior: reduced ? 'auto' : 'smooth' });
  };

  return (
    <section id="features" aria-labelledby="features-title" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="flex max-w-2xl flex-col gap-4">
            <p className="eyebrow">Features</p>
            <h2 id="features-title" className="headline text-[2.4rem] text-ink sm:text-5xl lg:text-[3.6rem]">
              Little things that make every trip easier.
            </h2>
            <p className="max-w-md text-lg leading-relaxed text-muted">
              Small, thoughtful details for the moments that usually cost you a few minutes, and a little <Hand className="whitespace-nowrap text-[1.5em]">less stress</Hand>.
            </p>
          </div>
          <div className="hidden shrink-0 items-center gap-2 md:flex" role="group" aria-label="Scroll the feature cards">
            <RailButton label="Previous card" disabled={atStart} onClick={() => step(-1)}>
              <ChevronLeft size={20} aria-hidden />
            </RailButton>
            <RailButton label="Next card" disabled={atEnd} onClick={() => step(1)}>
              <ChevronRight size={20} aria-hidden />
            </RailButton>
          </div>
        </Reveal>
      </div>

      <Reveal delay={0.1} className="mt-12 sm:mt-14">
        <div
          ref={rail}
          tabIndex={0}
          role="region"
          aria-label="Feature cards, scroll sideways for more"
          className={`rail flex gap-4 overflow-x-auto pb-6 pt-2 sm:gap-5 [&:focus-visible]:rounded-none [&:focus-visible]:outline-offset-[-3px] ${RAIL_PAD}`}
        >
          {CARDS.map((c) => (
            <article
              key={c.n}
              data-card
              aria-labelledby={`lt-${c.n}`}
              className={`group relative flex w-[290px] shrink-0 flex-col rounded-[28px] p-5 transition-transform duration-500 ease-[var(--ease-calm)] sm:w-[316px] md:hover:-translate-y-1 motion-reduce:md:hover:translate-y-0 ${c.tint}`}
            >
              <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[28px] opacity-0 shadow-lift transition-opacity duration-500 md:group-hover:opacity-100" />
              <div className="relative flex items-baseline justify-between gap-3">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-ink-soft">{c.label}</p>
                <span className="font-display text-sm font-medium tabular-nums text-ink-soft/70">{c.n}</span>
              </div>
              <div className="relative mt-4 overflow-hidden rounded-[20px] bg-white/50">{c.art}</div>
              <h3 id={`lt-${c.n}`} className="headline relative mt-5 text-[1.55rem] text-ink">
                {c.title}
              </h3>
            </article>
          ))}
          <article className="relative flex w-[250px] shrink-0 flex-col justify-between rounded-[28px] bg-ink p-6 text-paper sm:w-[270px]">
            <div className="flex flex-col gap-3">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-paper/70">And more</p>
              <p className="headline text-[1.55rem]">Search, quick routes and three languages, all on your phone.</p>
            </div>
            <Link
              href="#showcase"
              className="mt-8 inline-flex min-h-12 items-center justify-between gap-2 rounded-full bg-paper px-5 text-[0.95rem] font-semibold text-ink transition-transform duration-300 hover:scale-[1.02] motion-reduce:hover:scale-100"
            >
              Explore the app
              <ArrowRight size={18} aria-hidden />
            </Link>
          </article>
        </div>
      </Reveal>
    </section>
  );
}

function RailButton({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex size-12 items-center justify-center rounded-full bg-white text-ink ring-1 ring-line transition-[transform,opacity] duration-300 hover:scale-105 hover:ring-ink/25 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:scale-100 motion-reduce:hover:scale-100"
    >
      {children}
    </button>
  );
}
