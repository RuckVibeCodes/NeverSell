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
  user?: Address;
  assets?: Address[];
  refetchInterval?: number;
}

interface AssetPosition {
  asset: Address;
  aTokenBalance: number;
  stableDebt: number;
  variableDebt: number;
  totalDebt: number;
  usageAsCollateralEnabled: boolean;
  supplyAPY: number;
  borrowAPY: number;
}

interface UseAavePositionReturn {
  position: AavePosition | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  assetPositions: AssetPosition[];
  isLoadingAssets: boolean;
  isHealthy: boolean;
  isAtRisk: boolean;
  canBorrow: boolean;
}

export function useAavePosition({
  user,
  assets = [],
  refetchInterval = 15000,
}: UseAavePositionParams = {}): UseAavePositionReturn {
  const { address } = useAccount();
  const targetUser = user ?? address;

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
    query: { enabled: !!targetUser, refetchInterval },
  });

  const position = useMemo((): AavePosition | null => {
    if (!accountData) return null;
    const [totalCollateralBase, totalDebtBase, availableBorrowsBase, currentLiquidationThreshold, ltv, healthFactor] = accountData;
    return {
      totalCollateralUSD: parseBaseToUSD(totalCollateralBase),
      totalDebtUSD: parseBaseToUSD(totalDebtBase),
      availableBorrowsUSD: parseBaseToUSD(availableBorrowsBase),
      healthFactor: parseHealthFactor(healthFactor),
      ltv: parsePercentage(ltv),
      liquidationThreshold: parsePercentage(currentLiquidationThreshold),
      raw: { totalCollateralBase, totalDebtBase, availableBorrowsBase, currentLiquidationThreshold, ltv, healthFactor },
    };
  }, [accountData]);

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
    query: { enabled: assetContracts.length > 0, refetchInterval },
  });

  const assetPositions = useMemo((): AssetPosition[] => {
    if (!assetDataResults || assets.length === 0) return [];
    return assets.map((asset, index) => {
      const result = assetDataResults[index];
      if (!result || result.status !== "success" || !result.result) {
        return { asset, aTokenBalance: 0, stableDebt: 0, variableDebt: 0, totalDebt: 0, usageAsCollateralEnabled: false, supplyAPY: 0, borrowAPY: 0 };
      }
      const data = result.result as readonly [bigint, bigint, bigint, bigint, bigint, bigint, bigint, number, boolean];
      const [currentATokenBalance, currentStableDebt, currentVariableDebt, , , , liquidityRate, , usageAsCollateralEnabled] = data;
      const decimals = ASSET_DECIMALS[asset] ?? 18;
      return {
        asset,
        aTokenBalance: formatTokenAmount(currentATokenBalance, decimals),
        stableDebt: formatTokenAmount(currentStableDebt, decimals),
        variableDebt: formatTokenAmount(currentVariableDebt, decimals),
        totalDebt: formatTokenAmount(currentStableDebt + currentVariableDebt, decimals),
        usageAsCollateralEnabled,
        supplyAPY: Number(liquidityRate) / 1e27 * 100,
        borrowAPY: 0,
      };
    });
  }, [assetDataResults, assets]);

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
