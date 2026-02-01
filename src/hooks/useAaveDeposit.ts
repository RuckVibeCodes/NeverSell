"use client";

import { useCallback, useMemo } from "react";
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
}

interface UseAaveDepositReturn {
  // Approval state
  needsApproval: boolean;
  isCheckingAllowance: boolean;
  approve: () => void;
  isApproving: boolean;
  isApprovalPending: boolean;
  approvalError: Error | null;
  
  // Deposit state
  deposit: () => void;
  isDepositing: boolean;
  isDepositPending: boolean;
  depositError: Error | null;
  depositHash: `0x${string}` | undefined;
  isDepositSuccess: boolean;
  
  // Combined state
  isPending: boolean;
}

/**
 * Hook for depositing (supplying) collateral to Aave V3
 * 
 * @example
 * ```tsx
 * const { deposit, approve, needsApproval, isPending } = useAaveDeposit({
 *   asset: AAVE_V3_ADDRESSES.WETH,
 *   amount: 1.5, // 1.5 ETH
 * });
 * 
 * // If needs approval, call approve() first
 * if (needsApproval) {
 *   approve();
 * } else {
 *   deposit();
 * }
 * ```
 */
export function useAaveDeposit({
  asset,
  amount,
  onBehalfOf,
}: UseAaveDepositParams): UseAaveDepositReturn {
  const { address } = useAccount();
  
  const decimals = ASSET_DECIMALS[asset] ?? 18;
  const amountInWei = useMemo(
    () => parseTokenAmount(amount, decimals),
    [amount, decimals]
  );
  
  const recipient = onBehalfOf ?? address;

  // Check current allowance
  const { data: allowance, isLoading: isCheckingAllowance } = useReadContract({
    address: asset,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address && recipient ? [address, AAVE_V3_ADDRESSES.POOL] : undefined,
    query: {
      enabled: !!address && amount > 0,
    },
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
  } = useWriteContract();

  const { isLoading: isApprovalPending, error: approvalReceiptError } = useWaitForTransactionReceipt({
    hash: approvalHash,
  });

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
  } = useWriteContract();

  const { 
    isLoading: isDepositPending, 
    isSuccess: isDepositSuccess,
    error: depositReceiptError,
  } = useWaitForTransactionReceipt({
    hash: depositHash,
  });

  const deposit = useCallback(() => {
    if (!address || !recipient) return;
    
    writeDeposit({
      address: AAVE_V3_ADDRESSES.POOL,
      abi: AAVE_POOL_ABI,
      functionName: "supply",
      args: [asset, amountInWei, recipient, 0], // referralCode = 0
    });
  }, [address, recipient, asset, amountInWei, writeDeposit]);

  return {
    // Approval
    needsApproval,
    isCheckingAllowance,
    approve,
    isApproving,
    isApprovalPending,
    approvalError: approvalWriteError || approvalReceiptError,
    
    // Deposit
    deposit,
    isDepositing,
    isDepositPending,
    depositError: depositWriteError || depositReceiptError,
    depositHash,
    isDepositSuccess,
    
    // Combined
    isPending: isApproving || isApprovalPending || isDepositing || isDepositPending,
  };
}
