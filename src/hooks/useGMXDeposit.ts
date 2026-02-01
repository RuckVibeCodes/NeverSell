// Hook for depositing tokens into GMX GM pools
// Mints GM tokens in exchange for long/short tokens

'use client';

import { useCallback, useMemo, useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { encodeFunctionData } from 'viem';
import type { Address } from 'viem';
import {
  GMX_CONTRACTS,
  GM_POOLS,
  EXCHANGE_ROUTER_ABI,
  ERC20_ABI,
  DEFAULT_EXECUTION_FEE,
  DEFAULT_CALLBACK_GAS_LIMIT,
  ZERO_ADDRESS,
  type GMPoolName,
  type DepositParams,
  calculateMinOutput,
} from '@/lib/gmx';

export interface UseGMXDepositParams {
  poolName: GMPoolName;
  longTokenAmount?: bigint;
  shortTokenAmount?: bigint;
  slippageBps?: number; // Basis points (100 = 1%)
}

export interface UseGMXDepositResult {
  deposit: () => Promise<void>;
  approveToken: (token: Address, amount: bigint) => Promise<void>;
  isApproving: boolean;
  isDepositing: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  error: Error | null;
  depositHash: `0x${string}` | undefined;
  reset: () => void;
}

export function useGMXDeposit({
  poolName,
  longTokenAmount = BigInt(0),
  shortTokenAmount = BigInt(0),
  slippageBps = 100, // 1% default slippage
}: UseGMXDepositParams): UseGMXDepositResult {
  const { address } = useAccount();
  
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const pool = useMemo(() => GM_POOLS[poolName], [poolName]);

  // Write contract for token approvals
  const {
    writeContract: writeApprove,
    isPending: isApproveWritePending,
  } = useWriteContract();

  // Write contract for deposit
  const {
    data: depositHash,
    writeContract: writeDeposit,
    isPending: isDepositWritePending,
    reset: resetDeposit,
  } = useWriteContract();

  // Wait for deposit transaction
  const {
    isLoading: isConfirming,
    isSuccess,
  } = useWaitForTransactionReceipt({
    hash: depositHash,
  });

  // Approve token for Router spending
  const approveToken = useCallback(async (token: Address, amount: bigint) => {
    if (!address) {
      setError(new Error('Wallet not connected'));
      return;
    }

    setIsApproving(true);
    setError(null);

    try {
      writeApprove({
        address: token,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [GMX_CONTRACTS.router, amount],
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Approval failed'));
    } finally {
      setIsApproving(false);
    }
  }, [address, writeApprove]);

  // Create deposit
  const deposit = useCallback(async () => {
    if (!address) {
      setError(new Error('Wallet not connected'));
      return;
    }

    if (longTokenAmount === BigInt(0) && shortTokenAmount === BigInt(0)) {
      setError(new Error('Must deposit at least one token'));
      return;
    }

    setError(null);

    try {
      // Calculate minimum GM tokens to receive (with slippage)
      // For simplicity, we use 0 here - in production, calculate based on price
      const minMarketTokens = BigInt(0);

      const depositParams: DepositParams = {
        receiver: address,
        callbackContract: ZERO_ADDRESS,
        uiFeeReceiver: ZERO_ADDRESS,
        market: pool.marketToken,
        initialLongToken: pool.longToken,
        initialShortToken: pool.shortToken,
        longTokenSwapPath: [],
        shortTokenSwapPath: [],
        minMarketTokens: calculateMinOutput(minMarketTokens, slippageBps),
        shouldUnwrapNativeToken: false,
        executionFee: DEFAULT_EXECUTION_FEE,
        callbackGasLimit: DEFAULT_CALLBACK_GAS_LIMIT,
      };

      // Build multicall data
      const calls: `0x${string}`[] = [];

      // Send ETH for execution fee
      calls.push(
        encodeFunctionData({
          abi: EXCHANGE_ROUTER_ABI,
          functionName: 'sendWnt',
          args: [],
        })
      );

      // Send long tokens if any
      if (longTokenAmount > BigInt(0)) {
        calls.push(
          encodeFunctionData({
            abi: EXCHANGE_ROUTER_ABI,
            functionName: 'sendTokens',
            args: [[pool.longToken]],
          })
        );
      }

      // Send short tokens if any
      if (shortTokenAmount > BigInt(0)) {
        calls.push(
          encodeFunctionData({
            abi: EXCHANGE_ROUTER_ABI,
            functionName: 'sendTokens',
            args: [[pool.shortToken]],
          })
        );
      }

      // Create deposit
      calls.push(
        encodeFunctionData({
          abi: EXCHANGE_ROUTER_ABI,
          functionName: 'createDeposit',
          args: [depositParams],
        })
      );

      // Execute multicall
      writeDeposit({
        address: GMX_CONTRACTS.exchangeRouter,
        abi: EXCHANGE_ROUTER_ABI,
        functionName: 'multicall',
        args: [calls],
        value: DEFAULT_EXECUTION_FEE,
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Deposit failed'));
    }
  }, [address, pool, longTokenAmount, shortTokenAmount, slippageBps, writeDeposit]);

  const reset = useCallback(() => {
    setError(null);
    resetDeposit();
  }, [resetDeposit]);

  return {
    deposit,
    approveToken,
    isApproving: isApproving || isApproveWritePending,
    isDepositing: isDepositWritePending,
    isConfirming,
    isSuccess,
    error,
    depositHash,
    reset,
  };
}
