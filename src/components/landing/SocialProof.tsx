'use client';

import { useEffect, useRef, useState } from 'react';

interface StatItemProps {
  value: string;
  label: string;
  prefix?: string;
  suffix?: string;
  delay?: number;
}

const StatItem = ({ value, label, prefix = '', suffix = '', delay = 0 }: StatItemProps) => {
  const [displayValue, setDisplayValue] = useState(0);
  const numericValue = parseFloat(value.replace(/[^0-9.]/g, ''));
  const itemRef = useRef<HTMLDivElement>(null);
  const animatedRef = useRef(false);

  useEffect(() => {
    if (animatedRef.current) return;
    
    const initAnimation = async () => {
      const gsapModule = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      const gsap = gsapModule.default;
      
      gsap.registerPlugin(ScrollTrigger);
      
      const ctx = gsap.context(() => {
        ScrollTrigger.create({
          trigger: itemRef.current,
          start: 'top 80%',
          onEnter: () => {
            if (animatedRef.current) return;
            animatedRef.current = true;
            gsap.to(
              { val: 0 },
              {
                val: numericValue,
                duration: 2,
                delay: delay,
                ease: 'power2.out',
                onUpdate: function () {
                  setDisplayValue(this.targets()[0].val);
                },
              }
            );
          },
          once: true,
        });
      }, itemRef);

      return () => ctx.revert();
    };

    // Delay to not block first paint
    const timeout = setTimeout(initAnimation, 100);
    return () => clearTimeout(timeout);
  }, [numericValue, delay]);

  const formatValue = (val: number) => {
    if (value.includes('M')) {
      return val.toFixed(1);
    } else if (value.includes('K')) {
      return Math.round(val).toLocaleString();
    }
    return Math.round(val).toLocaleString();
  };

  return (
    <div ref={itemRef} className="text-center">
      <div className="font-display text-3xl lg:text-5xl font-bold text-mint mb-2">
        {prefix}
        {formatValue(displayValue)}
        {suffix}
      </div>
      <div className="text-sm lg:text-base text-text-secondary">{label}</div>
    </div>
  );
};

const SocialProof = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initAnimation = async () => {
      const gsapModule = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      const gsap = gsapModule.default;
      
      gsap.registerPlugin(ScrollTrigger);
      
      const ctx = gsap.context(() => {
        gsap.fromTo(
          containerRef.current,
          { y: 24, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 80%',
            },
          }
        );
      }, sectionRef);

      return () => ctx.revert();
    };

    // Delay to not block first paint
    const timeout = setTimeout(initAnimation, 100);
    return () => clearTimeout(timeout);
  }, []);

  const stats = [
    { value: '4.2M', label: 'Total Value Locked', prefix: '$' },
    { value: '1200', label: 'Depositors', suffix: '+' },
    { value: '340K', label: 'Yield Distributed', prefix: '$' },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative w-full py-12 lg:py-16 border-y border-white/10"
    >
      <div
        ref={containerRef}
        className="w-full px-6 lg:px-10"
      >
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-3 gap-8 lg:gap-16">
            {stats.map((stat, index) => (
              <StatItem
                key={stat.label}
                value={stat.value}
                label={stat.label}
                prefix={stat.prefix}
                suffix={stat.suffix}
                delay={index * 0.15}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
