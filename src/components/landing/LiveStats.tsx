'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface StatItemProps {
  value: string;
  label: string;
  prefix?: string;
  suffix?: string;
  isCurrency?: boolean;
  delay?: number;
}

const StatItem = ({ value, label, prefix = '', suffix = '', delay = 0 }: StatItemProps) => {
  const [displayValue, setDisplayValue] = useState(0);
  const numericValue = parseFloat(value.replace(/[^0-9.]/g, ''));
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: itemRef.current,
        start: 'top 85%',
        onEnter: () => {
          gsap.to(
            { val: 0 },
            {
              val: numericValue,
              duration: 2.5,
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
    <div ref={itemRef} className="text-center relative">
      <div className="font-mono text-3xl lg:text-5xl font-bold text-mint pulse-number mb-2">
        {prefix}{formatValue(displayValue)}{suffix}
      </div>
      <div className="text-sm lg:text-base text-text-muted">{label}</div>
      {/* Subtle glow behind number */}
      <div className="absolute inset-0 bg-mint/5 blur-2xl rounded-full -z-10" />
    </div>
  );
};

const LiveStats = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        containerRef.current,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 85%',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const stats = [
    { value: '4.2', label: 'Total Value Locked', prefix: '$', suffix: 'M', isCurrency: true },
    { value: '340', label: 'Yield Distributed', prefix: '$', suffix: 'K', isCurrency: true },
    { value: '1200', label: 'Active Depositors', suffix: '+' },
    { value: '48', label: 'Creator Vaults' },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative w-full py-12 lg:py-16 border-y border-white/5"
    >
      <div
        ref={containerRef}
        className="w-full px-6 lg:px-10"
      >
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
            {stats.map((stat, index) => (
              <StatItem
                key={stat.label}
                value={stat.value}
                label={stat.label}
                prefix={stat.prefix}
                suffix={stat.suffix}
                isCurrency={stat.isCurrency}
                delay={index * 0.15}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LiveStats;
