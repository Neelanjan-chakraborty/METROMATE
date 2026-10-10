import Link from 'next/link';
import type { ReactNode } from 'react';

/*
 * Small shared building blocks: buttons (real links only), section headers and pills.
 */

type ButtonTone = 'dark' | 'violet' | 'light' | 'ghost' | 'coral';

const TONES: Record<ButtonTone, string> = {
  dark: 'bg-ink text-paper hover:bg-ink-soft',
  violet: 'bg-violet text-white hover:bg-violet-deep',
  light: 'bg-white text-ink ring-1 ring-line hover:ring-ink/25',
  ghost: 'bg-transparent text-ink ring-1 ring-ink/15 hover:bg-ink/[0.04]',
  coral: 'bg-coral text-ink hover:bg-coral-deep',
};

interface ButtonProps {
  href: string;
  tone?: ButtonTone;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
  /** For links that leave the site or download a file. */
  external?: boolean;
  download?: boolean;
  ariaLabel?: string;
}

/** A pill button that is always a real link (an in-page section, a page, or an external file). */
export function Button({ href, tone = 'dark', children, icon, className = '', external, download, ariaLabel }: ButtonProps) {
  const cls = `group inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-[0.95rem] font-semibold transition-[transform,background-color,box-shadow] duration-300 ease-[var(--ease-calm)] hover:scale-[1.02] active:scale-[0.99] motion-reduce:hover:scale-100 ${TONES[tone]} ${className}`;
  if (external || download) {
    return (
      <a href={href} className={cls} aria-label={ariaLabel} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} {...(download ? { download: '' } : {})}>
        {children}
        {icon}
      </a>
    );
  }
  return (
    <Link href={href} className={cls} aria-label={ariaLabel}>
      {children}
      {icon}
    </Link>
  );
}

export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`eyebrow ${className}`}>{children}</p>;
}

/** Section heading block: eyebrow, large headline, optional supporting text. */
export function SectionHeading({ eyebrow, title, children, align = 'left', className = '' }: { eyebrow?: string; title: ReactNode; children?: ReactNode; align?: 'left' | 'center'; className?: string }) {
  const a = align === 'center' ? 'mx-auto text-center items-center' : 'items-start';
  return (
    <div className={`flex max-w-3xl flex-col gap-4 ${a} ${className}`}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 className="headline text-[2.4rem] text-ink sm:text-5xl lg:text-[3.6rem]">{title}</h2>
      {children ? <div className="max-w-xl text-lg leading-relaxed text-muted">{children}</div> : null}
    </div>
  );
}

/** A small rounded label, used for benefit chips. */
export function Pill({ children, icon, className = '' }: { children: ReactNode; icon?: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full bg-white/80 px-3.5 py-2 text-sm font-medium text-ink-soft ring-1 ring-line ${className}`}>
      {icon}
      {children}
    </span>
  );
}

/** Restrained handwritten accent, e.g. "your way". */
export function Hand({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`hand text-[1.6em] leading-none text-violet ${className}`}>{children}</span>;
}
