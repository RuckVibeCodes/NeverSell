'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Wallet, TrendingUp, Landmark, Rocket, Layers, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

gsap.registerPlugin(ScrollTrigger);

const loopSteps = [
  { id: 'deposit', label: 'Deposit', icon: Wallet, color: '#94A3B8', description: 'BTC, ETH, ARB, or USDC' },
  { id: 'earn1', label: 'Earn Yield', icon: TrendingUp, color: '#2ED573', description: '7-15% APY on deposit' },
  { id: 'borrow', label: 'Borrow', icon: Landmark, color: '#6366F1', description: 'Up to 70% of value' },
  { id: 'deploy', label: 'Deploy', icon: Rocket, color: '#A855F7', description: 'To pools & vaults' },
  { id: 'earn2', label: 'Earn Again', icon: Layers, color: '#2ED573', description: 'Stack more yield' },
];

const YieldLoop = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const loopRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<(HTMLDivElement | null)[]>([]);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({ scrollTrigger: { trigger: sectionRef.current, start: 'top top', end: '+=150%', pin: true, scrub: 0.6 } });
      scrollTl.fromTo(headlineRef.current, { y: -80, opacity: 0 }, { y: 0, opacity: 1 }, 0)
        .fromTo(loopRef.current, { scale: 0.85, opacity: 0 }, { scale: 1, opacity: 1 }, 0.02);
      nodesRef.current.forEach((node, i) => scrollTl.fromTo(node, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, ease: 'back.out(1.7)' }, 0.04 + i * 0.03));
      scrollTl.fromTo(ctaRef.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1 }, 0.25)
        .fromTo(loopRef.current, { scale: 1, opacity: 1 }, { scale: 0.9, opacity: 0 }, 0.75);
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="yield-loop" ref={sectionRef} className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[800px] h-[800px] bg-gradient-to-br from-mint/10 via-electric-blue/8 to-electric-purple/5 rounded-full blur-[150px]" />
      </div>
      <div className="relative z-10 w-full px-6 lg:px-10 py-20">
        <div ref={headlineRef} className="text-center mb-12 lg:mb-16">
          <h2 className="font-display text-display-2 text-text-primary mb-4">Stack yield on <span className="text-gradient">yield.</span></h2>
          <p className="text-text-secondary text-lg max-w-xl mx-auto">Your money works twice. First from your deposit. Again from your deployment.</p>
        </div>
        <div ref={loopRef} className="relative max-w-4xl mx-auto">
          <div className="relative grid grid-cols-5 gap-4 lg:gap-8">
            {loopSteps.map((step, i) => {
              const Icon = step.icon;
              const isMint = step.color === '#2ED573';
              return (
                <div key={step.id} ref={(el) => { nodesRef.current[i] = el; }} className="flex flex-col items-center text-center group">
                  <div className={`w-16 h-16 lg:w-20 lg:h-20 rounded-2xl flex items-center justify-center mb-4 transition-all group-hover:scale-110 ${isMint ? 'bg-mint/15 border border-mint/30' : 'bg-white/5 border border-white/10'}`}>
                    <Icon className="w-7 h-7 lg:w-8 lg:h-8" style={{ color: step.color }} />
                  </div>
                  <h3 className="font-display text-sm lg:text-lg font-semibold text-text-primary mb-1">{step.label}</h3>
                  <p className="text-xs lg:text-sm text-text-muted">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
        <div ref={ctaRef} className="text-center mt-12 lg:mt-16">
          <Button className="btn-primary text-navy px-8 py-4 rounded-full font-semibold flex items-center gap-2 group mx-auto">Start Stacking <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></Button>
        </div>
      </div>
    </section>
  );
};

export default YieldLoop;
