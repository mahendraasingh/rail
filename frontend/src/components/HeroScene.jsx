import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../lib/motion';

const HeroScene3D = lazy(() => import('./HeroScene3D'));

const hasWebGL = () => {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch {
    return false;
  }
};

/**
 * Landing hero visual host.
 * Desktops with WebGL get the 3D railway scene; mobile, reduced-motion, or
 * non-WebGL environments get a lightweight 2D SVG railway fallback.
 */
export const HeroScene = () => {
  const [mode, setMode] = useState('checking'); // '3d' | 'fallback' | 'checking'
  const hostRef = useRef(null);

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches;
    const wide = window.innerWidth >= 768;
    const reduced = prefersReducedMotion();
    if (!reduced && fine && wide && hasWebGL()) {
      setMode('3d');
    } else {
      setMode('fallback');
    }
  }, []);

  return (
    <div ref={hostRef} className="relative h-[280px] sm:h-[360px] lg:h-[440px] select-none" aria-hidden="true">
      {mode === '3d' && (
        <Suspense fallback={<HeroFallback />}>
          <HeroScene3D />
        </Suspense>
      )}
      {mode !== '3d' && <HeroFallback />}
    </div>
  );
};

/** Lightweight 2D railway fallback: stations + route + schematic train. */
export const HeroFallback = () => {
  return (
    <div className="absolute inset-0 flex flex-col justify-center overflow-hidden">
      <svg viewBox="0 0 900 260" fill="none" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        {/* Route line */}
        <path d="M 40 190 H 860" stroke="#D8D0BE" strokeWidth="2" />
        <path d="M 40 190 H 500" stroke="#971C26" strokeWidth="2" strokeDasharray="2 0" opacity="0.55" />
        {/* Stations */}
        {[
          { x: 40, label: 'NEW DELHI' },
          { x: 300, label: 'AGRA' },
          { x: 560, label: 'BHOPAL' },
          { x: 860, label: 'MUMBAI' },
        ].map((s) => (
          <g key={s.label}>
            <circle cx={s.x} cy="190" r="5" fill="#23201B" />
            <text x={s.x} y="216" textAnchor="middle" fontSize="10" fontWeight="700" letterSpacing="2" fill="#9C947F">
              {s.label}
            </text>
          </g>
        ))}
        {/* Schematic train */}
        <g transform="translate(120, 96)">
          <rect x="0" y="0" width="150" height="52" rx="12" fill="#23201B" />
          <rect x="158" y="6" width="120" height="46" rx="10" fill="#3B372F" />
          <rect x="286" y="6" width="120" height="46" rx="10" fill="#3B372F" />
          {[0, 1, 2].map((i) => (
            <rect key={i} x={18 + i * 42} y="12" width="26" height="18" rx="4" fill="#EDD79E" opacity="0.9" />
          ))}
          {[0, 1, 2].map((i) => (
            <rect key={`b${i}`} x={170 + i * 38} y="14" width="24" height="16" rx="4" fill="#EDD79E" opacity="0.55" />
          ))}
          {[0, 1, 2].map((i) => (
            <rect key={`c${i}`} x={298 + i * 38} y="14" width="24" height="16" rx="4" fill="#EDD79E" opacity="0.55" />
          ))}
          {/* wheels */}
          {[28, 122, 186, 250, 314, 378].map((x) => (
            <circle key={x} cx={x} cy="56" r="6" fill="#23201B" stroke="#9C947F" strokeWidth="2" />
          ))}
        </g>
        {/* Coach window motif dots */}
        <g opacity="0.5">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <rect key={i} x={430 + i * 22} y="60" width="12" height="10" rx="2" fill="#D8D0BE" />
          ))}
        </g>
      </svg>
    </div>
  );
};

export default HeroScene;
