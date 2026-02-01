'use client';

import { Zap } from 'lucide-react';

interface APYDisplayProps {
  apy: number;
  dailyEarnings: number;
  monthlyEarnings: number;
  yearlyEarnings: number;
}

/**
 * APYDisplay - Shows the unified APY with earnings projections
 * CRITICAL: Only ONE APY number. No breakdowns.
 */
export function APYDisplay({
  apy,
  dailyEarnings,
  monthlyEarnings,
  yearlyEarnings,
}: APYDisplayProps) {
  return (
    <div className="glass-card p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-mint" />
        <h2 className="text-lg font-semibold text-white/80">Current APY</h2>
      </div>
      
      {/* APY Display */}
      <div className="mb-6">
        {/* Progress bar background */}
        <div className="relative h-3 bg-white/5 rounded-full overflow-hidden mb-3">
          {/* Filled portion - capped at 100% visually */}
          <div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-mint to-mint-light rounded-full transition-all duration-500"
            style={{ width: `${Math.min(apy * 5, 100)}%` }}
          />
        </div>
        
        {/* APY Value */}
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-display font-bold text-mint">
            {apy.toFixed(1)}%
          </span>
          <span className="text-white/40 text-sm">APY</span>
        </div>
      </div>
      
      {/* Earnings projections */}
      <div className="pt-4 border-t border-white/5">
        <div className="text-white/50 text-sm mb-3">You&apos;re earning</div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-mint font-medium">
              ${dailyEarnings.toFixed(2)}
            </span>
            <span className="text-white/40">/day</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-mint font-medium">
              ${monthlyEarnings.toFixed(0)}
            </span>
            <span className="text-white/40">/month</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-mint font-medium">
              ${yearlyEarnings.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </span>
            <span className="text-white/40">/year</span>
          </div>
        </div>
      </div>
    </div>
  );
}
