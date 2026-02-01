// Hook for fetching GMX markets info using the official SDK
// Provides real-time pool data, APYs, and token prices

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getGmxSdk } from '@/lib/gmxSdk';
import { GMX_CACHE_CONFIG, GMX_REST_API } from '@/lib/gmxConfig';

// Types from SDK (re-exported for convenience)
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
  // Rates from REST API
  fundingRateLong?: string;
  fundingRateShort?: string;
  borrowingRateLong?: string;
  borrowingRateShort?: string;
  netRateLong?: string;
  netRateShort?: string;
}

export interface TokenData {
  address: string;
  symbol: string;
  decimals: number;
  name: string;
  price?: bigint;
  priceMin?: bigint;
  priceMax?: bigint;
}

export interface GMXMarketsInfoResult {
  markets: Record<string, MarketInfo>;
  tokens: Record<string, TokenData>;
  prices: Record<string, { min: bigint; max: bigint }>;
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

/**
 * Fetch markets data from GMX REST API as fallback/supplement
 */
async function fetchRESTMarketsInfo(): Promise<RESTMarketInfo[]> {
  const response = await fetch(GMX_REST_API.marketsInfo, {
    cache: 'no-cache',
  });
  
  if (!response.ok) {
    throw new Error(`REST API error: ${response.status}`);
  }
  
  const data: RESTMarketsResponse = await response.json();
  return data.markets || [];
}

/**
 * Hook for fetching GMX markets info
 * Primary source: GMX SDK
 * Fallback: REST API
 */
export function useGMXMarketsInfo(): GMXMarketsInfoResult {
  const [markets, setMarkets] = useState<Record<string, MarketInfo>>({});
  const [tokens, setTokens] = useState<Record<string, TokenData>>({});
  const [prices] = useState<Record<string, { min: bigint; max: bigint }>>({});
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
        // Convert SDK data to our format
        const marketsMap: Record<string, MarketInfo> = {};
        
        for (const [address, marketInfo] of Object.entries(result.marketsInfoData)) {
          marketsMap[address.toLowerCase()] = {
            marketToken: address,
            indexToken: (marketInfo as { indexToken: { address: string } }).indexToken?.address || '',
            longToken: (marketInfo as { longToken: { address: string } }).longToken?.address || '',
            shortToken: (marketInfo as { shortToken: { address: string } }).shortToken?.address || '',
            name: (marketInfo as { name: string }).name || '',
            isDisabled: (marketInfo as { isDisabled: boolean }).isDisabled || false,
            longPoolAmount: (marketInfo as { longPoolAmount: bigint }).longPoolAmount || BigInt(0),
            shortPoolAmount: (marketInfo as { shortPoolAmount: bigint }).shortPoolAmount || BigInt(0),
            poolValueMax: (marketInfo as { poolValueMax: bigint }).poolValueMax || BigInt(0),
            poolValueMin: (marketInfo as { poolValueMin: bigint }).poolValueMin || BigInt(0),
            borrowingFactorLong: (marketInfo as { borrowingFactorLong: bigint }).borrowingFactorLong || BigInt(0),
            borrowingFactorShort: (marketInfo as { borrowingFactorShort: bigint }).borrowingFactorShort || BigInt(0),
            fundingFactor: (marketInfo as { fundingFactor: bigint }).fundingFactor || BigInt(0),
            totalBorrowingFees: (marketInfo as { totalBorrowingFees: bigint }).totalBorrowingFees || BigInt(0),
          };
        }
        
        setMarkets(marketsMap);
        
        if (result.tokensData) {
          const tokensMap: Record<string, TokenData> = {};
          for (const [address, tokenInfo] of Object.entries(result.tokensData)) {
            tokensMap[address.toLowerCase()] = {
              address,
              symbol: (tokenInfo as { symbol: string }).symbol || '',
              decimals: (tokenInfo as { decimals: number }).decimals || 18,
              name: (tokenInfo as { name: string }).name || '',
              price: (tokenInfo as { prices?: { minPrice: bigint } }).prices?.minPrice,
              priceMin: (tokenInfo as { prices?: { minPrice: bigint } }).prices?.minPrice,
              priceMax: (tokenInfo as { prices?: { maxPrice: bigint } }).prices?.maxPrice,
            };
          }
          setTokens(tokensMap);
        }
        
        if (result.pricesUpdatedAt) {
          setPricesUpdatedAt(result.pricesUpdatedAt);
        }
      }
      
      // Also fetch REST data for funding/borrowing rates (not in SDK)
      try {
        const restMarkets = await fetchRESTMarketsInfo();
        setMarkets(prev => {
          const updated = { ...prev };
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
          return updated;
        });
      } catch (restErr) {
        console.warn('REST API fallback failed:', restErr);
        // Continue with SDK data only
      }
      
    } catch (err) {
      console.error('Failed to fetch GMX markets info:', err);
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Failed to fetch markets'));
      
      // Try REST API as full fallback
      try {
        const restMarkets = await fetchRESTMarketsInfo();
        const marketsMap: Record<string, MarketInfo> = {};
        
        for (const restMarket of restMarkets) {
          const key = restMarket.marketToken.toLowerCase();
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
          };
        }
        
        setMarkets(marketsMap);
        setIsError(false);
        setError(null);
      } catch (fallbackErr) {
        console.error('REST API fallback also failed:', fallbackErr);
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
    prices,
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
