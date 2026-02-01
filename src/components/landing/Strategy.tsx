'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Button } from '@/components/ui/button';

gsap.registerPlugin(ScrollTrigger);

const assets = [
  {
    id: 'BTC',
    name: 'Bitcoin',
    symbol: 'BTC',
    apy: '~8–12%',
    apyNum: 10,
    description: 'Earn while you HODL.',
    subtext: '+ BTC price upside',
    color: '#F7931A',
    gradient: 'from-orange-500/20 to-orange-600/10',
  },
  {
    id: 'ETH',
    name: 'Ethereum',
    symbol: 'ETH',
    apy: '~10–14%',
    apyNum: 12,
    description: 'Your ETH works harder.',
    subtext: '+ ETH price upside',
    color: '#627EEA',
    gradient: 'from-blue-500/20 to-blue-600/10',
  },
  {
    id: 'ARB',
    name: 'Arbitrum',
    symbol: 'ARB',
    apy: '~12–18%',
    apyNum: 15,
    description: 'Higher risk, higher reward.',
    subtext: '+ ARB price upside',
    color: '#28A0F0',
    gradient: 'from-cyan-500/20 to-cyan-600/10',
  },
  {
    id: 'USDC',
    name: 'USDC',
    symbol: 'USDC',
    apy: '~7–10%',
    apyNum: 8.5,
    description: 'Stable yield, no volatility.',
    subtext: 'No price risk',
    color: '#2775CA',
    gradient: 'from-blue-400/20 to-blue-500/10',
    popular: true,
  },
];

// Token icon mapping to actual images
const tokenIcons: Record<string, string> = {
  BTC: '/tokens/btc.png',
  ETH: '/tokens/eth.png',
  ARB: '/tokens/arb.png',
  USDC: '/tokens/usdc.png',
};

const TokenIcon = ({ symbol }: { symbol: string; color?: string }) => {
  const iconSrc = tokenIcons[symbol];
  if (!iconSrc) return null;
  return (
    <img 
      src={iconSrc} 
      alt={symbol} 
      className="w-full h-full rounded-full object-cover"
    />
  );
};

const Strategy = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=130%',
          pin: true,
          scrub: 0.6,
        },
      });

      // Phase 1: ENTRANCE (0% - 30%)
      scrollTl.fromTo(
        headingRef.current,
        { y: -60, opacity: 0 },
        { y: 0, opacity: 1, ease: 'none' },
        0
      );

      cardsRef.current.forEach((card, index) => {
        scrollTl.fromTo(
          card,
          { y: 80, opacity: 0, scale: 0.95 },
          { y: 0, opacity: 1, scale: 1, ease: 'none' },
          0.03 + index * 0.025
        );
      });

      // Phase 3: EXIT (70% - 100%)
      cardsRef.current.forEach((card, index) => {
        scrollTl.fromTo(
          card,
          { y: 0, opacity: 1 },
          { y: -40, opacity: 0, ease: 'power2.in' },
          0.7 + index * 0.02
        );
      });

      scrollTl.fromTo(
        headingRef.current,
        { opacity: 1 },
        { opacity: 0, ease: 'power2.in' },
        0.85
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="assets"
      ref={sectionRef}
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] bg-mint/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 w-full px-6 lg:px-10 py-20">
        <h2
          ref={headingRef}
          className="font-display text-display-2 text-text-primary text-center mb-12 lg:mb-16"
        >
          Pick your <span className="text-gradient">asset.</span>
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 max-w-6xl mx-auto">
          {assets.map((asset, index) => (
            <div
              key={asset.id}
              ref={(el) => { cardsRef.current[index] = el; }}
              className={`glass-card rounded-3xl p-6 transition-all duration-300 group hover:border-mint/30 relative overflow-hidden`}
            >
              {/* Popular badge */}
              {asset.popular && (
                <div className="absolute -top-px left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 bg-mint text-navy text-xs font-mono font-bold rounded-b-xl">
                    POPULAR
                  </span>
                </div>
              )}

              {/* Gradient background on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${asset.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

              {/* Content */}
              <div className="relative z-10">
                {/* Token Icon */}
                <div className="w-14 h-14 mb-5 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300">
                  <TokenIcon symbol={asset.symbol} color={asset.color} />
                </div>

                <div className="font-mono text-sm text-text-muted mb-1">
                  {asset.symbol}
                </div>

                <div
                  className="font-display text-3xl lg:text-4xl font-bold mb-3 pulse-number"
                  style={{ color: asset.color }}
                >
                  {asset.apy}
                </div>

                <p className="text-text-secondary text-sm leading-relaxed mb-1">
                  {asset.description}
                </p>

                <p className="text-text-muted text-xs mb-5">{asset.subtext}</p>

                <Button
                  variant="outline"
                  className="w-full border-white/10 text-text-primary hover:bg-white/5 hover:border-mint/30 rounded-xl py-2.5 text-sm font-medium transition-all"
                >
                  Select
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Strategy;
