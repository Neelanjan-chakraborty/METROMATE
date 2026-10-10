'use client';

import { useId, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { site } from '@/lib/site';
import { CALM, Reveal, useStillMotion } from '../motion';
import { SectionHeading } from '../ui';

/*
 * Accessible accordion: each question is a button with aria-expanded / aria-controls; the answer panel is a
 * labelled region that eases open. Answers describe what the app does today, including what it does not do.
 */

const QA: { q: string; a: ReactNode }[] = [
  {
    q: 'What is MetroMate?',
    a: (
      <>
        MetroMate is an offline-first companion for the Ahmedabad–Gandhinagar Metro, with city bus and BRTS journeys added in. It plans routes, shows which way to ride and
        where to change, draws the network map and gives every station a page with its exits and lifts. It works in English, Hindi and Gujarati, with no account and no
        sign-up.
      </>
    ),
  },
  {
    q: 'Which metro and bus networks are supported?',
    a: (
      <>
        All 54 metro stations run by GMRC: the North–South line (APMC to Mahatma Mandir), the East–West line (Thaltej Gam to Vastral Gam) and the GIFT City branch, with
        interchanges at Old High Court and GNLU. For buses, MetroMate includes the scheduled timetables of AMTS city buses, BRTS (Janmarg) and Gandhinagar city buses. It does
        not include GSRTC intercity buses, suburban rail or autos.
      </>
    ),
  },
  {
    q: 'Can I use MetroMate without internet?',
    a: (
      <>
        Yes. Route planning, search, the network map, station details and bus timetables are built into the app, so there is nothing to download before you travel, and the
        routes you save stay on your phone. Only two optional links need a connection: opening directions in your maps app and visiting the GMRC website.
      </>
    ),
  },
  {
    q: 'Does MetroMate show live train or bus locations?',
    a: (
      <>
        No. MetroMate does not show live trains, live buses or real-time arrivals. Bus times are scheduled, and metro frequencies and first and last trains come from GMRC’s
        published timetable. The Live tab is different: it uses your own phone’s GPS, only when you start it, to show where you are along your journey and when your stop is
        next.
      </>
    ),
  },
  {
    q: 'Can I save my favourite routes?',
    a: (
      <>
        Yes. Star a route to keep it as a favourite, find recent trips on the Plan screen, and set up to three quick routes: Home, Campus and Work. They are stored in a small
        database on your phone and are never uploaded.
      </>
    ),
  },
  {
    q: 'How do I find station exits and facilities?',
    a: (
      <>
        Open any station from the Stations tab or the map. Its page lists the entry and exit gates and the lifts GMRC publishes for it, nearby bus stops within about 600 m,
        and the lines it serves. Facilities such as escalators or parking are not published station by station, so MetroMate does not guess them. Station locations are
        approximate; the{' '}
        <a href={site.dataSources} target="_blank" rel="noopener noreferrer" className="font-medium text-violet underline decoration-violet/30 underline-offset-4 hover:decoration-violet">
          data notes
        </a>{' '}
        list what is and isn’t known.
      </>
    ),
  },
];

function Item({ q, a, open, onToggle }: { q: string; a: ReactNode; open: boolean; onToggle: () => void }) {
  const id = useId();
  const reduced = useStillMotion();
  return (
    <li className="rounded-[20px] border border-line bg-white transition-shadow duration-300 hover:shadow-soft">
      <h3>
        <button
          type="button"
          id={`${id}-q`}
          aria-expanded={open}
          aria-controls={`${id}-a`}
          onClick={onToggle}
          className="flex w-full items-center justify-between gap-6 rounded-[20px] p-6 text-left"
        >
          <span className="font-display text-lg font-medium tracking-tight text-ink sm:text-xl">{q}</span>
          <span className={`flex size-9 shrink-0 items-center justify-center rounded-full transition-[background-color,rotate] duration-500 ease-[var(--ease-calm)] ${open ? 'rotate-45 bg-violet text-white' : 'bg-lavender text-ink'}`}>
            <Plus size={18} strokeWidth={2.2} aria-hidden />
          </span>
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={`${id}-a`}
            role="region"
            aria-labelledby={`${id}-q`}
            initial={reduced ? { opacity: 1 } : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.45, ease: CALM }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-6 text-[1rem] leading-relaxed text-ink-soft">{a}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </li>
  );
}

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" aria-labelledby="faq-title" className="relative bg-paper-deep/60 py-24 sm:py-32">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <Reveal>
          <SectionHeading eyebrow="FAQ" title={<span id="faq-title">Good questions, straight answers.</span>}>
            What MetroMate does, what it covers and what it doesn’t do yet.
          </SectionHeading>
        </Reveal>
        <Reveal delay={0.1}>
          <ul className="flex flex-col gap-3">
            {QA.map((item, i) => (
              <Item key={item.q} q={item.q} a={item.a} open={open === i} onToggle={() => setOpen(open === i ? null : i)} />
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
