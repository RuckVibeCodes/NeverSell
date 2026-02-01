"use client";

import { useCallback, useMemo } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { type Address, maxUint256 } from "viem";
import {
  AAVE_V3_ADDRESSES,
  AAVE_POOL_ABI,
  parseTokenAmount,
  ASSET_DECIMALS,
} from "@/lib/aave";

interface UseAaveWithdrawParams {
  asset: Address;
  amount: number;
  /** Set to true to withdraw max (all deposited collateral) */
  withdrawMax?: boolean;
  /** Address to receive the withdrawn assets */
  to?: Address;
}

interface UseAaveWithdrawReturn {
  withdraw: () => void;
  isWithdrawing: boolean;
  isPending: boolean;
  isSuccess: boolean;
  error: Error | null;
  hash: `0x${string}` | undefined;
}

/**
 * Hook for withdrawing collateral from Aave V3
 * 
 * @example
 * ```tsx
 * const { withdraw, isPending, isSuccess } = useAaveWithdraw({
 *   asset: AAVE_V3_ADDRESSES.WETH,
 *   amount: 0.5, // Withdraw 0.5 ETH
 * });
 * 
 * // Withdraw max
 * const { withdraw: withdrawAll } = useAaveWithdraw({
 *   asset: AAVE_V3_ADDRESSES.WETH,
 *   amount: 0,
 *   withdrawMax: true,
 * });
 * ```
 */
export function useAaveWithdraw({
  asset,
  amount,
  withdrawMax = false,
  to,
}: UseAaveWithdrawParams): UseAaveWithdrawReturn {
  const { address } = useAccount();
  
  const decimals = ASSET_DECIMALS[asset] ?? 18;
  
  // Use max uint256 to withdraw all, otherwise use specified amount
  const amountInWei = useMemo(() => {
    if (withdrawMax) return maxUint256;
    return parseTokenAmount(amount, decimals);
  }, [amount, decimals, withdrawMax]);
  
  const recipient = to ?? address;

  const {
    writeContract,
    data: hash,
    isPending: isWithdrawing,
    error: writeError,
  } = useWriteContract();

  const { 
    isLoading: isConfirming, 
    isSuccess,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  const withdraw = useCallback(() => {
    if (!address || !recipient) return;
    
    writeContract({
      address: AAVE_V3_ADDRESSES.POOL,
      abi: AAVE_POOL_ABI,
      functionName: "withdraw",
      args: [asset, amountInWei, recipient],
    });
  }, [address, recipient, asset, amountInWei, writeContract]);

  return {
    withdraw,
    isWithdrawing,
    isPending: isWithdrawing || isConfirming,
    isSuccess,
    error: writeError || receiptError,
    hash,
  };
}
