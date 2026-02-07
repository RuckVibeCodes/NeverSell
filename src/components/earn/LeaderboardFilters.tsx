"use client";

import { useState } from "react";
import { 
  TrendingUp, 
  Wallet, 
  Users, 
  Filter, 
  ChevronDown,
  X,
  Shield,
  Target
} from "lucide-react";
import type { LeaderboardPeriod, LeaderboardSort } from "@/lib/mock-leaderboard-data";

interface LeaderboardFiltersProps {
  period: LeaderboardPeriod;
  sort: LeaderboardSort;
  riskLevel: string | null;
  minTvl: string | null;
  strategyType: string | null;
  onPeriodChange: (period: LeaderboardPeriod) => void;
  onSortChange: (sort: LeaderboardSort) => void;
  onRiskLevelChange: (risk: string | null) => void;
  onMinTvlChange: (tvl: string | null) => void;
  onStrategyTypeChange: (strategy: string | null) => void;
  onClearFilters: () => void;
}

const periods: { id: LeaderboardPeriod; label: string }[] = [
  { id: '30d', label: '30 Days' },
  { id: '90d', label: '90 Days' },
  { id: 'all', label: 'All Time' },
];

const sortOptions: { id: LeaderboardSort; label: string; icon: React.ReactNode }[] = [
  { id: 'returns', label: 'Returns', icon: <TrendingUp size={16} /> },
  { id: 'tvl', label: 'TVL', icon: <Wallet size={16} /> },
  { id: 'followers', label: 'Followers', icon: <Users size={16} /> },
];

const riskLevels = [
  { id: 'low', label: 'Low Risk', color: 'text-green-400 bg-green-500/10 border-green-500/20' },
  { id: 'medium', label: 'Medium', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { id: 'high', label: 'High Risk', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
];

const tvlOptions = [
  { id: '100000', label: '$100K+' },
  { id: '500000', label: '$500K+' },
  { id: '1000000', label: '$1M+' },
  { id: '5000000', label: '$5M+' },
];

const strategyTypes = [
  { id: 'yield', label: 'Yield', icon: '💰' },
  { id: 'momentum', label: 'Momentum', icon: '📈' },
  { id: 'degen', label: 'Degen', icon: '🎰' },
  { id: 'diversified', label: 'Diversified', icon: '🎯' },
  { id: 'whale-copy', label: 'Whale Copy', icon: '🐋' },
];

export function LeaderboardFilters({
  period,
  sort,
  riskLevel,
  minTvl,
  strategyType,
  onPeriodChange,
  onSortChange,
  onRiskLevelChange,
  onMinTvlChange,
  onStrategyTypeChange,
  onClearFilters,
}: LeaderboardFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const hasActiveFilters = riskLevel || minTvl || strategyType;
  const activeFilterCount = [riskLevel, minTvl, strategyType].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Period Tabs */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex gap-1 p-1 rounded-xl bg-white/5">
          {periods.map((p) => (
            <button
              key={p.id}
              onClick={() => onPeriodChange(p.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                period === p.id
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Sort buttons */}
        <div className="flex gap-1 p-1 rounded-xl bg-white/5">
          {sortOptions.map((s) => (
            <button
              key={s.id}
              onClick={() => onSortChange(s.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                sort === s.id
                  ? 'bg-white/10 text-white'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              {s.icon}
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Filters Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            showAdvanced || hasActiveFilters
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          <Filter size={16} />
          Filters
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown size={16} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
        </button>

        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1 px-3 py-2 text-sm text-white/40 hover:text-white/60 transition-colors"
          >
            <X size={14} />
            Clear all
          </button>
        )}
      </div>

      {/* Advanced Filters Panel */}
      {showAdvanced && (
        <div className="glass-card p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Risk Level */}
          <div>
            <label className="flex items-center gap-2 text-white/60 text-sm mb-2">
              <Shield size={14} />
              Risk Level
            </label>
            <div className="flex flex-wrap gap-2">
              {riskLevels.map((risk) => (
                <button
                  key={risk.id}
                  onClick={() => onRiskLevelChange(riskLevel === risk.id ? null : risk.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                    riskLevel === risk.id
                      ? risk.color
                      : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20'
                  }`}
                >
                  {risk.label}
                </button>
              ))}
            </div>
          </div>

          {/* Min TVL */}
          <div>
            <label className="flex items-center gap-2 text-white/60 text-sm mb-2">
              <Wallet size={14} />
              Minimum TVL
            </label>
            <div className="flex flex-wrap gap-2">
              {tvlOptions.map((tvl) => (
                <button
                  key={tvl.id}
                  onClick={() => onMinTvlChange(minTvl === tvl.id ? null : tvl.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                    minTvl === tvl.id
                      ? 'bg-mint/10 text-mint border-mint/30'
                      : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20'
                  }`}
                >
                  {tvl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Strategy Type */}
          <div>
            <label className="flex items-center gap-2 text-white/60 text-sm mb-2">
              <Target size={14} />
              Strategy Type
            </label>
            <div className="flex flex-wrap gap-2">
              {strategyTypes.map((strategy) => (
                <button
                  key={strategy.id}
                  onClick={() => onStrategyTypeChange(strategyType === strategy.id ? null : strategy.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                    strategyType === strategy.id
                      ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                      : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20'
                  }`}
                >
                  <span>{strategy.icon}</span>
                  {strategy.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
