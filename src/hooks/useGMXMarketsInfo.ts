// Hook for fetching GMX markets info using the official SDK
// Provides real-time pool data, APYs, and token prices
// Last updated: 2026-02-01

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getGmxSdk } from '@/lib/gmxSdk';
import { GMX_CACHE_CONFIG, GMX_REST_API } from '@/lib/gmxConfig';

// Request timeout for REST API calls (10 seconds)
const REQUEST_TIMEOUT_MS = 10000;

/**
 * Market information from GMX SDK/API
 * @property marketToken - The GM token address for this market
 * @property indexToken - The index token being traded (e.g., BTC, ETH)
 * @property longToken - Token used for long positions
 * @property shortToken - Token used for short positions (usually USDC)
 * @property name - Human-readable market name
 * @property isDisabled - Whether the market is currently disabled
 * @property longPoolAmount - Amount of long tokens in the pool
 * @property shortPoolAmount - Amount of short tokens in the pool
 * @property poolValueMax - Maximum pool value in USD (30 decimals)
 * @property poolValueMin - Minimum pool value in USD (30 decimals)
 */
export interface MarketInfo {
  marketToken: string;
  indexToken: string;
  longToken: string;
  shortToken: string;
  name: string;
  isDisabled: boolean;
  longPoolAmount: bigint;
  shortPoolAmount: bigint;
  poolValueMax: bigint;
  poolValueMin: bigint;
  borrowingFactorLong: bigint;
  borrowingFactorShort: bigint;
  fundingFactor: bigint;
  totalBorrowingFees: bigint;
  // Rates from REST API (annualized, 30 decimal precision)
  fundingRateLong?: string;
  fundingRateShort?: string;
  borrowingRateLong?: string;
  borrowingRateShort?: string;
  netRateLong?: string;
  netRateShort?: string;
  // APY from GMX /apy endpoint (decimal: 0.15 = 15%)
  apy?: number;
  baseApy?: number;
  bonusApr?: number;
}

/**
 * Token data from GMX SDK
 * @property address - Token contract address
 * @property symbol - Token symbol (e.g., "ETH", "USDC")
 * @property decimals - Token decimals
 * @property name - Token name
 * @property priceMin - Minimum oracle price (30 decimals)
 * @property priceMax - Maximum oracle price (30 decimals)
 */
export interface TokenData {
  address: string;
  symbol: string;
  decimals: number;
  name: string;
  priceMin?: bigint;
  priceMax?: bigint;
}

export interface GMXMarketsInfoResult {
  markets: Record<string, MarketInfo>;
  tokens: Record<string, TokenData>;
  pricesUpdatedAt: number | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

// REST API response types
interface RESTMarketInfo {
  name: string;
  marketToken: string;
  indexToken: string;
  longToken: string;
  shortToken: string;
  isListed: boolean;
  listingDate: string;
  poolAmountLong: string;
  poolAmountShort: string;
  openInterestLong: string;
  openInterestShort: string;
  availableLiquidityLong: string;
  availableLiquidityShort: string;
  fundingRateLong: string;
  fundingRateShort: string;
  borrowingRateLong: string;
  borrowingRateShort: string;
  netRateLong: string;
  netRateShort: string;
}

interface RESTMarketsResponse {
  markets: RESTMarketInfo[];
}

// APY API response type
interface APYMarketData {
  apy: number;       // Total APY as decimal (0.15 = 15%)
  baseApy: number;   // Base APY from trading fees
  bonusApr: number;  // Bonus APR from incentives
}

interface APYResponse {
  markets: Record<string, APYMarketData>;
  glvs?: Record<string, APYMarketData>;
}

/**
 * Safely get a string property from an unknown object
 */
function safeString(obj: unknown, ...path: string[]): string {
  let current: unknown = obj;
  for (const key of path) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return '';
    }
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === 'string' ? current : '';
}

/**
 * Safely get a bigint property from an unknown object
 */
function safeBigInt(obj: unknown, key: string): bigint {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return BigInt(0);
  }
  const value = (obj as Record<string, unknown>)[key];
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') return BigInt(Math.floor(value));
  if (typeof value === 'string') {
    try {
      return BigInt(value);
    } catch {
      return BigInt(0);
    }
  }
  return BigInt(0);
}

/**
 * Safely get a boolean property from an unknown object
 */
function safeBoolean(obj: unknown, key: string): boolean {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return false;
  }
  return Boolean((obj as Record<string, unknown>)[key]);
}

/**
 * Fetch markets data from GMX REST API with timeout
 */
async function fetchRESTMarketsInfo(): Promise<RESTMarketInfo[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  
  try {
    const response = await fetch(GMX_REST_API.marketsInfo, {
      cache: 'no-cache',
      signal: controller.signal,
    });
    
    if (!response.ok) {
      throw new Error(`REST API error: ${response.status}`);
    }
    
    const data: RESTMarketsResponse = await response.json();
    return data.markets || [];
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch APY data from GMX /apy endpoint
 * Returns pre-calculated APY values (decimals: 0.15 = 15%)
 */
async function fetchAPYData(): Promise<Record<string, APYMarketData>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  
  try {
    // Use 'total' period for all-time APY, could also use '7d' or '30d'
    const response = await fetch(`${GMX_REST_API.base}/apy?period=total`, {
      cache: 'no-cache',
      signal: controller.signal,
    });
    
    if (!response.ok) {
      throw new Error(`APY API error: ${response.status}`);
    }
    
    const data: APYResponse = await response.json();
    return data.markets || {};
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Convert SDK market info to our MarketInfo type safely
 */
function convertSdkMarket(address: string, marketInfo: unknown): MarketInfo {
  return {
    marketToken: address,
    indexToken: safeString(marketInfo, 'indexToken', 'address'),
    longToken: safeString(marketInfo, 'longToken', 'address'),
    shortToken: safeString(marketInfo, 'shortToken', 'address'),
    name: safeString(marketInfo, 'name'),
    isDisabled: safeBoolean(marketInfo, 'isDisabled'),
    longPoolAmount: safeBigInt(marketInfo, 'longPoolAmount'),
    shortPoolAmount: safeBigInt(marketInfo, 'shortPoolAmount'),
    poolValueMax: safeBigInt(marketInfo, 'poolValueMax'),
    poolValueMin: safeBigInt(marketInfo, 'poolValueMin'),
    borrowingFactorLong: safeBigInt(marketInfo, 'borrowingFactorLong'),
    borrowingFactorShort: safeBigInt(marketInfo, 'borrowingFactorShort'),
    fundingFactor: safeBigInt(marketInfo, 'fundingFactor'),
    totalBorrowingFees: safeBigInt(marketInfo, 'totalBorrowingFees'),
  };
}

/**
 * Convert SDK token info to our TokenData type safely
 */
function convertSdkToken(address: string, tokenInfo: unknown): TokenData {
  const prices = tokenInfo && typeof tokenInfo === 'object' 
    ? (tokenInfo as Record<string, unknown>).prices 
    : undefined;
  
  return {
    address,
    symbol: safeString(tokenInfo, 'symbol'),
    decimals: typeof tokenInfo === 'object' && tokenInfo !== null
      ? (typeof (tokenInfo as Record<string, unknown>).decimals === 'number' 
          ? (tokenInfo as Record<string, unknown>).decimals as number 
          : 18)
      : 18,
    name: safeString(tokenInfo, 'name'),
    priceMin: prices && typeof prices === 'object' ? safeBigInt(prices, 'minPrice') : undefined,
    priceMax: prices && typeof prices === 'object' ? safeBigInt(prices, 'maxPrice') : undefined,
  };
}

/**
 * Hook for fetching GMX markets info
 * Primary source: GMX SDK
 * Fallback: REST API
 */
export function useGMXMarketsInfo(): GMXMarketsInfoResult {
  const [markets, setMarkets] = useState<Record<string, MarketInfo>>({});
  const [tokens, setTokens] = useState<Record<string, TokenData>>({});
  const [pricesUpdatedAt, setPricesUpdatedAt] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setError(null);

    try {
      // Try SDK first
      const sdk = getGmxSdk();
      const result = await sdk.markets.getMarketsInfo();
      
      if (result.marketsInfoData) {
        // Convert SDK data to our format using safe accessors
        const marketsMap: Record<string, MarketInfo> = {};
        
        for (const [address, marketInfo] of Object.entries(result.marketsInfoData)) {
          marketsMap[address.toLowerCase()] = convertSdkMarket(address, marketInfo);
        }
        
        setMarkets(marketsMap);
        
        if (result.tokensData) {
          const tokensMap: Record<string, TokenData> = {};
          for (const [address, tokenInfo] of Object.entries(result.tokensData)) {
            tokensMap[address.toLowerCase()] = convertSdkToken(address, tokenInfo);
          }
          setTokens(tokensMap);
        }
        
        if (result.pricesUpdatedAt) {
          setPricesUpdatedAt(result.pricesUpdatedAt);
        }
      }
      
      // Fetch REST data (rates) and APY data in parallel
      try {
        const [restMarkets, apyData] = await Promise.all([
          fetchRESTMarketsInfo().catch(() => [] as RESTMarketInfo[]),
          fetchAPYData().catch(() => ({} as Record<string, APYMarketData>)),
        ]);
        
        setMarkets(prev => {
          const updated = { ...prev };
          
          // Merge REST rate data
          for (const restMarket of restMarkets) {
            const key = restMarket.marketToken.toLowerCase();
            if (updated[key]) {
              updated[key] = {
                ...updated[key],
                fundingRateLong: restMarket.fundingRateLong,
                fundingRateShort: restMarket.fundingRateShort,
                borrowingRateLong: restMarket.borrowingRateLong,
                borrowingRateShort: restMarket.borrowingRateShort,
                netRateLong: restMarket.netRateLong,
                netRateShort: restMarket.netRateShort,
              };
            } else {
              // Add new market from REST if not in SDK
              updated[key] = {
                marketToken: restMarket.marketToken,
                indexToken: restMarket.indexToken,
                longToken: restMarket.longToken,
                shortToken: restMarket.shortToken,
                name: restMarket.name,
                isDisabled: !restMarket.isListed,
                longPoolAmount: BigInt(restMarket.poolAmountLong || '0'),
                shortPoolAmount: BigInt(restMarket.poolAmountShort || '0'),
                poolValueMax: BigInt(0),
                poolValueMin: BigInt(0),
                borrowingFactorLong: BigInt(0),
                borrowingFactorShort: BigInt(0),
                fundingFactor: BigInt(0),
                totalBorrowingFees: BigInt(0),
                fundingRateLong: restMarket.fundingRateLong,
                fundingRateShort: restMarket.fundingRateShort,
                borrowingRateLong: restMarket.borrowingRateLong,
                borrowingRateShort: restMarket.borrowingRateShort,
                netRateLong: restMarket.netRateLong,
                netRateShort: restMarket.netRateShort,
              };
            }
          }
          
          // Merge APY data (key is checksummed address from API - normalize to lowercase)
          // Create lowercase lookup for APY data
          const apyLookup: Record<string, APYMarketData> = {};
          for (const [address, data] of Object.entries(apyData)) {
            apyLookup[address.toLowerCase()] = data;
          }
          
          // Apply APY data to markets
          for (const [marketKey, market] of Object.entries(updated)) {
            const apyForMarket = apyLookup[marketKey];
            if (apyForMarket) {
              updated[marketKey] = {
                ...market,
                apy: apyForMarket.apy,
                baseApy: apyForMarket.baseApy,
                bonusApr: apyForMarket.bonusApr,
              };
            }
          }
          
          return updated;
        });
      } catch (restErr) {
        // REST/APY fallback failed - continue with SDK data only
        if (process.env.NODE_ENV === 'development') {
          console.warn('REST API supplement failed:', restErr);
        }
      }
      
    } catch (err) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Failed to fetch markets'));
      
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to fetch GMX markets info:', err);
      }
      
      // Try REST API as full fallback
      try {
        const [restMarkets, apyData] = await Promise.all([
          fetchRESTMarketsInfo(),
          fetchAPYData().catch(() => ({} as Record<string, APYMarketData>)),
        ]);
        
        const marketsMap: Record<string, MarketInfo> = {};
        
        // Create lowercase lookup for APY data
        const apyLookup: Record<string, APYMarketData> = {};
        for (const [address, data] of Object.entries(apyData)) {
          apyLookup[address.toLowerCase()] = data;
        }
        
        for (const restMarket of restMarkets) {
          const key = restMarket.marketToken.toLowerCase();
          const apy = apyLookup[key];
          
          marketsMap[key] = {
            marketToken: restMarket.marketToken,
            indexToken: restMarket.indexToken,
            longToken: restMarket.longToken,
            shortToken: restMarket.shortToken,
            name: restMarket.name,
            isDisabled: !restMarket.isListed,
            longPoolAmount: BigInt(restMarket.poolAmountLong || '0'),
            shortPoolAmount: BigInt(restMarket.poolAmountShort || '0'),
            poolValueMax: BigInt(0),
            poolValueMin: BigInt(0),
            borrowingFactorLong: BigInt(0),
            borrowingFactorShort: BigInt(0),
            fundingFactor: BigInt(0),
            totalBorrowingFees: BigInt(0),
            fundingRateLong: restMarket.fundingRateLong,
            fundingRateShort: restMarket.fundingRateShort,
            borrowingRateLong: restMarket.borrowingRateLong,
            borrowingRateShort: restMarket.borrowingRateShort,
            netRateLong: restMarket.netRateLong,
            netRateShort: restMarket.netRateShort,
            apy: apy?.apy,
            baseApy: apy?.baseApy,
            bonusApr: apy?.bonusApr,
          };
        }
        
        setMarkets(marketsMap);
        setIsError(false);
        setError(null);
      } catch (fallbackErr) {
        if (process.env.NODE_ENV === 'development') {
          console.error('REST API fallback also failed:', fallbackErr);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(fetchData, GMX_CACHE_CONFIG.refetchInterval);
    return () => clearInterval(interval);
  }, [fetchData]);

  return {
    markets,
    tokens,
    pricesUpdatedAt,
    isLoading,
    isError,
    error,
    refetch: fetchData,
  };
}

/**
 * Get market info by address
 */
export function useGMXMarket(marketAddress: string): MarketInfo | null {
  const { markets } = useGMXMarketsInfo();
  return useMemo(() => {
    return markets[marketAddress.toLowerCase()] || null;
  }, [markets, marketAddress]);
}

/**
 * Get all active (non-disabled) markets
 */
export function useActiveGMXMarkets(): MarketInfo[] {
  const { markets } = useGMXMarketsInfo();
  return useMemo(() => {
    return Object.values(markets).filter(m => !m.isDisabled);
  }, [markets]);
}
