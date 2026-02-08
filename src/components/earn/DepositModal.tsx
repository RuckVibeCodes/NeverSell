'use client';

import { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  Check,
  ExternalLink,
  ArrowRight,
  Loader2,
  Shield,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import type { BeefyVaultWithStats, BeefyChain } from '@/lib/beefy';

// Ethereum provider type (matching window.ethereum shape)
interface TypedEthereum {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

// Helper to get typed ethereum
function getTypedEthereum(): TypedEthereum | undefined {
  return window.ethereum as TypedEthereum | undefined;
}

interface DepositModalProps {
  vault: BeefyVaultWithStats;
  onClose: () => void;
}

const chainConfig: Record<BeefyChain, { rpc: string; chainId: number; name: string; explorer: string }> = {
  arbitrum: {
    rpc: 'https://arb1.arbitrum.io/rpc',
    chainId: 42161,
    name: 'Arbitrum One',
    explorer: 'https://arbiscan.io',
  },
  base: {
    rpc: 'https://mainnet.base.org',
    chainId: 8453,
    name: 'Base',
    explorer: 'https://basescan.org',
  },
  optimism: {
    rpc: 'https://mainnet.optimism.io',
    chainId: 10,
    name: 'Optimism',
    explorer: 'https://optimistic.etherscan.io',
  },
  polygon: {
    rpc: 'https://polygon-rpc.com',
    chainId: 137,
    name: 'Polygon',
    explorer: 'https://polygonscan.com',
  },
};

export function DepositModal({ vault, onClose }: DepositModalProps) {
  const [step, setStep] = useState<'input' | 'confirm' | 'pending' | 'success'>('input');
  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState<string>('0');
  const [isConnected, setIsConnected] = useState(false);
  const [isCorrectChain, setIsCorrectChain] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const chain = chainConfig[vault.chain];

  // Simulated wallet check (replace with actual wallet connection)
  useEffect(() => {
    // Check if wallet is connected
    const eth = getTypedEthereum();
    if (typeof window !== 'undefined' && eth) {
      eth.request({ method: 'eth_accounts' })
        .then((accounts) => {
          const accountList = accounts as string[];
          setIsConnected(accountList.length > 0);
          if (accountList.length > 0) {
            // Check chain
            eth.request({ method: 'eth_chainId' })
              .then((chainId) => {
                setIsCorrectChain(parseInt(chainId as string, 16) === chain.chainId);
              });
            // Get balance (simplified - would need actual token balance)
            setBalance('1.234'); // Placeholder
          }
        });
    }
  }, [chain.chainId]);

  const handleConnect = async () => {
    const eth = getTypedEthereum();
    if (eth) {
      try {
        await eth.request({ method: 'eth_requestAccounts' });
        setIsConnected(true);
      } catch (err) {
        console.error('Failed to connect wallet:', err);
      }
    }
  };

  const handleSwitchChain = async () => {
    const eth = getTypedEthereum();
    if (eth) {
      try {
        await eth.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${chain.chainId.toString(16)}` }],
        });
        setIsCorrectChain(true);
      } catch (err) {
        // If chain doesn't exist, add it
        const error = err as { code?: number };
        if (error.code === 4902) {
          try {
            await eth.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${chain.chainId.toString(16)}`,
                chainName: chain.name,
                rpcUrls: [chain.rpc],
              }],
            });
          } catch (addErr) {
            console.error('Failed to add chain:', addErr);
          }
        }
      }
    }
  };

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    setStep('pending');

    // Simulate transaction (replace with actual Beefy deposit)
    try {
      // 1. Approve token spending
      // 2. Deposit to vault
      await new Promise(resolve => setTimeout(resolve, 2000));
      setTxHash('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
      setStep('success');
    } catch (err) {
      console.error('Deposit failed:', err);
      setStep('input');
    }
  };

  const formatApy = (apy: number) => `${apy.toFixed(1)}%`;
  const formatTvl = (tvl: number) => {
    if (tvl >= 1_000_000) return `$${(tvl / 1_000_000).toFixed(1)}M`;
    if (tvl >= 1_000) return `$${(tvl / 1_000).toFixed(0)}K`;
    return `$${tvl.toFixed(0)}`;
  };

  const projectedEarnings = amount && parseFloat(amount) > 0
    ? (parseFloat(amount) * (vault.apy / 100)).toFixed(4)
    : '0';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Deposit to Vault</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Vault Info */}
          <div className="bg-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex -space-x-2">
                {vault.assets.slice(0, 2).map((asset) => (
                  <div
                    key={asset}
                    className="w-10 h-10 rounded-full bg-gray-700 border-2 border-gray-800 flex items-center justify-center text-sm font-bold"
                  >
                    {asset.slice(0, 2)}
                  </div>
                ))}
              </div>
              <div>
                <h3 className="font-semibold text-white">{vault.name}</h3>
                <p className="text-sm text-gray-400">{chain.name}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500">APY</p>
                <p className="text-emerald-400 font-medium flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {formatApy(vault.apy)}
                </p>
              </div>
              <div>
                <p className="text-gray-500">TVL</p>
                <p className="text-white font-medium">{formatTvl(vault.tvl)}</p>
              </div>
              <div>
                <p className="text-gray-500">Risk</p>
                <p className="text-white font-medium flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  {vault.riskScore}
                </p>
              </div>
            </div>
          </div>

          {/* Step: Input */}
          {step === 'input' && (
            <>
              {/* Wallet Connection */}
              {!isConnected ? (
                <button
                  onClick={handleConnect}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-medium text-white flex items-center justify-center gap-2"
                >
                  <Wallet className="w-5 h-5" />
                  Connect Wallet
                </button>
              ) : !isCorrectChain ? (
                <button
                  onClick={handleSwitchChain}
                  className="w-full py-3 bg-yellow-500 hover:bg-yellow-600 rounded-xl font-medium text-black flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="w-5 h-5" />
                  Switch to {chain.name}
                </button>
              ) : (
                <>
                  {/* Amount Input */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-gray-400">Amount</label>
                      <button
                        onClick={() => setAmount(balance)}
                        className="text-sm text-emerald-400 hover:text-emerald-300"
                      >
                        Max: {balance} {vault.assets[0]}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-lg focus:border-emerald-500 focus:outline-none"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                        {vault.assets[0]}
                      </span>
                    </div>
                  </div>

                  {/* Projected Earnings */}
                  {parseFloat(amount) > 0 && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                      <p className="text-sm text-gray-400 mb-1">Projected Yearly Earnings</p>
                      <p className="text-xl font-bold text-emerald-400">
                        +{projectedEarnings} {vault.assets[0]}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Based on current {formatApy(vault.apy)} APY
                      </p>
                    </div>
                  )}

                  {/* Deposit Button */}
                  <button
                    onClick={() => setStep('confirm')}
                    disabled={!amount || parseFloat(amount) <= 0}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-700 disabled:text-gray-500 rounded-xl font-medium text-white flex items-center justify-center gap-2"
                  >
                    Continue
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </>
          )}

          {/* Step: Confirm */}
          {step === 'confirm' && (
            <>
              <div className="bg-gray-800 rounded-xl p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">You deposit</span>
                  <span className="text-white font-medium">{amount} {vault.assets[0]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">To vault</span>
                  <span className="text-white font-medium">{vault.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Network</span>
                  <span className="text-white font-medium">{chain.name}</span>
                </div>
                <div className="flex justify-between border-t border-gray-700 pt-3">
                  <span className="text-gray-400">Est. yearly return</span>
                  <span className="text-emerald-400 font-medium">+{projectedEarnings} {vault.assets[0]}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('input')}
                  className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-medium text-white"
                >
                  Back
                </button>
                <button
                  onClick={handleDeposit}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-medium text-white"
                >
                  Confirm Deposit
                </button>
              </div>
            </>
          )}

          {/* Step: Pending */}
          {step === 'pending' && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Processing Deposit</h3>
              <p className="text-gray-400 text-sm">
                Please confirm the transaction in your wallet
              </p>
            </div>
          )}

          {/* Step: Success */}
          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Deposit Successful!</h3>
              <p className="text-gray-400 text-sm mb-4">
                Your funds are now earning {formatApy(vault.apy)} APY
              </p>
              {txHash && (
                <a
                  href={`${chain.explorer}/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-sm"
                >
                  View Transaction <ExternalLink className="w-4 h-4" />
                </a>
              )}
              <div className="mt-6">
                <button
                  onClick={onClose}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-medium text-white"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
