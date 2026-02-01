'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Wallet, Split, TrendingUp } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    number: '01',
    title: 'Deposit',
    description: 'Deposit USDC from any wallet. We handle bridging, swapping, routing.',
    icon: Wallet,
  },
  {
    number: '02',
    title: 'We Split',
    description: '60% earns lending yield on Aave. 40% earns trading fees on GMX.',
    icon: Split,
  },
  {
    number: '03',
    title: 'You Earn',
    description: 'Watch your balance grow daily. Withdraw anytime—no penalties.',
    icon: TrendingUp,
  },
];

const HowItWorks = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const closingRef = useRef<HTMLParagraphElement>(null);

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
        { y: '-10vh', opacity: 0 },
        { y: 0, opacity: 1, ease: 'none' },
        0
      );

      scrollTl.fromTo(
        cardsRef.current[0],
        { x: '-50vw', opacity: 0, rotateZ: -2 },
        { x: 0, opacity: 1, rotateZ: 0, ease: 'none' },
        0.02
      );

      scrollTl.fromTo(
        cardsRef.current[1],
        { y: '60vh', opacity: 0, scale: 0.96 },
        { y: 0, opacity: 1, scale: 1, ease: 'none' },
        0.06
      );

      scrollTl.fromTo(
        cardsRef.current[2],
        { x: '50vw', opacity: 0, rotateZ: 2 },
        { x: 0, opacity: 1, rotateZ: 0, ease: 'none' },
        0.1
      );

      scrollTl.fromTo(
        closingRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, ease: 'none' },
        0.2
      );

      // Phase 3: EXIT (70% - 100%)
      scrollTl.fromTo(
        cardsRef.current[0],
        { x: 0, opacity: 1 },
        { x: '-18vw', opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        cardsRef.current[1],
        { y: 0, opacity: 1 },
        { y: '-14vh', opacity: 0, ease: 'power2.in' },
        0.72
      );

      scrollTl.fromTo(
        cardsRef.current[2],
        { x: 0, opacity: 1 },
        { x: '18vw', opacity: 0, ease: 'power2.in' },
        0.74
      );

      scrollTl.fromTo(
        closingRef.current,
        { opacity: 1 },
        { opacity: 0, ease: 'power2.in' },
        0.85
      );

      scrollTl.fromTo(
        headingRef.current,
        { opacity: 1 },
        { opacity: 0, ease: 'power2.in' },
        0.9
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="how-it-works"
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
          className="font-display text-display-2 text-text-primary text-center mb-16 lg:mb-20"
        >
          How you earn
        </h2>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                ref={(el) => { cardsRef.current[index] = el; }}
                className="glass-card rounded-2xl p-8 lg:p-10 hover:border-mint/30 transition-all duration-300 group"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-mint/10 flex items-center justify-center group-hover:bg-mint/20 transition-colors">
                    <Icon className="w-5 h-5 text-mint" />
                  </div>
                  <span className="font-mono text-xs text-text-muted tracking-widest">
                    STEP {step.number}
                  </span>
                </div>

                <h3 className="font-display text-2xl lg:text-3xl text-text-primary mb-4">
                  {step.title}
                </h3>

                <p className="text-text-secondary leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>

        <p
          ref={closingRef}
          className="text-center text-text-muted mt-12 lg:mt-16 text-lg"
        >
          That's it. No PhD required.
        </p>
      </div>
    </section>
  );
};

export default HowItWorks;
