"use client";

import { TrendingUp, Flame, Users, Check, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { LeaderboardEntry } from "@/lib/mock-leaderboard-data";

interface TrendingCreatorsProps {
  creators: LeaderboardEntry[];
  isLoading?: boolean;
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

export function TrendingCreators({ creators, isLoading }: TrendingCreatorsProps) {
  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
            <Flame size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Rising Stars</h2>
            <p className="text-white/50 text-sm">Fastest growing this week</p>
          </div>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-72 glass-card p-4 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/10 rounded w-24" />
                  <div className="h-3 bg-white/10 rounded w-20" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="h-12 bg-white/5 rounded-lg" />
                <div className="h-12 bg-white/5 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (creators.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Flame size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Rising Stars</h2>
            <p className="text-white/50 text-sm">Fastest growing this week</p>
          </div>
        </div>
        <Link 
          href="/app/earn/leaderboard?sort=followers"
          className="flex items-center gap-1 text-white/40 hover:text-white/60 text-sm transition-colors"
        >
          View all
          <ChevronRight size={16} />
        </Link>
      </div>

      {/* Horizontal scroll container */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        {creators.map((creator, index) => (
          <Link
            key={creator.id}
            href={`/app/earn/creator/${creator.creator.id}`}
            className="flex-shrink-0 w-72 glass-card p-4 hover:border-white/20 transition-all group relative overflow-hidden"
          >
            {/* Gradient overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${creator.color} opacity-0 group-hover:opacity-10 transition-opacity`} />

            {/* Trending badge */}
            <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold">
              <Flame size={10} />
              #{index + 1}
            </div>

            {/* Creator info */}
            <div className="relative flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${creator.color} flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform`}>
                {creator.creator.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-white font-semibold truncate">{creator.creator.name}</p>
                  {creator.creator.verified && (
                    <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <Check size={10} className="text-white" />
                    </div>
                  )}
                </div>
                <p className="text-white/40 text-sm truncate">{creator.creator.handle}</p>
              </div>
            </div>

            {/* Stats grid */}
            <div className="relative grid grid-cols-2 gap-2">
              <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                <div className="flex items-center gap-1 text-green-400 mb-1">
                  <TrendingUp size={14} />
                  <span className="font-bold">+{creator.performance.thirtyDay}%</span>
                </div>
                <p className="text-white/40 text-xs">30d Return</p>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                <div className="flex items-center gap-1 text-white mb-1">
                  <Users size={14} className="text-purple-400" />
                  <span className="font-bold">{formatFollowers(creator.followers)}</span>
                </div>
                <p className="text-white/40 text-xs">Followers</p>
              </div>
            </div>

            {/* Growth indicators */}
            <div className="relative flex items-center justify-between mt-3 pt-3 border-t border-white/5">
              <div className="flex items-center gap-1">
                <span className="text-white/40 text-xs">TVL</span>
                <span className="text-white text-sm font-medium">{formatNumber(creator.tvl)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${creator.followerGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {creator.followerGrowth >= 0 ? '↑' : '↓'} {Math.abs(creator.followerGrowth).toFixed(0)}% followers
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
