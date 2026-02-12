'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Twitter,
  Youtube,
  Check,
  TrendingUp,
  Users,
  DollarSign,
  Share2,
} from 'lucide-react';
import { mockLeaderboardData } from '@/lib/mock-leaderboard-data';
import { PortfolioComposition } from '@/components/earn/PortfolioComposition';
import { StrategyUpdateFeed } from '@/components/earn/StrategyUpdateFeed';
import { CopyStrategyButton } from '@/components/earn/CopyStrategyButton';

export default function CreatorProfilePage({ 
  params 
}: { 
  params: Promise<{ address: string }> 
}) {
  const resolvedParams = use(params);
  const [activeTab, setActiveTab] = useState<'overview' | 'portfolio' | 'updates'>('overview');
  
  // Get creator from mock data (in production, fetch from API)
  const creatorId = resolvedParams.address;
  const creatorData = mockLeaderboardData.find(e => e.creator.id === creatorId);
  
  if (!creatorData) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Creator Not Found</h1>
          <Link href="/app/earn/leaderboard" className="text-emerald-400 hover:underline">
            Back to Leaderboard
          </Link>
        </div>
      </div>
    );
  }

  const entry = creatorData;
  const creator = entry.creator;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        {/* Background gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${entry.color} opacity-20`} />
        
        <div className="relative max-w-7xl mx-auto px-4 py-8">
          {/* Back link */}
          <Link 
            href="/app/earn/leaderboard"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Leaderboard
          </Link>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-start gap-6">
                {/* Avatar */}
                <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${entry.color} flex items-center justify-center text-4xl shadow-xl`}>
                  {creator.avatar}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold">{creator.name}</h1>
                    {creator.verified && (
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <p className="text-gray-400 mb-3">{creator.handle}</p>
                  <p className="text-gray-300 mb-4">{creator.bio}</p>

                  {/* Social Links */}
                  <div className="flex gap-3">
                    {creator.socials?.twitter && (
                      <a href={`https://twitter.com/${creator.socials.twitter}`} target="_blank" rel="noopener" className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700">
                        <Twitter className="w-5 h-5" />
                      </a>
                    )}
                    {creator.socials?.youtube && (
                      <a href={`https://youtube.com/@${creator.socials.youtube}`} target="_blank" rel="noopener" className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700">
                        <Youtube className="w-5 h-5" />
                      </a>
                    )}
                    <button className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="lg:w-80 space-y-3">
              <StatCard
                icon={TrendingUp}
                label="30D Returns"
                value={`${entry.performance.thirtyDay >= 0 ? '+' : ''}${entry.performance.thirtyDay.toFixed(1)}%`}
                positive={entry.performance.thirtyDay >= 0}
              />
              <StatCard
                icon={DollarSign}
                label="TVL"
                value={formatNumber(entry.tvl)}
                subtitle="Total Value Locked"
              />
              <StatCard
                icon={Users}
                label="Followers"
                value={formatFollowers(entry.followers)}
                subtitle={`+${entry.followerGrowth}% this week`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-1 p-1 bg-gray-900 rounded-xl mb-6 w-fit">
          {(['overview', 'portfolio', 'updates'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Strategy Info */}
              <div className="bg-gray-900 rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-4">Strategy</h2>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRiskColor(entry.riskLevel)}`}>
                    {entry.riskLevel} risk
                  </span>
                  <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    {entry.strategyType}
                  </span>
                  {entry.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 rounded-full bg-gray-800 text-gray-300 border border-gray-700">
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-gray-400">
                  Trading {entry.strategyType} strategy focused on {entry.tags.slice(0, 3).join(', ')}.
                  Consistent returns with {entry.riskLevel} risk management.
                </p>
              </div>

              {/* Performance Chart Placeholder */}
              <div className="bg-gray-900 rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-4">Performance</h2>
                <div className="h-64 bg-gray-800 rounded-xl flex items-center justify-center">
                  <p className="text-gray-500">Performance chart coming soon</p>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Copy Button */}
              <div className="bg-gray-900 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">Copy This Strategy</h3>
                <CopyStrategyButton creatorName={creator.name} />
                <p className="text-xs text-gray-500 text-center mt-3">
                  You&apos;ll automatically copy their future trades
                </p>
              </div>

              {/* Quick Stats */}
              <div className="bg-gray-900 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">Stats</h3>
                <div className="space-y-3">
                  <StatRow label="90D Returns" value={`${entry.performance.ninetyDay >= 0 ? '+' : ''}${entry.performance.ninetyDay.toFixed(1)}%`} />
                  <StatRow label="All Time" value={`${entry.performance.allTime >= 0 ? '+' : ''}${entry.performance.allTime.toFixed(1)}%`} />
                  <StatRow label="TVL Growth" value={`${entry.tvlGrowth >= 0 ? '+' : ''}${entry.tvlGrowth.toFixed(1)}%`} />
                  <StatRow label="Joined" value={formatDate(entry.joinedAt)} />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'portfolio' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <PortfolioComposition 
                totalValue={entry.tvl}
                allocations={[
                  { poolId: 'eth-lido', name: 'ETH via Lido', percentage: 40, color: 'from-blue-500 to-blue-600' },
                  { poolId: 'usdc-aave', name: 'USDC on Aave', percentage: 30, color: 'from-cyan-500 to-cyan-600' },
                  { poolId: 'wbtc-beefy', name: 'WBTC via Beefy', percentage: 20, color: 'from-orange-500 to-orange-600' },
                  { poolId: 'arb-gmx', name: 'ARB on GMX', percentage: 10, color: 'from-sky-500 to-sky-600' },
                ]} 
              />
            </div>
            <div>
              <div className="bg-gray-900 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">Allocation</h3>
                <div className="space-y-3">
                  <AllocationBar token="ETH" percent={40} color="#627EEA" />
                  <AllocationBar token="USDC" percent={30} color="#2775CA" />
                  <AllocationBar token="WBTC" percent={20} color="#F7931A" />
                  <AllocationBar token="ARB" percent={10} color="#28A0F0" />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'updates' && (
          <StrategyUpdateFeed 
            portfolioId={creator.id} 
            creatorName={creator.name}
            creatorAvatar={creator.avatar}
          />
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  positive,
  subtitle,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  positive?: boolean;
  subtitle?: string;
}) {
  return (
    <div className="bg-gray-900/80 backdrop-blur rounded-xl p-4">
      <div className="flex items-center gap-2 text-gray-400 mb-1">
        <Icon className="w-4 h-4" />
        <span className="text-sm">{label}</span>
      </div>
      <p className={`text-xl font-bold ${positive !== undefined ? (positive ? 'text-emerald-400' : 'text-red-400') : 'text-white'}`}>
        {value}
      </p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-800 last:border-0">
      <span className="text-gray-400">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function AllocationBar({ token, percent, color }: { token: string; percent: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{token}</span>
        <span className="text-gray-400">{percent}%</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { 
    month: 'short', 
    year: 'numeric' 
  });
}
