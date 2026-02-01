"use client";

import { useCallback, useMemo } from "react";
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
  /** Asset to borrow (default: USDC) */
  asset?: Address;
  /** Amount to borrow in human-readable format */
  amount: number;
  /** Interest rate mode (default: VARIABLE) */
  interestRateMode?: typeof INTEREST_RATE_MODE[keyof typeof INTEREST_RATE_MODE];
  /** Address on whose behalf to borrow (default: connected wallet) */
  onBehalfOf?: Address;
}

interface UseAaveBorrowReturn {
  borrow: () => void;
  isBorrowing: boolean;
  isPending: boolean;
  isSuccess: boolean;
  error: Error | null;
  hash: `0x${string}` | undefined;
}

/**
 * Hook for borrowing assets (typically USDC) from Aave V3
 * 
 * Note: You must have sufficient collateral deposited before borrowing.
 * Check your position's availableBorrowsUSD with useAavePosition.
 * 
 * @example
 * ```tsx
 * const { borrow, isPending, isSuccess } = useAaveBorrow({
 *   amount: 1000, // Borrow 1000 USDC
 * });
 * 
 * // With custom asset
 * const { borrow: borrowWETH } = useAaveBorrow({
 *   asset: AAVE_V3_ADDRESSES.WETH,
 *   amount: 0.5,
 * });
 * ```
 */
export function useAaveBorrow({
  asset = AAVE_V3_ADDRESSES.USDC,
  amount,
  interestRateMode = INTEREST_RATE_MODE.VARIABLE,
  onBehalfOf,
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
  } = useWriteContract();

  const { 
    isLoading: isConfirming, 
    isSuccess,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  const borrow = useCallback(() => {
    if (!address || !borrower) return;
    
    writeContract({
      address: AAVE_V3_ADDRESSES.POOL,
      abi: AAVE_POOL_ABI,
      functionName: "borrow",
      args: [
        asset,
        amountInWei,
        BigInt(interestRateMode),
        0, // referralCode
        borrower,
      ],
    });
  }, [address, borrower, asset, amountInWei, interestRateMode, writeContract]);

  return {
    borrow,
    isBorrowing,
    isPending: isBorrowing || isConfirming,
    isSuccess,
    error: writeError || receiptError,
    hash,
  };
}
