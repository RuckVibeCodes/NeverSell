'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Button } from '@/components/ui/button';

gsap.registerPlugin(ScrollTrigger);

const assets = [
  { id: 'BTC', symbol: 'BTC', apy: '~8–12%', description: 'Earn while you HODL.', subtext: '+ BTC price upside', color: '#F7931A', gradient: 'from-orange-500/20 to-orange-600/10' },
  { id: 'ETH', symbol: 'ETH', apy: '~10–14%', description: 'Your ETH works harder.', subtext: '+ ETH price upside', color: '#627EEA', gradient: 'from-blue-500/20 to-blue-600/10' },
  { id: 'ARB', symbol: 'ARB', apy: '~12–18%', description: 'Higher risk, higher reward.', subtext: '+ ARB price upside', color: '#28A0F0', gradient: 'from-cyan-500/20 to-cyan-600/10' },
  { id: 'USDC', symbol: 'USDC', apy: '~7–10%', description: 'Stable yield, no volatility.', subtext: 'No price risk', color: '#2775CA', gradient: 'from-blue-400/20 to-blue-500/10', popular: true },
];

const TokenIcon = ({ symbol, color }: { symbol: string; color: string }) => (
  <svg viewBox="0 0 48 48" className="w-full h-full"><circle cx="24" cy="24" r="22" fill={color} /><text x="24" y="30" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">{symbol[0]}</text></svg>
);

const Strategy = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({ scrollTrigger: { trigger: sectionRef.current, start: 'top top', end: '+=130%', pin: true, scrub: 0.6 } });
      scrollTl.fromTo(headingRef.current, { y: -60, opacity: 0 }, { y: 0, opacity: 1 }, 0);
      cardsRef.current.forEach((card, i) => scrollTl.fromTo(card, { y: 80, opacity: 0 }, { y: 0, opacity: 1 }, 0.03 + i * 0.025));
      cardsRef.current.forEach((card, i) => scrollTl.fromTo(card, { y: 0, opacity: 1 }, { y: -40, opacity: 0 }, 0.7 + i * 0.02));
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="assets" ref={sectionRef} className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="w-[600px] h-[600px] bg-mint/5 rounded-full blur-[150px]" /></div>
      <div className="relative z-10 w-full px-6 lg:px-10 py-20">
        <h2 ref={headingRef} className="font-display text-display-2 text-text-primary text-center mb-12 lg:mb-16">Pick your <span className="text-gradient">asset.</span></h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 max-w-6xl mx-auto">
          {assets.map((asset, i) => (
            <div key={asset.id} ref={(el) => { cardsRef.current[i] = el; }} className="glass-card rounded-3xl p-6 transition-all group hover:border-mint/30 relative overflow-hidden">
              {asset.popular && <div className="absolute -top-px left-1/2 -translate-x-1/2"><span className="px-4 py-1 bg-mint text-navy text-xs font-mono font-bold rounded-b-xl">POPULAR</span></div>}
              <div className={`absolute inset-0 bg-gradient-to-br ${asset.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              <div className="relative z-10">
                <div className="w-14 h-14 mb-5 group-hover:scale-110 transition-transform"><TokenIcon symbol={asset.symbol} color={asset.color} /></div>
                <div className="font-mono text-sm text-text-muted mb-1">{asset.symbol}</div>
                <div className="font-display text-3xl lg:text-4xl font-bold mb-3" style={{ color: asset.color }}>{asset.apy}</div>
                <p className="text-text-secondary text-sm mb-1">{asset.description}</p>
                <p className="text-text-muted text-xs mb-5">{asset.subtext}</p>
                <Button variant="outline" className="w-full border-white/10 text-text-primary hover:border-mint/30 rounded-xl py-2.5 text-sm">Select</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Strategy;
