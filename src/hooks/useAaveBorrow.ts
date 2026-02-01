"use client";

import { useCallback, useMemo, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { type Address } from "viem";
import {
  AAVE_V3_ADDRESSES,
  AAVE_POOL_ABI,
  INTEREST_RATE_MODE,
  parseTokenAmount,
  ASSET_DECIMALS,
} from "@/lib/aave";

interface UseAaveBorrowParams {
  asset?: Address;
  amount: number;
  interestRateMode?: typeof INTEREST_RATE_MODE[keyof typeof INTEREST_RATE_MODE];
  onBehalfOf?: Address;
  onSuccess?: (hash: string) => void;
}

interface UseAaveBorrowReturn {
  borrow: () => void;
  isBorrowing: boolean;
  isPending: boolean;
  isSuccess: boolean;
  error: Error | null;
  hash: `0x${string}` | undefined;
  reset: () => void;
}

export function useAaveBorrow({
  asset = AAVE_V3_ADDRESSES.USDC,
  amount,
  interestRateMode = INTEREST_RATE_MODE.VARIABLE,
  onBehalfOf,
  onSuccess,
}: UseAaveBorrowParams): UseAaveBorrowReturn {
  const { address } = useAccount();
  
  const decimals = ASSET_DECIMALS[asset] ?? 18;
  const amountInWei = useMemo(
    () => parseTokenAmount(amount, decimals),
    [amount, decimals]
  );
  
  const borrower = onBehalfOf ?? address;

  const {
    writeContract,
    data: hash,
    isPending: isBorrowing,
    error: writeError,
    reset,
  } = useWriteContract();

  const { 
    isLoading: isConfirming, 
    isSuccess,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash });

  // Call onSuccess callback when borrow succeeds
  useEffect(() => {
    if (isSuccess && hash) {
      onSuccess?.(hash);
    }
  }, [isSuccess, hash, onSuccess]);

  const borrow = useCallback(() => {
    if (!address || !borrower) return;
    writeContract({
      address: AAVE_V3_ADDRESSES.POOL,
      abi: AAVE_POOL_ABI,
      functionName: "borrow",
      args: [asset, amountInWei, BigInt(interestRateMode), 0, borrower],
    });
  }, [address, borrower, asset, amountInWei, interestRateMode, writeContract]);

  return {
    borrow,
    isBorrowing,
    isPending: isBorrowing || isConfirming,
    isSuccess,
    error: writeError || receiptError,
    hash,
    reset,
  };
}
