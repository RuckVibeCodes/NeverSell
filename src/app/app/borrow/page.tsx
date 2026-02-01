"use client";

import { ArrowUpFromLine, AlertCircle } from "lucide-react";

const borrowableAssets = [
  { symbol: "USDC", name: "USD Coin", rate: 5.2, available: 0, icon: "$" },
  { symbol: "USDT", name: "Tether", rate: 5.5, available: 0, icon: "$" },
  { symbol: "DAI", name: "Dai", rate: 4.8, available: 0, icon: "D" },
];

export default function BorrowPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Borrow</h1>
        <p className="text-white/60">Access liquidity without selling your assets</p>
      </div>

      <div className="glass-card p-4 mb-8 flex items-start gap-3 border-mint/30">
        <AlertCircle className="text-mint flex-shrink-0 mt-0.5" size={20} />
        <div>
          <p className="text-white text-sm">
            <span className="font-semibold">Borrowing Power:</span> $0.00
          </p>
          <p className="text-white/60 text-sm">
            Deposit assets first to unlock borrowing capacity.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {borrowableAssets.map((asset) => (
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
            </div>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Borrow APR</span>
                <span className="text-white">{asset.rate}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Available</span>
                <span className="text-white">${asset.available.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <input
                type="number"
                placeholder="0.00"
                disabled
                className="flex-1 bg-navy-200 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-mint/50 disabled:opacity-50"
              />
              <button disabled className="btn-primary flex items-center gap-2 opacity-50 cursor-not-allowed">
                <ArrowUpFromLine size={18} />
                Borrow
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
