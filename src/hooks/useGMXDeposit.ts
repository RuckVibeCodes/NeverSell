// Hook for depositing tokens into GMX GM pools
// Mints GM tokens in exchange for long/short tokens

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
  type DepositParams,
  calculateMinOutput,
} from '@/lib/gmx';

export interface UseGMXDepositParams {
  poolName: GMPoolName;
  longTokenAmount?: bigint;
  shortTokenAmount?: bigint;
  slippageBps?: number; // Basis points (100 = 1%)
  onApprovalSuccess?: () => void;
  onDepositSuccess?: (hash: string) => void;
}

export interface UseGMXDepositResult {
  // Allowance checking
  needsLongTokenApproval: boolean;
  needsShortTokenApproval: boolean;
  isCheckingAllowance: boolean;
  refetchAllowances: () => void;
  
  // Approval
  approveLongToken: () => void;
  approveShortToken: () => void;
  isApproving: boolean;
  isApprovalPending: boolean;
  isApprovalSuccess: boolean;
  approvalError: Error | null;
  
  // Deposit
  deposit: () => void;
  isDepositing: boolean;
  isDepositPending: boolean;
  isDepositSuccess: boolean;
  depositError: Error | null;
  depositHash: `0x${string}` | undefined;
  
  // General
  isPending: boolean;
  reset: () => void;
}

export function useGMXDeposit({
  poolName,
  longTokenAmount = BigInt(0),
  shortTokenAmount = BigInt(0),
  slippageBps = 100, // 1% default slippage
  onApprovalSuccess,
  onDepositSuccess,
}: UseGMXDepositParams): UseGMXDepositResult {
  const { address } = useAccount();
  const [localError, setLocalError] = useState<Error | null>(null);

  const pool = useMemo(() => GM_POOLS[poolName], [poolName]);

  // Check long token allowance
  const { 
    data: longTokenAllowance, 
    isLoading: isCheckingLongAllowance,
    refetch: refetchLongAllowance,
  } = useReadContract({
    address: pool.longToken,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, GMX_CONTRACTS.router] : undefined,
    query: { enabled: !!address && longTokenAmount > BigInt(0) },
  });

  // Check short token allowance
  const { 
    data: shortTokenAllowance, 
    isLoading: isCheckingShortAllowance,
    refetch: refetchShortAllowance,
  } = useReadContract({
    address: pool.shortToken,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, GMX_CONTRACTS.router] : undefined,
    query: { enabled: !!address && shortTokenAmount > BigInt(0) },
  });

  const needsLongTokenApproval = useMemo(() => {
    if (longTokenAmount === BigInt(0)) return false;
    if (!longTokenAllowance) return true;
    return longTokenAllowance < longTokenAmount;
  }, [longTokenAllowance, longTokenAmount]);

  const needsShortTokenApproval = useMemo(() => {
    if (shortTokenAmount === BigInt(0)) return false;
    if (!shortTokenAllowance) return true;
    return shortTokenAllowance < shortTokenAmount;
  }, [shortTokenAllowance, shortTokenAmount]);

  // Approval transactions
  const {
    writeContract: writeApproveLong,
    data: approveLongHash,
    isPending: isApprovingLong,
    error: approveLongError,
    reset: resetApproveLong,
  } = useWriteContract();

  const {
    writeContract: writeApproveShort,
    data: approveShortHash,
    isPending: isApprovingShort,
    error: approveShortError,
    reset: resetApproveShort,
  } = useWriteContract();

  const { 
    isLoading: isLongApprovalPending,
    isSuccess: isLongApprovalSuccess,
    error: longApprovalReceiptError,
  } = useWaitForTransactionReceipt({ hash: approveLongHash });

  const { 
    isLoading: isShortApprovalPending,
    isSuccess: isShortApprovalSuccess,
    error: shortApprovalReceiptError,
  } = useWaitForTransactionReceipt({ hash: approveShortHash });

  // Refetch allowances when approval succeeds
  useEffect(() => {
    if (isLongApprovalSuccess) {
      refetchLongAllowance();
    }
  }, [isLongApprovalSuccess, refetchLongAllowance]);

  useEffect(() => {
    if (isShortApprovalSuccess) {
      refetchShortAllowance();
    }
  }, [isShortApprovalSuccess, refetchShortAllowance]);

  // Notify on any approval success
  const isApprovalSuccess = isLongApprovalSuccess || isShortApprovalSuccess;
  useEffect(() => {
    if (isApprovalSuccess) {
      onApprovalSuccess?.();
    }
  }, [isApprovalSuccess, onApprovalSuccess]);

  const approveLongToken = useCallback(() => {
    if (!address) return;
    writeApproveLong({
      address: pool.longToken,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [GMX_CONTRACTS.router, maxUint256],
    });
  }, [address, pool.longToken, writeApproveLong]);

  const approveShortToken = useCallback(() => {
    if (!address) return;
    writeApproveShort({
      address: pool.shortToken,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [GMX_CONTRACTS.router, maxUint256],
    });
  }, [address, pool.shortToken, writeApproveShort]);

  // Deposit transaction
  const {
    data: depositHash,
    writeContract: writeDeposit,
    isPending: isDepositing,
    error: depositWriteError,
    reset: resetDeposit,
  } = useWriteContract();

  const {
    isLoading: isDepositPending,
    isSuccess: isDepositSuccess,
    error: depositReceiptError,
  } = useWaitForTransactionReceipt({ hash: depositHash });

  // Call onDepositSuccess callback
  useEffect(() => {
    if (isDepositSuccess && depositHash) {
      onDepositSuccess?.(depositHash);
    }
  }, [isDepositSuccess, depositHash, onDepositSuccess]);

  const deposit = useCallback(() => {
    if (!address) {
      setLocalError(new Error('Wallet not connected'));
      return;
    }

    if (longTokenAmount === BigInt(0) && shortTokenAmount === BigInt(0)) {
      setLocalError(new Error('Must deposit at least one token'));
      return;
    }

    setLocalError(null);

    try {
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

      const calls: `0x${string}`[] = [];

      calls.push(
        encodeFunctionData({
          abi: EXCHANGE_ROUTER_ABI,
          functionName: 'sendWnt',
          args: [],
        })
      );

      if (longTokenAmount > BigInt(0)) {
        calls.push(
          encodeFunctionData({
            abi: EXCHANGE_ROUTER_ABI,
            functionName: 'sendTokens',
            args: [[pool.longToken]],
          })
        );
      }

      if (shortTokenAmount > BigInt(0)) {
        calls.push(
          encodeFunctionData({
            abi: EXCHANGE_ROUTER_ABI,
            functionName: 'sendTokens',
            args: [[pool.shortToken]],
          })
        );
      }

      calls.push(
        encodeFunctionData({
          abi: EXCHANGE_ROUTER_ABI,
          functionName: 'createDeposit',
          args: [depositParams],
        })
      );

      writeDeposit({
        address: GMX_CONTRACTS.exchangeRouter,
        abi: EXCHANGE_ROUTER_ABI,
        functionName: 'multicall',
        args: [calls],
        value: DEFAULT_EXECUTION_FEE,
      });
    } catch (err) {
      setLocalError(err instanceof Error ? err : new Error('Deposit failed'));
    }
  }, [address, pool, longTokenAmount, shortTokenAmount, slippageBps, writeDeposit]);

  const reset = useCallback(() => {
    setLocalError(null);
    resetApproveLong();
    resetApproveShort();
    resetDeposit();
  }, [resetApproveLong, resetApproveShort, resetDeposit]);

  const refetchAllowances = useCallback(() => {
    refetchLongAllowance();
    refetchShortAllowance();
  }, [refetchLongAllowance, refetchShortAllowance]);

  const isApproving = isApprovingLong || isApprovingShort;
  const isApprovalPending = isLongApprovalPending || isShortApprovalPending;
  const approvalError = approveLongError || approveShortError || longApprovalReceiptError || shortApprovalReceiptError;
  const depositError = depositWriteError || depositReceiptError || localError;

  return {
    needsLongTokenApproval,
    needsShortTokenApproval,
    isCheckingAllowance: isCheckingLongAllowance || isCheckingShortAllowance,
    refetchAllowances,
    approveLongToken,
    approveShortToken,
    isApproving,
    isApprovalPending,
    isApprovalSuccess,
    approvalError,
    deposit,
    isDepositing,
    isDepositPending,
    isDepositSuccess,
    depositError,
    depositHash,
    isPending: isApproving || isApprovalPending || isDepositing || isDepositPending,
    reset,
  };
}
