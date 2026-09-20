import { useEffect, useRef, useState } from 'react';

/**
 * Tiny GSAP module loader with a shared registry.
 * `useGsap(cb)` — run a gsap context scoped to your component (auto-cleanup via gsap.context).
 * `useReveal()` — attach to a container; direct children get a staggered rise+fade entrance.
 * Both respect prefers-reduced-motion (animations become instant sets to final state).
 */
let cachedGsap = null;

const loadGsap = async () => {
  if (cachedGsap) return cachedGsap;
  const mod = await import('gsap');
  cachedGsap = mod.gsap || mod.default;
  return cachedGsap;
};

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const useGsap = (setup, deps = []) => {
  const scopeRef = useRef(null);
  useEffect(() => {
    let ctx;
    let cancelled = false;
    loadGsap().then((gsap) => {
      if (cancelled || !scopeRef.current) return;
      ctx = gsap.context(() => {
        setup(gsap, scopeRef.current);
      }, scopeRef);
    });
    return () => {
      cancelled = true;
      if (ctx) ctx.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return scopeRef;
};

export const useReveal = (options = {}) => {
  const { y = 24, stagger = 0.07, duration = 0.7, selector = ':scope > *' } = options;
  const ref = useRef(null);
  useEffect(() => {
    let ctx;
    let cancelled = false;
    loadGsap().then((gsap) => {
      if (cancelled || !ref.current) return;
      const targets = ref.current.querySelectorAll(selector);
      if (!targets.length) return;
      ctx = gsap.context(() => {
        if (prefersReducedMotion()) {
          gsap.set(targets, { opacity: 1, y: 0, clearProps: 'all' });
          return;
        }
        gsap.set(targets, { opacity: 0, y });
        gsap.to(targets, {
          opacity: 1,
          y: 0,
          duration,
          stagger,
          ease: 'power3.out',
          overwrite: 'auto',
        });
      }, ref);
    });
    return () => {
      cancelled = true;
      if (ctx) ctx.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return ref;
};

/** Scroll-triggered one-shot reveal for a section (subtle rise, no scroll-jacking). */
export const useScrollReveal = (options = {}) => {
  const { y = 28, duration = 0.8 } = options;
  const ref = useRef(null);
  useEffect(() => {
    let ctx;
    let cancelled = false;
    loadGsap().then((gsap) => {
      if (cancelled || !ref.current) return;
      const el = ref.current;
      if (prefersReducedMotion()) return; // leave content visible
      gsap.set(el, { opacity: 0, y });
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              ctx = gsap.context(() => {
                gsap.to(el, { opacity: 1, y: 0, duration, ease: 'power3.out' });
              }, el);
              io.disconnect();
            }
          });
        },
        { threshold: 0.18 }
      );
      io.observe(el);
    });
    return () => {
      cancelled = true;
      if (ctx) ctx.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return ref;
};

/** Cached module-level load promise for three.js (code-split). */
let cachedThree = null;
export const loadThree = async () => {
  if (cachedThree) return cachedThree;
  cachedThree = await import('three');
  return cachedThree;
};
