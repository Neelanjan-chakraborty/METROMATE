import Link from 'next/link';
import { nav, site } from '@/lib/site';
import { Logo } from '../Logo';

/** Minimal footer: navigation, privacy, contact (the project's issue tracker), sources and attribution. */
export function Footer() {
  return (
    <footer className="bg-ink text-paper/80">
      <div className="mx-auto max-w-6xl px-5 pb-12 pt-4 sm:px-8">
        <div className="grid gap-10 border-t border-paper/10 pt-12 md:grid-cols-[1.3fr_1fr_1fr]">
          <div>
            <Logo tone="paper" size={32} />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-paper/70">
              An offline-first metro and bus companion for Ahmedabad and Gandhinagar. Made with love by Neelanjan for Road to DevFest: Metro Hacks.
            </p>
          </div>
          <nav aria-label="Footer">
            <p className="eyebrow text-paper/55">Explore</p>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm">
              {nav.map((n) => (
                <li key={n.href}>
                  <Link href={`/${n.href}`} className="rounded hover:text-paper">
                    {n.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/#showcase" className="rounded hover:text-paper">
                  The app
                </Link>
              </li>
            </ul>
          </nav>
          <div>
            <p className="eyebrow text-paper/55">About</p>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm">
              <li>
                <Link href="/privacy" className="rounded hover:text-paper">
                  Privacy
                </Link>
              </li>
              <li>
                <a href={site.issues} target="_blank" rel="noopener noreferrer" className="rounded hover:text-paper">
                  Contact &amp; feedback (GitHub issues)
                </a>
              </li>
              <li>
                <a href={site.repo} target="_blank" rel="noopener noreferrer" className="rounded hover:text-paper">
                  Source code
                </a>
              </li>
              <li>
                <a href={site.dataSources} target="_blank" rel="noopener noreferrer" className="rounded hover:text-paper">
                  Data sources &amp; known gaps
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 space-y-2 border-t border-paper/10 pt-8 text-xs leading-relaxed text-paper/55">
          <p>
            MetroMate is an independent project. It is not affiliated with or endorsed by GMRC (Gujarat Metro Rail Corporation), AMTS, Ahmedabad Janmarg Ltd or GSRTC.
          </p>
          <p>
            Metro network, gates, lifts and timetables: GMRC published material. Bus timetables: a third-party GTFS compilation of AMTS, BRTS and Gandhinagar city bus
            schedules. Station photos in the app screenshots: Sanjeev4125 via Wikimedia Commons, CC BY-SA 4.0. Illustrations are original artwork.
          </p>
          <p>© {new Date().getFullYear()} MetroMate.</p>
        </div>
      </div>
    </footer>
  );
}
