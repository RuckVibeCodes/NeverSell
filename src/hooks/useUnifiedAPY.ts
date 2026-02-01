'use client';

import { useMemo } from 'react';
import { useGMXApy } from './useGMXApy';

/**
 * Unified APY Hook
 * 
 * Calculates a single blended APY number from Aave + GMX yields.
 * Formula: (aaveYield × 0.6) + (gmxYield × 0.4) - platformFee
 * 
 * CRITICAL: This returns ONE number. Never expose the breakdown to users.
 */

// Platform fee: 10% of gross yield
const PLATFORM_FEE_PERCENT = 0.10;

// Protocol split: 60% Aave, 40% GMX
const AAVE_WEIGHT = 0.6;
const GMX_WEIGHT = 0.4;

// Default APY values when data is loading or unavailable
const DEFAULT_AAVE_APY = 3.5; // ~3.5% on Aave
const DEFAULT_GMX_APY = 18.0; // ~18% on GMX GM pools

export interface UnifiedAPYResult {
  // The single APY number to display
  apy: number;
  
  // Earnings projections based on deposit amount
  projections: {
    daily: number;
    monthly: number;
    yearly: number;
  };
  
  // Loading/error state
  isLoading: boolean;
  isError: boolean;
  
  // Refetch function
  refetch: () => void;
}

interface UseUnifiedAPYParams {
  depositedUSD?: number;
}

export function useUnifiedAPY({ depositedUSD = 0 }: UseUnifiedAPYParams = {}): UnifiedAPYResult {
  // Fetch GMX APY data
  const { apyData, isLoading: gmxLoading, isError: gmxError, refetch: gmxRefetch } = useGMXApy();
  
  // Calculate blended APY
  const { apy, projections } = useMemo(() => {
    // Get GMX blended APY (average across pools, weighted by typical allocation)
    let gmxApy = DEFAULT_GMX_APY;
    
    if (apyData['BTC/USD'] && apyData['ETH/USD']) {
      // Weight: 60% BTC pool, 30% ETH pool, 10% ARB pool (typical balanced allocation)
      const btcApy = apyData['BTC/USD']?.apy7d ?? DEFAULT_GMX_APY;
      const ethApy = apyData['ETH/USD']?.apy7d ?? DEFAULT_GMX_APY;
      const arbApy = apyData['ARB/USD']?.apy7d ?? DEFAULT_GMX_APY;
      
      gmxApy = btcApy * 0.6 + ethApy * 0.3 + arbApy * 0.1;
    }
    
    // Aave APY (placeholder - in production, fetch from Aave)
    // Using conservative estimate for now
    const aaveApy = DEFAULT_AAVE_APY;
    
    // Calculate gross APY: (Aave × 60%) + (GMX × 40%)
    const grossApy = (aaveApy * AAVE_WEIGHT) + (gmxApy * GMX_WEIGHT);
    
    // Subtract platform fee (10% of gross yield)
    const netApy = grossApy * (1 - PLATFORM_FEE_PERCENT);
    
    // Calculate projections
    const yearlyEarnings = depositedUSD * (netApy / 100);
    const monthlyEarnings = yearlyEarnings / 12;
    const dailyEarnings = yearlyEarnings / 365;
    
    return {
      apy: Math.round(netApy * 10) / 10, // One decimal place
      projections: {
        daily: Math.round(dailyEarnings * 100) / 100,
        monthly: Math.round(monthlyEarnings * 100) / 100,
        yearly: Math.round(yearlyEarnings * 100) / 100,
      },
    };
  }, [apyData, depositedUSD]);
  
  return {
    apy,
    projections,
    isLoading: gmxLoading,
    isError: gmxError,
    refetch: gmxRefetch,
  };
}

/**
 * Format APY for display
 */
export function formatAPY(apy: number): string {
  return `${apy.toFixed(1)}%`;
}

/**
 * Format earnings for display
 */
export function formatEarnings(amount: number): string {
  if (amount < 0.01) return '<$0.01';
  if (amount < 1) return `$${amount.toFixed(2)}`;
  if (amount < 100) return `$${amount.toFixed(2)}`;
  if (amount < 1000) return `$${amount.toFixed(0)}`;
  return `$${(amount / 1000).toFixed(1)}k`;
}
