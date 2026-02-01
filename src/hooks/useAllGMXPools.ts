// Hook for fetching ALL GMX GM pools from DefiLlama
// Used by the Markets explorer page

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

// DefiLlama pool data structure
interface DefiLlamaPool {
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apyBase: number | null;
  apy: number | null;
  pool: string;
  apyPct1D: number | null;
  apyPct7D: number | null;
  apyPct30D: number | null;
  apyMean30d: number | null;
  underlyingTokens: string[];
}

export interface GMPool {
  id: string;
  symbol: string;
  longToken: string;
  shortToken: string;
  apy: number;
  apy7d: number | null;
  apy30d: number | null;
  tvlUsd: number;
  poolType: 'standard' | 'single-sided';
  defiLlamaId: string;
}

export interface UseAllGMXPoolsResult {
  pools: GMPool[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  lastUpdated: Date | null;
  refetch: () => void;
}

// DefiLlama yields API endpoint
const DEFILLAMA_YIELDS_API = 'https://yields.llama.fi/pools';

// Parse pool symbol into tokens (e.g., "WBTC.B-USDC" -> ["WBTC.B", "USDC"])
function parsePoolSymbol(symbol: string): { longToken: string; shortToken: string; poolType: 'standard' | 'single-sided' } {
  const parts = symbol.split('-');
  if (parts.length < 2) {
    return { longToken: symbol, shortToken: 'USDC', poolType: 'standard' };
  }
  
  const longToken = parts[0];
  const shortToken = parts[1];
  
  // If both tokens are the same (e.g., "ETH-ETH"), it's a single-sided pool
  const poolType = longToken === shortToken ? 'single-sided' : 'standard';
  
  return { longToken, shortToken, poolType };
}

// Normalize token symbols for display
function normalizeTokenSymbol(token: string): string {
  // Handle wrapped tokens
  if (token === 'WBTC.B' || token === 'WBTC') return 'BTC';
  if (token === 'WETH') return 'ETH';
  return token;
}

// Convert DefiLlama pool to our GMPool format
function convertToGMPool(pool: DefiLlamaPool): GMPool {
  const { longToken, shortToken, poolType } = parsePoolSymbol(pool.symbol);
  
  return {
    id: pool.pool,
    symbol: pool.symbol,
    longToken: normalizeTokenSymbol(longToken),
    shortToken: normalizeTokenSymbol(shortToken),
    apy: pool.apy || pool.apyBase || 0,
    apy7d: pool.apyPct7D,
    apy30d: pool.apyMean30d,
    tvlUsd: pool.tvlUsd,
    poolType,
    defiLlamaId: pool.pool,
  };
}

/**
 * Hook for fetching all GMX GM pools from DefiLlama
 */
export function useAllGMXPools(): UseAllGMXPoolsResult {
  const [pools, setPools] = useState<GMPool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchPools = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setError(null);

    try {
      const response = await fetch(DEFILLAMA_YIELDS_API, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-cache',
      });

      if (!response.ok) {
        throw new Error(`DefiLlama API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Filter to GMX V2 pools on Arbitrum
      const gmxPools = data.data.filter(
        (p: DefiLlamaPool) => p.project === 'gmx-v2-perps' && p.chain === 'Arbitrum'
      );

      if (gmxPools.length === 0) {
        throw new Error('No GMX pools found');
      }

      // Convert to our format and sort by TVL
      const convertedPools = gmxPools
        .map(convertToGMPool)
        .sort((a: GMPool, b: GMPool) => b.tvlUsd - a.tvlUsd);

      setPools(convertedPools);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch GMX pools:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch pools'));
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchPools();
  }, [fetchPools]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchPools, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchPools]);

  return {
    pools,
    isLoading,
    isError,
    error,
    lastUpdated,
    refetch: fetchPools,
  };
}

/**
 * Hook for searching/filtering pools
 */
export function useFilteredGMXPools(
  pools: GMPool[],
  options: {
    search?: string;
    minTvl?: number;
    minApy?: number;
    poolType?: 'all' | 'standard' | 'single-sided';
    sortBy?: 'tvl' | 'apy' | 'symbol';
    sortOrder?: 'asc' | 'desc';
    mainOnly?: boolean; // Dedupe to highest TVL pool per symbol
  } = {}
): GMPool[] {
  return useMemo(() => {
    let filtered = [...pools];

    // Main pools only - dedupe to highest TVL per symbol
    if (options.mainOnly) {
      const mainPoolsBySymbol = new Map<string, GMPool>();
      for (const pool of filtered) {
        const existing = mainPoolsBySymbol.get(pool.symbol);
        if (!existing || pool.tvlUsd > existing.tvlUsd) {
          mainPoolsBySymbol.set(pool.symbol, pool);
        }
      }
      filtered = Array.from(mainPoolsBySymbol.values());
    }

    // Search filter
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      filtered = filtered.filter(
        p => 
          p.symbol.toLowerCase().includes(searchLower) ||
          p.longToken.toLowerCase().includes(searchLower) ||
          p.shortToken.toLowerCase().includes(searchLower)
      );
    }

    // TVL filter
    if (options.minTvl) {
      filtered = filtered.filter(p => p.tvlUsd >= options.minTvl!);
    }

    // APY filter
    if (options.minApy) {
      filtered = filtered.filter(p => p.apy >= options.minApy!);
    }

    // Pool type filter
    if (options.poolType && options.poolType !== 'all') {
      filtered = filtered.filter(p => p.poolType === options.poolType);
    }

    // Sort
    const sortBy = options.sortBy || 'tvl';
    const sortOrder = options.sortOrder || 'desc';
    const multiplier = sortOrder === 'desc' ? -1 : 1;

    filtered.sort((a, b) => {
      if (sortBy === 'tvl') {
        return (a.tvlUsd - b.tvlUsd) * multiplier;
      } else if (sortBy === 'apy') {
        return (a.apy - b.apy) * multiplier;
      } else {
        return a.symbol.localeCompare(b.symbol) * multiplier;
      }
    });

    return filtered;
  }, [pools, options.search, options.minTvl, options.minApy, options.poolType, options.sortBy, options.sortOrder, options.mainOnly]);
}

/**
 * Format TVL for display
 */
export function formatTVL(tvl: number): string {
  if (tvl >= 1_000_000_000) {
    return `$${(tvl / 1_000_000_000).toFixed(2)}B`;
  } else if (tvl >= 1_000_000) {
    return `$${(tvl / 1_000_000).toFixed(2)}M`;
  } else if (tvl >= 1_000) {
    return `$${(tvl / 1_000).toFixed(2)}K`;
  }
  return `$${tvl.toFixed(2)}`;
}

/**
 * Format APY for display
 */
export function formatPoolAPY(apy: number): string {
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
export function getPoolAPYColor(apy: number): string {
  if (apy >= 25) return 'text-green-400';
  if (apy >= 15) return 'text-lime-400';
  if (apy >= 10) return 'text-yellow-400';
  if (apy >= 5) return 'text-orange-400';
  return 'text-white/60';
}

/**
 * Get token icon/emoji based on symbol
 */
export function getTokenIcon(token: string): string {
  const icons: Record<string, string> = {
    'BTC': '₿',
    'ETH': 'Ξ',
    'ARB': 'A',
    'SOL': '◎',
    'LINK': '⛓',
    'UNI': '🦄',
    'DOGE': '🐕',
    'AAVE': '👻',
    'PEPE': '🐸',
    'WIF': '🐕',
    'ATOM': '⚛',
    'NEAR': 'Ⓝ',
    'XRP': '✕',
    'USDC': '$',
    'USDT': '$',
  };
  return icons[token] || token.charAt(0);
}

/**
 * Get gradient color for pool based on long token
 */
export function getPoolGradient(longToken: string): string {
  const gradients: Record<string, string> = {
    'BTC': 'from-orange-500 to-amber-500',
    'ETH': 'from-blue-500 to-purple-500',
    'ARB': 'from-blue-600 to-indigo-500',
    'SOL': 'from-purple-500 to-pink-500',
    'LINK': 'from-blue-400 to-cyan-500',
    'UNI': 'from-pink-500 to-rose-500',
    'DOGE': 'from-yellow-500 to-amber-500',
    'AAVE': 'from-teal-500 to-cyan-500',
    'PEPE': 'from-green-500 to-emerald-500',
  };
  return gradients[longToken] || 'from-gray-500 to-slate-500';
}
