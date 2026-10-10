import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/motion';
import { Button } from '@/components/ui';
import { NetworkMapArt, StationCutawayArt, ConnectionArt, OfflineArt } from '@/components/art/StoryArt';

/*
 * "Built around the way you move": four alternating editorial stories, each a large illustration on its own
 * background shape (an organic blob, an arch, a rounded panel, a circle) beside short copy and one link. On
 * small screens the illustration sits above the text.
 */

interface Story {
  id: string;
  kicker: string;
  title: ReactNode;
  body: string;
  cta: string;
  href: string;
  art: ReactNode;
  /** Background shape behind the illustration. */
  shape: string;
  /** Clip the illustration inside its shape; the value adds layout classes for that frame. */
  clip?: string;
}

const STORIES: Story[] = [
  {
    id: 'story-map',
    kicker: 'The network, made clearer',
    title: 'See the bigger picture.',
    body: 'Understand the network, spot your connections and explore stations without getting lost in a wall of lines.',
    cta: 'Explore the map',
    href: '#showcase-map',
    art: <NetworkMapArt />,
    shape: 'inset-x-[2%] inset-y-[6%] bg-lavender [border-radius:58%_42%_55%_45%/48%_56%_44%_52%]',
  },
  {
    id: 'story-stations',
    kicker: 'Every station has a story',
    title: 'Know before you arrive.',
    body: 'Find exits, lifts, nearby bus stops and landmarks for every station in one easy-to-understand place.',
    cta: 'Discover stations',
    href: '#showcase-stations',
    art: <StationCutawayArt />,
    shape: '[border-radius:50%_50%_40px_40px/51%_51%_40px_40px] bg-sage',
    clip: 'mx-auto max-w-[560px] pt-[14%]',
  },
  {
    id: 'story-connections',
    kicker: 'Metro to bus, without the confusion',
    title: 'One city. Better connections.',
    body: 'Understand how metro and bus journeys fit together, wherever integrated route data is available.',
    cta: 'See how it works',
    href: '#how-it-works',
    art: <ConnectionArt />,
    shape: 'rounded-[40px] bg-paper-deep ring-1 ring-line/70',
    clip: 'py-[3%]',
  },
  {
    id: 'story-offline',
    kicker: 'Your essentials, even offline',
    title: (
      <>
        Less signal. <span className="hand text-[1.25em] font-normal tracking-normal text-violet">Less stress.</span>
      </>
    ),
    body: 'Maps, timetables and station details live on your phone, and your saved journeys stay there too, even when your connection disappears.',
    cta: 'Explore offline features',
    href: '#offline',
    art: <OfflineArt />,
    shape: 'left-1/2 top-1/2 aspect-square w-[92%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_35%_30%,var(--color-peach),color-mix(in_oklab,var(--color-coral)_45%,var(--color-paper)))]',
  },
];

export function FeatureStory() {
  return (
    <section id="stories" aria-labelledby="stories-title" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
          <p className="eyebrow">Why MetroMate</p>
          <h2 id="stories-title" className="display text-[2.7rem] text-ink sm:text-6xl lg:text-[4.6rem]">
            Built around the way you move.
          </h2>
        </Reveal>

        <div className="mt-16 flex flex-col gap-20 sm:mt-24 sm:gap-28 lg:gap-40">
          {STORIES.map((s, i) => {
            const flip = i % 2 === 1;
            return (
              <article key={s.id} id={s.id} aria-labelledby={`${s.id}-title`} className="grid items-center gap-8 sm:gap-12 lg:grid-cols-12 lg:gap-16">
                <Reveal className={`relative lg:col-span-7 ${flip ? 'lg:order-2' : ''}`}>
                  {s.clip ? (
                    <div className={`relative overflow-hidden ${s.clip} ${s.shape}`}>{s.art}</div>
                  ) : (
                    <>
                      <div aria-hidden className={`absolute ${s.shape}`} />
                      <div className="relative px-1 py-4 sm:px-6 sm:py-8">{s.art}</div>
                    </>
                  )}
                </Reveal>
                <Reveal delay={0.12} className={`flex flex-col items-start gap-5 lg:col-span-5 ${flip ? 'lg:order-1 lg:pl-4' : 'lg:pr-4'}`}>
                  <div className="flex items-center gap-3">
                    <span className="font-display text-sm font-semibold tabular-nums text-violet">0{i + 1}</span>
                    <span aria-hidden className="h-px w-8 bg-ink/20" />
                    <p className="eyebrow">{s.kicker}</p>
                  </div>
                  <h3 id={`${s.id}-title`} className="headline text-[2.2rem] text-ink sm:text-5xl lg:text-[3.3rem]">
                    {s.title}
                  </h3>
                  <p className="max-w-md text-lg leading-relaxed text-ink-soft">{s.body}</p>
                  <Button href={s.href} tone="ghost" className="mt-2" icon={<ArrowRight size={18} aria-hidden className="transition-transform duration-300 group-hover:translate-x-0.5" />}>
                    {s.cta}
                  </Button>
                </Reveal>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
