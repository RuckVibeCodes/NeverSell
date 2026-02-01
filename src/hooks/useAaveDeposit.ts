"use client";

import { useCallback, useMemo, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { type Address, maxUint256 } from "viem";
import {
  AAVE_V3_ADDRESSES,
  AAVE_POOL_ABI,
  ERC20_ABI,
  parseTokenAmount,
  ASSET_DECIMALS,
} from "@/lib/aave";

interface UseAaveDepositParams {
  asset: Address;
  amount: number;
  onBehalfOf?: Address;
  onApprovalSuccess?: () => void;
  onDepositSuccess?: (hash: string) => void;
}

interface UseAaveDepositReturn {
  needsApproval: boolean;
  isCheckingAllowance: boolean;
  refetchAllowance: () => void;
  approve: () => void;
  isApproving: boolean;
  isApprovalPending: boolean;
  isApprovalSuccess: boolean;
  approvalError: Error | null;
  approvalHash: `0x${string}` | undefined;
  deposit: () => void;
  isDepositing: boolean;
  isDepositPending: boolean;
  depositError: Error | null;
  depositHash: `0x${string}` | undefined;
  isDepositSuccess: boolean;
  isPending: boolean;
  reset: () => void;
}

export function useAaveDeposit({
  asset,
  amount,
  onBehalfOf,
  onApprovalSuccess,
  onDepositSuccess,
}: UseAaveDepositParams): UseAaveDepositReturn {
  const { address } = useAccount();
  
  const decimals = ASSET_DECIMALS[asset] ?? 18;
  const amountInWei = useMemo(
    () => parseTokenAmount(amount, decimals),
    [amount, decimals]
  );
  
  const recipient = onBehalfOf ?? address;

  // Check allowance with refetch capability
  const { 
    data: allowance, 
    isLoading: isCheckingAllowance,
    refetch: refetchAllowance,
  } = useReadContract({
    address: asset,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address && recipient ? [address, AAVE_V3_ADDRESSES.POOL] : undefined,
    query: { enabled: !!address && amount > 0 },
  });

  const needsApproval = useMemo(() => {
    if (!allowance) return true;
    return allowance < amountInWei;
  }, [allowance, amountInWei]);

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

  // Deposit transaction
  const {
    writeContract: writeDeposit,
    data: depositHash,
    isPending: isDepositing,
    error: depositWriteError,
    reset: resetDeposit,
  } = useWriteContract();

  const { 
    isLoading: isDepositPending, 
    isSuccess: isDepositSuccess,
    error: depositReceiptError,
  } = useWaitForTransactionReceipt({ hash: depositHash });

  // Call onDepositSuccess callback when deposit succeeds
  useEffect(() => {
    if (isDepositSuccess && depositHash) {
      onDepositSuccess?.(depositHash);
    }
  }, [isDepositSuccess, depositHash, onDepositSuccess]);

  const deposit = useCallback(() => {
    if (!address || !recipient) return;
    writeDeposit({
      address: AAVE_V3_ADDRESSES.POOL,
      abi: AAVE_POOL_ABI,
      functionName: "supply",
      args: [asset, amountInWei, recipient, 0],
    });
  }, [address, recipient, asset, amountInWei, writeDeposit]);

  // Reset all transaction state
  const reset = useCallback(() => {
    resetApproval();
    resetDeposit();
  }, [resetApproval, resetDeposit]);

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
    deposit,
    isDepositing,
    isDepositPending,
    depositError: depositWriteError || depositReceiptError,
    depositHash,
    isDepositSuccess,
    isPending: isApproving || isApprovalPending || isDepositing || isDepositPending,
    reset,
  };
}
