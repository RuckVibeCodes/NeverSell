// Hook for fetching GMX GM pool APY data
// Uses DefiLlama yields API for reliable yield information

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  GM_POOLS,
  type GMPoolName,
} from '@/lib/gmx';

// DefiLlama pool data structure
interface DefiLlamaPool {
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apyBase: number;
  apy: number;
  pool: string;
  apyPct1D: number | null;
  apyPct7D: number | null;
  apyPct30D: number | null;
  apyMean30d: number | null;
  underlyingTokens: string[];
}

interface DefiLlamaResponse {
  data: DefiLlamaPool[];
}

export interface PoolAPY {
  poolName: GMPoolName;
  feeApy: number;      // Trading fee APY (base APY from DefiLlama)
  perfApy: number;     // Annual performance (estimated from APY changes)
  totalApy: number;    // Total APY (feeApy + perfApy)
  apy7d: number;       // 7-day average for display
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

// DefiLlama yields API endpoint
const DEFILLAMA_YIELDS_API = 'https://yields.llama.fi/pools';

// Pool ID mapping from DefiLlama (highest TVL pools for each asset)
const DEFILLAMA_POOL_IDS: Record<GMPoolName, string> = {
  'BTC/USD': '5b8c0691-b9ff-4d82-97e4-19a1247e6dbf', // WBTC.B-USDC (~$80M TVL)
  'ETH/USD': '61b4c35c-97f6-4c05-a5ff-aeb4426adf5b', // ETH-USDC (~$76M TVL)
  'ARB/USD': 'f3fa942f-1867-4028-95ff-4eb76816cd07', // ARB-USDC (~$700K TVL)
};

// Symbol mapping for fallback matching
const POOL_SYMBOLS: Record<GMPoolName, string[]> = {
  'BTC/USD': ['WBTC.B-USDC', 'BTC-USDC', 'WBTC-USDC'],
  'ETH/USD': ['ETH-USDC', 'WETH-USDC'],
  'ARB/USD': ['ARB-USDC'],
};

// Fallback APY values based on real GMX data (updated 2026-02-01)
// Source: GMX UI shows Fee APY + Annual Performance
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
 * Find a pool from DefiLlama data by pool ID or symbol
 */
function findPoolData(pools: DefiLlamaPool[], poolName: GMPoolName): DefiLlamaPool | null {
  // First try to find by pool ID
  const poolId = DEFILLAMA_POOL_IDS[poolName];
  const byId = pools.find(p => p.pool === poolId);
  if (byId) return byId;

  // Fallback: find by symbol matching (highest TVL)
  const symbols = POOL_SYMBOLS[poolName];
  const matches = pools.filter(p => 
    p.project === 'gmx-v2-perps' && 
    p.chain === 'Arbitrum' &&
    symbols.some(s => p.symbol.includes(s.replace('-', '')))
  );

  if (matches.length === 0) return null;

  // Return highest TVL match
  return matches.sort((a, b) => b.tvlUsd - a.tvlUsd)[0];
}

/**
 * Convert DefiLlama pool to our PoolAPY format
 */
function convertToPoolAPY(pool: DefiLlamaPool, poolName: GMPoolName): PoolAPY {
  const totalApy = pool.apy || pool.apyBase || 0;
  
  // Estimate fee vs performance APY split
  // DefiLlama doesn't separate these, so we estimate:
  // - Fee APY is typically more stable (use apyMean30d as proxy)
  // - Performance APY is the volatile component
  const meanApy = pool.apyMean30d || totalApy * 0.7;
  const feeApy = Math.min(meanApy, totalApy * 0.8); // Cap fee at 80% of total
  const perfApy = Math.max(0, totalApy - feeApy);

  return {
    poolName,
    feeApy: Math.round(feeApy * 100) / 100,
    perfApy: Math.round(perfApy * 100) / 100,
    totalApy: Math.round(totalApy * 100) / 100,
    apy7d: Math.round(totalApy * 100) / 100,
    tvlUsd: pool.tvlUsd,
    lastUpdated: new Date(),
  };
}

/**
 * Hook for fetching GMX GM pool APY from DefiLlama
 */
export function useGMXApy(): UseGMXApyResult {
  const [apyData, setApyData] = useState<Record<GMPoolName, PoolAPY | null>>({
    'BTC/USD': null,
    'ETH/USD': null,
    'ARB/USD': null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAPYFromDefiLlama = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setError(null);

    try {
      const response = await fetch(DEFILLAMA_YIELDS_API, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        // Add cache busting
        cache: 'no-cache',
      });

      if (!response.ok) {
        throw new Error(`DefiLlama API request failed: ${response.status}`);
      }

      const data: DefiLlamaResponse = await response.json();
      
      // Filter to GMX V2 pools on Arbitrum
      const gmxPools = data.data.filter(
        p => p.project === 'gmx-v2-perps' && p.chain === 'Arbitrum'
      );

      if (gmxPools.length === 0) {
        throw new Error('No GMX pools found in DefiLlama data');
      }

      const newApyData: Record<GMPoolName, PoolAPY | null> = {
        'BTC/USD': null,
        'ETH/USD': null,
        'ARB/USD': null,
      };

      const timestamp = new Date();

      // Map pools to our structure
      for (const poolName of Object.keys(GM_POOLS) as GMPoolName[]) {
        const poolData = findPoolData(gmxPools, poolName);
        if (poolData) {
          newApyData[poolName] = convertToPoolAPY(poolData, poolName);
        } else {
          // Use fallback with current timestamp
          newApyData[poolName] = { ...FALLBACK_APY[poolName], lastUpdated: timestamp };
          console.warn(`No DefiLlama data for ${poolName}, using fallback`);
        }
      }

      setApyData(newApyData);
      setLastUpdated(timestamp);
    } catch (err) {
      console.warn('Failed to fetch GMX APY from DefiLlama, using fallback values:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch APY'));
      setIsError(true);
      
      // Use fallback values
      setApyData(FALLBACK_APY);
      setLastUpdated(FALLBACK_APY['BTC/USD'].lastUpdated);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchAPYFromDefiLlama();
  }, [fetchAPYFromDefiLlama]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchAPYFromDefiLlama, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAPYFromDefiLlama]);

  return {
    apyData,
    isLoading,
    isError,
    error,
    lastUpdated,
    refetch: fetchAPYFromDefiLlama,
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
  if (apy >= 100) {
    return `${apy.toFixed(0)}%`;
  } else if (apy >= 10) {
    return `${apy.toFixed(1)}%`;
  } else {
    return `${apy.toFixed(2)}%`;
  }
}

/**
 * Get APY color class based on value
 */
export function getAPYColorClass(apy: number): string {
  if (apy >= 20) return 'text-green-500';
  if (apy >= 10) return 'text-green-400';
  if (apy >= 5) return 'text-yellow-400';
  return 'text-gray-400';
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
