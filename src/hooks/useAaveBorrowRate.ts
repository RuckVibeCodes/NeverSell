"use client";

import { useMemo } from "react";
import { useReadContract } from "wagmi";
import { type Address } from "viem";
import { AAVE_V3_ADDRESSES, POOL_DATA_PROVIDER_ABI } from "@/lib/aave";

interface UseAaveBorrowRateParams {
  asset?: Address;
  refetchInterval?: number;
}

interface UseAaveBorrowRateReturn {
  variableBorrowRate: number | null; // APR as percentage (e.g., 5.2 for 5.2%)
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch the current variable borrow rate for an asset from Aave V3
 */
export function useAaveBorrowRate({
  asset = AAVE_V3_ADDRESSES.USDC,
  refetchInterval = 30000, // 30 seconds default
}: UseAaveBorrowRateParams = {}): UseAaveBorrowRateReturn {
  const {
    data: reserveData,
    isLoading,
    error,
  } = useReadContract({
    address: AAVE_V3_ADDRESSES.POOL_DATA_PROVIDER,
    abi: POOL_DATA_PROVIDER_ABI,
    functionName: "getReserveData",
    args: [asset],
    query: { refetchInterval },
  });

  const variableBorrowRate = useMemo(() => {
    if (!reserveData) return null;
    
    // reserveData is a tuple, variableBorrowRate is at index 6
    // Rate is in RAY (1e27), convert to percentage
    const rawRate = reserveData[6] as bigint;
    const rateAsPercentage = Number(rawRate) / 1e27 * 100;
    
    return rateAsPercentage;
  }, [reserveData]);

  return {
    variableBorrowRate,
    isLoading,
    error: error as Error | null,
  };
}
