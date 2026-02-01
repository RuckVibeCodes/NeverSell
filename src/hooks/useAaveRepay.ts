"use client";

import { useCallback, useMemo } from "react";
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
  /** Asset to repay (default: USDC) */
  asset?: Address;
  /** Amount to repay in human-readable format */
  amount: number;
  /** Set to true to repay max (entire debt) */
  repayMax?: boolean;
  /** Interest rate mode of the debt to repay (default: VARIABLE) */
  interestRateMode?: typeof INTEREST_RATE_MODE[keyof typeof INTEREST_RATE_MODE];
  /** Address on whose behalf to repay (default: connected wallet) */
  onBehalfOf?: Address;
}

interface UseAaveRepayReturn {
  // Approval state
  needsApproval: boolean;
  isCheckingAllowance: boolean;
  approve: () => void;
  isApproving: boolean;
  isApprovalPending: boolean;
  approvalError: Error | null;
  
  // Repay state
  repay: () => void;
  isRepaying: boolean;
  isRepayPending: boolean;
  repayError: Error | null;
  repayHash: `0x${string}` | undefined;
  isRepaySuccess: boolean;
  
  // Combined state
  isPending: boolean;
}

/**
 * Hook for repaying borrowed assets to Aave V3
 * 
 * Requires approval of the asset to the Pool contract before repaying.
 * 
 * @example
 * ```tsx
 * const { repay, approve, needsApproval, isPending } = useAaveRepay({
 *   amount: 500, // Repay 500 USDC
 * });
 * 
 * // Repay all debt
 * const { repay: repayAll } = useAaveRepay({
 *   amount: 0,
 *   repayMax: true,
 * });
 * ```
 */
export function useAaveRepay({
  asset = AAVE_V3_ADDRESSES.USDC,
  amount,
  repayMax = false,
  interestRateMode = INTEREST_RATE_MODE.VARIABLE,
  onBehalfOf,
}: UseAaveRepayParams): UseAaveRepayReturn {
  const { address } = useAccount();
  
  const decimals = ASSET_DECIMALS[asset] ?? 18;
  
  // Use max uint256 to repay all debt, otherwise use specified amount
  const amountInWei = useMemo(() => {
    if (repayMax) return maxUint256;
    return parseTokenAmount(amount, decimals);
  }, [amount, decimals, repayMax]);
  
  const debtor = onBehalfOf ?? address;

  // Check current allowance
  const { data: allowance, isLoading: isCheckingAllowance } = useReadContract({
    address: asset,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address ? [address, AAVE_V3_ADDRESSES.POOL] : undefined,
    query: {
      enabled: !!address && (amount > 0 || repayMax),
    },
  });

  const needsApproval = useMemo(() => {
    if (!allowance) return true;
    // For repayMax, we need max approval
    if (repayMax) return allowance < maxUint256 / BigInt(2);
    return allowance < amountInWei;
  }, [allowance, amountInWei, repayMax]);

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

  // Repay transaction
  const {
    writeContract: writeRepay,
    data: repayHash,
    isPending: isRepaying,
    error: repayWriteError,
  } = useWriteContract();

  const { 
    isLoading: isRepayPending, 
    isSuccess: isRepaySuccess,
    error: repayReceiptError,
  } = useWaitForTransactionReceipt({
    hash: repayHash,
  });

  const repay = useCallback(() => {
    if (!address || !debtor) return;
    
    writeRepay({
      address: AAVE_V3_ADDRESSES.POOL,
      abi: AAVE_POOL_ABI,
      functionName: "repay",
      args: [asset, amountInWei, BigInt(interestRateMode), debtor],
    });
  }, [address, debtor, asset, amountInWei, interestRateMode, writeRepay]);

  return {
    // Approval
    needsApproval,
    isCheckingAllowance,
    approve,
    isApproving,
    isApprovalPending,
    approvalError: approvalWriteError || approvalReceiptError,
    
    // Repay
    repay,
    isRepaying,
    isRepayPending,
    repayError: repayWriteError || repayReceiptError,
    repayHash,
    isRepaySuccess,
    
    // Combined
    isPending: isApproving || isApprovalPending || isRepaying || isRepayPending,
  };
}
