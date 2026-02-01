"use client";

import { Vault, TrendingUp, Shield, Zap } from "lucide-react";

const vaults = [
  {
    name: "Conservative Yield",
    description: "Low-risk stablecoin strategies",
    apy: 8.5,
    tvl: 0,
    risk: "Low",
    icon: Shield,
  },
  {
    name: "Balanced Growth",
    description: "Mixed asset yield optimization",
    apy: 15.2,
    tvl: 0,
    risk: "Medium",
    icon: TrendingUp,
  },
  {
    name: "Aggressive Alpha",
    description: "High-yield leveraged strategies",
    apy: 28.7,
    tvl: 0,
    risk: "High",
    icon: Zap,
  },
];

const riskColors = {
  Low: "text-green-400",
  Medium: "text-yellow-400",
  High: "text-red-400",
};

export default function VaultsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Vaults</h1>
        <p className="text-white/60">Automated yield strategies for passive income</p>
      </div>

      <div className="glass-card p-6 mb-8 text-center border-mint/30">
        <Vault className="mx-auto mb-4 text-mint" size={48} />
        <h2 className="text-xl font-semibold text-white mb-2">Vaults Coming Soon</h2>
        <p className="text-white/60 max-w-lg mx-auto">
          Automated yield strategies are under development. Deposit assets to earn base yields while we build out advanced vault strategies.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {vaults.map((vault) => (
          <div key={vault.name} className="glass-card p-6 opacity-60">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-mint/10 flex items-center justify-center">
                <vault.icon className="text-mint" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{vault.name}</h3>
                <p className="text-white/50 text-sm">{vault.description}</p>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-white/50">Projected APY</span>
                <span className="text-mint font-semibold">{vault.apy}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">TVL</span>
                <span className="text-white">${vault.tvl.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Risk Level</span>
                <span className={riskColors[vault.risk as keyof typeof riskColors]}>{vault.risk}</span>
              </div>
            </div>
            
            <button disabled className="w-full btn-secondary opacity-50 cursor-not-allowed">
              Coming Soon
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
