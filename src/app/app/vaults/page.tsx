"use client";

import { useState } from "react";
import { 
  Sparkles, 
  TrendingUp, 
  Users, 
  Star, 
  Flame, 
  Crown,
  ArrowUpRight,
  Heart,
  Zap,
  X,
  Check,
  Loader2,
} from "lucide-react";
import { useAccount, useBalance } from "wagmi";
import { formatUnits } from "viem";
import { AAVE_V3_ADDRESSES } from "@/lib/aave";
import type { Address } from "viem";

// Mock vault data - in production this would come from an API
const mockVaults = [
  {
    id: "1",
    creator: {
      name: "CryptoKing",
      handle: "@cryptoking_trades",
      avatar: "👑",
      verified: true,
    },
    performance: {
      thirtyDay: 34.5,
      allTime: 156.2,
    },
    tvl: 2340000,
    followers: 15200,
    apy: 28.5,
    strategy: "BTC/ETH momentum trading with strict risk management",
    tags: ["momentum", "BTC", "ETH"],
    trending: true,
    color: "from-amber-400 via-orange-500 to-red-500",
  },
  {
    id: "2",
    creator: {
      name: "DeFi Queen",
      handle: "@defi_queen",
      avatar: "👸",
      verified: true,
    },
    performance: {
      thirtyDay: 21.8,
      allTime: 89.4,
    },
    tvl: 1890000,
    followers: 12400,
    apy: 24.2,
    strategy: "Multi-strategy yield farming across top protocols",
    tags: ["yield", "diversified", "safe"],
    trending: false,
    color: "from-purple-400 via-pink-500 to-rose-500",
  },
  {
    id: "3",
    creator: {
      name: "Alpha Hunter",
      handle: "@alpha_hunter",
      avatar: "🎯",
      verified: true,
    },
    performance: {
      thirtyDay: 45.2,
      allTime: 210.8,
    },
    tvl: 890000,
    followers: 8900,
    apy: 35.8,
    strategy: "High-conviction plays on emerging narratives",
    tags: ["alpha", "degen", "high-risk"],
    trending: true,
    color: "from-emerald-400 via-cyan-500 to-blue-500",
  },
  {
    id: "4",
    creator: {
      name: "Whale Watcher",
      handle: "@whale_watcher",
      avatar: "🐋",
      verified: false,
    },
    performance: {
      thirtyDay: 18.3,
      allTime: 67.2,
    },
    tvl: 3200000,
    followers: 9800,
    apy: 19.5,
    strategy: "Copy whale movements with enhanced timing",
    tags: ["whales", "copy-trading", "safe"],
    trending: false,
    color: "from-blue-400 via-indigo-500 to-violet-500",
  },
  {
    id: "5",
    creator: {
      name: "Yield Master",
      handle: "@yield_master",
      avatar: "💎",
      verified: true,
    },
    performance: {
      thirtyDay: 15.6,
      allTime: 52.3,
    },
    tvl: 4500000,
    followers: 21300,
    apy: 16.8,
    strategy: "Stable yield optimization with minimal risk",
    tags: ["stable", "low-risk", "consistent"],
    trending: false,
    color: "from-teal-400 via-emerald-500 to-green-500",
  },
  {
    id: "6",
    creator: {
      name: "Meme Lord",
      handle: "@meme_lord",
      avatar: "🚀",
      verified: false,
    },
    performance: {
      thirtyDay: 89.2,
      allTime: 320.5,
    },
    tvl: 450000,
    followers: 32100,
    apy: 65.2,
    strategy: "Memecoin alpha with quick exits",
    tags: ["meme", "degen", "volatile"],
    trending: true,
    color: "from-yellow-400 via-orange-500 to-pink-500",
  },
];

type FilterCategory = "all" | "trending" | "top-apy" | "most-followed" | "new";

interface DepositModalProps {
  vault: typeof mockVaults[0];
  onClose: () => void;
}

function DepositModal({ vault, onClose }: DepositModalProps) {
  const [amount, setAmount] = useState("");
  const [isDepositing, setIsDepositing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { address } = useAccount();
  
  const { data: balance } = useBalance({
    address,
    token: AAVE_V3_ADDRESSES.USDC as Address,
  });

  const handleMaxClick = () => {
    if (balance) {
      setAmount(formatUnits(balance.value, 6));
    }
  };

  const handleDeposit = async () => {
    setIsDepositing(true);
    // Mock deposit - in production this would call a smart contract
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsDepositing(false);
    setIsSuccess(true);
  };

  const depositAmount = parseFloat(amount) || 0;
  const estimatedMonthly = depositAmount * (vault.apy / 100 / 12);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="w-full max-w-md relative animate-in fade-in zoom-in-95 duration-300">
        {/* Gradient border effect */}
        <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${vault.color} opacity-50 blur-xl`} />
        
        <div className="glass-card relative p-6 border-2 border-white/10">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>

          {/* Creator info */}
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${vault.color} flex items-center justify-center text-3xl shadow-xl`}>
              {vault.creator.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white">{vault.creator.name}</h3>
                {vault.creator.verified && (
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </div>
                )}
              </div>
              <p className="text-white/50">{vault.creator.handle}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="p-3 rounded-xl bg-white/5 text-center">
              <p className="text-green-400 font-bold">+{vault.performance.thirtyDay}%</p>
              <p className="text-white/40 text-xs">30d Return</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 text-center">
              <p className="text-mint font-bold">{vault.apy}%</p>
              <p className="text-white/40 text-xs">APY</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 text-center">
              <p className="text-white font-bold">{(vault.followers / 1000).toFixed(1)}K</p>
              <p className="text-white/40 text-xs">Followers</p>
            </div>
          </div>

          {/* Deposit input */}
          <div className="space-y-3 mb-6">
            <div className="relative">
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-navy-200 border border-white/10 rounded-xl px-4 py-4 text-white text-lg placeholder:text-white/30 focus:outline-none focus:border-mint/50 transition-colors"
                disabled={isDepositing}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <button 
                  onClick={handleMaxClick}
                  className="text-mint text-sm hover:underline"
                >
                  MAX
                </button>
                <span className="text-white/50">USDC</span>
              </div>
            </div>
            
            <div className="flex justify-between text-sm text-white/50 px-1">
              <span>Balance: {balance ? parseFloat(formatUnits(balance.value, 6)).toFixed(2) : '0.00'}</span>
              {depositAmount > 0 && (
                <span className="text-mint">~${estimatedMonthly.toFixed(2)}/mo</span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button 
              className="flex-1 btn-secondary py-3 flex items-center justify-center gap-2"
            >
              <Heart size={18} />
              Follow
            </button>
            <button 
              onClick={handleDeposit}
              disabled={!amount || parseFloat(amount) <= 0 || isDepositing || isSuccess}
              className="flex-1 btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isDepositing ? (
                <Loader2 size={18} className="animate-spin" />
              ) : isSuccess ? (
                <Check size={18} />
              ) : (
                <Zap size={18} />
              )}
              {isDepositing ? 'Depositing...' : isSuccess ? 'Done!' : 'Deposit'}
            </button>
          </div>

          {isSuccess && (
            <div className="mt-4 p-3 rounded-xl bg-mint/10 border border-mint/20 flex items-center gap-2 text-mint text-sm">
              <Check size={16} />
              You&apos;re now copying {vault.creator.name}&apos;s strategy!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function VaultCard({ vault, onSelect }: { vault: typeof mockVaults[0]; onSelect: () => void }) {
  const [isFollowed, setIsFollowed] = useState(false);

  return (
    <div 
      className="glass-card p-6 hover:border-white/20 transition-all duration-300 group cursor-pointer relative overflow-hidden"
      onClick={onSelect}
    >
      {/* Gradient glow on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${vault.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
      
      {/* Trending badge */}
      {vault.trending && (
        <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold">
          <Flame size={12} />
          TRENDING
        </div>
      )}

      {/* Creator header */}
      <div className="flex items-center gap-4 mb-4">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${vault.color} flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          {vault.creator.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white truncate">{vault.creator.name}</h3>
            {vault.creator.verified && (
              <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                <Check size={10} className="text-white" />
              </div>
            )}
          </div>
          <p className="text-white/40 text-sm truncate">{vault.creator.handle}</p>
        </div>
      </div>

      {/* Performance banner */}
      <div className={`mb-4 p-4 rounded-xl bg-gradient-to-r ${vault.color} bg-opacity-10`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 text-xs mb-1">30d Performance</p>
            <div className="flex items-center gap-1">
              <TrendingUp size={18} className="text-green-400" />
              <span className="text-2xl font-bold text-green-400">+{vault.performance.thirtyDay}%</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white/60 text-xs mb-1">APY</p>
            <span className="text-xl font-bold text-mint">{vault.apy}%</span>
          </div>
        </div>
      </div>

      {/* Strategy */}
      <p className="text-white/60 text-sm mb-4 line-clamp-2">{vault.strategy}</p>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {vault.tags.map(tag => (
          <span 
            key={tag}
            className="px-2 py-1 rounded-full text-xs bg-white/5 text-white/60"
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
        <div className="p-2 rounded-lg bg-white/[0.02]">
          <p className="text-white font-semibold">${(vault.tvl / 1_000_000).toFixed(1)}M</p>
          <p className="text-white/40 text-xs">TVL</p>
        </div>
        <div className="p-2 rounded-lg bg-white/[0.02]">
          <p className="text-white font-semibold">{(vault.followers / 1000).toFixed(1)}K</p>
          <p className="text-white/40 text-xs">Followers</p>
        </div>
        <div className="p-2 rounded-lg bg-white/[0.02]">
          <p className="text-green-400 font-semibold">+{vault.performance.allTime}%</p>
          <p className="text-white/40 text-xs">All Time</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        <button 
          onClick={() => setIsFollowed(!isFollowed)}
          className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all ${
            isFollowed 
              ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' 
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          <Heart size={16} className={isFollowed ? 'fill-current' : ''} />
          {isFollowed ? 'Following' : 'Follow'}
        </button>
        <button 
          onClick={onSelect}
          className="flex-1 btn-primary py-2.5 text-sm flex items-center justify-center gap-2"
        >
          <ArrowUpRight size={16} />
          Deposit
        </button>
      </div>
    </div>
  );
}

function Leaderboard({ vaults }: { vaults: typeof mockVaults }) {
  const topVaults = [...vaults].sort((a, b) => b.performance.thirtyDay - a.performance.thirtyDay).slice(0, 3);

  return (
    <div className="glass-card p-6 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
          <Crown size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Top Performers</h2>
          <p className="text-white/50 text-sm">This month&apos;s best vaults</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {topVaults.map((vault, index) => (
          <div 
            key={vault.id}
            className={`p-4 rounded-xl border ${
              index === 0 
                ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30' 
                : 'bg-white/[0.02] border-white/5'
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold ${
                index === 0 ? 'bg-amber-500 text-white' :
                index === 1 ? 'bg-gray-400 text-white' :
                'bg-amber-700 text-white'
              }`}>
                {index + 1}
              </div>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${vault.color} flex items-center justify-center text-lg`}>
                {vault.creator.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{vault.creator.name}</p>
                <p className="text-white/40 text-xs truncate">{vault.creator.handle}</p>
              </div>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-white/40 text-xs">30d Return</p>
                <p className="text-green-400 font-bold text-lg">+{vault.performance.thirtyDay}%</p>
              </div>
              <div className="text-right">
                <p className="text-white/40 text-xs">TVL</p>
                <p className="text-white font-medium">${(vault.tvl / 1_000_000).toFixed(1)}M</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function VaultsPage() {
  const { isConnected } = useAccount();
  const [selectedVault, setSelectedVault] = useState<typeof mockVaults[0] | null>(null);
  const [filter, setFilter] = useState<FilterCategory>("all");

  const filters: { id: FilterCategory; label: string; icon: React.ReactNode }[] = [
    { id: "all", label: "All", icon: <Sparkles size={16} /> },
    { id: "trending", label: "Trending", icon: <Flame size={16} /> },
    { id: "top-apy", label: "Top APY", icon: <TrendingUp size={16} /> },
    { id: "most-followed", label: "Most Followed", icon: <Users size={16} /> },
    { id: "new", label: "New", icon: <Star size={16} /> },
  ];

  const filteredVaults = mockVaults.filter(vault => {
    if (filter === "all") return true;
    if (filter === "trending") return vault.trending;
    if (filter === "top-apy") return vault.apy > 25;
    if (filter === "most-followed") return vault.followers > 10000;
    if (filter === "new") return !vault.creator.verified; // Mock: treating unverified as "new"
    return true;
  }).sort((a, b) => {
    if (filter === "top-apy") return b.apy - a.apy;
    if (filter === "most-followed") return b.followers - a.followers;
    return 0;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with gradient text */}
      <div className="mb-8">
        <h1 className="text-4xl font-display font-bold mb-2">
          <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-orange-400 bg-clip-text text-transparent">
            Follow Top Traders
          </span>
        </h1>
        <p className="text-white/60 text-lg">Copy strategies from the best. Earn together.</p>
      </div>

      {/* Leaderboard */}
      <Leaderboard vaults={mockVaults} />

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filter === f.id
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            {f.icon}
            {f.label}
          </button>
        ))}
      </div>

      {!isConnected ? (
        <div className="glass-card p-12 text-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center text-4xl mx-auto mb-6 animate-pulse">
            🚀
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Join the Movement</h2>
          <p className="text-white/60 mb-6">Connect your wallet to follow top traders and grow your portfolio.</p>
          <div className="flex flex-wrap justify-center gap-4 text-white/40 text-sm">
            <span className="flex items-center gap-1"><Users size={16} /> 50K+ Followers</span>
            <span className="flex items-center gap-1"><TrendingUp size={16} /> $15M+ TVL</span>
            <span className="flex items-center gap-1"><Star size={16} /> 100+ Vaults</span>
          </div>
        </div>
      ) : (
        <>
          {/* Stats banner */}
          <div className="glass-card p-6 mb-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10" />
            <div className="relative grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-white/40 text-sm mb-1">Your Vault Deposits</p>
                <p className="text-2xl font-bold text-white">$0.00</p>
              </div>
              <div>
                <p className="text-white/40 text-sm mb-1">Total Earnings</p>
                <p className="text-2xl font-bold text-green-400">$0.00</p>
              </div>
              <div>
                <p className="text-white/40 text-sm mb-1">Vaults Following</p>
                <p className="text-2xl font-bold text-white">0</p>
              </div>
              <div>
                <p className="text-white/40 text-sm mb-1">Avg APY</p>
                <p className="text-2xl font-bold text-mint">--%</p>
              </div>
            </div>
          </div>

          {/* Vault grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVaults.map(vault => (
              <VaultCard 
                key={vault.id}
                vault={vault}
                onSelect={() => setSelectedVault(vault)}
              />
            ))}
          </div>

          {filteredVaults.length === 0 && (
            <div className="glass-card p-12 text-center">
              <p className="text-white/40">No vaults found for this filter.</p>
            </div>
          )}
        </>
      )}

      {/* Create vault CTA */}
      <div className="mt-12 glass-card p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-orange-500/5" />
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl mx-auto mb-4">
            🎯
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Become a Creator</h2>
          <p className="text-white/60 mb-6 max-w-md mx-auto">
            Share your trading strategies, build a following, and earn performance fees when your followers profit.
          </p>
          <button className="btn-secondary inline-flex items-center gap-2">
            <Sparkles size={18} />
            Apply to Create a Vault
          </button>
        </div>
      </div>

      {/* Deposit Modal */}
      {selectedVault && (
        <DepositModal 
          vault={selectedVault}
          onClose={() => setSelectedVault(null)} 
        />
      )}
    </div>
  );
}
