import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useGsap, prefersReducedMotion } from '../lib/motion';

/**
 * Wraps route content and plays a short, subtle page transition on navigation.
 * Skipped entirely for prefers-reduced-motion users.
 */
export const PageTransition = ({ children }) => {
  const location = useLocation();
  const ref = useRef(null);
  const [key, setKey] = useState(location.pathname);

  useEffect(() => {
    setKey(location.pathname);
  }, [location.pathname]);

  useGsap(
    (gsap, root) => {
      if (prefersReducedMotion()) return;
      gsap.fromTo(
        root,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out', clearProps: 'opacity,transform' }
      );
    },
    [key]
  );

  return (
    <div ref={ref} key={key} className="min-h-[70vh]">
      {children}
    </div>
  );
};

export default PageTransition;
