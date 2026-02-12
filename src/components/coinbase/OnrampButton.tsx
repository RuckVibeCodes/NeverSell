'use client';

import { useState, useCallback } from 'react';
import { CreditCard, Loader2, ExternalLink } from 'lucide-react';

interface OnrampButtonProps {
  address?: string; // Optional - can work without wallet
  defaultAsset?: string;
  defaultNetwork?: string;
  presetFiatAmount?: number;
  className?: string;
  disabled?: boolean;
}

const COINBASE_PROJECT_ID = process.env.NEXT_PUBLIC_COINBASE_PROJECT_ID;

/**
 * Coinbase Onramp Button - Opens the Coinbase Buy widget
 * Works with or without a connected wallet
 * - With wallet: Uses session token auth, funds go directly to connected wallet
 * - Without wallet: User enters their wallet address manually
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
  const [showAddressInput, setShowAddressInput] = useState(false);
  const [manualAddress, setManualAddress] = useState('');

  const openOnramp = useCallback(async (targetAddress: string) => {
    if (!targetAddress || !/^0x[a-fA-F0-9]{40}$/.test(targetAddress)) {
      setError('Please enter a valid Ethereum address');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get session token for the address
      const response = await fetch('/api/coinbase/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: targetAddress,
          blockchains: ['ethereum', 'arbitrum', 'base', 'optimism'],
          assets: ['ETH', 'USDC', 'USDT', 'DAI'],
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to initialize onramp');
      }

      const { token } = await response.json();

      // Build Coinbase Onramp URL with session token
      const onrampUrl = new URL('https://pay.coinbase.com/buy/select-asset');
      onrampUrl.searchParams.set('sessionToken', token);
      
      if (COINBASE_PROJECT_ID) {
        onrampUrl.searchParams.set('appId', COINBASE_PROJECT_ID);
      }
      
      onrampUrl.searchParams.set('defaultNetwork', defaultNetwork);
      onrampUrl.searchParams.set('defaultAsset', defaultAsset);
      onrampUrl.searchParams.set('presetFiatAmount', presetFiatAmount.toString());

      window.open(onrampUrl.toString(), '_blank', 'width=460,height=750');
      setShowAddressInput(false);
      setManualAddress('');
    } catch (err) {
      console.error('Onramp error:', err);
      setError(err instanceof Error ? err.message : 'Failed to open buy widget');
    } finally {
      setIsLoading(false);
    }
  }, [defaultAsset, defaultNetwork, presetFiatAmount]);

  const handleClick = useCallback(() => {
    if (disabled) return;
    
    if (address) {
      // Connected wallet - use that address
      openOnramp(address);
    } else {
      // No wallet - show address input
      setShowAddressInput(true);
    }
  }, [address, disabled, openOnramp]);

  const handleManualSubmit = useCallback(() => {
    openOnramp(manualAddress);
  }, [manualAddress, openOnramp]);

  if (showAddressInput) {
    return (
      <div className="flex flex-col gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
        <p className="text-white/80 text-sm text-center">
          Enter your wallet address to receive crypto
        </p>
        
        <input
          type="text"
          placeholder="0x..."
          value={manualAddress}
          onChange={(e) => {
            setManualAddress(e.target.value);
            setError(null);
          }}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500 font-mono text-sm"
        />
        
        <button
          onClick={handleManualSubmit}
          disabled={isLoading || !manualAddress}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <CreditCard size={18} />
          )}
          {isLoading ? 'Opening...' : 'Buy with Card'}
        </button>
        
        <button
          onClick={() => {
            setShowAddressInput(false);
            setManualAddress('');
            setError(null);
          }}
          className="text-white/50 text-sm hover:text-white/70"
        >
          Cancel
        </button>
        
        {error && (
          <p className="text-red-400 text-xs text-center">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <button
        onClick={handleClick}
        disabled={disabled || isLoading}
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
      
      {!address && (
        <p className="text-white/40 text-xs mt-2 text-center">
          No wallet connected? You can enter an address manually
        </p>
      )}
      
      {error && (
        <p className="text-red-400 text-xs mt-2 text-center">{error}</p>
      )}
    </div>
  );
}
