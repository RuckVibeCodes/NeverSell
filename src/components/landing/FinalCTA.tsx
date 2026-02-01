'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, TrendingUp, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

gsap.registerPlugin(ScrollTrigger);

const FinalCTA = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const pillarsRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isMobile = window.matchMedia('(max-width: 1023px)').matches;

    const ctx = gsap.context(() => {
      if (isMobile) {
        // Simple fade-in on mobile
        gsap.fromTo(
          [headlineRef.current, pillarsRef.current, ctaRef.current],
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 80%',
            },
          }
        );
        return;
      }

      // Desktop: full scroll-driven animation
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
        pillarsRef.current,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, ease: 'none' },
        0.1
      );

      scrollTl.fromTo(
        ctaRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, ease: 'none' },
        0.2
      );

      // Phase 3: EXIT (70% - 100%)
      scrollTl.fromTo(
        headlineRef.current,
        { opacity: 1 },
        { opacity: 0, ease: 'power2.in' },
        0.85
      );

      scrollTl.fromTo(
        pillarsRef.current,
        { opacity: 1 },
        { opacity: 0, ease: 'power2.in' },
        0.88
      );

      scrollTl.fromTo(
        ctaRef.current,
        { opacity: 1 },
        { opacity: 0, ease: 'power2.in' },
        0.9
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const pillars = [
    {
      icon: TrendingUp,
      title: 'Earn',
      desc: 'Your crypto works 24/7',
    },
    {
      icon: Zap,
      title: 'Borrow',
      desc: 'Access liquidity instantly',
    },
    {
      icon: Shield,
      title: 'Keep',
      desc: 'Never sell your bags',
    },
  ];

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
          className="font-display text-display-2 lg:text-display-1 text-text-primary mb-10 max-w-4xl mx-auto"
        >
          The <span className="text-gradient-mint">NeverSell</span> Method
        </h2>

        {/* Three Pillars */}
        <div ref={pillarsRef} className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 lg:gap-16 mb-12">
          {pillars.map((pillar, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-mint/10 border border-mint/20 flex items-center justify-center">
                <pillar.icon className="w-5 h-5 text-mint" />
              </div>
              <div className="text-left">
                <p className="font-display font-semibold text-text-primary">{pillar.title}</p>
                <p className="text-sm text-text-secondary">{pillar.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div ref={ctaRef}>
          <Link href="/app">
            <Button className="btn-primary text-navy hover:opacity-90 px-10 py-5 rounded-full text-lg font-semibold transition-all flex items-center gap-3 group mx-auto animate-pulse-glow">
              Start Earning
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <p className="text-text-muted text-sm mt-4">
            No lock-ups • No selling • No banks
          </p>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
