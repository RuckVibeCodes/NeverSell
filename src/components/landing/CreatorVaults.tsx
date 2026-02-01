'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Users, TrendingUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

gsap.registerPlugin(ScrollTrigger);

const vaults = [
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
    name: 'Your Vault',
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

const CreatorVaults = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headerRef.current,
        { y: 30, opacity: 0 },
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

      cardsRef.current.forEach((card, index) => {
        gsap.fromTo(
          card,
          { y: 50, opacity: 0, scale: 0.98 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.7,
            delay: index * 0.1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 70%',
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="vaults"
      ref={sectionRef}
      className="relative w-full py-24 lg:py-32"
    >
      <div className="w-full px-6 lg:px-10">
        {/* Header */}
        <div ref={headerRef} className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12 lg:mb-16 max-w-6xl mx-auto">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-electric-purple" />
              <span className="text-sm font-mono text-electric-purple uppercase tracking-wider">Featured</span>
            </div>
            <h2 className="font-display text-display-2 text-text-primary mb-3">
              Creator Vaults
            </h2>
            <p className="text-text-secondary text-lg max-w-md">
              Launch your own vault. Let your community earn with you.
            </p>
          </div>
          <Button className="btn-secondary text-white hover:opacity-90 px-6 py-3 rounded-full text-sm font-semibold transition-all flex items-center gap-2 group w-fit">
            Launch Vault
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {/* Vault Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 max-w-6xl mx-auto">
          {vaults.map((vault, index) => (
            <div
              key={vault.name}
              ref={(el) => { cardsRef.current[index] = el; }}
              className={`glass-card rounded-2xl p-6 transition-all duration-300 group hover:border-mint/30 ${
                vault.isPlaceholder ? 'border-dashed border-white/20' : ''
              }`}
            >
              {/* Avatar & Name */}
              <div className="flex items-center gap-3 mb-5">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold"
                  style={{ 
                    backgroundColor: vault.isPlaceholder ? 'rgba(255,255,255,0.05)' : `${vault.color}20`,
                    color: vault.isPlaceholder ? '#94A3B8' : vault.color,
                    border: `1px solid ${vault.isPlaceholder ? 'rgba(255,255,255,0.1)' : vault.color + '40'}`
                  }}
                >
                  {vault.avatar}
                </div>
                <div>
                  <h3 className="font-display font-semibold text-text-primary">
                    {vault.name}
                  </h3>
                  <p className="text-sm text-text-muted">{vault.handle}</p>
                </div>
              </div>

              {/* Stats */}
              {!vault.isPlaceholder ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-text-muted text-sm">
                      <TrendingUp className="w-4 h-4" />
                      APY
                    </div>
                    <span 
                      className="font-mono font-bold text-lg"
                      style={{ color: vault.color }}
                    >
                      {vault.apy}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-text-muted text-sm">
                      <span className="font-mono text-xs">TVL</span>
                    </div>
                    <span className="font-mono text-text-primary">
                      {formatNumber(vault.tvl)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-text-muted text-sm">
                      <Users className="w-4 h-4" />
                    </div>
                    <span className="font-mono text-text-primary">
                      {formatFollowers(vault.followers)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-text-muted text-sm mb-4">
                    Start earning with your community
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full border-white/10 text-text-primary hover:bg-white/5 rounded-xl py-2.5 text-sm"
                  >
                    Get Started
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CreatorVaults;
