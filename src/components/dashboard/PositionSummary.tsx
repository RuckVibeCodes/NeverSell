'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PositionSummaryProps {
  totalValueUSD: number;
  depositedUSD: number;
  earningsUSD: number;
  earningsPercent: number;
  dailyEarnings: number;
}

/**
 * PositionSummary - Main position overview card
 * Shows total value, deposited amount, and earnings
 */
export function PositionSummary({
  totalValueUSD,
  depositedUSD,
  earningsUSD,
  earningsPercent,
  dailyEarnings,
}: PositionSummaryProps) {
  const isPositive = earningsPercent >= 0;
  
  return (
    <div className="glass-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white/80">Your Position</h2>
        <div className={cn(
          'flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium',
          isPositive ? 'bg-mint/10 text-mint' : 'bg-red-500/10 text-red-400'
        )}>
          {isPositive ? (
            <TrendingUp size={14} />
          ) : (
            <TrendingDown size={14} />
          )}
          <span>{isPositive ? '+' : ''}{earningsPercent.toFixed(1)}%</span>
        </div>
      </div>
      
      {/* Total Value - Large */}
      <div className="mb-6">
        <span className="text-white/50 text-sm">Total Value</span>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-display font-bold text-white">
            ${totalValueUSD.toLocaleString('en-US', { 
              minimumFractionDigits: 2,
              maximumFractionDigits: 2 
            })}
          </span>
        </div>
      </div>
      
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
        <div>
          <span className="text-white/50 text-sm">Deposited</span>
          <div className="text-xl font-semibold text-white">
            ${depositedUSD.toLocaleString('en-US', { 
              minimumFractionDigits: 0,
              maximumFractionDigits: 0 
            })}
          </div>
        </div>
        <div>
          <span className="text-white/50 text-sm">Earnings</span>
          <div className="flex items-baseline gap-2">
            <span className={cn(
              'text-xl font-semibold',
              isPositive ? 'text-mint' : 'text-red-400'
            )}>
              {isPositive ? '+' : ''}${Math.abs(earningsUSD).toLocaleString('en-US', { 
                minimumFractionDigits: 2,
                maximumFractionDigits: 2 
              })}
            </span>
            <span className="text-white/40 text-sm">
              +${dailyEarnings.toFixed(2)}/day
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
