'use client';

import { useEffect } from 'react';

/**
 * Client component that initializes GSAP scroll animations
 * Isolated so the landing page can be a server component
 */
export function ScrollAnimations() {
  useEffect(() => {
    const initScrollAnimations = async () => {
      // Only load GSAP on desktop where we use complex scroll animations
      const isMobile = window.matchMedia('(max-width: 1023px)').matches;
      if (isMobile) return;
      
      const gsap = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      
      gsap.default.registerPlugin(ScrollTrigger);
      
      // Wait for all ScrollTriggers to be created by child components
      const timeout = setTimeout(() => {
        const pinned = ScrollTrigger.getAll()
          .filter((st) => st.vars.pin)
          .sort((a, b) => a.start - b.start);

        const maxScroll = ScrollTrigger.maxScroll(window);
        if (!maxScroll || pinned.length === 0) return;

        // Build pinned ranges with settle centers
        const pinnedRanges = pinned.map((st) => {
          const start = st.start / maxScroll;
          const end = (st.end ?? st.start) / maxScroll;
          const settleRatio = 0.5;
          const settleCenter = start + (end - start) * settleRatio;
          return { start, end, settleCenter };
        });

        // Create global snap
        ScrollTrigger.create({
          snap: {
            snapTo: (value) => {
              const inPinned = pinnedRanges.some(
                (r) => value >= r.start - 0.02 && value <= r.end + 0.02
              );
              if (!inPinned) return value;

              const target = pinnedRanges.reduce(
                (closest, r) =>
                  Math.abs(value - r.settleCenter) <
                  Math.abs(value - closest.settleCenter)
                    ? r
                    : closest,
                pinnedRanges[0]
              );
              return target.settleCenter;
            },
            duration: { min: 0.4, max: 0.8 },
            ease: 'power2.inOut',
          },
        });
      }, 500);

      return () => {
        clearTimeout(timeout);
      };
    };

    // Delay GSAP initialization to after first paint
    const rafId = requestAnimationFrame(() => {
      initScrollAnimations();
    });

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, []);

  // This component renders nothing - it just runs the effect
  return null;
}
