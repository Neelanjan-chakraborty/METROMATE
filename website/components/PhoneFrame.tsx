import Image from 'next/image';

/**
 * A realistic phone frame around a real MetroMate screenshot (captured from the app at 390 × 844 pt).
 * The status bar is drawn by the frame, since the captures start below it.
 */
export function PhoneFrame({ src, alt, width = 300, priority = false, className = '', sizes, statusBg = '#f6f5ff', statusInk = 'dark' }: { src: string; alt: string; width?: number; priority?: boolean; className?: string; sizes?: string; statusBg?: string; statusInk?: 'dark' | 'light' }) {
  const bezel = Math.round(width * 0.035);
  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: width + bezel * 2, maxWidth: '100%' }}>
      <div className="relative rounded-[15%/7%] bg-[#1d1a19] p-[3.5%] shadow-device ring-1 ring-black/40">
        {/* side buttons */}
        <span aria-hidden className="absolute -left-[3px] top-[18%] h-[6%] w-[3px] rounded-l bg-[#2c2826]" />
        <span aria-hidden className="absolute -left-[3px] top-[27%] h-[10%] w-[3px] rounded-l bg-[#2c2826]" />
        <span aria-hidden className="absolute -right-[3px] top-[24%] h-[13%] w-[3px] rounded-r bg-[#2c2826]" />
        <div className="relative overflow-hidden rounded-[12%/5.6%]" style={{ aspectRatio: `390 / ${844 + 44}`, background: statusBg }}>
          {/* status bar */}
          <div aria-hidden className="absolute inset-x-0 top-0 z-10 flex h-[5%] items-center justify-between bg-transparent px-[8%] font-semibold" style={{ color: statusInk === 'dark' ? '#292524' : '#ffffff', fontSize: Math.max(8, Math.round(width * 0.04)) }}>
            <span>9:41</span>
            <span className="absolute left-1/2 top-[22%] h-[56%] w-[30%] -translate-x-1/2 rounded-full bg-[#1d1a19]" />
            <span className="flex items-center gap-1">
              <svg width="15" height="10" viewBox="0 0 15 10" aria-hidden>
                <rect x="0" y="6" width="2.5" height="4" rx="0.6" fill="currentColor" />
                <rect x="4" y="4" width="2.5" height="6" rx="0.6" fill="currentColor" />
                <rect x="8" y="2" width="2.5" height="8" rx="0.6" fill="currentColor" />
                <rect x="12" y="0" width="2.5" height="10" rx="0.6" fill="currentColor" opacity="0.35" />
              </svg>
              <svg width="22" height="11" viewBox="0 0 22 11" aria-hidden>
                <rect x="0.5" y="0.5" width="18" height="10" rx="2.6" fill="none" stroke="currentColor" opacity="0.45" />
                <rect x="2" y="2" width="12" height="7" rx="1.5" fill="currentColor" />
                <rect x="19.5" y="3.5" width="1.6" height="4" rx="0.8" fill="currentColor" opacity="0.45" />
              </svg>
            </span>
          </div>
          <div className="absolute inset-x-0 bottom-0" style={{ top: `${(44 / 888) * 100}%` }}>
            <Image src={src} alt={alt} fill sizes={sizes ?? `${width}px`} className="object-cover object-top" priority={priority} quality={90} />
          </div>
          <span aria-hidden className="absolute bottom-[1.2%] left-1/2 z-10 h-[0.55%] w-[34%] -translate-x-1/2 rounded-full bg-ink/80" />
        </div>
      </div>
    </div>
  );
}
