import { useEffect, useState } from 'react';
import { useGsap, prefersReducedMotion } from '../lib/motion';

/** Small inline train mark used across the app (navbar, loader, footer). */
export const TrainGlyph = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
    <rect x="5" y="3" width="14" height="13" rx="3.2" />
    <path d="M5 10.5h14" />
    <circle cx="9" cy="13.6" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="13.6" r="1.1" fill="currentColor" stroke="none" />
    <path d="M8 19.5l1.6-3M16 19.5l-1.6-3M6.5 21h11" strokeLinecap="round" />
  </svg>
);

const STEPS = ['TRACK', 'COACH', 'SEATS', 'ROUTE'];

/**
 * Premium railway loading screen.
 * Sequence: railway track -> train -> coach -> seats -> route -> RailSaathi wordmark.
 * Auto-hides on readiness (`onDone`) after a short minimum display time.
 */
export const LoadingScreen = ({ onDone, minDuration = 1400 }) => {
  const [leaving, setLeaving] = useState(false);
  const scope = useGsap((gsap, root) => {
    const q = gsap.utils.selector(root);
    if (prefersReducedMotion()) {
      gsap.set(q('[data-fade]'), { opacity: 1 });
      gsap.set(q('.ls-track'), { scaleX: 1 });
      return;
    }
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
    tl.from(q('.ls-track'), { scaleX: 0, transformOrigin: 'left center', duration: 0.7 })
      .from(q('[data-train]'), { x: -70, opacity: 0, duration: 0.55 }, '-=0.25')
      .from(q('[data-berth]'), { opacity: 0, y: 6, stagger: 0.05, duration: 0.3 }, '-=0.15')
      .fromTo(
        q('.ls-route'),
        { strokeDashoffset: 60 },
        { strokeDashoffset: 0, duration: 0.6 },
        '-=0.2'
      )
      .from(q('[data-wordmark]'), { opacity: 0, y: 10, duration: 0.45 }, '-=0.15')
      .from(q('[data-prep]'), { opacity: 0, duration: 0.35 }, '-=0.2');
  });

  useEffect(() => {
    const t1 = setTimeout(() => setLeaving(true), minDuration);
    const t2 = setTimeout(() => onDone && onDone(), minDuration + 420);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onDone, minDuration]);

  return (
    <div
      ref={scope}
      className={`fixed inset-0 z-[100] paper-texture flex flex-col items-center justify-center gap-8 transition-opacity duration-400 ${
        leaving ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      role="status"
      aria-label="RailSaathi is preparing your journey"
    >
      {/* Track */}
      <div className="w-56 h-[3px] rounded-full bg-line-strong relative overflow-hidden ls-track">
        <div className="absolute inset-y-0 left-0 w-full grid grid-cols-10">
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} className="border-r border-ivory/80" />
          ))}
        </div>
      </div>

      {/* Train + coach + seats */}
      <div data-train className="ink-band rounded-2xl px-6 py-4 shadow-elevated flex items-center gap-4">
        <TrainGlyph className="w-8 h-8 text-saffron-300" />
        <div className="grid grid-cols-4 gap-1.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} data-berth className="w-3.5 h-4 rounded-[4px] bg-ivory/15 border border-ivory/25" />
          ))}
        </div>
        {/* Route glyph */}
        <svg width="70" height="24" viewBox="0 0 70 24" fill="none" className="ml-2">
          <circle cx="6" cy="12" r="3" className="text-saffron-300" fill="currentColor" />
          <circle cx="64" cy="12" r="3" className="text-crimson-400" fill="currentColor" />
          <path
            className="ls-route text-saffron-200"
            d="M9 12 H 61"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeDasharray="4 4"
            strokeDashoffset="60"
          />
        </svg>
      </div>

      {/* Wordmark */}
      <div data-wordmark className="text-center space-y-1.5">
        <h1 className="font-display text-3xl tracking-tight text-ink">
          RAIL<span className="text-crimson-600">SAATHI</span>
        </h1>
        <p className="platform-label">Booked Together. Sit Together.</p>
      </div>

      {/* Progress steps */}
      <div data-prep className="flex items-center gap-3">
        {STEPS.map((s) => (
          <span key={s} className="platform-label !text-[10px]">{s}</span>
        ))}
        <span className="platform-label !text-[10px] text-crimson-600 animate-pulse">· PREPARING JOURNEY…</span>
      </div>
    </div>
  );
};

export default LoadingScreen;
