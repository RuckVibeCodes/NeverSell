import { Suspense } from 'react';
import dynamic from 'next/dynamic';

import Navigation from '@/components/landing/Navigation';
import Hero from '@/components/landing/Hero';
import { ScrollAnimations } from '@/components/landing/ScrollAnimations';

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
  return (
    <div className="relative min-h-screen gradient-bg">
      {/* Client component for scroll animations */}
      <ScrollAnimations />
      
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
