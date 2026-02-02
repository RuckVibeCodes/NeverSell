'use client';

import { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';

const protocols = [
  {
    name: 'Aave',
    tvl: '$12B+',
    description: 'Lending protocol',
    logo: (
      <svg viewBox="0 0 48 48" className="w-12 h-12">
        <circle cx="24" cy="24" r="22" fill="#B6509E" />
        <path d="M24 12l-8 20h4l2-5h8l2 5h4L24 12zm-2 12l2-5 2 5h-4z" fill="white" />
      </svg>
    ),
  },
  {
    name: 'GMX',
    tvl: '$500M+',
    description: 'Perpetual exchange',
    logo: (
      <svg viewBox="0 0 48 48" className="w-12 h-12">
        <circle cx="24" cy="24" r="22" fill="#2D42FC" />
        <path d="M16 16h6v6h-6zM26 16h6v6h-6zM16 26h6v6h-6zM26 26h6v6h-6z" fill="white" />
      </svg>
    ),
  },
];

const checks = [
  'Non-custodial — you control your keys',
  'Audited smart contracts',
  '100% on-chain',
  '$50K bug bounty',
  '48-hour timelock',
];

const Security = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="security"
      ref={sectionRef}
      className="relative w-full py-24 lg:py-32"
    >
      <div className="w-full px-6 lg:px-10">
        <div className="max-w-4xl mx-auto">
          {/* Heading */}
          <div 
            className={`text-center mb-12 transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <h2 className="font-display text-display-2 text-text-primary mb-4">
              Built on <span className="text-gradient">battle-tested</span> protocols.
            </h2>
            <p className="text-text-secondary text-lg max-w-xl mx-auto">
              Your funds sit in Aave and GMX — $12B+ of DeFi infrastructure. We never have custody.
            </p>
          </div>

          {/* Protocol Cards */}
          <div className="flex flex-wrap justify-center gap-6 mb-12">
            {protocols.map((protocol, index) => (
              <div
                key={protocol.name}
                className={`glass-card rounded-2xl p-6 text-center min-w-[160px] hover:border-mint/20 transition-all group duration-500 ${
                  isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
                }`}
                style={{ transitionDelay: `${index * 150 + 200}ms` }}
              >
                <div className="mb-4 group-hover:scale-110 transition-transform">
                  {protocol.logo}
                </div>
                <div className="font-display text-xl text-text-primary mb-1">
                  {protocol.name}
                </div>
                <div className="font-mono text-2xl text-mint font-bold mb-1">
                  {protocol.tvl}
                </div>
                <div className="text-xs text-text-muted">
                  {protocol.description}
                </div>
              </div>
            ))}
          </div>

          {/* Checklist */}
          <div
            className={`glass-card rounded-2xl p-8 lg:p-10 mb-10 transition-all duration-700 delay-500 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="grid sm:grid-cols-2 gap-4">
              {checks.map((check, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 text-text-secondary transition-all duration-500 ${
                    isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                  }`}
                  style={{ transitionDelay: `${index * 100 + 600}ms` }}
                >
                  <div className="w-6 h-6 rounded-full bg-mint/15 flex items-center justify-center flex-shrink-0 border border-mint/25">
                    <Check className="w-3.5 h-3.5 text-mint" />
                  </div>
                  {check}
                </div>
              ))}
            </div>
          </div>

          {/* Built on Arbitrum Badge */}
          <div 
            className={`flex justify-center transition-all duration-700 delay-1000 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-electric-blue/10 border border-electric-blue/25">
              <div className="w-8 h-8 rounded-lg bg-electric-blue/20 flex items-center justify-center">
                <svg viewBox="0 0 32 32" className="w-5 h-5">
                  <circle cx="16" cy="16" r="14" fill="#28A0F0" />
                  <path d="M16 8l-6 10h4l2-5 2 5h4L16 8z" fill="white" />
                </svg>
              </div>
              <span className="text-text-secondary text-sm">
                Built on <span className="text-electric-blue font-medium">Arbitrum</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Security;
