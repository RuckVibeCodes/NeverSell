'use client';

import { useState, useEffect, useCallback } from 'react';
import { Rocket, Shield, Users, TrendingUp, BarChart3, Layers } from 'lucide-react';
import { VaultCard, VaultCardSkeleton } from './VaultCard';
import { VaultFilters } from './VaultFilters';
import type { 
  BeefyVaultWithStats, 
  VaultFilters as VaultFiltersType, 
  SortField, 
  SortOrder 
} from '@/lib/beefy';

interface VaultStats {
  totalVaults: number;
  totalTvl: number;
  avgApy: number;
  chainBreakdown: Record<string, number>;
}

interface VaultsResponse {
  vaults: BeefyVaultWithStats[];
  stats: VaultStats;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

interface VaultDiscoveryProps {
  onDepositClick: (vault: BeefyVaultWithStats) => void;
}

export function VaultDiscovery({ onDepositClick }: VaultDiscoveryProps) {
  const [vaults, setVaults] = useState<BeefyVaultWithStats[]>([]);
  const [stats, setStats] = useState<VaultStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<VaultFiltersType>({});
  const [sort, setSort] = useState<SortField>('apy');
  const [order, setOrder] = useState<SortOrder>('desc');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchVaults = useCallback(async (reset: boolean = false, currentOffset: number = 0) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.chains?.length) params.set('chains', filters.chains.join(','));
      if (filters.assets?.length) params.set('assets', filters.assets.join(','));
      if (filters.minApy) params.set('minApy', filters.minApy.toString());
      if (filters.maxRisk) params.set('maxRisk', filters.maxRisk);
      if (filters.minTvl) params.set('minTvl', filters.minTvl.toString());
      if (filters.search) params.set('search', filters.search);
      params.set('sort', sort);
      params.set('order', order);
      params.set('limit', '20');
      params.set('offset', reset ? '0' : currentOffset.toString());

      const res = await fetch(`/api/earn/vaults?${params}`);
      if (!res.ok) throw new Error('Failed to fetch vaults');
      
      const data: VaultsResponse = await res.json();
      
      if (reset) {
        setVaults(data.vaults);
        setOffset(20);
      } else {
        setVaults(prev => [...prev, ...data.vaults]);
        setOffset(prev => prev + 20);
      }
      
      setStats(data.stats);
      setHasMore(data.pagination.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [filters, sort, order]);

  useEffect(() => {
    fetchVaults(true, 0);
  }, [fetchVaults]);

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K`;
    return num.toFixed(0);
  };

  return (
    <div className="space-y-6">
      {/* Hero Stats */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-purple-500/10 border border-gray-800 rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Earn the Best Yields</h1>
            <p className="text-gray-400">Auto-routed across Arbitrum, Base, Optimism & Polygon</p>
          </div>
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              <StatItem 
                icon={Layers} 
                label="Total TVL" 
                value={`$${formatNumber(stats.totalTvl)}`} 
              />
              <StatItem 
                icon={TrendingUp} 
                label="Avg APY" 
                value={`${stats.avgApy.toFixed(1)}%`} 
              />
              <StatItem 
                icon={BarChart3} 
                label="Active Vaults" 
                value={stats.totalVaults.toString()} 
              />
              <StatItem 
                icon={Layers} 
                label="Chains" 
                value="4" 
              />
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickActionCard
          icon={Rocket}
          title="Quick Start"
          description="Auto-deposit to top vault"
          apy="~28% APY"
          color="emerald"
          onClick={() => {
            if (vaults[0]) onDepositClick(vaults[0]);
          }}
        />
        <QuickActionCard
          icon={Shield}
          title="Safe Yield"
          description="Stablecoin vaults only"
          apy="~8% APY"
          color="blue"
          onClick={() => {
            setFilters({ ...filters, assets: ['USDC', 'USDT', 'DAI'], maxRisk: 'low' });
          }}
        />
        <QuickActionCard
          icon={Users}
          title="Copy a Pro"
          description="Follow top creators"
          apy="Variable"
          color="purple"
          onClick={() => {
            window.location.href = '/app/earn/leaderboard';
          }}
        />
      </div>

      {/* Filters */}
      <VaultFilters
        filters={filters}
        sort={sort}
        order={order}
        onFiltersChange={setFilters}
        onSortChange={(s, o) => {
          setSort(s);
          setOrder(o);
        }}
      />

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
          {error}
          <button 
            onClick={() => fetchVaults(true)} 
            className="ml-2 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Vault Grid */}
      {loading && vaults.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <VaultCardSkeleton key={i} />
          ))}
        </div>
      ) : vaults.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">No vaults match your filters</p>
          <button
            onClick={() => setFilters({})}
            className="mt-4 text-emerald-400 hover:text-emerald-300"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vaults.map(vault => (
              <VaultCard key={vault.id} vault={vault} onDeposit={onDepositClick} />
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={() => fetchVaults(false, offset)}
                disabled={loading}
                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-white font-medium disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatItem({ 
  icon: Icon, 
  label, 
  value 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center">
        <Icon className="w-5 h-5 text-emerald-400" />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-lg font-semibold text-white">{value}</p>
      </div>
    </div>
  );
}

function QuickActionCard({
  icon: Icon,
  title,
  description,
  apy,
  color,
  onClick,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  apy: string;
  color: 'emerald' | 'blue' | 'purple';
  onClick: () => void;
}) {
  const colorClasses = {
    emerald: 'from-emerald-500/20 to-transparent border-emerald-500/30 hover:border-emerald-500/50',
    blue: 'from-blue-500/20 to-transparent border-blue-500/30 hover:border-blue-500/50',
    purple: 'from-purple-500/20 to-transparent border-purple-500/30 hover:border-purple-500/50',
  };

  const iconClasses = {
    emerald: 'bg-emerald-500/20 text-emerald-400',
    blue: 'bg-blue-500/20 text-blue-400',
    purple: 'bg-purple-500/20 text-purple-400',
  };

  const apyClasses = {
    emerald: 'text-emerald-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
  };

  return (
    <button
      onClick={onClick}
      className={`bg-gradient-to-b ${colorClasses[color]} border rounded-2xl p-5 text-left transition-all hover:scale-[1.02]`}
    >
      <div className={`w-12 h-12 rounded-xl ${iconClasses[color]} flex items-center justify-center mb-4`}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-400 mb-2">{description}</p>
      <p className={`text-sm font-medium ${apyClasses[color]}`}>{apy}</p>
    </button>
  );
}
