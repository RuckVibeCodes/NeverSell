"use client";

import { useCallback, useMemo, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { type Address, maxUint256 } from "viem";
import {
  AAVE_V3_ADDRESSES,
  AAVE_POOL_ABI,
  ERC20_ABI,
  INTEREST_RATE_MODE,
  parseTokenAmount,
  ASSET_DECIMALS,
} from "@/lib/aave";

interface UseAaveRepayParams {
  asset?: Address;
  amount: number;
  repayMax?: boolean;
  interestRateMode?: typeof INTEREST_RATE_MODE[keyof typeof INTEREST_RATE_MODE];
  onBehalfOf?: Address;
  onApprovalSuccess?: () => void;
  onRepaySuccess?: (hash: string) => void;
}

interface UseAaveRepayReturn {
  needsApproval: boolean;
  isCheckingAllowance: boolean;
  refetchAllowance: () => void;
  approve: () => void;
  isApproving: boolean;
  isApprovalPending: boolean;
  isApprovalSuccess: boolean;
  approvalError: Error | null;
  approvalHash: `0x${string}` | undefined;
  repay: () => void;
  isRepaying: boolean;
  isRepayPending: boolean;
  repayError: Error | null;
  repayHash: `0x${string}` | undefined;
  isRepaySuccess: boolean;
  isPending: boolean;
  reset: () => void;
}

export function useAaveRepay({
  asset = AAVE_V3_ADDRESSES.USDC,
  amount,
  repayMax = false,
  interestRateMode = INTEREST_RATE_MODE.VARIABLE,
  onBehalfOf,
  onApprovalSuccess,
  onRepaySuccess,
}: UseAaveRepayParams): UseAaveRepayReturn {
  const { address } = useAccount();
  
  const decimals = ASSET_DECIMALS[asset] ?? 18;
  const amountInWei = useMemo(() => {
    if (repayMax) return maxUint256;
    return parseTokenAmount(amount, decimals);
  }, [amount, decimals, repayMax]);
  
  const debtor = onBehalfOf ?? address;

  // Check allowance with refetch capability
  const { 
    data: allowance, 
    isLoading: isCheckingAllowance,
    refetch: refetchAllowance,
  } = useReadContract({
    address: asset,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address ? [address, AAVE_V3_ADDRESSES.POOL] : undefined,
    query: { enabled: !!address && (amount > 0 || repayMax) },
  });

  const needsApproval = useMemo(() => {
    if (!allowance) return true;
    if (repayMax) return allowance < maxUint256 / BigInt(2);
    return allowance < amountInWei;
  }, [allowance, amountInWei, repayMax]);

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
  } = useWaitForTransactionReceipt({
    hash: approvalHash,
  });

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
      address: asset,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [AAVE_V3_ADDRESSES.POOL, maxUint256],
    });
  }, [address, asset, writeApprove]);

  // Repay transaction
  const {
    writeContract: writeRepay,
    data: repayHash,
    isPending: isRepaying,
    error: repayWriteError,
    reset: resetRepay,
  } = useWriteContract();

  const { 
    isLoading: isRepayPending, 
    isSuccess: isRepaySuccess,
    error: repayReceiptError,
  } = useWaitForTransactionReceipt({ hash: repayHash });

  // Call onRepaySuccess callback when repay succeeds
  useEffect(() => {
    if (isRepaySuccess && repayHash) {
      onRepaySuccess?.(repayHash);
    }
  }, [isRepaySuccess, repayHash, onRepaySuccess]);

  const repay = useCallback(() => {
    if (!address || !debtor) return;
    writeRepay({
      address: AAVE_V3_ADDRESSES.POOL,
      abi: AAVE_POOL_ABI,
      functionName: "repay",
      args: [asset, amountInWei, BigInt(interestRateMode), debtor],
    });
  }, [address, debtor, asset, amountInWei, interestRateMode, writeRepay]);

  // Reset all transaction state
  const reset = useCallback(() => {
    resetApproval();
    resetRepay();
  }, [resetApproval, resetRepay]);

  return {
    needsApproval,
    isCheckingAllowance,
    refetchAllowance: () => refetchAllowance(),
    approve,
    isApproving,
    isApprovalPending,
    isApprovalSuccess,
    approvalError: approvalWriteError || approvalReceiptError,
    approvalHash,
    repay,
    isRepaying,
    isRepayPending,
    repayError: repayWriteError || repayReceiptError,
    repayHash,
    isRepaySuccess,
    isPending: isApproving || isApprovalPending || isRepaying || isRepayPending,
    reset,
  };
}
