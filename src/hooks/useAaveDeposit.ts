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
  needsApproval: boolean;
  isCheckingAllowance: boolean;
  approve: () => void;
  isApproving: boolean;
  isApprovalPending: boolean;
  approvalError: Error | null;
  deposit: () => void;
  isDepositing: boolean;
  isDepositPending: boolean;
  depositError: Error | null;
  depositHash: `0x${string}` | undefined;
  isDepositSuccess: boolean;
  isPending: boolean;
}

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

  const { data: allowance, isLoading: isCheckingAllowance } = useReadContract({
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
    writeContract: writeDeposit,
    data: depositHash,
    isPending: isDepositing,
    error: depositWriteError,
  } = useWriteContract();

  const { 
    isLoading: isDepositPending, 
    isSuccess: isDepositSuccess,
    error: depositReceiptError,
  } = useWaitForTransactionReceipt({ hash: depositHash });

  const deposit = useCallback(() => {
    if (!address || !recipient) return;
    writeDeposit({
      address: AAVE_V3_ADDRESSES.POOL,
      abi: AAVE_POOL_ABI,
      functionName: "supply",
      args: [asset, amountInWei, recipient, 0],
    });
  }, [address, recipient, asset, amountInWei, writeDeposit]);

  return {
    needsApproval,
    isCheckingAllowance,
    approve,
    isApproving,
    isApprovalPending,
    approvalError: approvalWriteError || approvalReceiptError,
    deposit,
    isDepositing,
    isDepositPending,
    depositError: depositWriteError || depositReceiptError,
    depositHash,
    isDepositSuccess,
    isPending: isApproving || isApprovalPending || isDepositing || isDepositPending,
  };
}
