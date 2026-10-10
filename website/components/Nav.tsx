'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { nav } from '@/lib/site';
import { Logo } from './Logo';

/**
 * Floating pill navigation. On small screens the section links fold into a menu (a disclosure button with a
 * labelled panel; Escape and outside clicks close it), while the logo and the primary action stay visible.
 */
export function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (panel.current && !panel.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-3 sm:top-5">
      <div ref={panel} className="pointer-events-auto relative w-full max-w-5xl">
        <nav
          aria-label="Main"
          className={`flex items-center justify-between gap-2 rounded-full border border-line/80 bg-paper/75 py-2 pl-3 pr-2 backdrop-blur-md transition-shadow duration-500 sm:pl-4 ${scrolled ? 'shadow-soft' : 'shadow-[0_4px_20px_-14px_rgb(41_37_36/0.25)]'}`}
        >
          <Link href="#top" className="rounded-full" aria-label="MetroMate, back to top">
            <Logo size={34} />
          </Link>
          <ul className="hidden items-center gap-1 md:flex">
            {nav.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="rounded-full px-3.5 py-2 text-[0.92rem] font-medium text-ink-soft transition-colors hover:bg-ink/[0.05] hover:text-ink">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-1.5">
            <Link href="#showcase" className="inline-flex min-h-11 items-center rounded-full bg-ink px-4 text-[0.9rem] font-semibold text-paper transition-colors hover:bg-ink-soft sm:px-5">
              Explore the app
            </Link>
            <button
              type="button"
              className="inline-flex size-11 items-center justify-center rounded-full text-ink hover:bg-ink/[0.05] md:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? 'Close menu' : 'Open menu'}
              onClick={() => setOpen((o) => !o)}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>
        <div
          id="mobile-menu"
          hidden={!open}
          className="absolute inset-x-0 top-[calc(100%+8px)] rounded-[28px] border border-line bg-paper/95 p-2 shadow-lift backdrop-blur-md md:hidden"
        >
          <ul className="flex flex-col">
            {nav.map((n) => (
              <li key={n.href}>
                <Link href={n.href} onClick={() => setOpen(false)} className="block rounded-2xl px-4 py-3.5 text-base font-medium text-ink hover:bg-ink/[0.05]">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </header>
  );
}
