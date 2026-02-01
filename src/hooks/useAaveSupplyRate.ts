"use client";

import { useMemo } from "react";
import { useReadContracts } from "wagmi";
import { type Address } from "viem";
import { AAVE_V3_ADDRESSES, POOL_DATA_PROVIDER_ABI } from "@/lib/aave";

/**
 * Fallback Aave supply APY values (as percentages)
 * Updated: 2026-02-01
 * Source: Aave V3 Arbitrum UI
 */
export const FALLBACK_AAVE_SUPPLY_APY: Record<string, number> = {
  WBTC: 0.1,   // ~0.1%
  ETH: 2.0,    // ~2%
  USDC: 4.5,   // ~4.5%
  ARB: 1.0,    // ~1%
};

// Map symbol to Aave asset address
const SYMBOL_TO_ADDRESS: Record<string, Address> = {
  WBTC: AAVE_V3_ADDRESSES.WBTC,
  ETH: AAVE_V3_ADDRESSES.WETH,
  USDC: AAVE_V3_ADDRESSES.USDC,
  ARB: AAVE_V3_ADDRESSES.ARB,
};

interface UseAaveSupplyRatesReturn {
  supplyRates: Record<string, number>; // APY as percentage (e.g., 4.5 for 4.5%)
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch the current supply (liquidity) rates for multiple assets from Aave V3
 * Returns supply APY as percentages for WBTC, ETH, USDC, ARB
 */
export function useAaveSupplyRates(
  refetchInterval = 60000 // 1 minute default
): UseAaveSupplyRatesReturn {
  const symbols = Object.keys(SYMBOL_TO_ADDRESS);
  
  const contracts = symbols.map((symbol) => ({
    address: AAVE_V3_ADDRESSES.POOL_DATA_PROVIDER,
    abi: POOL_DATA_PROVIDER_ABI,
    functionName: "getReserveData" as const,
    args: [SYMBOL_TO_ADDRESS[symbol]] as const,
  }));

  const {
    data: results,
    isLoading,
    error,
  } = useReadContracts({
    contracts,
    query: { refetchInterval },
  });

  const supplyRates = useMemo(() => {
    const rates: Record<string, number> = {};
    
    symbols.forEach((symbol, index) => {
      if (results && results[index]?.status === "success" && results[index].result) {
        // liquidityRate is at index 5, rate is in RAY (1e27)
        const rawRate = results[index].result[5] as bigint;
        const rateAsPercentage = Number(rawRate) / 1e27 * 100;
        rates[symbol] = Math.round(rateAsPercentage * 100) / 100; // Round to 2 decimals
      } else {
        // Use fallback value
        rates[symbol] = FALLBACK_AAVE_SUPPLY_APY[symbol] ?? 0;
      }
    });
    
    return rates;
  }, [results, symbols]);

  return {
    supplyRates,
    isLoading,
    error: error as Error | null,
  };
}

/**
 * Hook to fetch the supply rate for a single asset
 */
export function useAaveSupplyRate(symbol: string): {
  supplyRate: number;
  isLoading: boolean;
  error: Error | null;
} {
  const { supplyRates, isLoading, error } = useAaveSupplyRates();
  
  return {
    supplyRate: supplyRates[symbol] ?? FALLBACK_AAVE_SUPPLY_APY[symbol] ?? 0,
    isLoading,
    error,
  };
}
