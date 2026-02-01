'use client';

import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import Navigation from '@/components/landing/Navigation';
import Hero from '@/components/landing/Hero';
import LiveStats from '@/components/landing/LiveStats';
import YieldLoop from '@/components/landing/YieldLoop';
import CreatorPortfolios from '@/components/landing/CreatorPortfolios';
import Strategy from '@/components/landing/Strategy';
import Method from '@/components/landing/Method';
import Security from '@/components/landing/Security';
import FAQ from '@/components/landing/FAQ';
import FinalCTA from '@/components/landing/FinalCTA';
import Footer from '@/components/landing/Footer';

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  useEffect(() => {
    // Disable complex scroll animations on mobile for better UX
    const isMobile = window.matchMedia('(max-width: 1023px)').matches;
    
    if (isMobile) {
      // On mobile, kill all pinning ScrollTriggers for simpler scrolling
      const timeout = setTimeout(() => {
        ScrollTrigger.getAll().forEach((st) => {
          if (st.vars.pin) {
            st.kill();
          }
        });
      }, 100);
      return () => clearTimeout(timeout);
    }

    // Desktop: Wait for all ScrollTriggers to be created
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
    }, 100);

    return () => {
      clearTimeout(timeout);
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);

  return (
    <div className="relative min-h-screen gradient-bg">
      <Navigation />
      <main className="relative">
        <Hero />
        <LiveStats />
        <YieldLoop />
        <CreatorPortfolios />
        <Strategy />
        <Method />
        <Security />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
