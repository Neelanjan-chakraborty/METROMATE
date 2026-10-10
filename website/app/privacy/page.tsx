import type { Metadata } from 'next';
import Link from 'next/link';
import { site } from '@/lib/site';
import { Logo } from '@/components/Logo';
import { Footer } from '@/components/sections/Footer';

export const metadata: Metadata = {
  title: 'Privacy — MetroMate',
  description: 'How the MetroMate app and this website handle your data: no account, no tracking, everything stays on your phone.',
};

const APP = [
  ['No account, no sign-up', 'MetroMate has no accounts and no backend server. There is nothing to log in to.'],
  [
    'Your saved data stays on your phone',
    'Favourites, recent trips, Home / Campus / Work shortcuts, your language and any station positions you choose to record are kept in a small database on your device. They are never uploaded. “Reset local data” in Settings removes them.',
  ],
  [
    'Location only when you ask',
    'The Live tab reads your phone’s GPS in the foreground, only after you start it, to show where you are along your journey. Your position is processed on the phone and is not sent anywhere.',
  ],
  ['No analytics or ads', 'The app contains no analytics, advertising or tracking code, and makes no network requests of its own.'],
  [
    'Optional links',
    'Two optional links open other services that have their own privacy policies: directions in your maps app, and the GMRC website.',
  ],
] as const;

const WEB = [
  ['No cookies, no tracking', 'This website sets no cookies and uses no analytics, ads or third-party trackers. Its fonts are served from this site.'],
  ['No forms', 'The site does not ask for or collect any personal information.'],
  [
    'Hosting',
    'Like any website, the server that hosts these pages may keep standard request logs (such as IP address and browser type) for security and reliability.',
  ],
  [
    'Downloading the app',
    'The Android preview build is a file hosted by Expo (expo.dev); downloading it is subject to Expo’s own terms and privacy policy.',
  ],
] as const;

function List({ items }: { items: readonly (readonly [string, string])[] }) {
  return (
    <dl className="mt-6 divide-y divide-line rounded-[28px] border border-line bg-white">
      {items.map(([t, d]) => (
        <div key={t} className="p-6">
          <dt className="font-display text-lg font-medium tracking-tight text-ink">{t}</dt>
          <dd className="mt-1.5 leading-relaxed text-ink-soft">{d}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function PrivacyPage() {
  return (
    <>
      <header className="mx-auto flex max-w-3xl items-center justify-between px-5 pt-8 sm:px-8">
        <Link href="/" aria-label="MetroMate home" className="rounded-full">
          <Logo size={34} />
        </Link>
        <Link href="/" className="rounded-full px-4 py-2 text-sm font-medium text-ink-soft ring-1 ring-line hover:text-ink">
          Back to home
        </Link>
      </header>
      <main id="main" className="mx-auto max-w-3xl px-5 pb-24 pt-16 sm:px-8">
        <p className="eyebrow">Privacy</p>
        <h1 className="display mt-4 text-5xl text-ink sm:text-6xl">Your trips are your business.</h1>
        <p className="mt-6 text-lg leading-relaxed text-muted">MetroMate is built to work on your phone, without accounts or tracking. Here is exactly what that means.</p>
        <h2 className="headline mt-14 text-3xl text-ink">The MetroMate app</h2>
        <List items={APP} />
        <h2 className="headline mt-14 text-3xl text-ink">This website</h2>
        <List items={WEB} />
        <p className="mt-12 leading-relaxed text-ink-soft">
          Questions? Open an issue on the project’s{' '}
          <a href={site.issues} target="_blank" rel="noopener noreferrer" className="font-medium text-violet underline decoration-violet/30 underline-offset-4 hover:decoration-violet">
            GitHub page
          </a>
          .
        </p>
      </main>
      <Footer />
    </>
  );
}
