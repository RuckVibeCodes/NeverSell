'use client';

import { useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { BEEFY_CHAINS, type BeefyChain, type VaultFilters as VaultFiltersType, type SortField, type SortOrder } from '@/lib/beefy';

interface VaultFiltersProps {
  filters: VaultFiltersType;
  sort: SortField;
  order: SortOrder;
  onFiltersChange: (filters: VaultFiltersType) => void;
  onSortChange: (sort: SortField, order: SortOrder) => void;
}

const chainLabels: Record<BeefyChain, string> = {
  arbitrum: 'Arbitrum',
  base: 'Base',
  optimism: 'Optimism',
  polygon: 'Polygon',
};

const sortOptions: { value: SortField; label: string }[] = [
  { value: 'apy', label: 'APY' },
  { value: 'tvl', label: 'TVL' },
  { value: 'risk', label: 'Risk' },
  { value: 'name', label: 'Name' },
];

const assetOptions = ['ETH', 'USDC', 'USDT', 'BTC', 'DAI', 'WETH', 'ARB', 'OP'];

export function VaultFilters({
  filters,
  sort,
  order,
  onFiltersChange,
  onSortChange,
}: VaultFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchValue, setSearchValue] = useState(filters.search || '');

  const handleSearchSubmit = () => {
    onFiltersChange({ ...filters, search: searchValue || undefined });
  };

  const handleChainToggle = (chain: BeefyChain) => {
    const currentChains = filters.chains || [];
    const newChains = currentChains.includes(chain)
      ? currentChains.filter(c => c !== chain)
      : [...currentChains, chain];
    onFiltersChange({ ...filters, chains: newChains.length ? newChains : undefined });
  };

  const handleAssetToggle = (asset: string) => {
    const currentAssets = filters.assets || [];
    const newAssets = currentAssets.includes(asset)
      ? currentAssets.filter(a => a !== asset)
      : [...currentAssets, asset];
    onFiltersChange({ ...filters, assets: newAssets.length ? newAssets : undefined });
  };

  const handleRiskChange = (risk: 'low' | 'medium' | 'high' | undefined) => {
    onFiltersChange({ ...filters, maxRisk: risk });
  };

  const clearFilters = () => {
    setSearchValue('');
    onFiltersChange({});
  };

  const hasActiveFilters = 
    filters.search || 
    filters.chains?.length || 
    filters.assets?.length || 
    filters.maxRisk || 
    filters.minApy || 
    filters.minTvl;

  return (
    <div className="space-y-4">
      {/* Search and Sort Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
            placeholder="Search vaults, tokens, platforms..."
            className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortField, order)}
            className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:outline-none cursor-pointer"
          >
            {sortOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                Sort: {opt.label}
              </option>
            ))}
          </select>
          
          <button
            onClick={() => onSortChange(sort, order === 'desc' ? 'asc' : 'desc')}
            className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white hover:border-gray-700"
          >
            {order === 'desc' ? '↓' : '↑'}
          </button>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-2 bg-gray-900 border rounded-xl px-4 py-3 transition-colors ${
              showAdvanced || hasActiveFilters
                ? 'border-emerald-500 text-emerald-400'
                : 'border-gray-800 text-gray-400 hover:border-gray-700'
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
            Filters
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-4">
          {/* Chains */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Chains</label>
            <div className="flex flex-wrap gap-2">
              {BEEFY_CHAINS.map(chain => (
                <button
                  key={chain}
                  onClick={() => handleChainToggle(chain)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filters.chains?.includes(chain)
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                      : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
                  }`}
                >
                  {chainLabels[chain]}
                </button>
              ))}
            </div>
          </div>

          {/* Assets */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Assets</label>
            <div className="flex flex-wrap gap-2">
              {assetOptions.map(asset => (
                <button
                  key={asset}
                  onClick={() => handleAssetToggle(asset)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filters.assets?.includes(asset)
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                      : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
                  }`}
                >
                  {asset}
                </button>
              ))}
            </div>
          </div>

          {/* Risk Level */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Max Risk</label>
            <div className="flex flex-wrap gap-2">
              {(['low', 'medium', 'high'] as const).map(risk => (
                <button
                  key={risk}
                  onClick={() => handleRiskChange(filters.maxRisk === risk ? undefined : risk)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filters.maxRisk === risk
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                      : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
                  }`}
                >
                  {risk.charAt(0).toUpperCase() + risk.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Min APY & TVL */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Min APY (%)</label>
              <input
                type="number"
                value={filters.minApy || ''}
                onChange={(e) => onFiltersChange({
                  ...filters,
                  minApy: e.target.value ? parseFloat(e.target.value) : undefined,
                })}
                placeholder="0"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Min TVL ($)</label>
              <input
                type="number"
                value={filters.minTvl || ''}
                onChange={(e) => onFiltersChange({
                  ...filters,
                  minTvl: e.target.value ? parseFloat(e.target.value) : undefined,
                })}
                placeholder="0"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm"
            >
              <X className="w-4 h-4" />
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
