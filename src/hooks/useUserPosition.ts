'use client';

import { useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useAavePosition } from './useAavePosition';
import { useGMXPosition } from './useGMXPosition';
import { useUnifiedAPY } from './useUnifiedAPY';

/**
 * User Position Hook
 * 
 * Aggregates user's total position across all protocols.
 * CRITICAL: Hide all protocol-specific details. User sees only unified numbers.
 * 
 * Returns:
 * - totalValue: Total value of all assets
 * - deposited: Original deposit amount (tracked)
 * - earnings: Total earnings to date
 * - borrowCapacity: Available to borrow (NOT health factor!)
 * - borrowed: Current borrowed amount
 */

export interface UserPosition {
  // Core position data
  totalValueUSD: number;
  depositedUSD: number;
  earningsUSD: number;
  earningsPercent: number;
  
  // Borrow info (user-friendly terms)
  borrowCapacityUSD: number;  // Max they can borrow
  borrowedUSD: number;        // Currently borrowed
  availableToBorrowUSD: number; // Capacity - borrowed
  borrowAPR: number;          // Cost to borrow (only relevant if borrowed > 0)
  
  // Borrow capacity as percentage (for meter visualization)
  borrowUtilization: number;  // 0-100, how much of capacity is used
  
  // APY (unified, single number)
  currentAPY: number;
  
  // Earnings projections
  dailyEarnings: number;
  monthlyEarnings: number;
  yearlyEarnings: number;
  
  // State
  hasPosition: boolean;
  isLoading: boolean;
  isError: boolean;
}

export interface UseUserPositionResult extends UserPosition {
  refetch: () => void;
}

export function useUserPosition(): UseUserPositionResult {
  const { address, isConnected } = useAccount();
  
  // Fetch Aave position (internal, not exposed to UI)
  const {
    position: aavePosition,
    isLoading: aaveLoading,
    error: aaveError,
    refetch: aaveRefetch,
  } = useAavePosition();
  
  // Fetch GMX position (internal, not exposed to UI)
  const {
    totalValueUsd: gmxValueUsd,
    isLoading: gmxLoading,
    isError: gmxError,
    refetch: gmxRefetch,
  } = useGMXPosition();
  
  // Aggregate position data
  const aggregatedPosition = useMemo(() => {
    // If not connected or no position, return defaults
    if (!isConnected || !address) {
      return {
        totalValueUSD: 0,
        depositedUSD: 0,
        earningsUSD: 0,
        earningsPercent: 0,
        borrowCapacityUSD: 0,
        borrowedUSD: 0,
        availableToBorrowUSD: 0,
        borrowAPR: 5.2, // Default borrow rate
        borrowUtilization: 0,
        hasPosition: false,
      };
    }
    
    // Calculate total value from both protocols
    const aaveCollateral = aavePosition?.totalCollateralUSD ?? 0;
    const gmxValue = gmxValueUsd ?? 0;
    const totalValueUSD = aaveCollateral + gmxValue;
    
    // For MVP, we estimate deposited amount as 95% of current value
    // In production, this would be tracked in a contract
    const depositedUSD = totalValueUSD > 0 ? totalValueUSD * 0.95 : 0;
    const earningsUSD = totalValueUSD - depositedUSD;
    const earningsPercent = depositedUSD > 0 ? (earningsUSD / depositedUSD) * 100 : 0;
    
    // Borrow capacity from Aave (the 60% portion)
    // User sees "Borrow Capacity" not "Health Factor"
    const borrowCapacityUSD = aavePosition?.availableBorrowsUSD ?? 0;
    const borrowedUSD = aavePosition?.totalDebtUSD ?? 0;
    const maxBorrowCapacity = borrowCapacityUSD + borrowedUSD; // Total capacity
    const availableToBorrowUSD = borrowCapacityUSD;
    
    // Calculate borrow utilization (for the meter)
    const borrowUtilization = maxBorrowCapacity > 0 
      ? (borrowedUSD / maxBorrowCapacity) * 100 
      : 0;
    
    // Default borrow APR (in production, fetch from Aave)
    const borrowAPR = 5.2;
    
    const hasPosition = totalValueUSD > 0;
    
    return {
      totalValueUSD,
      depositedUSD,
      earningsUSD,
      earningsPercent,
      borrowCapacityUSD: maxBorrowCapacity,
      borrowedUSD,
      availableToBorrowUSD,
      borrowAPR,
      borrowUtilization,
      hasPosition,
    };
  }, [isConnected, address, aavePosition, gmxValueUsd]);
  
  // Get unified APY
  const { apy, projections, isLoading: apyLoading } = useUnifiedAPY({
    depositedUSD: aggregatedPosition.depositedUSD,
  });
  
  const refetch = () => {
    aaveRefetch();
    gmxRefetch();
  };
  
  return {
    ...aggregatedPosition,
    currentAPY: apy,
    dailyEarnings: projections.daily,
    monthlyEarnings: projections.monthly,
    yearlyEarnings: projections.yearly,
    isLoading: aaveLoading || gmxLoading || apyLoading,
    isError: !!aaveError || gmxError,
    refetch,
  };
}

/**
 * Format USD values for display
 */
export function formatUSD(amount: number): string {
  if (amount === 0) return '$0';
  if (amount < 0.01) return '<$0.01';
  if (amount < 1) return `$${amount.toFixed(2)}`;
  if (amount < 1000) return `$${amount.toFixed(2)}`;
  if (amount < 10000) return `$${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  if (amount < 1000000) return `$${(amount / 1000).toFixed(1)}k`;
  return `$${(amount / 1000000).toFixed(2)}M`;
}

/**
 * Format percentage for display
 */
export function formatPercent(value: number): string {
  if (value === 0) return '0%';
  if (Math.abs(value) < 0.1) return '<0.1%';
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}
