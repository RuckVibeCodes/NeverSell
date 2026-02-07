"use client";

import { TrendingUp, TrendingDown, Check, Users, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { LeaderboardEntry, LeaderboardPeriod } from "@/lib/mock-leaderboard-data";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  period: LeaderboardPeriod;
  isLoading?: boolean;
}

function getRankBadge(rank: number) {
  if (rank === 1) return { bg: "bg-amber-500", text: "🥇" };
  if (rank === 2) return { bg: "bg-gray-400", text: "🥈" };
  if (rank === 3) return { bg: "bg-amber-700", text: "🥉" };
  return { bg: "bg-white/10", text: `${rank}` };
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}K`;
  return `$${num.toFixed(0)}`;
}

function formatFollowers(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

function getRiskColor(risk: 'low' | 'medium' | 'high') {
  if (risk === 'low') return 'text-green-400 bg-green-500/10 border-green-500/20';
  if (risk === 'medium') return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  return 'text-red-400 bg-red-500/10 border-red-500/20';
}

function getPerformance(entry: LeaderboardEntry, period: LeaderboardPeriod): number {
  if (period === '90d') return entry.performance.ninetyDay;
  if (period === 'all') return entry.performance.allTime;
  return entry.performance.thirtyDay;
}

export function LeaderboardTable({ entries, period, isLoading }: LeaderboardTableProps) {
  if (isLoading) {
    return (
      <div className="glass-card overflow-hidden">
        <div className="animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border-b border-white/5">
              <div className="w-8 h-8 rounded-full bg-white/10" />
              <div className="w-12 h-12 rounded-xl bg-white/10" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-white/10 rounded w-32" />
                <div className="h-3 bg-white/10 rounded w-24" />
              </div>
              <div className="h-6 bg-white/10 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <p className="text-white/40">No creators match your filters.</p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-white/10 text-white/40 text-sm font-medium">
        <div className="col-span-1">Rank</div>
        <div className="col-span-4">Creator</div>
        <div className="col-span-2 text-right">Returns</div>
        <div className="col-span-2 text-right">TVL</div>
        <div className="col-span-2 text-right">Followers</div>
        <div className="col-span-1"></div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-white/5">
        {entries.map((entry, index) => {
          const rank = index + 1;
          const badge = getRankBadge(rank);
          const performance = getPerformance(entry, period);
          const isPositive = performance >= 0;

          return (
            <Link
              key={entry.id}
              href={`/app/earn/creator/${entry.creator.id}`}
              className="grid grid-cols-12 gap-4 p-4 hover:bg-white/[0.02] transition-colors group items-center"
            >
              {/* Rank */}
              <div className="col-span-2 md:col-span-1">
                <div className={`w-8 h-8 rounded-full ${badge.bg} flex items-center justify-center text-sm font-bold text-white`}>
                  {rank <= 3 ? badge.text : rank}
                </div>
              </div>

              {/* Creator */}
              <div className="col-span-7 md:col-span-4 flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${entry.color} flex items-center justify-center text-2xl shadow-lg group-hover:scale-105 transition-transform`}>
                  {entry.creator.avatar}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium truncate">{entry.creator.name}</p>
                    {entry.creator.verified && (
                      <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                        <Check size={10} className="text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-white/40 text-sm truncate">{entry.creator.handle}</p>
                    <span className={`hidden sm:inline-flex px-2 py-0.5 rounded-full text-xs border ${getRiskColor(entry.riskLevel)}`}>
                      {entry.riskLevel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Returns - visible on mobile */}
              <div className="col-span-3 md:col-span-2 text-right">
                <div className={`inline-flex items-center gap-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                  {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  <span className="font-bold text-lg">
                    {isPositive ? '+' : ''}{performance.toFixed(1)}%
                  </span>
                </div>
                <p className="text-white/40 text-xs md:hidden">
                  {period === '30d' ? '30D' : period === '90d' ? '90D' : 'All Time'}
                </p>
              </div>

              {/* TVL - hidden on mobile */}
              <div className="hidden md:block col-span-2 text-right">
                <p className="text-white font-medium">{formatNumber(entry.tvl)}</p>
                <p className={`text-xs ${entry.tvlGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {entry.tvlGrowth >= 0 ? '+' : ''}{entry.tvlGrowth.toFixed(1)}% 7d
                </p>
              </div>

              {/* Followers - hidden on mobile */}
              <div className="hidden md:block col-span-2 text-right">
                <div className="flex items-center justify-end gap-1 text-white">
                  <Users size={14} className="text-white/40" />
                  <span className="font-medium">{formatFollowers(entry.followers)}</span>
                </div>
                <p className={`text-xs ${entry.followerGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {entry.followerGrowth >= 0 ? '+' : ''}{entry.followerGrowth.toFixed(1)}% 7d
                </p>
              </div>

              {/* Arrow */}
              <div className="hidden md:flex col-span-1 justify-end">
                <ChevronRight size={20} className="text-white/20 group-hover:text-white/60 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
