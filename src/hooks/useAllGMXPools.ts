// Hook for fetching ALL GMX GM pools from native SDK
// Used by the Markets explorer page

'use client';

import { useMemo } from 'react';
import { useGMXMarketsInfo, type MarketInfo } from './useGMXMarketsInfo';
import { 
  calculateTotalApy, 
  getPoolTvlUsd,
  formatApy,
  getApyColorClass,
} from '@/lib/gmxApy';

export interface GMPool {
  id: string;
  symbol: string;
  name: string;
  longToken: string;
  shortToken: string;
  indexToken: string;       // Address
  indexTokenSymbol: string; // Symbol (e.g., "PENGU", "ASTER") for search
  marketToken: string;
  apy: number;
  feeApy: number;
  perfApy: number;
  apy7d: number | null;
  apy30d: number | null;
  tvlUsd: number;
  poolType: 'standard' | 'single-sided';
  isDisabled: boolean;
  // Rate data for advanced displays
  fundingRateLong: number;
  fundingRateShort: number;
  borrowingRateLong: number;
  borrowingRateShort: number;
}

export interface UseAllGMXPoolsResult {
  pools: GMPool[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  lastUpdated: Date | null;
  refetch: () => void;
}

// Fallback token symbol mappings (used when SDK tokens data is unavailable)
// Last updated: 2026-02-01
const FALLBACK_TOKEN_SYMBOLS: Record<string, string> = {
  '0x82af49447d8a07e3bd95bd0d56f35241523fbab1': 'ETH',
  '0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f': 'WBTC',
  '0xaf88d065e77c8cc2239327c5edb3a432268e5831': 'USDC',
  '0x912ce59144191c1204e64559fe8253a0e49e6548': 'ARB',
  '0xfc5a1a6eb076a2c7ad06ed22c90d7e710e35ad0a': 'GMX',
  '0xf97f4df75117a78c1a5a0dbb814af92458539fb4': 'LINK',
  '0xfa7f8980b0f1e64a2062791cc3b0871572f1f7f0': 'UNI',
  '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8': 'USDC.e',
  '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9': 'USDT',
  '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1': 'DAI',
  '0x17fc002b466eec40dae837fc4be5c67993ddbd6f': 'FRAX',
  '0xf42ae1d54fd613c9bb14810b0588faaa09a426ca': 'SOL',
};

/**
 * Get token symbol from address
 * Uses SDK tokens data first, falls back to hardcoded mappings
 */
function getTokenSymbol(
  address: string, 
  tokensData: Record<string, { symbol: string }>,
  fallbackName?: string
): string {
  const lowerAddress = address.toLowerCase();
  
  // Try SDK tokens data first (most up-to-date)
  const tokenData = tokensData[lowerAddress];
  if (tokenData?.symbol) {
    return tokenData.symbol;
  }
  
  // Try fallback mapping
  const fallbackSymbol = FALLBACK_TOKEN_SYMBOLS[lowerAddress];
  if (fallbackSymbol) return fallbackSymbol;
  
  // Try to extract from market name (often contains symbols)
  if (fallbackName && fallbackName.includes('/')) {
    const parts = fallbackName.split('/');
    if (parts[0]) return parts[0];
  }
  
  // Return shortened address as last resort
  return address.slice(0, 6) + '...';
}

/**
 * Parse rate string to number (annualized %)
 */
function parseRate(rateStr: string | undefined): number {
  if (!rateStr) return 0;
  try {
    const rate = BigInt(rateStr);
    // Convert from per-second to annual (× seconds per year / 10^28 for percentage)
    const secondsPerYear = BigInt(31536000);
    const annual = Number(rate * secondsPerYear) / 1e28;
    return Math.round(annual * 100) / 100;
  } catch {
    return 0;
  }
}

/**
 * Convert MarketInfo to GMPool
 * Uses pre-calculated APY from GMX /apy endpoint when available
 */
function marketToPool(
  market: MarketInfo, 
  tokensData: Record<string, { symbol: string }>
): GMPool {
  const tvlUsd = getPoolTvlUsd(market);
  
  const longSymbol = getTokenSymbol(market.longToken, tokensData, market.name);
  const shortSymbol = getTokenSymbol(market.shortToken, tokensData, market.name);
  const indexSymbol = getTokenSymbol(market.indexToken, tokensData, market.name);
  
  // Determine pool type
  const isSingleSided = market.longToken.toLowerCase() === market.shortToken.toLowerCase();
  
  // Build symbol
  const symbol = isSingleSided 
    ? `${longSymbol}-${longSymbol}`
    : `${longSymbol}-${shortSymbol}`;

  // Use pre-calculated APY from GMX API when available (apy is decimal: 0.15 = 15%)
  let apy: number;
  let feeApy: number;
  let perfApy: number;
  
  if (market.apy !== undefined && market.apy > 0) {
    apy = market.apy * 100; // Convert to percentage
    feeApy = (market.baseApy ?? market.apy) * 100;
    perfApy = (market.bonusApr ?? 0) * 100;
  } else {
    // Fallback to calculated APY from rates (less accurate)
    const calculated = calculateTotalApy(market);
    apy = calculated.totalApy;
    feeApy = calculated.feeApy;
    perfApy = calculated.performanceApy;
  }

  return {
    id: market.marketToken,
    symbol,
    name: market.name || `${longSymbol}/${shortSymbol}`,
    longToken: longSymbol,
    shortToken: shortSymbol,
    indexToken: market.indexToken,
    indexTokenSymbol: indexSymbol, // For search: PENGU, ASTER, etc.
    marketToken: market.marketToken,
    apy,
    feeApy,
    perfApy,
    apy7d: null, // TODO: Fetch 7d APY from /apy?period=7d
    apy30d: null, // TODO: Fetch 30d APY from /apy?period=30d
    tvlUsd,
    poolType: isSingleSided ? 'single-sided' : 'standard',
    isDisabled: market.isDisabled,
    fundingRateLong: parseRate(market.fundingRateLong),
    fundingRateShort: parseRate(market.fundingRateShort),
    borrowingRateLong: parseRate(market.borrowingRateLong),
    borrowingRateShort: parseRate(market.borrowingRateShort),
  };
}

/**
 * Hook for fetching all GMX GM pools
 */
export function useAllGMXPools(): UseAllGMXPoolsResult {
  const { 
    markets, 
    tokens,
    isLoading, 
    isError, 
    error, 
    pricesUpdatedAt,
    refetch 
  } = useGMXMarketsInfo();

  const pools = useMemo(() => {
    // Convert tokens to the format expected by marketToPool
    const tokensMap: Record<string, { symbol: string }> = {};
    for (const [address, token] of Object.entries(tokens)) {
      tokensMap[address] = { symbol: token.symbol };
    }
    
    const poolList = Object.values(markets)
      .map(market => marketToPool(market, tokensMap))
      .filter(pool => !pool.isDisabled) // Only show active pools
      .sort((a, b) => b.tvlUsd - a.tvlUsd); // Sort by TVL desc
    
    return poolList;
  }, [markets, tokens]);

  const lastUpdated = useMemo(() => {
    if (pricesUpdatedAt) {
      return new Date(pricesUpdatedAt);
    }
    return null;
  }, [pricesUpdatedAt]);

  return {
    pools,
    isLoading,
    isError,
    error,
    lastUpdated,
    refetch,
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

    // Search filter - includes index token for assets like PENGU, ASTER
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      filtered = filtered.filter(
        p => 
          p.symbol.toLowerCase().includes(searchLower) ||
          p.name.toLowerCase().includes(searchLower) ||
          p.longToken.toLowerCase().includes(searchLower) ||
          p.shortToken.toLowerCase().includes(searchLower) ||
          p.indexTokenSymbol.toLowerCase().includes(searchLower)
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
  return formatApy(apy);
}

/**
 * Get APY color class based on value
 */
export function getPoolAPYColor(apy: number): string {
  return getApyColorClass(apy);
}

/**
 * Get token icon/emoji based on symbol
 */
export function getTokenIcon(token: string): string {
  const icons: Record<string, string> = {
    'BTC': '₿',
    'WBTC': '₿',
    'ETH': 'Ξ',
    'WETH': 'Ξ',
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
    'DAI': '$',
    'GMX': 'G',
  };
  return icons[token] || token.charAt(0);
}

/**
 * Get gradient color for pool based on long token
 */
export function getPoolGradient(longToken: string): string {
  const gradients: Record<string, string> = {
    'BTC': 'from-orange-500 to-amber-500',
    'WBTC': 'from-orange-500 to-amber-500',
    'ETH': 'from-blue-500 to-purple-500',
    'WETH': 'from-blue-500 to-purple-500',
    'ARB': 'from-blue-600 to-indigo-500',
    'SOL': 'from-purple-500 to-pink-500',
    'LINK': 'from-blue-400 to-cyan-500',
    'UNI': 'from-pink-500 to-rose-500',
    'DOGE': 'from-yellow-500 to-amber-500',
    'AAVE': 'from-teal-500 to-cyan-500',
    'PEPE': 'from-green-500 to-emerald-500',
    'GMX': 'from-blue-500 to-purple-500',
  };
  return gradients[longToken] || 'from-gray-500 to-slate-500';
}
