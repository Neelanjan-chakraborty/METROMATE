import Link from 'next/link';
import { ArrowRight, Download } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { MiniCity } from '@/components/art/MiniCity';
import { DrawPath, Reveal } from '@/components/motion';
import { Button } from '@/components/ui';
import { site } from '@/lib/site';

/*
 * The closing invitation: dark charcoal, paper text, one restrained coral accent, and a small evening city
 * with the metro and bus still running along their lines.
 */

const LABELS = ['Practical by design', 'Offline-ready', 'Made for everyday travel.'];

export function FinalCta() {
  return (
    <section aria-labelledby="final-cta-title" className="relative overflow-hidden bg-ink text-paper">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-[-18%] h-[520px] w-[820px] max-w-[140vw] -translate-x-1/2 rounded-full bg-violet/20 blur-[120px]" />

      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-5 pt-24 text-center sm:px-8 sm:pt-32">
        <Reveal className="flex flex-col items-center">
          <Logo size={44} tone="paper" />
        </Reveal>

        <Reveal delay={0.08} className="mt-10">
          <h2 id="final-cta-title" className="display text-[2.7rem] text-paper sm:text-6xl lg:text-[4.6rem]">
            Your next journey can feel{' '}
            <span className="relative inline-block whitespace-nowrap">
              simpler.
              <svg viewBox="0 0 220 24" preserveAspectRatio="none" className="absolute -bottom-[0.16em] left-[2%] h-[0.28em] w-[94%]" aria-hidden>
                <DrawPath d="M4 15 C 52 6, 120 4, 216 11 M28 20 C 80 14, 140 13, 196 17" fill="none" stroke="#FFB7B2" strokeWidth={4.5} strokeLinecap="round" delay={0.5} duration={1.4} />
              </svg>
            </span>
          </h2>
        </Reveal>

        <Reveal delay={0.14} className="mt-7">
          <p className="max-w-md text-lg leading-relaxed text-paper/75">Find your way through the city, one better connection at a time.</p>
        </Reveal>

        <Reveal delay={0.2} className="mt-10 flex w-full flex-col items-center gap-3">
          <div className="flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:items-center">
            <Button href={site.androidApk} download external={false} tone="light" icon={<Download aria-hidden className="size-[1.1em]" />} ariaLabel="Get MetroMate: download the Android preview build (APK)">
              Get MetroMate
            </Button>
            <Link
              href="#showcase-map"
              className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-[0.95rem] font-semibold text-paper ring-1 ring-paper/25 transition-[background-color,box-shadow] duration-300 hover:bg-paper/[0.07] hover:ring-paper/45"
            >
              Explore the network
              <ArrowRight aria-hidden className="size-[1.05em] transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transition-none" />
            </Link>
          </div>
          <p className="text-[0.84rem] text-paper/65">
            Android preview build (APK) <span aria-hidden className="mx-1 inline-block size-1 rounded-full bg-coral align-middle" /> iPhone version not available yet
          </p>
        </Reveal>

        <Reveal delay={0.26} className="mt-12">
          <ul className="flex flex-wrap items-center justify-center gap-2.5" aria-label="MetroMate in brief">
            {LABELS.map((l) => (
              <li key={l} className="rounded-full bg-paper/[0.06] px-4 py-2 text-[0.85rem] font-medium text-paper/80 ring-1 ring-paper/10">
                {l}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>

      <MiniCity className="relative mt-14 block h-[200px] w-full sm:mt-16 sm:h-[260px] lg:h-[300px]" />
    </section>
  );
}
