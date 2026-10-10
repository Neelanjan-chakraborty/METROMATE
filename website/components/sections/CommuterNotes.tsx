import { Reveal } from '../motion';
import { SectionHeading } from '../ui';

/*
 * MetroMate has no published user reviews yet, so this section shows illustrative commuter scenarios, clearly
 * labelled as examples. Each pairs a moment from an everyday trip with what the app actually does there.
 */

interface Note {
  moment: string;
  helps: string;
  sign: string;
  paper: string;
  tilt: string;
  tape: string;
}

const NOTES: Note[] = [
  {
    moment: 'Finding the right station exit before stepping off the train.',
    helps: 'Every station page lists GMRC’s gate numbers and the lifts near them.',
    sign: 'the arrival',
    paper: '#FFFDF7',
    tilt: 'rotate-[-1deg]',
    tape: '#FFB7B2',
  },
  {
    moment: 'Keeping a regular route ready for the morning commute.',
    helps: 'Save it as Home, Campus or Work and open it with one tap, even offline.',
    sign: 'the 8:40 commute',
    paper: '#FBFAF4',
    tilt: 'rotate-[0.8deg] md:translate-y-8',
    tape: '#C9C2F6',
  },
  {
    moment: 'Understanding where the metro connection meets the bus.',
    helps: 'Plans that mix metro, BRTS, AMTS and walking show each leg and where to change.',
    sign: 'the long way round',
    paper: '#FAFBF6',
    tilt: 'rotate-[0.6deg]',
    tape: '#CFE0CF',
  },
  {
    moment: 'Checking the last train before heading home late.',
    helps: 'The route screen shows first and last trains from GMRC’s published timetable.',
    sign: 'the late shift',
    paper: '#FFFCF6',
    tilt: 'rotate-[-0.9deg] md:translate-y-8',
    tape: '#FFDCC6',
  },
];

export function CommuterNotes() {
  return (
    <section aria-labelledby="notes-title" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <Reveal>
          <SectionHeading eyebrow="Commuter notes" title={<span id="notes-title">Made for the everyday in&#8209;between.</span>}>
            Small moments that make a trip feel easier. These are example scenarios, not quotes from users.
          </SectionHeading>
        </Reveal>

        <ul className="mt-14 grid gap-8 md:grid-cols-2 md:gap-x-10 md:gap-y-6">
          {NOTES.map((n, i) => (
            <li key={n.sign} className={n.tilt}>
              <Reveal delay={i * 0.08}>
                <article
                  className="relative rounded-[22px] p-7 pt-9 shadow-[0_1px_1px_rgb(41_37_36/0.04),0_18px_36px_-22px_rgb(41_37_36/0.3)] ring-1 ring-[#EDE6DA] sm:p-8 sm:pt-10"
                  style={{ background: n.paper }}
                >
                  <span aria-hidden className="absolute -top-3 left-8 h-6 w-20 rotate-[-4deg] rounded-[3px] opacity-80" style={{ background: n.tape }} />
                  <p className="eyebrow text-[0.68rem]">Example scenario</p>
                  <p className="mt-3 font-display text-[1.45rem] font-medium leading-snug tracking-tight text-ink">{n.moment}</p>
                  <p className="mt-4 border-t border-dashed border-[#E2DACB] pt-4 text-[0.98rem] leading-relaxed text-ink-soft">{n.helps}</p>
                  <p className="hand mt-4 text-right text-[1.7rem] leading-none text-violet">— {n.sign}</p>
                </article>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
