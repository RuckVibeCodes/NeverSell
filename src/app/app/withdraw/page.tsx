"use client";

import { useState } from 'react';
import { ArrowUpFromLine, ExternalLink, Clock, Shield } from 'lucide-react';

const SUPPORTED_CHAINS = [
  { id: 1, name: 'Ethereum', symbol: 'ETH', icon: '♦' },
  { id: 137, name: 'Polygon', symbol: 'MATIC', icon: '♦' },
  { id: 42161, name: 'Arbitrum', symbol: 'ETH', icon: 'A' },
  { id: 8453, name: 'Base', symbol: 'ETH', icon: 'B' },
];

export default function WithdrawPage() {
  const [selectedChain, setSelectedChain] = useState(1);
  const [amount, setAmount] = useState('');
  const [withdrawType, setWithdrawType] = useState<'percentage' | 'usd'>('percentage');
  const [isLoading, setIsLoading] = useState(false);
  const [quote, setQuote] = useState<any>(null);

  const handleGetQuote = async () => {
    setIsLoading(true);
    // Mock API call - in production, call /api/positions/:id/withdraw
    setTimeout(() => {
      setQuote({
        id: 'withdraw_123',
        estimatedUsdc: '25000000', // $25 USDC
        bridgeFee: '25000', // 0.1%
        protocolFee: '25000', // 0.1%
        totalFees: '50000',
        netAmount: '24950000',
        destinationChain: selectedChain,
        estimatedTimeMinutes: 15,
      });
      setIsLoading(false);
    }, 1000);
  };

  const handleWithdraw = async () => {
    if (!quote) return;
    setIsLoading(true);
    // In production, this would execute the transaction
    setTimeout(() => {
      alert('Withdrawal initiated! Check your wallet to sign the transaction.');
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Withdraw</h1>
        <p className="text-white/60">Bridge your funds back to your wallet on any chain</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Withdrawal Form */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Withdraw Funds</h2>

          {/* Amount Input */}
          <div className="mb-6">
            <label className="block text-white/60 text-sm mb-2">Withdraw Amount</label>
            <div className="flex gap-2 mb-2">
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  withdrawType === 'percentage'
                    ? 'bg-mint text-navy-900'
                    : 'bg-navy-200 text-white/60 hover:text-white'
                }`}
                onClick={() => setWithdrawType('percentage')}
              >
                Percentage
              </button>
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  withdrawType === 'usd'
                    ? 'bg-mint text-navy-900'
                    : 'bg-navy-200 text-white/60 hover:text-white'
                }`}
                onClick={() => setWithdrawType('usd')}
              >
                USD Amount
              </button>
            </div>
            <div className="relative">
              <input
                type="number"
                placeholder={withdrawType === 'percentage' ? '100' : '0.00'}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-navy-200 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-mint/50"
              />
              {withdrawType === 'percentage' && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">
                  %
                </span>
              )}
              {withdrawType === 'usd' && (
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                  $
                </span>
              )}
            </div>
            <div className="flex justify-between mt-2 text-sm text-white/50">
              <span>Position Value: $125,420.50</span>
              <button
                className="text-mint hover:underline"
                onClick={() => setAmount(withdrawType === 'percentage' ? '100' : '125420.50')}
              >
                MAX
              </button>
            </div>
          </div>

          {/* Destination Chain */}
          <div className="mb-6">
            <label className="block text-white/60 text-sm mb-2">Destination Chain</label>
            <div className="grid grid-cols-2 gap-2">
              {SUPPORTED_CHAINS.map((chain) => (
                <button
                  key={chain.id}
                  onClick={() => setSelectedChain(chain.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    selectedChain === chain.id
                      ? 'border-mint bg-mint/10'
                      : 'border-white/10 bg-navy-200 hover:border-white/30'
                  }`}
                >
                  <span className="text-lg">{chain.icon}</span>
                  <div className="text-left">
                    <div className="text-white font-medium text-sm">{chain.name}</div>
                    <div className="text-white/40 text-xs">{chain.symbol}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Get Quote Button */}
          <button
            onClick={handleGetQuote}
            disabled={isLoading || !amount}
            className="w-full btn-primary flex items-center justify-center gap-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>Processing...</>
            ) : (
              <>
                <ArrowUpFromLine size={18} />
                Get Withdrawal Quote
              </>
            )}
          </button>
        </div>

        {/* Quote Details */}
        {quote ? (
          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Withdrawal Quote</h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-white/60">Estimated Amount</span>
                <span className="text-white font-semibold">${(parseInt(quote.estimatedUsdc) / 1_000_000).toFixed(2)}</span>
              </div>

              <div className="border-t border-white/10 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Bridge Fee (0.1%)</span>
                  <span className="text-white/80">${(parseInt(quote.bridgeFee) / 1_000_000).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Protocol Fee (0.1%)</span>
                  <span className="text-white/80">${(parseInt(quote.protocolFee) / 1_000_000).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold pt-2 border-t border-white/10">
                  <span className="text-white/80">Total Fees</span>
                  <span className="text-white">${(parseInt(quote.totalFees) / 1_000_000).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4">
                <span className="text-white/60">Net Amount</span>
                <span className="text-mint font-bold text-lg">${(parseInt(quote.netAmount) / 1_000_000).toFixed(2)}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-white/50 pt-2">
                <Clock size={14} />
                <span>Estimated time: ~{quote.estimatedTimeMinutes} minutes</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-white/50 pt-2">
                <Shield size={14} />
                <span>Secured by LiFi bridge protocol</span>
              </div>
            </div>

            <button
              onClick={handleWithdraw}
              disabled={isLoading}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3 mt-6 disabled:opacity-50"
            >
              {isLoading ? 'Signing Transaction...' : 'Confirm Withdrawal'}
            </button>

            <p className="text-center text-white/40 text-xs mt-4">
              You&apos;ll need to sign a transaction in your wallet
            </p>
          </div>
        ) : (
          <div className="glass-card p-6 flex items-center justify-center text-white/40">
            <div className="text-center">
              <ArrowUpFromLine size={48} className="mx-auto mb-4 opacity-50" />
              <p>Enter an amount and select a destination chain to get a quote</p>
            </div>
          </div>
        )}
      </div>

      {/* Info Cards */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <h3 className="text-white font-medium mb-2">Fast Bridge Times</h3>
          <p className="text-white/60 text-sm">
            Most withdrawals complete in 2-15 minutes depending on destination chain.
          </p>
        </div>
        <div className="glass-card p-4">
          <h3 className="text-white font-medium mb-2">Low Fees</h3>
          <p className="text-white/60 text-sm">
            Only 0.1% bridge fee + 0.1% protocol fee. No hidden costs.
          </p>
        </div>
        <div className="glass-card p-4">
          <h3 className="text-white font-medium mb-2">Secure Protocol</h3>
          <p className="text-white/60 text-sm">
            Powered by LiFi, the most trusted bridge protocol in DeFi.
          </p>
        </div>
      </div>
    </div>
  );
}
