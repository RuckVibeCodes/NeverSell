'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAccount, useWalletClient, useChainId } from 'wagmi';
import { parseUnits } from 'viem';
import {
  initLiFiConfig,
  getBridgeQuote,
  executeBridgeRoute,
  ARBITRUM_CHAIN_ID,
  isCrossChainDeposit,
  formatEstimatedTime,
  type BridgeQuoteResult,
} from '@/lib/lifi';

export type BridgeStatus = 'idle' | 'quoting' | 'quoted' | 'executing' | 'success' | 'error';

export interface UseLiFiBridgeParams {
  fromTokenAddress: string;
  toTokenAddress: string;
  amount: string; // Human readable amount (e.g., "1.5")
  decimals?: number;
  toChainId?: number; // Destination chain (defaults to Arbitrum)
}

export interface UseLiFiBridgeReturn {
  // State
  status: BridgeStatus;
  quote: BridgeQuoteResult | null;
  error: string | null;
  
  // Chain info
  sourceChainId: number | undefined;
  isCrossChain: boolean;
  
  // Actions
  fetchQuote: () => Promise<void>;
  executeBridge: () => Promise<void>;
  reset: () => void;
  
  // Formatted display values
  estimatedOutput: string;
  estimatedGas: string;
  estimatedTime: string;
  bridgePath: string;
}

// Initialize Li.Fi config once
let lifiInitialized = false;

export function useLiFiBridge(params: UseLiFiBridgeParams): UseLiFiBridgeReturn {
  const { fromTokenAddress, toTokenAddress, amount, decimals = 18, toChainId } = params;
  const destinationChainId = toChainId || ARBITRUM_CHAIN_ID;
  
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();
  
  const [status, setStatus] = useState<BridgeStatus>('idle');
  const [quote, setQuote] = useState<BridgeQuoteResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize Li.Fi on first use
  useEffect(() => {
    if (!lifiInitialized) {
      initLiFiConfig();
      lifiInitialized = true;
    }
  }, []);

  const isCrossChain = chainId ? isCrossChainDeposit(chainId) : false;

  const reset = useCallback(() => {
    setStatus('idle');
    setQuote(null);
    setError(null);
  }, []);

  const fetchQuote = useCallback(async () => {
    if (!isConnected || !address || !chainId) {
      setError('Please connect your wallet');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setStatus('quoting');
    setError(null);

    try {
      const fromAmount = parseUnits(amount, decimals).toString();
      
      const quoteResult = await getBridgeQuote({
        fromChainId: chainId,
        toChainId: destinationChainId,
        fromTokenAddress,
        toTokenAddress,
        fromAmount,
        fromAddress: address,
      });

      setQuote(quoteResult);
      setStatus('quoted');
    } catch (err) {
      console.error('Quote error:', err);
      setError(err instanceof Error ? err.message : 'Failed to get quote');
      setStatus('error');
    }
  }, [isConnected, address, chainId, amount, decimals, fromTokenAddress, toTokenAddress, destinationChainId]);

  const executeBridge = useCallback(async () => {
    if (!quote?.route || !walletClient) {
      setError('No quote available or wallet not connected');
      return;
    }

    setStatus('executing');
    setError(null);

    try {
      await executeBridgeRoute(quote.route);
      setStatus('success');
    } catch (err) {
      console.error('Bridge execution error:', err);
      setError(err instanceof Error ? err.message : 'Failed to execute bridge');
      setStatus('error');
    }
  }, [quote, walletClient]);

  // Formatted display values
  const estimatedOutput = quote?.estimatedOutputFormatted || '0';
  const estimatedGas = quote?.estimatedGasCost ? `$${parseFloat(quote.estimatedGasCost).toFixed(2)}` : '-';
  const estimatedTime = quote?.estimatedTime ? formatEstimatedTime(quote.estimatedTime) : '-';
  const bridgePath = quote?.bridgeName || '-';

  return {
    status,
    quote,
    error,
    sourceChainId: chainId,
    isCrossChain,
    fetchQuote,
    executeBridge,
    reset,
    estimatedOutput,
    estimatedGas,
    estimatedTime,
    bridgePath,
  };
}

// Re-export useful constants
export { TOKENS, SUPPORTED_SOURCE_CHAINS, ARBITRUM_CHAIN_ID } from '@/lib/lifi';
