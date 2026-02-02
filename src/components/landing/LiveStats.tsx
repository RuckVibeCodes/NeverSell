'use client';

import { useEffect, useRef, useState } from 'react';

interface StatItemProps {
  value: string;
  label: string;
  prefix?: string;
  suffix?: string;
  isCurrency?: boolean;
  delay?: number;
  isVisible: boolean;
}

const StatItem = ({ value, label, prefix = '', suffix = '', delay = 0, isVisible }: StatItemProps) => {
  const [displayValue, setDisplayValue] = useState(0);
  const numericValue = parseFloat(value.replace(/[^0-9.]/g, ''));
  const itemRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isVisible || hasAnimated.current) return;
    hasAnimated.current = true;

    // Simple counter animation without GSAP
    const duration = 2500;
    const startTime = Date.now() + delay * 1000;
    
    const animate = () => {
      const now = Date.now();
      if (now < startTime) {
        requestAnimationFrame(animate);
        return;
      }
      
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      setDisplayValue(numericValue * eased);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [numericValue, delay, isVisible]);

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
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const stats = [
    { value: '4.2', label: 'Total Value Locked', prefix: '$', suffix: 'M', isCurrency: true },
    { value: '340', label: 'Yield Distributed', prefix: '$', suffix: 'K', isCurrency: true },
    { value: '1200', label: 'Active Depositors', suffix: '+' },
    { value: '48', label: 'Creator Portfolios' },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative w-full py-12 lg:py-16 border-y border-white/5"
    >
      <div
        ref={containerRef}
        className={`w-full px-6 lg:px-10 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
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
                isVisible={isVisible}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LiveStats;
