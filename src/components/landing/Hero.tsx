'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Blended APYs: (Aave Supply × 0.6) + (GMX Pool × 0.4)
const assetAPYs: Record<string, number> = {
  BTC: 6.0,
  ETH: 9.1,
  ARB: 4.1,
  USDC: 10.6,
};

const assets = [
  { id: 'BTC', label: 'BTC', color: '#F7931A', icon: '/tokens/btc.png' },
  { id: 'ETH', label: 'ETH', color: '#627EEA', icon: '/tokens/eth.png' },
  { id: 'ARB', label: 'ARB', color: '#28A0F0', icon: '/tokens/arb.png' },
  { id: 'USDC', label: 'USDC', color: '#2775CA', icon: '/tokens/usdc.png' },
];

const Hero = () => {
  const [amount, setAmount] = useState(10000);
  const [asset, setAsset] = useState('USDC');
  
  const apy = assetAPYs[asset];
  const dailyEarn = (amount * (apy / 100)) / 365;
  const monthlyEarn = (amount * (apy / 100)) / 12;
  const yearlyEarn = amount * (apy / 100);

  const scrollToYieldLoop = () => {
    const element = document.querySelector('#yield-loop');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-screen w-full flex items-center overflow-hidden gradient-bg">
      {/* Background Orbs - hidden on mobile for performance */}
      <div className="hidden lg:block absolute top-0 left-0 w-[600px] h-[600px] bg-mint/20 rounded-full blur-[200px] animate-float-slow" />
      <div className="hidden lg:block absolute bottom-0 right-0 w-[700px] h-[700px] bg-electric-blue/15 rounded-full blur-[250px] animate-float" />
      {/* Mobile-optimized subtle gradient instead */}
      <div className="lg:hidden absolute inset-0 bg-gradient-to-br from-mint/5 via-transparent to-electric-blue/5" />

      {/* Content */}
      <div className="relative z-10 w-full px-6 lg:px-10 pt-24 lg:pt-0">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center max-w-[1600px] mx-auto">
          {/* Left: Text Content */}
          <div className="space-y-6 lg:space-y-8">
            <h1 className="font-display text-display-1 text-text-primary">
              <span className="block">Yield on yield.</span>
              <span className="block">No lock-ups.</span>
              <span className="block text-gradient-mint">No banks.</span>
            </h1>

            <p className="text-lg lg:text-xl text-text-secondary max-w-lg leading-relaxed">
              Deposit crypto. Earn yield. Borrow against it. Deploy to pools. <span className="text-mint font-medium">Earn again.</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <Link href="/app/lend">
                <Button className="btn-primary text-navy hover:opacity-90 px-8 py-4 rounded-full text-base font-semibold transition-all flex items-center gap-2 group">
                  Start Earning
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button 
                variant="outline" 
                onClick={scrollToYieldLoop}
                className="border-white/20 text-text-primary hover:bg-white/5 px-8 py-4 rounded-full text-base font-medium transition-all flex items-center gap-2"
              >
                See how it works
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Right: Calculator */}
          <div className="lg:justify-self-end w-full max-w-md lg:max-w-lg">
            <div className="glass-card-strong rounded-3xl p-6 lg:p-8 w-full glow-border-mint">
              <div className="space-y-6">
                {/* Amount Input */}
                <div>
                  <label className="block text-sm text-text-secondary mb-3 font-medium">
                    I want to deposit
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary text-lg font-mono">$</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3.5 text-text-primary text-xl font-mono focus:outline-none focus:border-mint/50 transition-all"
                    />
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="1000000"
                    step="100"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full mt-4"
                  />
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-text-muted font-mono">$100</span>
                    <span className="text-xs text-text-muted font-mono">$1M</span>
                  </div>
                </div>

                {/* Asset Selection */}
                <div>
                  <label className="block text-sm text-text-secondary mb-3 font-medium">Into</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {assets.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => setAsset(a.id)}
                        className={`py-3 px-3 rounded-xl border text-sm font-mono font-semibold transition-all flex items-center justify-center gap-2 ${
                          asset === a.id
                            ? 'border-mint bg-mint/15 text-mint shadow-[0_0_20px_rgba(46,213,115,0.2)]'
                            : 'border-white/10 text-text-secondary hover:border-white/20 hover:text-text-primary'
                        }`}
                      >
                        <Image
                          src={a.icon}
                          alt={a.label}
                          width={20}
                          height={20}
                          className="rounded-full"
                          priority
                        />
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Earnings Display */}
                <div className="pt-5 border-t border-white/10">
                  <label className="block text-sm text-text-secondary mb-4 font-medium">You&apos;d earn</label>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary text-sm">Daily</span>
                      <span className="font-mono text-mint font-semibold">${dailyEarn.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary text-sm">Monthly</span>
                      <span className="font-mono text-mint font-semibold">${monthlyEarn.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary text-sm">Yearly</span>
                      <span className="font-mono text-mint font-bold text-lg">${yearlyEarn.toFixed(0)}</span>
                    </div>
                  </div>
                  <div className="mt-4 text-right">
                    <span className="text-xs text-text-muted font-mono">at ~{apy}% APY</span>
                  </div>
                </div>

                <Link href="/app/lend" className="w-full">
                  <Button className="w-full btn-primary text-navy hover:opacity-90 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 group">
                    Start Earning <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
