'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { X, Check } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const Method = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const sellCardRef = useRef<HTMLDivElement>(null);
  const borrowCardRef = useRef<HTMLDivElement>(null);
  const subheadRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=120%',
          pin: true,
          scrub: 1.2,
        },
      });

      // Phase 1: ENTRANCE (0% - 30%)
      scrollTl.fromTo(
        headingRef.current,
        { y: -50, opacity: 0 },
        { y: 0, opacity: 1, ease: 'none' },
        0
      );

      scrollTl.fromTo(
        sellCardRef.current,
        { x: '-60vw', opacity: 0 },
        { x: 0, opacity: 1, ease: 'none' },
        0.02
      );

      scrollTl.fromTo(
        borrowCardRef.current,
        { x: '60vw', opacity: 0 },
        { x: 0, opacity: 1, ease: 'none' },
        0.06
      );

      scrollTl.fromTo(
        subheadRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, ease: 'none' },
        0.2
      );

      // Phase 3: EXIT (70% - 100%)
      scrollTl.fromTo(
        sellCardRef.current,
        { y: 0, opacity: 1 },
        { y: '30vh', opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        borrowCardRef.current,
        { y: 0, opacity: 1 },
        { y: '30vh', opacity: 0, ease: 'power2.in' },
        0.72
      );

      scrollTl.fromTo(
        subheadRef.current,
        { opacity: 1 },
        { opacity: 0, ease: 'power2.in' },
        0.85
      );

      scrollTl.fromTo(
        headingRef.current,
        { opacity: 1 },
        { opacity: 0, ease: 'power2.in' },
        0.88
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const sellPoints = [
    { text: 'Pay ~$3,000 in taxes', negative: true },
    { text: 'Lose future upside', negative: true },
    { text: 'Miss the pump', negative: true },
  ];

  const borrowPoints = [
    { text: 'Keep your crypto', negative: false },
    { text: 'Keep the upside', negative: false },
    { text: 'Pay simple interest', negative: false },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-navy-light" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[500px] bg-mint/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 w-full px-6 lg:px-10 py-20">
        <h2
          ref={headingRef}
          className="font-display text-display-2 text-text-primary text-center mb-12 lg:mb-16"
        >
          Need cash? <span className="text-mint">Borrow, don't sell.</span>
        </h2>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
          {/* Sell Card */}
          <div
            ref={sellCardRef}
            className="glass-card rounded-3xl p-8 lg:p-10 border-red-500/20 opacity-70"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-red-500/15 flex items-center justify-center border border-red-500/25">
                <X className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="font-display text-2xl text-red-400 font-semibold">SELL</h3>
            </div>

            <ul className="space-y-4 mb-8">
              {sellPoints.map((point, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 text-text-secondary"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 flex-shrink-0" />
                  {point.text}
                </li>
              ))}
            </ul>

            <div className="pt-6 border-t border-white/10">
              <p className="text-red-400 font-semibold">You lose.</p>
            </div>
          </div>

          {/* Borrow Card */}
          <div
            ref={borrowCardRef}
            className="glass-card-strong rounded-3xl p-8 lg:p-10 border-mint/30 glow-mint relative overflow-hidden"
          >
            {/* Animated glow background */}
            <div className="absolute inset-0 bg-gradient-to-br from-mint/10 via-transparent to-electric-blue/10 animate-pulse" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-mint/15 flex items-center justify-center border border-mint/30">
                  <Check className="w-6 h-6 text-mint" />
                </div>
                <h3 className="font-display text-2xl text-mint font-semibold">BORROW</h3>
              </div>

              <ul className="space-y-4 mb-8">
                {borrowPoints.map((point, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-text-primary"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-mint mt-2 flex-shrink-0" />
                    {point.text}
                  </li>
                ))}
              </ul>

              <div className="pt-6 border-t border-white/10">
                <p className="text-mint font-semibold">You win.</p>
              </div>
            </div>
          </div>
        </div>

        <p
          ref={subheadRef}
          className="text-center text-text-secondary mt-10 lg:mt-14 text-lg max-w-xl mx-auto"
        >
          This is how the <span className="text-text-primary font-medium">smart money</span> plays.
        </p>
      </div>
    </section>
  );
};

export default Method;
