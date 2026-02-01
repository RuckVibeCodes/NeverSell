'use client';

import Link from 'next/link';
import { Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BorrowCapacityCardProps {
  borrowCapacityUSD: number;
  borrowedUSD: number;
  availableToBorrowUSD: number;
  borrowUtilization: number;
  borrowAPR: number;
}

/**
 * BorrowCapacityCard - Shows borrow capacity meter (NOT health factor!)
 * User-friendly borrowing interface
 */
export function BorrowCapacityCard({
  borrowCapacityUSD,
  borrowedUSD,
  availableToBorrowUSD,
  borrowUtilization,
  borrowAPR,
}: BorrowCapacityCardProps) {
  // Color based on utilization
  const getUtilizationColor = () => {
    if (borrowUtilization < 50) return 'from-mint to-mint-light';
    if (borrowUtilization < 75) return 'from-yellow-400 to-yellow-500';
    return 'from-red-400 to-red-500';
  };
  
  return (
    <div className="glass-card p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Landmark className="w-5 h-5 text-electric-blue" />
        <h2 className="text-lg font-semibold text-white/80">Borrow Capacity</h2>
      </div>
      
      {/* Capacity Display */}
      <div className="mb-4">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-2xl font-display font-bold text-white">
            ${availableToBorrowUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </span>
          <span className="text-white/40 text-sm">available</span>
        </div>
        
        {/* Progress bar */}
        <div className="relative h-2.5 bg-white/10 rounded-full overflow-hidden">
          <div 
            className={cn(
              'absolute inset-y-0 left-0 rounded-full transition-all duration-500 bg-gradient-to-r',
              getUtilizationColor()
            )}
            style={{ width: `${borrowUtilization}%` }}
          />
        </div>
        
        {/* Labels */}
        <div className="flex justify-between mt-2 text-sm">
          <span className="text-white/50">
            ${borrowedUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })} borrowed
          </span>
          <span className="text-white/50">
            ${borrowCapacityUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })} capacity
          </span>
        </div>
      </div>
      
      {/* Borrow APR notice (only if borrowed > 0) */}
      {borrowedUSD > 0 && (
        <div className="mb-4 p-3 bg-white/5 rounded-lg">
          <div className="flex justify-between items-center text-sm">
            <span className="text-white/60">Borrow APR</span>
            <span className="text-white font-medium">{borrowAPR.toFixed(1)}%</span>
          </div>
        </div>
      )}
      
      {/* Action buttons */}
      <div className="flex gap-3 pt-4 border-t border-white/5">
        <Link
          href="/app/borrow"
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all',
            availableToBorrowUSD > 0
              ? 'bg-electric-blue text-white hover:bg-electric-blue/90'
              : 'bg-white/5 text-white/30 cursor-not-allowed'
          )}
        >
          <span>Borrow</span>
        </Link>
        
        {borrowedUSD > 0 && (
          <Link
            href="/app/borrow?tab=repay"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 text-white rounded-xl font-medium hover:bg-white/10 transition-all"
          >
            <span>Repay</span>
          </Link>
        )}
      </div>
    </div>
  );
}
