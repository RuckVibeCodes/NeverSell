"use client";

import { useState, useCallback } from "react";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { parseUnits, type Address } from "viem";
import { arbitrum } from "viem/chains";

// Constants
const PLATFORM_GAS_FEE_USD = 0.05; // $0.05 per deposit - covers Alchemy sponsorship
const NEVERSELL_TREASURY = "0x9c7930cA28279C6A7a763DcA3573620903491806" as const;

// Token addresses on Arbitrum
const TOKEN_CONFIG: Record<string, { address: Address; decimals: number; supportsPermit: boolean }> = {
  WBTC: { address: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f", decimals: 8, supportsPermit: false },
  WETH: { address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", decimals: 18, supportsPermit: false },
  USDC: { address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", decimals: 6, supportsPermit: true }, // Native USDC supports permit
  ARB: { address: "0x912CE59144191C1204E64559FE8253a0e49E6548", decimals: 18, supportsPermit: false },
};

interface PermitSignature {
  v: number;
  r: `0x${string}`;
  s: `0x${string}`;
  deadline: bigint;
}

interface GaslessDepositResult {
  success: boolean;
  hash?: string;
  netAmount: bigint;
  gasFeeDeducted: number;
  error?: string;
}

/**
 * Hook for gasless deposits with permit signature support
 * - Sponsors gas via Alchemy Gas Manager
 * - Deducts $0.05 from deposit to cover sponsorship cost
 * - Uses permit signatures to skip approve tx (for supported tokens)
 */
export function useGaslessDeposit() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<string>("");

  /**
   * Sign EIP-2612 permit for gasless approval
   */
  const signPermit = useCallback(async ({
    tokenAddress,
    spender,
    value,
    deadline,
  }: {
    tokenAddress: Address;
    spender: Address;
    value: bigint;
    deadline: bigint;
  }): Promise<PermitSignature | null> => {
    if (!walletClient || !address || !publicClient) return null;

    try {
      // Get token name and nonce for permit
      const [name, nonce] = await Promise.all([
        publicClient.readContract({
          address: tokenAddress,
          abi: [{ name: "name", type: "function", inputs: [], outputs: [{ type: "string" }] }],
          functionName: "name",
        }),
        publicClient.readContract({
          address: tokenAddress,
          abi: [{ name: "nonces", type: "function", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] }],
          functionName: "nonces",
          args: [address],
        }),
      ]);

      // EIP-712 domain
      const domain = {
        name: name as string,
        version: "1",
        chainId: arbitrum.id,
        verifyingContract: tokenAddress,
      };

      // Permit message
      const types = {
        Permit: [
          { name: "owner", type: "address" },
          { name: "spender", type: "address" },
          { name: "value", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      };

      const message = {
        owner: address,
        spender,
        value,
        nonce: nonce as bigint,
        deadline,
      };

      // Sign the permit
      const signature = await walletClient.signTypedData({
        domain,
        types,
        primaryType: "Permit",
        message,
      });

      // Split signature
      const r = `0x${signature.slice(2, 66)}` as `0x${string}`;
      const s = `0x${signature.slice(66, 130)}` as `0x${string}`;
      const v = parseInt(signature.slice(130, 132), 16);

      return { v, r, s, deadline };
    } catch (error) {
      console.error("Permit signing failed:", error);
      return null;
    }
  }, [walletClient, address, publicClient]);

  /**
   * Calculate gas fee in token terms
   */
  const calculateGasFeeInToken = useCallback((
    tokenPriceUSD: number,
    tokenDecimals: number
  ): bigint => {
    const feeInToken = PLATFORM_GAS_FEE_USD / tokenPriceUSD;
    return parseUnits(feeInToken.toFixed(tokenDecimals), tokenDecimals);
  }, []);

  /**
   * Execute gasless deposit with permit (for supported tokens)
   */
  const depositWithPermit = useCallback(async ({
    tokenSymbol,
    amount,
    tokenPriceUSD,
    depositContract,
  }: {
    tokenSymbol: string;
    amount: bigint;
    tokenPriceUSD: number;
    depositContract: Address;
  }): Promise<GaslessDepositResult> => {
    if (!walletClient || !address || !publicClient) {
      return { success: false, netAmount: BigInt(0), gasFeeDeducted: 0, error: "Wallet not connected" };
    }

    const tokenConfig = TOKEN_CONFIG[tokenSymbol];
    if (!tokenConfig) {
      return { success: false, netAmount: BigInt(0), gasFeeDeducted: 0, error: "Token not supported" };
    }

    setIsProcessing(true);
    setStatus("Preparing gasless deposit...");

    try {
      // Calculate fee and net amount
      const gasFeeInToken = calculateGasFeeInToken(tokenPriceUSD, tokenConfig.decimals);
      const netAmount = amount - gasFeeInToken;
      const gasFeeDeducted = PLATFORM_GAS_FEE_USD;

      if (netAmount <= BigInt(0)) {
        return { success: false, netAmount: BigInt(0), gasFeeDeducted: 0, error: "Amount too small to cover gas fee" };
      }

      // Set deadline to 1 hour from now
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);

      if (tokenConfig.supportsPermit) {
        // Token supports permit - sign permit instead of approve tx
        setStatus("Sign permit to authorize deposit...");
        
        const permit = await signPermit({
          tokenAddress: tokenConfig.address,
          spender: depositContract,
          value: amount,
          deadline,
        });

        if (!permit) {
          return { success: false, netAmount: BigInt(0), gasFeeDeducted: 0, error: "Permit signing cancelled" };
        }

        setStatus("Executing gasless deposit...");

        // Call depositWithPermit on contract
        // This single tx: validates permit + transfers tokens + deposits to strategy
        const hash = await walletClient.writeContract({
          address: depositContract,
          abi: DEPOSIT_WITH_PERMIT_ABI,
          functionName: "depositWithPermit",
          args: [
            tokenConfig.address,
            amount,
            netAmount,
            NEVERSELL_TREASURY, // Fee recipient
            permit.deadline,
            permit.v,
            permit.r,
            permit.s,
          ],
        });

        setStatus("Deposit complete!");
        return { success: true, hash, netAmount, gasFeeDeducted };

      } else {
        // Token doesn't support permit - need traditional approve first
        setStatus("Checking allowance...");

        const allowance = await publicClient.readContract({
          address: tokenConfig.address,
          abi: [{ name: "allowance", type: "function", inputs: [{ type: "address" }, { type: "address" }], outputs: [{ type: "uint256" }] }],
          functionName: "allowance",
          args: [address, depositContract],
        }) as bigint;

        if (allowance < amount) {
          setStatus("Approve token transfer...");
          
          const approveHash = await walletClient.writeContract({
            address: tokenConfig.address,
            abi: [{ name: "approve", type: "function", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [{ type: "bool" }] }],
            functionName: "approve",
            args: [depositContract, amount],
          });

          // Wait for approval
          await publicClient.waitForTransactionReceipt({ hash: approveHash });
        }

        setStatus("Executing deposit...");

        // Standard deposit (fee deducted in contract)
        const hash = await walletClient.writeContract({
          address: depositContract,
          abi: DEPOSIT_ABI,
          functionName: "deposit",
          args: [tokenConfig.address, amount, netAmount, NEVERSELL_TREASURY],
        });

        setStatus("Deposit complete!");
        return { success: true, hash, netAmount, gasFeeDeducted };
      }

    } catch (error: unknown) {
      console.error("Gasless deposit failed:", error);
      const err = error as { shortMessage?: string; message?: string };
      const errorMessage = err?.shortMessage || err?.message || "Deposit failed";
      return { success: false, netAmount: BigInt(0), gasFeeDeducted: 0, error: errorMessage };
    } finally {
      setIsProcessing(false);
      setStatus("");
    }
  }, [walletClient, address, publicClient, signPermit, calculateGasFeeInToken]);

  return {
    depositWithPermit,
    signPermit,
    isProcessing,
    status,
    PLATFORM_GAS_FEE_USD,
    TOKEN_CONFIG,
  };
}

// Contract ABIs
const DEPOSIT_WITH_PERMIT_ABI = [
  {
    name: "depositWithPermit",
    type: "function",
    inputs: [
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "netAmount", type: "uint256" },
      { name: "feeRecipient", type: "address" },
      { name: "deadline", type: "uint256" },
      { name: "v", type: "uint8" },
      { name: "r", type: "bytes32" },
      { name: "s", type: "bytes32" },
    ],
    outputs: [],
  },
] as const;

const DEPOSIT_ABI = [
  {
    name: "deposit",
    type: "function",
    inputs: [
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "netAmount", type: "uint256" },
      { name: "feeRecipient", type: "address" },
    ],
    outputs: [],
  },
] as const;

export type { PermitSignature, GaslessDepositResult };
