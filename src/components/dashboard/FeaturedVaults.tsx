'use client';

import Link from 'next/link';
import { Flame, TrendingUp, Users, ArrowRight } from 'lucide-react';

interface Vault {
  id: string;
  name: string;
  creator: string;
  apy: number;
  tvl: number;
  depositors: number;
}

// Placeholder vault data
const FEATURED_VAULTS: Vault[] = [
  {
    id: '1',
    name: 'BTC Maximalist',
    creator: 'CryptoMaxi',
    apy: 16.2,
    tvl: 2400000,
    depositors: 847,
  },
  {
    id: '2',
    name: 'Balanced Growth',
    creator: 'DeFiPro',
    apy: 14.8,
    tvl: 1800000,
    depositors: 623,
  },
  {
    id: '3',
    name: 'Altcoin Alpha',
    creator: 'DeFiDegen',
    apy: 24.8,
    tvl: 890000,
    depositors: 312,
  },
];

function formatTVL(tvl: number): string {
  if (tvl >= 1000000) return `$${(tvl / 1000000).toFixed(1)}M`;
  if (tvl >= 1000) return `$${(tvl / 1000).toFixed(0)}K`;
  return `$${tvl}`;
}

/**
 * FeaturedVaults - Showcase top vaults on the dashboard
 */
export function FeaturedVaults() {
  return (
    <div className="glass-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-400" />
          <h2 className="text-lg font-semibold text-white/80">Popular Vaults</h2>
        </div>
        <Link
          href="/app/vaults"
          className="flex items-center gap-1 text-sm text-white/50 hover:text-white transition-colors"
        >
          <span>View all</span>
          <ArrowRight size={14} />
        </Link>
      </div>
      
      {/* Vault cards */}
      <div className="space-y-3">
        {FEATURED_VAULTS.map((vault) => (
          <Link
            key={vault.id}
            href={`/app/vaults/${vault.id}`}
            className="block p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-medium text-white">{vault.name}</h3>
                <p className="text-sm text-white/50">by {vault.creator}</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-mint">{vault.apy.toFixed(1)}%</div>
                <div className="text-xs text-white/40">APY</div>
              </div>
            </div>
            
            {/* Stats */}
            <div className="flex items-center gap-4 text-xs text-white/40">
              <div className="flex items-center gap-1">
                <TrendingUp size={12} />
                <span>{formatTVL(vault.tvl)} TVL</span>
              </div>
              <div className="flex items-center gap-1">
                <Users size={12} />
                <span>{vault.depositors} depositors</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
