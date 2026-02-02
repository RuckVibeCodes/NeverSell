"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Search, 
  TrendingUp, 
  Droplets, 
  Filter, 
  ChevronDown, 
  ChevronUp,
  RefreshCw,
  ExternalLink,
  Loader2,
  AlertCircle,
  BarChart3,
  Layers,
  Star,
  TrendingUpIcon
} from "lucide-react";
import { 
  useAllGMXPools, 
  formatTVL, 
  formatPoolAPY, 
  getPoolAPYColor,
  type GMPool
} from "@/hooks/useAllGMXPools";
import { TokenLogo, StackedTokenLogos } from "@/components/ui/TokenLogo";

// Filter options
type SortBy = 'tvl' | 'apy' | 'symbol';
type SortOrder = 'asc' | 'desc';
type PoolTypeFilter = 'all' | 'standard' | 'single-sided';
type CategoryFilter = 'all' | 'favorites' | 'rwa' | 'defi' | 'meme';

// TVL filter presets
const TVL_PRESETS = [
  { label: 'All', value: 0 },
  { label: '$100K+', value: 100_000 },
  { label: '$1M+', value: 1_000_000 },
  { label: '$10M+', value: 10_000_000 },
  { label: '$50M+', value: 50_000_000 },
];

// Pool categories based on GMX token config
const CATEGORY_TOKENS: Record<string, string[]> = {
  rwa: ['XAU', 'XAG'], // Gold, Silver
  defi: ['AAVE', 'UNI', 'LINK', 'GMX', 'CRV', 'MKR', 'COMP', 'SNX', 'SUSHI', 'APE', 'AXS', 'ENS', 'LDO', 'RPL', 'BAL', 'YFI', 'CVX', 'FXS', 'ALCX'],
  meme: ['DOGE', 'PEPE', 'WIF', 'BONK', 'SHIB', 'FLOKI', 'ARBI', 'PENGU', 'MEME', 'NEIRO', 'BRETT', 'TURBO', 'MOG', 'BOME', 'WLD'],
};

// Get pool category based on long token symbol
function getPoolCategory(longToken: string): string {
  const token = longToken.toUpperCase();
  for (const [category, tokens] of Object.entries(CATEGORY_TOKENS)) {
    if (tokens.includes(token)) return category;
  }
  return 'other';
}

// Check if pool is in a specific category
function isPoolInCategory(pool: GMPool, category: CategoryFilter): boolean {
  if (category === 'all') return true;
  if (category === 'favorites') return false; // Handled separately
  
  const poolCategory = getPoolCategory(pool.longToken);
  return poolCategory === category;
}

// Pool card component
function PoolCard({ pool, isFavorite, onToggleFavorite }: { pool: GMPool; isFavorite: boolean; onToggleFavorite: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div 
      className="glass-card p-4 hover:border-mint/20 transition-all duration-300 cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <StackedTokenLogos 
            tokens={[
              { symbol: pool.indexTokenSymbol || pool.longToken },
              { symbol: pool.shortToken }
            ]}
            size={36}
          />
          <div>
            <h3 className="text-white font-medium">{pool.indexTokenSymbol || pool.longToken}/{pool.shortToken}</h3>
            <div className="flex items-center gap-2">
              <span className="text-white/40 text-xs">{pool.symbol}</span>
              {pool.poolType === 'single-sided' && (
                <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 text-[10px]">
                  Single-sided
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(pool.id);
            }}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <Star 
              size={20} 
              className={isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-white/30 hover:text-white/60'} 
            />
          </button>
          <div className="text-right">
            <p className={`text-xl font-bold ${getPoolAPYColor(pool.apy)}`}>
              {formatPoolAPY(pool.apy)}
            </p>
            <p className="text-white/40 text-xs">APY</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5">
          <Droplets size={14} className="text-purple-400" />
          <span className="text-white/60">TVL:</span>
          <span className="text-white">{formatTVL(pool.tvlUsd)}</span>
        </div>
        {pool.apy7d !== null && (
          <div className="flex items-center gap-1">
            <span className="text-white/40 text-xs">7d:</span>
            <span className={`text-xs ${pool.apy7d >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {pool.apy7d >= 0 ? '+' : ''}{pool.apy7d.toFixed(1)}%
            </span>
          </div>
        )}
        <ChevronDown 
          size={16} 
          className={`text-white/40 transition-transform ${expanded ? 'rotate-180' : ''}`} 
        />
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
          {/* Pool composition */}
          <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
            <p className="text-white/40 text-xs mb-2">Pool Composition</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <TokenLogo symbol={pool.longToken} size={24} />
                <span className="text-white text-sm">{pool.longToken}</span>
              </div>
              <span className="text-white/30">+</span>
              <div className="flex items-center gap-2">
                <TokenLogo symbol={pool.shortToken} size={24} />
                <span className="text-white text-sm">{pool.shortToken}</span>
              </div>
            </div>
          </div>

          {/* APY breakdown */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 rounded-lg bg-white/[0.03] text-center">
              <p className="text-white/40 text-[10px]">Current APY</p>
              <p className={`font-medium ${getPoolAPYColor(pool.apy)}`}>{formatPoolAPY(pool.apy)}</p>
            </div>
            <div className="p-2 rounded-lg bg-white/[0.03] text-center">
              <p className="text-white/40 text-[10px]">7d Change</p>
              <p className={`font-medium ${(pool.apy7d ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {pool.apy7d !== null ? `${pool.apy7d >= 0 ? '+' : ''}${pool.apy7d.toFixed(1)}%` : '-'}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-white/[0.03] text-center">
              <p className="text-white/40 text-[10px]">30d Mean</p>
              <p className="font-medium text-white">
                {pool.apy30d !== null ? formatPoolAPY(pool.apy30d) : '-'}
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex gap-2">
            <a
              href="/app/pools"
              className="flex-1 py-2 rounded-lg bg-mint/10 border border-mint/30 text-mint text-sm text-center hover:bg-mint/20 transition-colors flex items-center justify-center gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              Quick Start →
            </a>
            <a
              href="/app/vaults"
              className="flex-1 py-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 text-sm text-center hover:bg-purple-500/20 transition-colors flex items-center justify-center gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              Add to Portfolio →
            </a>
          </div>

          {/* External links (smaller) */}
          <div className="flex gap-2 pt-2">
            <a
              href={`https://app.gmx.io/#/pools/details?market=${pool.marketToken}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-1.5 text-white/40 text-xs text-center hover:text-white/60 transition-colors flex items-center justify-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              GMX <ExternalLink size={10} />
            </a>
            <a
              href={`https://arbiscan.io/address/${pool.marketToken}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-1.5 text-white/40 text-xs text-center hover:text-white/60 transition-colors flex items-center justify-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              Arbiscan <ExternalLink size={10} />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// Stats summary component
function StatsSummary({ pools }: { pools: GMPool[] }) {
  const stats = useMemo(() => {
    if (pools.length === 0) return null;
    
    const totalTvl = pools.reduce((sum, p) => sum + p.tvlUsd, 0);
    const avgApy = pools.reduce((sum, p) => sum + p.apy, 0) / pools.length;
    const maxApy = Math.max(...pools.map(p => p.apy));
    
    return { totalTvl, avgApy, maxApy, count: pools.length };
  }, [pools]);

  if (!stats) return null;

  return (
    <div className="glass-card p-4 mb-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <p className="text-white/40 text-xs mb-1">Total Pools</p>
          <p className="text-2xl font-bold text-white">{stats.count}</p>
        </div>
        <div>
          <p className="text-white/40 text-xs mb-1">Total TVL</p>
          <p className="text-2xl font-bold text-mint">{formatTVL(stats.totalTvl)}</p>
        </div>
        <div>
          <p className="text-white/40 text-xs mb-1">Avg APY</p>
          <p className={`text-2xl font-bold ${getPoolAPYColor(stats.avgApy)}`}>
            {formatPoolAPY(stats.avgApy)}
          </p>
        </div>
        <div>
          <p className="text-white/40 text-xs mb-1">Max APY</p>
          <p className={`text-2xl font-bold ${getPoolAPYColor(stats.maxApy)}`}>
            {formatPoolAPY(stats.maxApy)}
          </p>
        </div>
      </div>
    </div>
  );
}

// Main page component
export default function MarketsPage() {
  const { pools, isLoading, isError, error, lastUpdated, refetch } = useAllGMXPools();
  
  // Filter state - show all pools by default (user can filter if needed)
  const [search, setSearch] = useState('');
  const [minTvl, setMinTvl] = useState(0); // Show all TVL levels by default
  const [minApy, setMinApy] = useState(0);
  const [poolType, setPoolType] = useState<PoolTypeFilter>('all');
  const [mainOnly, setMainOnly] = useState(false); // Show all pools by default
  const [sortBy, setSortBy] = useState<SortBy>('tvl');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showFilters, setShowFilters] = useState(false);
  
  // Category filter
  const [category, setCategory] = useState<CategoryFilter>('all');
  
  // Favorites state with localStorage persistence
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  // Load favorites from localStorage on mount
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem('gmx-pool-favorites');
      if (saved) {
        const ids = JSON.parse(saved);
        setFavorites(new Set(ids));
      }
    } catch (e) {
      console.error('Failed to load favorites:', e);
    }
  }, []);

  // Save favorites to localStorage when they change
  const toggleFavorite = (poolId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(poolId)) {
      newFavorites.delete(poolId);
    } else {
      newFavorites.add(poolId);
    }
    setFavorites(newFavorites);
    try {
      localStorage.setItem('gmx-pool-favorites', JSON.stringify(Array.from(newFavorites)));
    } catch (e) {
      console.error('Failed to save favorites:', e);
    }
  };

  // Filtered pools
  const filteredPools = useMemo(() => {
    let result = [...pools];

    // Category filter
    if (category === 'favorites') {
      result = result.filter(p => favorites.has(p.id));
    } else if (category !== 'all') {
      result = result.filter(p => isPoolInCategory(p, category));
    }

    // Main pools only - dedupe to highest TVL per symbol
    if (mainOnly) {
      const mainPoolsBySymbol = new Map<string, GMPool>();
      for (const pool of result) {
        const existing = mainPoolsBySymbol.get(pool.symbol);
        if (!existing || pool.tvlUsd > existing.tvlUsd) {
          mainPoolsBySymbol.set(pool.symbol, pool);
        }
      }
      result = Array.from(mainPoolsBySymbol.values());
    }

    // Search filter - includes index token for assets like PENGU, ASTER
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        p => 
          p.symbol.toLowerCase().includes(searchLower) ||
          p.name.toLowerCase().includes(searchLower) ||
          p.longToken.toLowerCase().includes(searchLower) ||
          p.shortToken.toLowerCase().includes(searchLower) ||
          p.indexTokenSymbol.toLowerCase().includes(searchLower)
      );
    }

    // TVL filter
    if (minTvl > 0) {
      result = result.filter(p => p.tvlUsd >= minTvl);
    }

    // APY filter
    if (minApy > 0) {
      result = result.filter(p => p.apy >= minApy);
    }

    // Pool type filter
    if (poolType !== 'all') {
      result = result.filter(p => p.poolType === poolType);
    }

    // Sort
    const multiplier = sortOrder === 'desc' ? -1 : 1;
    result.sort((a, b) => {
      if (sortBy === 'tvl') {
        return (a.tvlUsd - b.tvlUsd) * multiplier;
      } else if (sortBy === 'apy') {
        return (a.apy - b.apy) * multiplier;
      } else {
        return a.symbol.localeCompare(b.symbol) * multiplier;
      }
    });

    return result;
  }, [pools, category, favorites, mainOnly, search, minTvl, minApy, poolType, sortBy, sortOrder]);

  // Toggle sort
  const handleSort = (column: SortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-mint/20 to-purple-500/20 flex items-center justify-center">
              <BarChart3 size={20} className="text-mint" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-white">Research</h1>
              <p className="text-white/50 text-sm">Analyze GM liquidity pools. Find your edge.</p>
            </div>
          </div>
          <button
            onClick={refetch}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
        {lastUpdated && (
          <p className="text-white/30 text-xs">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Ready to earn? CTA Banner */}
      <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-mint/10 via-purple-500/10 to-orange-500/10 border border-mint/20">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-mint/20 flex items-center justify-center">
              <span className="text-xl">🚀</span>
            </div>
            <div>
              <p className="text-white font-medium">Ready to earn?</p>
              <p className="text-white/60 text-sm">Research complete? Start earning yield now.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <a
              href="/app/pools"
              className="px-4 py-2 rounded-lg bg-mint text-navy font-medium text-sm hover:bg-mint/90 transition-colors"
            >
              Quick Start →
            </a>
            <a
              href="/app/vaults"
              className="px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400 font-medium text-sm hover:bg-purple-500/30 transition-colors"
            >
              Create Portfolio →
            </a>
          </div>
        </div>
      </div>

      {/* Stats summary */}
      <StatsSummary pools={filteredPools} />

      {/* Category tabs */}
      <div className="mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { id: 'all', label: 'All Markets', icon: Layers },
            { id: 'favorites', label: 'Favorites', icon: Star, badge: mounted ? favorites.size : 0 },
            { id: 'rwa', label: 'RWA', icon: TrendingUpIcon },
            { id: 'defi', label: 'DeFi', icon: TrendingUp },
            { id: 'meme', label: 'Meme', icon: TrendingUpIcon },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setCategory(tab.id as CategoryFilter)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-colors ${
                  category === tab.id
                    ? 'bg-mint/20 text-mint border border-mint/30'
                    : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
                }`}
              >
                <Icon size={16} />
                <span className="text-sm font-medium">{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                    category === tab.id ? 'bg-mint/30 text-mint' : 'bg-white/20 text-white/60'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="mb-6 space-y-4">
        {/* Search bar */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search pools (e.g., BTC, ETH, SOL...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-navy-light border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-mint/50 transition-colors"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors ${
              showFilters 
                ? 'bg-mint/10 border-mint/30 text-mint' 
                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
            }`}
          >
            <Filter size={18} />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="glass-card p-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Min TVL */}
              <div>
                <label className="text-white/60 text-xs mb-2 block">Minimum TVL</label>
                <div className="flex flex-wrap gap-2">
                  {TVL_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => setMinTvl(preset.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        minTvl === preset.value
                          ? 'bg-mint/20 text-mint border border-mint/30'
                          : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Min APY */}
              <div>
                <label className="text-white/60 text-xs mb-2 block">Minimum APY</label>
                <input
                  type="number"
                  placeholder="0"
                  value={minApy || ''}
                  onChange={(e) => setMinApy(Number(e.target.value) || 0)}
                  className="w-full bg-navy-light border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-mint/50 text-sm"
                />
              </div>

              {/* Pool type */}
              <div>
                <label className="text-white/60 text-xs mb-2 block">Pool Type</label>
                <div className="flex gap-2">
                  {(['all', 'standard', 'single-sided'] as PoolTypeFilter[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setPoolType(type)}
                      className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ${
                        poolType === type
                          ? 'bg-mint/20 text-mint border border-mint/30'
                          : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div>
                <label className="text-white/60 text-xs mb-2 block">Sort By</label>
                <div className="flex gap-2">
                  {(['tvl', 'apy', 'symbol'] as SortBy[]).map((col) => (
                    <button
                      key={col}
                      onClick={() => handleSort(col)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ${
                        sortBy === col
                          ? 'bg-mint/20 text-mint border border-mint/30'
                          : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {col}
                      {sortBy === col && (
                        sortOrder === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main pools toggle */}
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium">Main pools only</p>
                <p className="text-white/40 text-xs">Show only the highest TVL pool per market (hides duplicates)</p>
              </div>
              <button
                onClick={() => setMainOnly(!mainOnly)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  mainOnly ? 'bg-mint' : 'bg-white/20'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  mainOnly ? 'left-7' : 'left-1'
                }`} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-white/50 text-sm">
          Showing {filteredPools.length} of {pools.length} pools
          {category !== 'all' && <span className="text-mint ml-1">({category})</span>}
          {mainOnly && <span className="text-mint ml-1">(main pools)</span>}
        </p>
        {(search || minTvl > 0 || minApy > 0 || poolType !== 'all' || mainOnly || category !== 'all') && (
          <button
            onClick={() => {
              setSearch('');
              setMinTvl(0);
              setMinApy(0);
              setPoolType('all');
              setMainOnly(false);
              setCategory('all');
            }}
            className="text-mint text-sm hover:underline"
          >
            Reset filters
          </button>
        )}
      </div>

      {/* Loading state */}
      {isLoading && pools.length === 0 && (
        <div className="glass-card p-12 text-center">
          <Loader2 size={32} className="text-mint animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading GM pools from GMX...</p>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="glass-card p-8 text-center">
          <AlertCircle size={32} className="text-red-400 mx-auto mb-4" />
          <p className="text-white font-medium mb-2">Failed to load pools</p>
          <p className="text-white/50 text-sm mb-4">{error?.message}</p>
          <button
            onClick={refetch}
            className="px-4 py-2 rounded-lg bg-mint text-navy-100 font-medium hover:bg-mint/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && filteredPools.length === 0 && (
        <div className="glass-card p-12 text-center">
          <Layers size={32} className="text-white/30 mx-auto mb-4" />
          <p className="text-white font-medium mb-2">No pools found</p>
          <p className="text-white/50 text-sm">
            Try adjusting your search or filters
          </p>
        </div>
      )}

      {/* Pool grid */}
      {filteredPools.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPools.map((pool) => (
            <PoolCard 
              key={pool.id} 
              pool={pool} 
              isFavorite={favorites.has(pool.id)}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      )}

      {/* Info banner */}
      <div className="mt-8 p-4 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-start gap-3">
          <TrendingUp size={20} className="text-mint mt-0.5" />
          <div>
            <p className="text-white font-medium">About GM Pools</p>
            <p className="text-white/60 text-sm mt-1">
              GM pools are GMX V2 liquidity pools that earn fees from traders using leverage. 
              Each pool is composed of a long token (e.g., ETH, BTC) and a short token (usually USDC). 
              APYs are variable based on trading volume and market activity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
