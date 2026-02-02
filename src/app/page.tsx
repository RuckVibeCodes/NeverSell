'use client';

import { useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';

import Navigation from '@/components/landing/Navigation';
import Hero from '@/components/landing/Hero';

// Lazy load below-the-fold components for faster initial load
const LiveStats = dynamic(() => import('@/components/landing/LiveStats'), {
  ssr: false,
  loading: () => <div className="h-32 w-full" />,
});

const YieldLoop = dynamic(() => import('@/components/landing/YieldLoop'), {
  ssr: false,
  loading: () => <div className="min-h-screen w-full" />,
});

const CreatorPortfolios = dynamic(() => import('@/components/landing/CreatorPortfolios'), {
  ssr: false,
  loading: () => <div className="min-h-screen w-full" />,
});

const Strategy = dynamic(() => import('@/components/landing/Strategy'), {
  ssr: false,
  loading: () => <div className="min-h-screen w-full" />,
});

const Method = dynamic(() => import('@/components/landing/Method'), {
  ssr: false,
  loading: () => <div className="min-h-screen w-full" />,
});

const Security = dynamic(() => import('@/components/landing/Security'), {
  ssr: false,
  loading: () => <div className="min-h-screen w-full" />,
});

const FAQ = dynamic(() => import('@/components/landing/FAQ'), {
  ssr: false,
  loading: () => <div className="min-h-[50vh] w-full" />,
});

const FinalCTA = dynamic(() => import('@/components/landing/FinalCTA'), {
  ssr: false,
  loading: () => <div className="min-h-[40vh] w-full" />,
});

const Footer = dynamic(() => import('@/components/landing/Footer'), {
  ssr: false,
  loading: () => <div className="h-32 w-full" />,
});

export default function Home() {
  useEffect(() => {
    // Dynamically import GSAP only after hydration to avoid blocking initial render
    
    const initScrollAnimations = async () => {
      // Only load GSAP on desktop where we use complex scroll animations
      const isMobile = window.matchMedia('(max-width: 1023px)').matches;
      if (isMobile) return;
      
      const gsap = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      
      gsap.default.registerPlugin(ScrollTrigger);
      
      // Wait for all ScrollTriggers to be created
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

  return (
    <div className="relative min-h-screen gradient-bg">
      <Navigation />
      <main className="relative">
        <Hero />
        <Suspense fallback={<div className="h-32 w-full" />}>
          <LiveStats />
        </Suspense>
        <Suspense fallback={<div className="min-h-screen w-full" />}>
          <YieldLoop />
        </Suspense>
        <Suspense fallback={<div className="min-h-screen w-full" />}>
          <CreatorPortfolios />
        </Suspense>
        <Suspense fallback={<div className="min-h-screen w-full" />}>
          <Strategy />
        </Suspense>
        <Suspense fallback={<div className="min-h-screen w-full" />}>
          <Method />
        </Suspense>
        <Suspense fallback={<div className="min-h-screen w-full" />}>
          <Security />
        </Suspense>
        <Suspense fallback={<div className="min-h-[50vh] w-full" />}>
          <FAQ />
        </Suspense>
        <Suspense fallback={<div className="min-h-[40vh] w-full" />}>
          <FinalCTA />
        </Suspense>
      </main>
      <Suspense fallback={<div className="h-32 w-full" />}>
        <Footer />
      </Suspense>
    </div>
  );
}
