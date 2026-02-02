'use client';

import { useState, useCallback } from 'react';
import { Banknote, Loader2, ExternalLink } from 'lucide-react';

interface OfframpButtonProps {
  address: string;
  defaultAsset?: string;
  defaultNetwork?: string;
  redirectUrl?: string;
  className?: string;
  disabled?: boolean;
}

const COINBASE_PROJECT_ID = process.env.NEXT_PUBLIC_COINBASE_PROJECT_ID;

/**
 * Coinbase Offramp Button - Opens the Coinbase Sell widget
 * Uses session tokens for secure authentication
 */
export function OfframpButton({
  address,
  defaultAsset = 'USDC',
  defaultNetwork = 'arbitrum',
  redirectUrl,
  className = '',
  disabled = false,
}: OfframpButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOfframp = useCallback(async () => {
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
        throw new Error(data.error || 'Failed to initialize offramp');
      }

      const { token } = await response.json();

      // Build Coinbase Offramp URL
      const offrampUrl = new URL('https://pay.coinbase.com/v3/sell/input');
      offrampUrl.searchParams.set('sessionToken', token);
      
      if (COINBASE_PROJECT_ID) {
        offrampUrl.searchParams.set('appId', COINBASE_PROJECT_ID);
      }
      
      offrampUrl.searchParams.set('defaultNetwork', defaultNetwork);
      offrampUrl.searchParams.set('defaultAsset', defaultAsset);
      
      // Partner user reference for tracking
      offrampUrl.searchParams.set('partnerUserId', address.slice(0, 10));
      
      // Redirect URL after completion
      if (redirectUrl) {
        offrampUrl.searchParams.set('redirectUrl', redirectUrl);
      }

      // Open in new window
      window.open(offrampUrl.toString(), '_blank', 'width=460,height=750');
    } catch (err) {
      console.error('Offramp error:', err);
      setError(err instanceof Error ? err.message : 'Failed to open sell widget');
    } finally {
      setIsLoading(false);
    }
  }, [address, disabled, defaultAsset, defaultNetwork, redirectUrl]);

  return (
    <div className="flex flex-col">
      <button
        onClick={handleOfframp}
        disabled={disabled || isLoading || !address}
        className={`flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-400 hover:to-emerald-500 shadow-lg shadow-emerald-500/25 ${className}`}
      >
        {isLoading ? (
          <Loader2 size={20} className="animate-spin" />
        ) : (
          <Banknote size={20} />
        )}
        {isLoading ? 'Opening...' : 'Cash Out'}
        {!isLoading && <ExternalLink size={14} className="ml-1 opacity-60" />}
      </button>
      
      {error && (
        <p className="text-red-400 text-xs mt-2 text-center">{error}</p>
      )}
    </div>
  );
}
