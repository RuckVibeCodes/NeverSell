// Hook for withdrawing from GMX GM pools
// Burns GM tokens in exchange for long/short tokens

'use client';

import { useCallback, useMemo, useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { encodeFunctionData } from 'viem';
import {
  GMX_CONTRACTS,
  GM_POOLS,
  EXCHANGE_ROUTER_ABI,
  ERC20_ABI,
  DEFAULT_EXECUTION_FEE,
  DEFAULT_CALLBACK_GAS_LIMIT,
  ZERO_ADDRESS,
  type GMPoolName,
  type WithdrawalParams,
  calculateMinOutput,
} from '@/lib/gmx';

export interface UseGMXWithdrawParams {
  poolName: GMPoolName;
  marketTokenAmount: bigint;
  slippageBps?: number; // Basis points (100 = 1%)
  preferLongToken?: boolean; // If true, prefer receiving long token
}

export interface UseGMXWithdrawResult {
  withdraw: () => Promise<void>;
  approveGMToken: (amount: bigint) => Promise<void>;
  isApproving: boolean;
  isWithdrawing: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  error: Error | null;
  withdrawHash: `0x${string}` | undefined;
  reset: () => void;
}

export function useGMXWithdraw({
  poolName,
  marketTokenAmount,
  slippageBps = 100, // 1% default slippage
}: UseGMXWithdrawParams): UseGMXWithdrawResult {
  const { address } = useAccount();
  
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const pool = useMemo(() => GM_POOLS[poolName], [poolName]);

  // Write contract for GM token approval
  const {
    writeContract: writeApprove,
    isPending: isApproveWritePending,
  } = useWriteContract();

  // Write contract for withdrawal
  const {
    data: withdrawHash,
    writeContract: writeWithdraw,
    isPending: isWithdrawWritePending,
    reset: resetWithdraw,
  } = useWriteContract();

  // Wait for withdrawal transaction
  const {
    isLoading: isConfirming,
    isSuccess,
  } = useWaitForTransactionReceipt({
    hash: withdrawHash,
  });

  // Approve GM token for Router spending
  const approveGMToken = useCallback(async (amount: bigint) => {
    if (!address) {
      setError(new Error('Wallet not connected'));
      return;
    }

    setIsApproving(true);
    setError(null);

    try {
      writeApprove({
        address: pool.marketToken,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [GMX_CONTRACTS.router, amount],
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Approval failed'));
    } finally {
      setIsApproving(false);
    }
  }, [address, pool.marketToken, writeApprove]);

  // Create withdrawal
  const withdraw = useCallback(async () => {
    if (!address) {
      setError(new Error('Wallet not connected'));
      return;
    }

    if (marketTokenAmount === BigInt(0)) {
      setError(new Error('Must specify amount to withdraw'));
      return;
    }

    setError(null);

    try {
      // Calculate minimum tokens to receive (with slippage)
      // In production, calculate based on current pool value
      const minLongTokenAmount = BigInt(0);
      const minShortTokenAmount = BigInt(0);

      const withdrawParams: WithdrawalParams = {
        receiver: address,
        callbackContract: ZERO_ADDRESS,
        uiFeeReceiver: ZERO_ADDRESS,
        market: pool.marketToken,
        longTokenSwapPath: [],
        shortTokenSwapPath: [],
        minLongTokenAmount: calculateMinOutput(minLongTokenAmount, slippageBps),
        minShortTokenAmount: calculateMinOutput(minShortTokenAmount, slippageBps),
        shouldUnwrapNativeToken: false, // Keep as wrapped token
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

      // Send GM tokens to vault
      calls.push(
        encodeFunctionData({
          abi: EXCHANGE_ROUTER_ABI,
          functionName: 'sendTokens',
          args: [[pool.marketToken]],
        })
      );

      // Create withdrawal
      calls.push(
        encodeFunctionData({
          abi: EXCHANGE_ROUTER_ABI,
          functionName: 'createWithdrawal',
          args: [withdrawParams],
        })
      );

      // Execute multicall
      writeWithdraw({
        address: GMX_CONTRACTS.exchangeRouter,
        abi: EXCHANGE_ROUTER_ABI,
        functionName: 'multicall',
        args: [calls],
        value: DEFAULT_EXECUTION_FEE,
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Withdrawal failed'));
    }
  }, [address, pool, marketTokenAmount, slippageBps, writeWithdraw]);

  const reset = useCallback(() => {
    setError(null);
    resetWithdraw();
  }, [resetWithdraw]);

  return {
    withdraw,
    approveGMToken,
    isApproving: isApproving || isApproveWritePending,
    isWithdrawing: isWithdrawWritePending,
    isConfirming,
    isSuccess,
    error,
    withdrawHash,
    reset,
  };
}
