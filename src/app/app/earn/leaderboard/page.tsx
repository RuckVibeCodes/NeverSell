"use client";

import { useState, useEffect, useCallback } from "react";
import { Trophy, RefreshCw } from "lucide-react";
import { LeaderboardTable } from "@/components/earn/LeaderboardTable";
import { LeaderboardFilters } from "@/components/earn/LeaderboardFilters";
import { TrendingCreators } from "@/components/earn/TrendingCreators";
import type { 
  LeaderboardEntry, 
  LeaderboardPeriod, 
  LeaderboardSort 
} from "@/lib/mock-leaderboard-data";

export default function LeaderboardPage() {
  // Filter state
  const [period, setPeriod] = useState<LeaderboardPeriod>('30d');
  const [sort, setSort] = useState<LeaderboardSort>('returns');
  const [riskLevel, setRiskLevel] = useState<string | null>(null);
  const [minTvl, setMinTvl] = useState<string | null>(null);
  const [strategyType, setStrategyType] = useState<string | null>(null);

  // Data state
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [trendingCreators, setTrendingCreators] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTrendingLoading, setIsTrendingLoading] = useState(true);

  // Fetch leaderboard data
  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        period,
        sort,
        limit: '50',
      });
      
      if (riskLevel) params.set('riskLevel', riskLevel);
      if (minTvl) params.set('minTvl', minTvl);
      if (strategyType) params.set('strategyType', strategyType);

      const response = await fetch(`/api/earn/leaderboard?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setEntries(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, [period, sort, riskLevel, minTvl, strategyType]);

  // Fetch trending creators
  const fetchTrending = useCallback(async () => {
    setIsTrendingLoading(true);
    try {
      const response = await fetch('/api/earn/leaderboard?trending=true&limit=6');
      const data = await response.json();
      
      if (data.success) {
        setTrendingCreators(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch trending:', error);
    } finally {
      setIsTrendingLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchTrending();
  }, [fetchTrending]);

  // Fetch on filter change
  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const handleClearFilters = () => {
    setRiskLevel(null);
    setMinTvl(null);
    setStrategyType(null);
  };

  const handleRefresh = () => {
    fetchLeaderboard();
    fetchTrending();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Trophy size={24} className="text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold">
              <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                Leaderboard
              </span>
            </h1>
          </div>
          <p className="text-white/60 text-lg">
            Discover and follow the top-performing creators
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Trending Section */}
      <TrendingCreators 
        creators={trendingCreators} 
        isLoading={isTrendingLoading} 
      />

      {/* Filters */}
      <div className="mb-6">
        <LeaderboardFilters
          period={period}
          sort={sort}
          riskLevel={riskLevel}
          minTvl={minTvl}
          strategyType={strategyType}
          onPeriodChange={setPeriod}
          onSortChange={setSort}
          onRiskLevelChange={setRiskLevel}
          onMinTvlChange={setMinTvl}
          onStrategyTypeChange={setStrategyType}
          onClearFilters={handleClearFilters}
        />
      </div>

      {/* Results count */}
      {!isLoading && entries.length > 0 && (
        <p className="text-white/40 text-sm mb-4">
          Showing {entries.length} creator{entries.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Leaderboard Table */}
      <LeaderboardTable 
        entries={entries} 
        period={period}
        isLoading={isLoading} 
      />

      {/* Empty state with CTA */}
      {!isLoading && entries.length === 0 && (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-3xl mx-auto mb-4">
            🔍
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No creators found</h3>
          <p className="text-white/60 mb-4">
            Try adjusting your filters to see more results.
          </p>
          <button
            onClick={handleClearFilters}
            className="btn-secondary"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Bottom CTA */}
      <div className="mt-12 glass-card p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-orange-500/5" />
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl mx-auto mb-4">
            🚀
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Join the Leaderboard</h2>
          <p className="text-white/60 mb-6 max-w-md mx-auto">
            Create your portfolio, build a following, and compete for the top spots.
          </p>
          <a 
            href="/app/vaults"
            className="btn-primary inline-flex items-center gap-2"
          >
            Start Your Portfolio
          </a>
        </div>
      </div>
    </div>
  );
}
