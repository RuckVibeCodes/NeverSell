// Hook for getting user's GMX GM pool position
// Fetches GM token balance and estimated USD value

'use client';

import { useMemo } from 'react';
import { useReadContract, useReadContracts, useAccount } from 'wagmi';
import { type Address, formatUnits } from 'viem';
import {
  GMX_CONTRACTS,
  GM_POOLS,
  ERC20_ABI,
  READER_ABI,
  type GMPoolName,
  formatGMAmount,
} from '@/lib/gmx';

export interface GMPosition {
  poolName: GMPoolName;
  marketToken: Address;
  balance: bigint;
  balanceFormatted: string;
  estimatedValueUsd: number;
  shareOfPool: number; // Percentage
}

export interface UseGMXPositionParams {
  poolName?: GMPoolName; // If not provided, fetches all pools
}

export interface UseGMXPositionResult {
  positions: GMPosition[];
  totalValueUsd: number;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

// Single pool position hook
export function useGMXPoolPosition(poolName: GMPoolName): GMPosition | null {
  const { address } = useAccount();
  const pool = GM_POOLS[poolName];

  // Get user's GM token balance
  const { data: balance } = useReadContract({
    address: pool.marketToken,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Get total supply for share calculation
  const { data: totalSupply } = useReadContract({
    address: pool.marketToken,
    abi: ERC20_ABI,
    functionName: 'totalSupply',
  });

  return useMemo(() => {
    if (!balance || balance === BigInt(0)) {
      return null;
    }

    const balanceNum = Number(formatUnits(balance, 18));
    const totalSupplyNum = totalSupply ? Number(formatUnits(totalSupply, 18)) : 0;
    const shareOfPool = totalSupplyNum > 0 ? (balanceNum / totalSupplyNum) * 100 : 0;

    // Estimate USD value (in production, use Reader.getMarketTokenPrice)
    // For now, use a placeholder calculation
    const estimatedValueUsd = balanceNum * 1; // Placeholder: 1 GM ≈ $1

    return {
      poolName,
      marketToken: pool.marketToken,
      balance,
      balanceFormatted: formatGMAmount(balance),
      estimatedValueUsd,
      shareOfPool,
    };
  }, [poolName, pool.marketToken, balance, totalSupply]);
}

// All positions hook
export function useGMXPosition({ poolName }: UseGMXPositionParams = {}): UseGMXPositionResult {
  const { address } = useAccount();

  // If specific pool requested, only fetch that one
  const poolsToFetch = poolName 
    ? { [poolName]: GM_POOLS[poolName] }
    : GM_POOLS;

  const poolNames = Object.keys(poolsToFetch) as GMPoolName[];

  // Build contract calls for all pool balances
  const balanceContracts = poolNames.map((name) => ({
    address: GM_POOLS[name].marketToken,
    abi: ERC20_ABI,
    functionName: 'balanceOf' as const,
    args: address ? [address] : undefined,
  }));

  const totalSupplyContracts = poolNames.map((name) => ({
    address: GM_POOLS[name].marketToken,
    abi: ERC20_ABI,
    functionName: 'totalSupply' as const,
  }));

  // Fetch all balances
  const {
    data: balancesData,
    isLoading: isBalancesLoading,
    isError: isBalancesError,
    refetch: refetchBalances,
  } = useReadContracts({
    contracts: balanceContracts,
    query: {
      enabled: !!address,
    },
  });

  // Fetch all total supplies
  const {
    data: totalSuppliesData,
    isLoading: isTotalSuppliesLoading,
    isError: isTotalSuppliesError,
    refetch: refetchTotalSupplies,
  } = useReadContracts({
    contracts: totalSupplyContracts,
  });

  const positions = useMemo(() => {
    if (!balancesData) return [];

    const result: GMPosition[] = [];

    for (let i = 0; i < poolNames.length; i++) {
      const poolName = poolNames[i];
      const balanceResult = balancesData[i];
      const totalSupplyResult = totalSuppliesData?.[i];

      if (balanceResult.status !== 'success' || !balanceResult.result) {
        continue;
      }

      const balance = balanceResult.result as bigint;
      if (balance === BigInt(0)) {
        continue;
      }

      const totalSupply = totalSupplyResult?.status === 'success' 
        ? (totalSupplyResult.result as bigint)
        : BigInt(0);

      const balanceNum = Number(formatUnits(balance, 18));
      const totalSupplyNum = totalSupply ? Number(formatUnits(totalSupply, 18)) : 0;
      const shareOfPool = totalSupplyNum > 0 ? (balanceNum / totalSupplyNum) * 100 : 0;

      // Estimate USD value (placeholder)
      const estimatedValueUsd = balanceNum * 1;

      result.push({
        poolName,
        marketToken: GM_POOLS[poolName].marketToken,
        balance,
        balanceFormatted: formatGMAmount(balance),
        estimatedValueUsd,
        shareOfPool,
      });
    }

    return result;
  }, [balancesData, totalSuppliesData, poolNames]);

  const totalValueUsd = useMemo(() => {
    return positions.reduce((sum, pos) => sum + pos.estimatedValueUsd, 0);
  }, [positions]);

  const refetch = () => {
    refetchBalances();
    refetchTotalSupplies();
  };

  return {
    positions,
    totalValueUsd,
    isLoading: isBalancesLoading || isTotalSuppliesLoading,
    isError: isBalancesError || isTotalSuppliesError,
    refetch,
  };
}

// Hook for detailed position with USD value from on-chain
export function useGMXPositionWithValue(poolName: GMPoolName) {
  const { address } = useAccount();
  const pool = GM_POOLS[poolName];

  // Get user's GM token balance
  const { data: balance } = useReadContract({
    address: pool.marketToken,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Get market info from Reader
  const { data: marketData } = useReadContract({
    address: GMX_CONTRACTS.reader,
    abi: READER_ABI,
    functionName: 'getMarket',
    args: [GMX_CONTRACTS.dataStore, pool.marketToken],
  });

  return {
    balance: balance ?? BigInt(0),
    balanceFormatted: balance ? formatGMAmount(balance) : '0',
    marketData,
  };
}
