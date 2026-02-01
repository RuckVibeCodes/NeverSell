'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

gsap.registerPlugin(ScrollTrigger);

const FinalCTA = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const subtextRef = useRef<HTMLParagraphElement>(null);

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
        headlineRef.current,
        { y: 60, opacity: 0, scale: 0.98 },
        { y: 0, opacity: 1, scale: 1, ease: 'none' },
        0
      );

      scrollTl.fromTo(
        ctaRef.current,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, ease: 'none' },
        0.1
      );

      scrollTl.fromTo(
        subtextRef.current,
        { opacity: 0 },
        { opacity: 1, ease: 'none' },
        0.18
      );

      // Phase 3: EXIT (70% - 100%)
      scrollTl.fromTo(
        headlineRef.current,
        { opacity: 1 },
        { opacity: 0, ease: 'power2.in' },
        0.85
      );

      scrollTl.fromTo(
        ctaRef.current,
        { opacity: 1 },
        { opacity: 0, ease: 'power2.in' },
        0.88
      );

      scrollTl.fromTo(
        subtextRef.current,
        { opacity: 1 },
        { opacity: 0, ease: 'power2.in' },
        0.9
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] bg-gradient-to-br from-mint/15 via-electric-blue/10 to-electric-purple/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 w-full px-6 lg:px-10 text-center">
        <h2
          ref={headlineRef}
          className="font-display text-display-2 lg:text-display-1 text-text-primary mb-8 max-w-4xl mx-auto"
        >
          Your crypto could be earning{' '}
          <span className="text-gradient-mint">$2.14/day.</span>
          <br />
          <span className="text-text-secondary">Right now.</span>
        </h2>

        <div ref={ctaRef} className="mb-6">
          <Button className="btn-primary text-navy hover:opacity-90 px-10 py-5 rounded-full text-lg font-semibold transition-all flex items-center gap-3 group mx-auto animate-pulse-glow">
            Start Earning
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        <p ref={subtextRef} className="text-text-secondary text-lg">
          Join 1,200+ depositors <span className="text-mint">stacking yield.</span>
        </p>
      </div>
    </section>
  );
};

export default FinalCTA;
