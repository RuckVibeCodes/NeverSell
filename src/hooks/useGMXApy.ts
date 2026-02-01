// Hook for fetching GMX GM pool APY data
// Uses native GMX SDK and REST API for accurate real-time yields

'use client';

import { useMemo } from 'react';
import { useGMXMarketsInfo, type MarketInfo } from './useGMXMarketsInfo';
import { 
  calculateTotalApy, 
  getPoolTvlUsd,
  formatApy as formatApyUtil,
  getApyColorClass as getApyColorClassUtil,
} from '@/lib/gmxApy';
import {
  GM_POOLS,
  type GMPoolName,
} from '@/lib/gmx';

export interface PoolAPY {
  poolName: GMPoolName;
  feeApy: number;      // Trading/borrowing fee APY
  perfApy: number;     // Performance APY (GM token appreciation)
  totalApy: number;    // Total APY (feeApy + perfApy)
  apy7d: number;       // 7-day average (same as totalApy for now)
  tvlUsd: number;
  lastUpdated: Date;
}

export interface UseGMXApyResult {
  apyData: Record<GMPoolName, PoolAPY | null>;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  lastUpdated: Date | null;
  refetch: () => void;
}

// Fallback APY values (used when SDK/API fails)
// Updated periodically based on GMX UI
const FALLBACK_APY: Record<GMPoolName, PoolAPY> = {
  'BTC/USD': {
    poolName: 'BTC/USD',
    feeApy: 10.77,
    perfApy: 4.05,
    totalApy: 14.82,
    apy7d: 14.82,
    tvlUsd: 80_000_000,
    lastUpdated: new Date('2026-02-01'),
  },
  'ETH/USD': {
    poolName: 'ETH/USD',
    feeApy: 12.14,
    perfApy: 7.61,
    totalApy: 19.75,
    apy7d: 19.75,
    tvlUsd: 76_000_000,
    lastUpdated: new Date('2026-02-01'),
  },
  'ARB/USD': {
    poolName: 'ARB/USD',
    feeApy: 6.0,
    perfApy: 2.65,
    totalApy: 8.65,
    apy7d: 8.65,
    tvlUsd: 700_000,
    lastUpdated: new Date('2026-02-01'),
  },
};

/**
 * Find market info by pool name
 */
function findMarketByPoolName(
  markets: Record<string, MarketInfo>,
  poolName: GMPoolName
): MarketInfo | null {
  const poolConfig = GM_POOLS[poolName];
  if (!poolConfig) return null;
  
  const marketKey = poolConfig.marketToken.toLowerCase();
  return markets[marketKey] || null;
}

/**
 * Convert MarketInfo to PoolAPY
 */
function marketToPoolApy(
  market: MarketInfo,
  poolName: GMPoolName
): PoolAPY {
  const { feeApy, performanceApy, totalApy } = calculateTotalApy(market);
  const tvlUsd = getPoolTvlUsd(market);
  
  return {
    poolName,
    feeApy,
    perfApy: performanceApy,
    totalApy,
    apy7d: totalApy, // TODO: Calculate actual 7d average from historical data
    tvlUsd,
    lastUpdated: new Date(),
  };
}

/**
 * Hook for fetching GMX GM pool APY from native SDK
 */
export function useGMXApy(): UseGMXApyResult {
  const { 
    markets, 
    isLoading, 
    isError, 
    error, 
    pricesUpdatedAt,
    refetch 
  } = useGMXMarketsInfo();

  const apyData = useMemo(() => {
    const result: Record<GMPoolName, PoolAPY | null> = {
      'BTC/USD': null,
      'ETH/USD': null,
      'ARB/USD': null,
    };

    const poolNames = Object.keys(GM_POOLS) as GMPoolName[];
    
    for (const poolName of poolNames) {
      const market = findMarketByPoolName(markets, poolName);
      
      if (market) {
        result[poolName] = marketToPoolApy(market, poolName);
      } else if (!isLoading && !isError) {
        // Use fallback if market not found (but data loaded)
        result[poolName] = { ...FALLBACK_APY[poolName], lastUpdated: new Date() };
        console.warn(`No market data for ${poolName}, using fallback APY`);
      }
    }

    return result;
  }, [markets, isLoading, isError]);

  // Use fallback data if error occurred
  const finalApyData = useMemo(() => {
    if (isError) {
      return FALLBACK_APY;
    }
    return apyData;
  }, [apyData, isError]);

  const lastUpdated = useMemo(() => {
    if (pricesUpdatedAt) {
      return new Date(pricesUpdatedAt);
    }
    return null;
  }, [pricesUpdatedAt]);

  return {
    apyData: finalApyData,
    isLoading,
    isError,
    error,
    lastUpdated,
    refetch,
  };
}

/**
 * Hook for single pool APY
 */
export function useGMXPoolApy(poolName: GMPoolName): {
  apy: PoolAPY | null;
  isLoading: boolean;
  isError: boolean;
  lastUpdated: Date | null;
} {
  const { apyData, isLoading, isError, lastUpdated } = useGMXApy();

  return {
    apy: apyData[poolName],
    isLoading,
    isError,
    lastUpdated,
  };
}

/**
 * Hook for blended APY across multiple pools
 */
export function useGMXBlendedApy(
  allocations: Record<GMPoolName, number> // Allocation percentages
): {
  blendedApy: number;
  isLoading: boolean;
  lastUpdated: Date | null;
} {
  const { apyData, isLoading, lastUpdated } = useGMXApy();

  const blendedApy = useMemo(() => {
    let totalApy = 0;
    let totalWeight = 0;

    for (const [poolName, allocation] of Object.entries(allocations)) {
      const poolApy = apyData[poolName as GMPoolName];
      if (poolApy && allocation > 0) {
        totalApy += poolApy.totalApy * allocation;
        totalWeight += allocation;
      }
    }

    return totalWeight > 0 ? totalApy / totalWeight : 0;
  }, [apyData, allocations]);

  return {
    blendedApy,
    isLoading,
    lastUpdated,
  };
}

/**
 * Format APY for display
 */
export function formatAPY(apy: number): string {
  return formatApyUtil(apy);
}

/**
 * Get APY color class based on value
 */
export function getAPYColorClass(apy: number): string {
  return getApyColorClassUtil(apy);
}

/**
 * Format relative time for "Last updated" display
 */
export function formatLastUpdated(date: Date | null): string {
  if (!date) return 'Never';
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
}
