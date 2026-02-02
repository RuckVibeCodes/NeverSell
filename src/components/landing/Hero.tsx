'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Particle component for background - lightweight CSS animations
const Particles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-mint/30"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `particle-float ${15 + Math.random() * 10}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}
    </div>
  );
};

interface CalculatorProps {
  amount: number;
  setAmount: (amount: number) => void;
  asset: string;
  setAsset: (asset: string) => void;
}

// Blended APYs: (Aave Supply × 0.6) + (GMX Pool × 0.4)
// Source: Aave V3 Arbitrum supply rates + GMX GM pool APYs (Feb 2026)
// BTC: (0.1% × 0.6) + (14.82% × 0.4) = 6.0%
// ETH: (2.0% × 0.6) + (19.75% × 0.4) = 9.1%
// ARB: (1.0% × 0.6) + (8.65% × 0.4) = 4.1%
// USDC: (4.5% × 0.6) + (19.75% × 0.4) = 10.6% (uses ETH/USD pool)
const assetAPYs: Record<string, number> = {
  BTC: 6.0,
  ETH: 9.1,
  ARB: 4.1,
  USDC: 10.6,
};

const assets = [
  { id: 'BTC', label: 'BTC', color: '#F7931A', icon: '/tokens/btc.png' },
  { id: 'ETH', label: 'ETH', color: '#627EEA', icon: '/tokens/eth.png' },
  { id: 'ARB', label: 'ARB', color: '#28A0F0', icon: '/tokens/arb.png' },
  { id: 'USDC', label: 'USDC', color: '#2775CA', icon: '/tokens/usdc.png' },
];

const Calculator = ({ amount, setAmount, asset, setAsset }: CalculatorProps) => {
  const apy = assetAPYs[asset];
  const dailyEarn = (amount * (apy / 100)) / 365;
  const monthlyEarn = (amount * (apy / 100)) / 12;
  const yearlyEarn = amount * (apy / 100);

  return (
    <div className="glass-card-strong rounded-3xl p-6 lg:p-8 w-full glow-border-mint animate-pulse-glow">
      <div className="space-y-6">
        {/* Amount Input */}
        <div>
          <label className="block text-sm text-text-secondary mb-3 font-medium">
            I want to deposit
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary text-lg font-mono">$</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3.5 text-text-primary text-xl font-mono focus:outline-none focus:border-mint/50 transition-all"
            />
          </div>
          <input
            type="range"
            min="100"
            max="1000000"
            step="100"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full mt-4"
          />
          <div className="flex justify-between mt-2">
            <span className="text-xs text-text-muted font-mono">$100</span>
            <span className="text-xs text-text-muted font-mono">$1M</span>
          </div>
        </div>

        {/* Asset Selection */}
        <div>
          <label className="block text-sm text-text-secondary mb-3 font-medium">Into</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {assets.map((a) => (
              <button
                key={a.id}
                onClick={() => setAsset(a.id)}
                className={`py-3 px-3 rounded-xl border text-sm font-mono font-semibold transition-all flex items-center justify-center gap-2 ${
                  asset === a.id
                    ? 'border-mint bg-mint/15 text-mint shadow-[0_0_20px_rgba(46,213,115,0.2)]'
                    : 'border-white/10 text-text-secondary hover:border-white/20 hover:text-text-primary'
                }`}
              >
                <Image
                  src={a.icon}
                  alt={a.label}
                  width={20}
                  height={20}
                  className="rounded-full"
                />
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Earnings Display */}
        <div className="pt-5 border-t border-white/10">
          <label className="block text-sm text-text-secondary mb-4 font-medium">You'd earn</label>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-text-secondary text-sm">Daily</span>
              <span className="font-mono text-mint font-semibold pulse-number">${dailyEarn.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary text-sm">Monthly</span>
              <span className="font-mono text-mint font-semibold pulse-number">${monthlyEarn.toFixed(0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary text-sm">Yearly</span>
              <span className="font-mono text-mint font-bold text-lg pulse-number">${yearlyEarn.toFixed(0)}</span>
            </div>
          </div>
          <div className="mt-4 text-right">
            <span className="text-xs text-text-muted font-mono">at ~{apy}% APY</span>
          </div>
        </div>

        <Link href="/app/lend" className="w-full">
          <Button className="w-full btn-primary text-navy hover:opacity-90 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 group">
            Start Earning <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>
    </div>
  );
};

const Hero = () => {
  const [amount, setAmount] = useState(10000);
  const [asset, setAsset] = useState('USDC');
  const [isAnimated, setIsAnimated] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const calculatorRef = useRef<HTMLDivElement>(null);
  const subheadRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simple CSS-based entrance animation that runs immediately
    // No GSAP needed for initial render - make it instant and responsive
    const timer = setTimeout(() => setIsAnimated(true), 50);
    
    // Load GSAP only for desktop scroll animations (non-blocking)
    const isMobile = window.matchMedia('(max-width: 1023px)').matches;
    if (isMobile) return () => clearTimeout(timer);

    let cleanup: (() => void) | undefined;
    
    const initScrollAnimation = async () => {
      try {
        const gsap = await import('gsap');
        const { ScrollTrigger } = await import('gsap/ScrollTrigger');
        gsap.default.registerPlugin(ScrollTrigger);

        const ctx = gsap.default.context(() => {
          const scrollTl = gsap.default.timeline({
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top top',
              end: '+=140%',
              pin: true,
              scrub: 1.2,
            },
          });

          // EXIT animation on scroll
          scrollTl.fromTo(
            headlineRef.current,
            { x: 0, opacity: 1 },
            { x: '-20vw', opacity: 0, ease: 'power2.in' },
            0.7
          );

          scrollTl.fromTo(
            subheadRef.current,
            { x: 0, opacity: 1 },
            { x: '-15vw', opacity: 0, ease: 'power2.in' },
            0.72
          );

          scrollTl.fromTo(
            ctaRef.current,
            { x: 0, opacity: 1 },
            { x: '-10vw', opacity: 0, ease: 'power2.in' },
            0.74
          );

          scrollTl.fromTo(
            calculatorRef.current,
            { x: 0, opacity: 1 },
            { x: '20vw', opacity: 0, ease: 'power2.in' },
            0.7
          );
        }, sectionRef);

        cleanup = () => ctx.revert();
      } catch (e) {
        console.warn('GSAP failed to load:', e);
      }
    };

    // Delay GSAP load to not block first paint
    const rafId = requestAnimationFrame(() => {
      setTimeout(initScrollAnimation, 100);
    });

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(rafId);
      cleanup?.();
    };
  }, []);

  const scrollToYieldLoop = useCallback(() => {
    const element = document.querySelector('#yield-loop');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen w-full flex items-center overflow-hidden gradient-bg"
    >
      {/* Background Orbs */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-mint/20 rounded-full blur-[200px] animate-float-slow" />
      <div className="absolute bottom-0 right-0 w-[700px] h-[700px] bg-electric-blue/15 rounded-full blur-[250px] animate-float" />
      
      {/* Particles */}
      <Particles />

      {/* Content */}
      <div className="relative z-10 w-full px-6 lg:px-10 pt-24 lg:pt-0">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center max-w-[1600px] mx-auto">
          {/* Left: Text Content */}
          <div 
            ref={headlineRef} 
            className={`space-y-6 lg:space-y-8 transition-all duration-700 ease-out ${
              isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <h1 className="font-display text-display-1 text-text-primary">
              <div className="overflow-hidden">
                <span className={`block transition-all duration-700 delay-100 ${isAnimated ? 'translate-y-0' : 'translate-y-full'}`}>
                  Yield on yield.
                </span>
              </div>
              <div className="overflow-hidden">
                <span className={`block transition-all duration-700 delay-200 ${isAnimated ? 'translate-y-0' : 'translate-y-full'}`}>
                  No lock-ups.
                </span>
              </div>
              <div className="overflow-hidden">
                <span className={`block text-gradient-mint transition-all duration-700 delay-300 ${isAnimated ? 'translate-y-0' : 'translate-y-full'}`}>
                  No banks.
                </span>
              </div>
            </h1>

            <p 
              ref={subheadRef} 
              className={`text-lg lg:text-xl text-text-secondary max-w-lg leading-relaxed transition-all duration-700 delay-400 ${
                isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              Deposit crypto. Earn yield. Borrow against it. Deploy to pools. <span className="text-mint font-medium">Earn again.</span>
            </p>

            <div 
              ref={ctaRef} 
              className={`flex flex-col sm:flex-row gap-4 items-start transition-all duration-700 delay-500 ${
                isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <Link href="/app/lend">
                <Button className="btn-primary text-navy hover:opacity-90 px-8 py-4 rounded-full text-base font-semibold transition-all flex items-center gap-2 group">
                  Start Earning
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button 
                variant="outline" 
                onClick={scrollToYieldLoop}
                className="border-white/20 text-text-primary hover:bg-white/5 px-8 py-4 rounded-full text-base font-medium transition-all flex items-center gap-2"
              >
                See how it works
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Right: Calculator */}
          <div
            ref={calculatorRef}
            className={`lg:justify-self-end w-full max-w-md lg:max-w-lg transition-all duration-700 delay-300 ${
              isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <Calculator
              amount={amount}
              setAmount={setAmount}
              asset={asset}
              setAsset={setAsset}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
