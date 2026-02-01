"use client";

import { ArrowDownToLine } from "lucide-react";

const supportedAssets = [
  { symbol: "ETH", name: "Ethereum", apy: 3.2, icon: "Ξ" },
  { symbol: "WBTC", name: "Wrapped Bitcoin", apy: 1.8, icon: "₿" },
  { symbol: "ARB", name: "Arbitrum", apy: 5.1, icon: "A" },
  { symbol: "USDC", name: "USD Coin", apy: 4.5, icon: "$" },
];

export default function DepositPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Deposit</h1>
        <p className="text-white/60">Supply assets to earn yield and use as collateral</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {supportedAssets.map((asset) => (
          <div key={asset.symbol} className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-mint/10 flex items-center justify-center text-mint font-bold">
                  {asset.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{asset.symbol}</h3>
                  <p className="text-white/50 text-sm">{asset.name}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-mint font-semibold">{asset.apy}% APY</div>
                <div className="text-white/50 text-sm">Supply Rate</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <input
                type="number"
                placeholder="0.00"
                className="flex-1 bg-navy-200 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-mint/50"
              />
              <button className="btn-primary flex items-center gap-2">
                <ArrowDownToLine size={18} />
                Deposit
              </button>
            </div>
            
            <div className="flex justify-between mt-3 text-sm text-white/50">
              <span>Wallet Balance: 0.00 {asset.symbol}</span>
              <button className="text-mint hover:underline">MAX</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
