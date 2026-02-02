'use client';

import { useState, useCallback } from 'react';
import { CreditCard, Loader2, ExternalLink } from 'lucide-react';

interface OnrampButtonProps {
  address: string;
  defaultAsset?: string;
  defaultNetwork?: string;
  presetFiatAmount?: number;
  className?: string;
  disabled?: boolean;
}

const COINBASE_PROJECT_ID = process.env.NEXT_PUBLIC_COINBASE_PROJECT_ID;

/**
 * Coinbase Onramp Button - Opens the Coinbase Buy widget
 * Uses session tokens for secure authentication
 */
export function OnrampButton({
  address,
  defaultAsset = 'USDC',
  defaultNetwork = 'arbitrum',
  presetFiatAmount = 100,
  className = '',
  disabled = false,
}: OnrampButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOnramp = useCallback(async () => {
    if (!address || disabled) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch session token from backend
      const response = await fetch('/api/coinbase/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          blockchains: ['ethereum', 'arbitrum', 'base', 'optimism'],
          assets: ['ETH', 'USDC', 'USDT', 'DAI'],
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to initialize onramp');
      }

      const { token } = await response.json();

      // Build Coinbase Onramp URL
      const onrampUrl = new URL('https://pay.coinbase.com/buy/select-asset');
      onrampUrl.searchParams.set('sessionToken', token);
      
      if (COINBASE_PROJECT_ID) {
        onrampUrl.searchParams.set('appId', COINBASE_PROJECT_ID);
      }
      
      onrampUrl.searchParams.set('defaultNetwork', defaultNetwork);
      onrampUrl.searchParams.set('defaultAsset', defaultAsset);
      onrampUrl.searchParams.set('presetFiatAmount', presetFiatAmount.toString());

      // Open in new window
      window.open(onrampUrl.toString(), '_blank', 'width=460,height=750');
    } catch (err) {
      console.error('Onramp error:', err);
      setError(err instanceof Error ? err.message : 'Failed to open buy widget');
    } finally {
      setIsLoading(false);
    }
  }, [address, disabled, defaultAsset, defaultNetwork, presetFiatAmount]);

  return (
    <div className="flex flex-col">
      <button
        onClick={handleOnramp}
        disabled={disabled || isLoading || !address}
        className={`flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-400 hover:to-blue-500 shadow-lg shadow-blue-500/25 ${className}`}
      >
        {isLoading ? (
          <Loader2 size={20} className="animate-spin" />
        ) : (
          <CreditCard size={20} />
        )}
        {isLoading ? 'Opening...' : 'Buy with Card'}
        {!isLoading && <ExternalLink size={14} className="ml-1 opacity-60" />}
      </button>
      
      {error && (
        <p className="text-red-400 text-xs mt-2 text-center">{error}</p>
      )}
    </div>
  );
}
