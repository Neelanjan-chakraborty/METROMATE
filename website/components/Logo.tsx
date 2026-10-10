import Image from 'next/image';

/** MetroMate's train-inspired "M" mark (the app icon) with the wordmark. */
export function Logo({ size = 36, wordmark = true, tone = 'ink' }: { size?: number; wordmark?: boolean; tone?: 'ink' | 'paper' }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <Image src="/brand/logo.webp" alt={wordmark ? '' : 'MetroMate'} width={size} height={size} className="rounded-[24%] shadow-[0_6px_14px_-6px_rgb(81_64_232/0.6)]" priority />
      {wordmark ? <span className={`font-display text-[1.15rem] font-semibold tracking-tight ${tone === 'ink' ? 'text-ink' : 'text-paper'}`}>MetroMate</span> : null}
    </span>
  );
}
