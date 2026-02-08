'use client';

import { useState } from 'react';
import {
  TrendingUp,
  Shield,
  AlertTriangle,
  Zap,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import type { BeefyVaultWithStats, BeefyChain } from '@/lib/beefy';

interface VaultCardProps {
  vault: BeefyVaultWithStats;
  onDeposit: (vault: BeefyVaultWithStats) => void;
}

const chainColors: Record<BeefyChain, string> = {
  arbitrum: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  base: 'bg-blue-400/20 text-blue-300 border-blue-400/30',
  optimism: 'bg-red-500/20 text-red-400 border-red-500/30',
  polygon: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

const chainLabels: Record<BeefyChain, string> = {
  arbitrum: 'ARB',
  base: 'BASE',
  optimism: 'OP',
  polygon: 'MATIC',
};

const riskColors = {
  low: 'bg-green-500/20 text-green-400',
  medium: 'bg-yellow-500/20 text-yellow-400',
  high: 'bg-red-500/20 text-red-400',
};

const riskIcons = {
  low: Shield,
  medium: Zap,
  high: AlertTriangle,
};

export function VaultCard({ vault, onDeposit }: VaultCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const RiskIcon = riskIcons[vault.riskScore];

  const formatTvl = (tvl: number) => {
    if (tvl >= 1_000_000) return `$${(tvl / 1_000_000).toFixed(1)}M`;
    if (tvl >= 1_000) return `$${(tvl / 1_000).toFixed(0)}K`;
    return `$${tvl.toFixed(0)}`;
  };

  const formatApy = (apy: number) => {
    if (apy >= 100) return `${apy.toFixed(0)}%`;
    return `${apy.toFixed(1)}%`;
  };

  return (
    <div
      className={`bg-gray-900 rounded-2xl border border-gray-800 p-5 transition-all cursor-pointer ${
        isHovered ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/10' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onDeposit(vault)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          {/* Chain Badge */}
          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${chainColors[vault.chain]}`}>
            {chainLabels[vault.chain]}
          </span>
          {/* Platform */}
          <span className="text-xs text-gray-500">{vault.platformId}</span>
        </div>
        {/* Risk Badge */}
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${riskColors[vault.riskScore]}`}>
          <RiskIcon className="w-3 h-3" />
          {vault.riskScore}
        </div>
      </div>

      {/* Asset Info */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          {/* Token Icons Placeholder */}
          <div className="flex -space-x-2">
            {vault.assets.slice(0, 2).map((asset) => (
              <div
                key={asset}
                className="w-8 h-8 rounded-full bg-gray-700 border-2 border-gray-900 flex items-center justify-center text-xs font-bold"
              >
                {asset.slice(0, 2)}
              </div>
            ))}
          </div>
          <h3 className="font-semibold text-white">{vault.name}</h3>
        </div>
        <p className="text-sm text-gray-400">{vault.assets.join(' + ')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">APY</p>
          <p className="text-2xl font-bold text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            {formatApy(vault.apy)}
          </p>
          {vault.apyBreakdown && (
            <p className="text-xs text-gray-500 mt-0.5">
              {formatApy(vault.apyBreakdown.vaultApr)} vault + {formatApy(vault.apyBreakdown.tradingApr)} trading
            </p>
          )}
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">TVL</p>
          <p className="text-xl font-semibold text-white">
            {formatTvl(vault.tvl)}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-800">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeposit(vault);
          }}
          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          Deposit
          <ChevronRight className="w-4 h-4" />
        </button>
        {vault.buyTokenUrl && (
          <a
            href={vault.buyTokenUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="ml-2 p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
        )}
      </div>
    </div>
  );
}

// Loading skeleton
export function VaultCardSkeleton() {
  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-12 h-5 bg-gray-700 rounded" />
          <div className="w-16 h-4 bg-gray-800 rounded" />
        </div>
        <div className="w-16 h-5 bg-gray-700 rounded" />
      </div>
      
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-gray-700 rounded-full" />
          <div className="w-8 h-8 bg-gray-700 rounded-full -ml-4" />
          <div className="w-32 h-5 bg-gray-700 rounded" />
        </div>
        <div className="w-24 h-4 bg-gray-800 rounded" />
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="w-12 h-3 bg-gray-800 rounded mb-2" />
          <div className="w-20 h-8 bg-gray-700 rounded" />
        </div>
        <div>
          <div className="w-12 h-3 bg-gray-800 rounded mb-2" />
          <div className="w-16 h-6 bg-gray-700 rounded" />
        </div>
      </div>
      
      <div className="pt-4 border-t border-gray-800">
        <div className="w-full h-10 bg-gray-700 rounded-lg" />
      </div>
    </div>
  );
}
