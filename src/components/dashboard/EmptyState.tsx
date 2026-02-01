'use client';

import Link from 'next/link';
import { Sprout, ArrowRight } from 'lucide-react';

/**
 * EmptyState - Shown when user has no deposits
 * Compelling CTA to get them to deposit
 */
export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {/* Illustration */}
      <div className="relative mb-8">
        {/* Glow effect */}
        <div className="absolute inset-0 blur-3xl bg-mint/20 rounded-full" />
        
        {/* Icon container */}
        <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-mint/20 to-mint/5 border border-mint/20 flex items-center justify-center">
          <Sprout className="w-12 h-12 text-mint" strokeWidth={1.5} />
        </div>
      </div>
      
      {/* Headline */}
      <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-3">
        Start earning on your crypto
      </h2>
      
      {/* Subheadline */}
      <p className="text-white/60 text-base sm:text-lg max-w-md mb-8">
        Deposit USDC and watch your wealth grow without selling. 
        Earn yield and access liquidity whenever you need it.
      </p>
      
      {/* CTA Button */}
      <Link
        href="/app/deposit"
        className="group inline-flex items-center gap-2 px-6 py-3 bg-mint text-navy font-semibold rounded-xl hover:bg-mint-light transition-all duration-200 shadow-glow hover:shadow-glow-strong"
      >
        <span>Deposit Now</span>
        <ArrowRight 
          size={18} 
          className="transition-transform group-hover:translate-x-0.5" 
        />
      </Link>
      
      {/* Trust indicators */}
      <div className="flex items-center gap-6 mt-8 text-white/40 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-mint/50" />
          <span>No lock-up period</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-mint/50" />
          <span>Withdraw anytime</span>
        </div>
      </div>
    </div>
  );
}
