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
  asset?: Address;
  amount: number;
  repayMax?: boolean;
  interestRateMode?: typeof INTEREST_RATE_MODE[keyof typeof INTEREST_RATE_MODE];
  onBehalfOf?: Address;
}

interface UseAaveRepayReturn {
  needsApproval: boolean;
  isCheckingAllowance: boolean;
  approve: () => void;
  isApproving: boolean;
  isApprovalPending: boolean;
  approvalError: Error | null;
  repay: () => void;
  isRepaying: boolean;
  isRepayPending: boolean;
  repayError: Error | null;
  repayHash: `0x${string}` | undefined;
  isRepaySuccess: boolean;
  isPending: boolean;
}

export function useAaveRepay({
  asset = AAVE_V3_ADDRESSES.USDC,
  amount,
  repayMax = false,
  interestRateMode = INTEREST_RATE_MODE.VARIABLE,
  onBehalfOf,
}: UseAaveRepayParams): UseAaveRepayReturn {
  const { address } = useAccount();
  
  const decimals = ASSET_DECIMALS[asset] ?? 18;
  const amountInWei = useMemo(() => {
    if (repayMax) return maxUint256;
    return parseTokenAmount(amount, decimals);
  }, [amount, decimals, repayMax]);
  
  const debtor = onBehalfOf ?? address;

  const { data: allowance, isLoading: isCheckingAllowance } = useReadContract({
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
  } = useWaitForTransactionReceipt({ hash: repayHash });

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
    needsApproval,
    isCheckingAllowance,
    approve,
    isApproving,
    isApprovalPending,
    approvalError: approvalWriteError || approvalReceiptError,
    repay,
    isRepaying,
    isRepayPending,
    repayError: repayWriteError || repayReceiptError,
    repayHash,
    isRepaySuccess,
    isPending: isApproving || isApprovalPending || isRepaying || isRepayPending,
  };
}
