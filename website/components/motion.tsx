'use client';

import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion';
import type { ReactNode } from 'react';

/*
 * The site's motion language: slow, low-velocity reveals (opacity 0 → 1, 24 px rise, 0.8 s, calm ease-out)
 * that play once as a block enters the viewport. With reduced motion everything simply appears.
 */

export const CALM = [0.22, 1, 0.36, 1] as const;

interface RevealProps extends HTMLMotionProps<'div'> {
  delay?: number;
  /** Rise distance in px. */
  y?: number;
  children: ReactNode;
}

export function Reveal({ delay = 0, y = 24, children, ...rest }: RevealProps) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 0.85, ease: CALM, delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** A soft decorative blob that drifts ±10 px on a slow loop. Purely decorative and hidden from assistive tech. */
export function FloatBlob({ className, color, duration = 8, delay = 0 }: { className?: string; color: string; duration?: number; delay?: number }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      aria-hidden
      className={`pointer-events-none absolute rounded-full blur-2xl ${className ?? ''}`}
      style={{ background: color }}
      animate={reduced ? undefined : { x: [0, 10, -6, 0], y: [0, -10, 6, 0] }}
      transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

/** An SVG path that draws itself once when it scrolls into view. */
export function DrawPath({ delay = 0, duration = 1.6, ...rest }: React.ComponentProps<typeof motion.path> & { delay?: number; duration?: number }) {
  const reduced = useReducedMotion();
  return (
    <motion.path
      initial={reduced ? false : { pathLength: 0 }}
      whileInView={{ pathLength: 1 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration, delay, ease: CALM }}
      {...rest}
    />
  );
}
