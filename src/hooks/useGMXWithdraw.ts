// Hook for withdrawing from GMX GM pools
// Burns GM tokens in exchange for long/short tokens

'use client';

import { useCallback, useMemo, useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useReadContract } from 'wagmi';
import { encodeFunctionData, maxUint256 } from 'viem';
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
  onApprovalSuccess?: () => void;
  onWithdrawSuccess?: (hash: string) => void;
}

export interface UseGMXWithdrawResult {
  // Allowance checking
  needsApproval: boolean;
  isCheckingAllowance: boolean;
  refetchAllowance: () => void;
  
  // Approval
  approve: () => void;
  isApproving: boolean;
  isApprovalPending: boolean;
  isApprovalSuccess: boolean;
  approvalError: Error | null;
  approvalHash: `0x${string}` | undefined;
  
  // Withdrawal
  withdraw: () => void;
  isWithdrawing: boolean;
  isWithdrawPending: boolean;
  isWithdrawSuccess: boolean;
  withdrawError: Error | null;
  withdrawHash: `0x${string}` | undefined;
  
  // General
  isPending: boolean;
  reset: () => void;
}

export function useGMXWithdraw({
  poolName,
  marketTokenAmount,
  slippageBps = 100, // 1% default slippage
  onApprovalSuccess,
  onWithdrawSuccess,
}: UseGMXWithdrawParams): UseGMXWithdrawResult {
  const { address } = useAccount();
  const [localError, setLocalError] = useState<Error | null>(null);

  const pool = useMemo(() => GM_POOLS[poolName], [poolName]);

  // Check GM token allowance
  const { 
    data: allowance, 
    isLoading: isCheckingAllowance,
    refetch: refetchAllowance,
  } = useReadContract({
    address: pool.marketToken,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, GMX_CONTRACTS.router] : undefined,
    query: { enabled: !!address && marketTokenAmount > BigInt(0) },
  });

  const needsApproval = useMemo(() => {
    if (marketTokenAmount === BigInt(0)) return false;
    if (!allowance) return true;
    return allowance < marketTokenAmount;
  }, [allowance, marketTokenAmount]);

  // Approval transaction
  const {
    writeContract: writeApprove,
    data: approvalHash,
    isPending: isApproving,
    error: approvalWriteError,
    reset: resetApproval,
  } = useWriteContract();

  const { 
    isLoading: isApprovalPending,
    isSuccess: isApprovalSuccess,
    error: approvalReceiptError,
  } = useWaitForTransactionReceipt({ hash: approvalHash });

  // Refetch allowance when approval succeeds
  useEffect(() => {
    if (isApprovalSuccess) {
      refetchAllowance();
      onApprovalSuccess?.();
    }
  }, [isApprovalSuccess, refetchAllowance, onApprovalSuccess]);

  const approve = useCallback(() => {
    if (!address) return;
    writeApprove({
      address: pool.marketToken,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [GMX_CONTRACTS.router, maxUint256],
    });
  }, [address, pool.marketToken, writeApprove]);

  // Withdrawal transaction
  const {
    data: withdrawHash,
    writeContract: writeWithdraw,
    isPending: isWithdrawing,
    error: withdrawWriteError,
    reset: resetWithdraw,
  } = useWriteContract();

  const {
    isLoading: isWithdrawPending,
    isSuccess: isWithdrawSuccess,
    error: withdrawReceiptError,
  } = useWaitForTransactionReceipt({ hash: withdrawHash });

  // Call onWithdrawSuccess callback
  useEffect(() => {
    if (isWithdrawSuccess && withdrawHash) {
      onWithdrawSuccess?.(withdrawHash);
    }
  }, [isWithdrawSuccess, withdrawHash, onWithdrawSuccess]);

  const withdraw = useCallback(() => {
    if (!address) {
      setLocalError(new Error('Wallet not connected'));
      return;
    }

    if (marketTokenAmount === BigInt(0)) {
      setLocalError(new Error('Must specify amount to withdraw'));
      return;
    }

    setLocalError(null);

    try {
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
        shouldUnwrapNativeToken: false,
        executionFee: DEFAULT_EXECUTION_FEE,
        callbackGasLimit: DEFAULT_CALLBACK_GAS_LIMIT,
      };

      const calls: `0x${string}`[] = [];

      calls.push(
        encodeFunctionData({
          abi: EXCHANGE_ROUTER_ABI,
          functionName: 'sendWnt',
          args: [],
        })
      );

      calls.push(
        encodeFunctionData({
          abi: EXCHANGE_ROUTER_ABI,
          functionName: 'sendTokens',
          args: [[pool.marketToken]],
        })
      );

      calls.push(
        encodeFunctionData({
          abi: EXCHANGE_ROUTER_ABI,
          functionName: 'createWithdrawal',
          args: [withdrawParams],
        })
      );

      writeWithdraw({
        address: GMX_CONTRACTS.exchangeRouter,
        abi: EXCHANGE_ROUTER_ABI,
        functionName: 'multicall',
        args: [calls],
        value: DEFAULT_EXECUTION_FEE,
      });
    } catch (err) {
      setLocalError(err instanceof Error ? err : new Error('Withdrawal failed'));
    }
  }, [address, pool, marketTokenAmount, slippageBps, writeWithdraw]);

  const reset = useCallback(() => {
    setLocalError(null);
    resetApproval();
    resetWithdraw();
  }, [resetApproval, resetWithdraw]);

  const approvalError = approvalWriteError || approvalReceiptError;
  const withdrawError = withdrawWriteError || withdrawReceiptError || localError;

  return {
    needsApproval,
    isCheckingAllowance,
    refetchAllowance: () => refetchAllowance(),
    approve,
    isApproving,
    isApprovalPending,
    isApprovalSuccess,
    approvalError,
    approvalHash,
    withdraw,
    isWithdrawing,
    isWithdrawPending,
    isWithdrawSuccess,
    withdrawError,
    withdrawHash,
    isPending: isApproving || isApprovalPending || isWithdrawing || isWithdrawPending,
    reset,
  };
}
