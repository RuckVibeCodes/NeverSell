'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Users, TrendingUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const portfolios = [
  {
    name: 'CryptoCobain',
    handle: '@cobie',
    apy: 14.2,
    tvl: 890000,
    followers: 12400,
    color: '#2ED573',
    avatar: 'CC',
  },
  {
    name: 'DeFi Dad',
    handle: '@defidad',
    apy: 11.8,
    tvl: 2100000,
    followers: 28700,
    color: '#6366F1',
    avatar: 'DD',
  },
  {
    name: 'The Block Alpha',
    handle: '@theblock',
    apy: 16.5,
    tvl: 456000,
    followers: 8200,
    color: '#A855F7',
    avatar: 'TB',
  },
  {
    name: 'Your Portfolio',
    handle: 'Launch yours',
    apy: 0,
    tvl: 0,
    followers: 0,
    color: '#94A3B8',
    avatar: '?',
    isPlaceholder: true,
  },
];

const formatNumber = (num: number) => {
  if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
  return `$${num}`;
};

const formatFollowers = (num: number) => {
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const CreatorPortfolios = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

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
      id="portfolios"
      ref={sectionRef}
      className="relative w-full py-24 lg:py-32"
    >
      <div className="w-full px-6 lg:px-10">
        {/* Header */}
        <div 
          className={`flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12 lg:mb-16 max-w-6xl mx-auto transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-electric-purple" />
              <span className="text-sm font-mono text-electric-purple uppercase tracking-wider">Featured</span>
            </div>
            <h2 className="font-display text-display-2 text-text-primary mb-3">
              Creator Portfolios
            </h2>
            <p className="text-text-secondary text-lg max-w-md">
              Launch your own portfolio. Let your community earn with you.
            </p>
          </div>
          <Link href="/app/vaults">
            <Button className="btn-secondary text-white hover:opacity-90 px-6 py-3 rounded-full text-sm font-semibold transition-all flex items-center gap-2 group w-fit">
              Launch Portfolio
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        {/* Portfolio Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 max-w-6xl mx-auto">
          {portfolios.map((portfolio, index) => (
            <div
              key={portfolio.name}
              className={`glass-card rounded-2xl p-6 transition-all duration-500 group hover:border-mint/30 ${
                portfolio.isPlaceholder ? 'border-dashed border-white/20' : ''
              } ${
                isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-98'
              }`}
              style={{ transitionDelay: `${index * 100 + 200}ms` }}
            >
              {/* Avatar & Name */}
              <div className="flex items-center gap-3 mb-5">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold"
                  style={{ 
                    backgroundColor: portfolio.isPlaceholder ? 'rgba(255,255,255,0.05)' : `${portfolio.color}20`,
                    color: portfolio.isPlaceholder ? '#94A3B8' : portfolio.color,
                    border: `1px solid ${portfolio.isPlaceholder ? 'rgba(255,255,255,0.1)' : portfolio.color + '40'}`
                  }}
                >
                  {portfolio.avatar}
                </div>
                <div>
                  <h3 className="font-display font-semibold text-text-primary">
                    {portfolio.name}
                  </h3>
                  <p className="text-sm text-text-muted">{portfolio.handle}</p>
                </div>
              </div>

              {/* Stats */}
              {!portfolio.isPlaceholder ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-text-muted text-sm">
                      <TrendingUp className="w-4 h-4" />
                      APY
                    </div>
                    <span 
                      className="font-mono font-bold text-lg"
                      style={{ color: portfolio.color }}
                    >
                      {portfolio.apy}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-text-muted text-sm">
                      <span className="font-mono text-xs">TVL</span>
                    </div>
                    <span className="font-mono text-text-primary">
                      {formatNumber(portfolio.tvl)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-text-muted text-sm">
                      <Users className="w-4 h-4" />
                    </div>
                    <span className="font-mono text-text-primary">
                      {formatFollowers(portfolio.followers)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-text-muted text-sm mb-4">
                    Start earning with your community
                  </p>
                  <Link href="/app/vaults" className="w-full">
                    <Button 
                      variant="outline" 
                      className="w-full border-white/10 text-text-primary hover:bg-white/5 rounded-xl py-2.5 text-sm"
                    >
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CreatorPortfolios;
