"use client";

import { useMemo } from "react";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { type Address } from "viem";
import {
  AAVE_V3_ADDRESSES,
  AAVE_POOL_ABI,
  POOL_DATA_PROVIDER_ABI,
  parseHealthFactor,
  parseBaseToUSD,
  parsePercentage,
  formatTokenAmount,
  ASSET_DECIMALS,
  type AavePosition,
} from "@/lib/aave";

interface UseAavePositionParams {
  /** User address to query (default: connected wallet) */
  user?: Address;
  /** Specific assets to get reserve data for */
  assets?: Address[];
  /** Polling interval in ms (default: 15000) */
  refetchInterval?: number;
}

interface AssetPosition {
  asset: Address;
  aTokenBalance: number;
  stableDebt: number;
  variableDebt: number;
  totalDebt: number;
  usageAsCollateralEnabled: boolean;
  supplyAPY: number; // liquidityRate as APY
  borrowAPY: number; // variableBorrowRate as APY (approximation)
}

interface UseAavePositionReturn {
  // Overall account data
  position: AavePosition | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  
  // Per-asset positions (if assets provided)
  assetPositions: AssetPosition[];
  isLoadingAssets: boolean;
  
  // Convenience getters
  isHealthy: boolean;
  isAtRisk: boolean; // Health factor < 1.5
  canBorrow: boolean;
}

/**
 * Hook for fetching a user's Aave V3 position data
 * 
 * @example
 * ```tsx
 * const { position, isHealthy, canBorrow } = useAavePosition();
 * 
 * if (position) {
 *   console.log(`Health Factor: ${position.healthFactor}`);
 *   console.log(`Available to Borrow: $${position.availableBorrowsUSD}`);
 * }
 * 
 * // Get per-asset breakdown
 * const { assetPositions } = useAavePosition({
 *   assets: [AAVE_V3_ADDRESSES.WETH, AAVE_V3_ADDRESSES.WBTC],
 * });
 * ```
 */
export function useAavePosition({
  user,
  assets = [],
  refetchInterval = 15000,
}: UseAavePositionParams = {}): UseAavePositionReturn {
  const { address } = useAccount();
  const targetUser = user ?? address;

  // Fetch main account data
  const {
    data: accountData,
    isLoading,
    error,
    refetch,
  } = useReadContract({
    address: AAVE_V3_ADDRESSES.POOL,
    abi: AAVE_POOL_ABI,
    functionName: "getUserAccountData",
    args: targetUser ? [targetUser] : undefined,
    query: {
      enabled: !!targetUser,
      refetchInterval,
    },
  });

  // Parse account data into friendly format
  const position = useMemo((): AavePosition | null => {
    if (!accountData) return null;

    const [
      totalCollateralBase,
      totalDebtBase,
      availableBorrowsBase,
      currentLiquidationThreshold,
      ltv,
      healthFactor,
    ] = accountData;

    return {
      totalCollateralUSD: parseBaseToUSD(totalCollateralBase),
      totalDebtUSD: parseBaseToUSD(totalDebtBase),
      availableBorrowsUSD: parseBaseToUSD(availableBorrowsBase),
      healthFactor: parseHealthFactor(healthFactor),
      ltv: parsePercentage(ltv),
      liquidationThreshold: parsePercentage(currentLiquidationThreshold),
      raw: {
        totalCollateralBase,
        totalDebtBase,
        availableBorrowsBase,
        currentLiquidationThreshold,
        ltv,
        healthFactor,
      },
    };
  }, [accountData]);

  // Fetch per-asset data if assets provided
  const assetContracts = useMemo(() => {
    if (!targetUser || assets.length === 0) return [];
    
    return assets.map((asset) => ({
      address: AAVE_V3_ADDRESSES.POOL_DATA_PROVIDER,
      abi: POOL_DATA_PROVIDER_ABI,
      functionName: "getUserReserveData" as const,
      args: [asset, targetUser] as const,
    }));
  }, [targetUser, assets]);

  const {
    data: assetDataResults,
    isLoading: isLoadingAssets,
  } = useReadContracts({
    contracts: assetContracts,
    query: {
      enabled: assetContracts.length > 0,
      refetchInterval,
    },
  });

  // Parse per-asset positions
  const assetPositions = useMemo((): AssetPosition[] => {
    if (!assetDataResults || assets.length === 0) return [];

    return assets.map((asset, index) => {
      const result = assetDataResults[index];
      
      if (!result || result.status !== "success" || !result.result) {
        return {
          asset,
          aTokenBalance: 0,
          stableDebt: 0,
          variableDebt: 0,
          totalDebt: 0,
          usageAsCollateralEnabled: false,
          supplyAPY: 0,
          borrowAPY: 0,
        };
      }

      const data = result.result as readonly [bigint, bigint, bigint, bigint, bigint, bigint, bigint, number, boolean];
      const [
        currentATokenBalance,
        currentStableDebt,
        currentVariableDebt,
        , // principalStableDebt
        , // scaledVariableDebt
        , // stableBorrowRate
        liquidityRate,
        , // stableRateLastUpdated
        usageAsCollateralEnabled,
      ] = data;

      const decimals = ASSET_DECIMALS[asset] ?? 18;

      // Convert ray (27 decimals) rate to APY percentage
      // APY ≈ rate / 1e27 * 100
      const supplyAPY = Number(liquidityRate) / 1e27 * 100;

      return {
        asset,
        aTokenBalance: formatTokenAmount(currentATokenBalance, decimals),
        stableDebt: formatTokenAmount(currentStableDebt, decimals),
        variableDebt: formatTokenAmount(currentVariableDebt, decimals),
        totalDebt: formatTokenAmount(currentStableDebt + currentVariableDebt, decimals),
        usageAsCollateralEnabled,
        supplyAPY,
        borrowAPY: 0, // Would need separate call to get this
      };
    });
  }, [assetDataResults, assets]);

  // Convenience flags
  const isHealthy = position ? position.healthFactor > 1 : true;
  const isAtRisk = position ? position.healthFactor < 1.5 && position.healthFactor !== Infinity : false;
  const canBorrow = position ? position.availableBorrowsUSD > 0 : false;

  return {
    position,
    isLoading,
    error: error as Error | null,
    refetch,
    assetPositions,
    isLoadingAssets,
    isHealthy,
    isAtRisk,
    canBorrow,
  };
}
