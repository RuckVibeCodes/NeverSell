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
import { ScrollAnimations } from '@/components/landing/ScrollAnimations';

export default function Home() {
  return (
    <div className="relative min-h-[100dvh] lg:min-h-screen gradient-bg">
      {/* Client component for scroll animations */}
      <ScrollAnimations />
      
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
