'use client';

import Link from 'next/link';
import { useAccount } from 'wagmi';
import { useUserPosition } from '@/hooks';
import { useAavePosition } from '@/hooks/useAavePosition';
import { HarvestCard } from '@/components/dashboard';
import { 
  Wallet, 
  PiggyBank, 
  Landmark, 
  Layers, 
  Sparkles,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Clock,
  Zap,
  Users,
  ChevronRight,
} from 'lucide-react';

// Mock data for demo mode
const MOCK_POSITION = {
  totalValue: 10450,
  deposited: 10000,
  earnings: 450,
  percentChange: 4.5,
  currentApy: 14.2,
  dailyEarnings: 3.90,
  borrowCapacity: 6000,
  currentlyBorrowed: 2000,
  availableToBorrow: 4000,
};

// Mock portfolios for demo
const MOCK_PORTFOLIOS = [
  {
    id: '1',
    name: 'Alpha Hunter Strategy',
    creator: 'CryptoKing',
    avatar: '👑',
    deposited: 2500,
    earnings: 125,
    apy: 28.5,
    color: 'from-amber-400 to-orange-500',
  },
  {
    id: '2',
    name: 'Safe Yield Farm',
    creator: 'Yield Master',
    avatar: '💎',
    deposited: 5000,
    earnings: 180,
    apy: 16.8,
    color: 'from-teal-400 to-emerald-500',
  },
];

// Quick action card
function ActionCard({ 
  href, 
  icon: Icon, 
  title, 
  description, 
  color 
}: { 
  href: string; 
  icon: typeof Wallet; 
  title: string; 
  description: string;
  color: string;
}) {
  return (
    <Link href={href} className="glass-card p-5 hover:border-mint/20 transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
          <Icon size={22} className="text-white" />
        </div>
        <ArrowRight size={18} className="text-white/20 group-hover:text-mint transition-colors" />
      </div>
      <h3 className="text-white font-semibold mb-1">{title}</h3>
      <p className="text-white/50 text-sm">{description}</p>
    </Link>
  );
}

// Recent activity item
function ActivityItem({ 
  type, 
  amount, 
  asset, 
  time 
}: { 
  type: string; 
  amount: string; 
  asset: string; 
  time: string;
}) {
  const getTypeColor = () => {
    switch (type) {
      case 'Supplied': return 'text-green-400';
      case 'Borrowed': return 'text-amber-400';
      case 'Deposited': return 'text-purple-400';
      case 'Repaid': return 'text-blue-400';
      default: return 'text-white';
    }
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div>
        <span className={`font-medium ${getTypeColor()}`}>{type}</span>
        <span className="text-white ml-2">{amount} {asset}</span>
      </div>
      <div className="flex items-center gap-1 text-white/40 text-sm">
        <Clock size={14} />
        {time}
      </div>
    </div>
  );
}

// Your Position Card (comprehensive)
function PositionCard({
  totalValue,
  deposited,
  earnings,
  percentChange,
  currentApy,
  dailyEarnings,
  borrowCapacity,
  currentlyBorrowed,
  availableToBorrow,
  isDemoMode,
}: {
  totalValue: number;
  deposited: number;
  earnings: number;
  percentChange: number;
  currentApy: number;
  dailyEarnings: number;
  borrowCapacity: number;
  currentlyBorrowed: number;
  availableToBorrow: number;
  isDemoMode?: boolean;
}) {
  const isPositive = percentChange >= 0;

  return (
    <div className="glass-card p-6 relative overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-mint/5 via-transparent to-purple-500/5" />
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-mint/20 to-emerald-500/20 flex items-center justify-center">
              <TrendingUp size={16} className="text-mint" />
            </div>
            Your Position
          </h2>
          {isDemoMode && (
            <span className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs">Demo</span>
          )}
        </div>

        {/* Main Value Section */}
        <div className="mb-6">
          <div className="flex items-end gap-3 mb-2">
            <p className="text-4xl font-bold text-white">
              ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium ${
              isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {isPositive ? '+' : ''}{percentChange.toFixed(1)}%
            </div>
          </div>
          
          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-white/40">Deposited: </span>
              <span className="text-white">${deposited.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-white/40">Earnings: </span>
              <span className="text-mint font-medium">${earnings.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 my-5" />

        {/* APY Section */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
            <p className="text-white/40 text-sm mb-1">Current APY</p>
            <p className="text-2xl font-bold text-mint">{currentApy.toFixed(1)}%</p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
            <p className="text-white/40 text-sm mb-1">Earning</p>
            <p className="text-2xl font-bold text-white">${dailyEarnings.toFixed(2)}<span className="text-white/40 text-sm font-normal">/day</span></p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 my-5" />

        {/* Borrow Section */}
        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-white/40 text-sm">Borrow Capacity</span>
            <span className="text-white font-medium">${borrowCapacity.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/40 text-sm">Currently Borrowed</span>
            <span className="text-amber-400 font-medium">${currentlyBorrowed.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/40 text-sm">Available</span>
            <span className="text-mint font-medium">${availableToBorrow.toLocaleString()}</span>
          </div>
          
          {/* Utilization bar */}
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500 rounded-full"
              style={{ width: `${(currentlyBorrowed / borrowCapacity) * 100}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <Link 
            href="/app/borrow" 
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-mint to-emerald-500 text-white font-medium hover:from-mint/90 hover:to-emerald-500/90 transition-all"
          >
            Borrow
          </Link>
          <Link 
            href="/app/borrow?mode=repay" 
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/15 transition-all"
          >
            Repay
          </Link>
          <Link 
            href="/app/borrow?mode=withdraw" 
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/15 transition-all"
          >
            Withdraw
          </Link>
        </div>
      </div>
    </div>
  );
}

// Portfolio Card (mini version for dashboard)
function PortfolioMiniCard({
  name,
  creator,
  avatar,
  deposited,
  earnings,
  apy,
  color,
}: {
  name: string;
  creator: string;
  avatar: string;
  deposited: number;
  earnings: number;
  apy: number;
  color: string;
}) {
  return (
    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-lg`}>
          {avatar}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium truncate">{name}</p>
          <p className="text-white/40 text-xs">by {creator}</p>
        </div>
        <div className="text-right">
          <p className="text-mint font-bold">{apy}%</p>
          <p className="text-white/40 text-xs">APY</p>
        </div>
      </div>
      <div className="flex justify-between text-sm">
        <div>
          <span className="text-white/40">Deposited: </span>
          <span className="text-white">${deposited.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-white/40">Earned: </span>
          <span className="text-mint">+${earnings.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

// Empty state for new users
function EmptyDashboard() {
  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="glass-card p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-mint/5 via-purple-500/5 to-pink-500/5" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-mint to-emerald-500 flex items-center justify-center">
              <Zap size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Welcome to NeverSell</h2>
              <p className="text-white/60">Your journey to financial freedom starts here</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 text-center">
            <div className="p-4 rounded-xl bg-white/[0.02]">
              <div className="text-3xl mb-2">1️⃣</div>
              <p className="text-white font-medium">Fund</p>
              <p className="text-white/50 text-sm">Bridge assets to Arbitrum</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02]">
              <div className="text-3xl mb-2">2️⃣</div>
              <p className="text-white font-medium">Lend</p>
              <p className="text-white/50 text-sm">Supply collateral & earn</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02]">
              <div className="text-3xl mb-2">3️⃣</div>
              <p className="text-white font-medium">Borrow</p>
              <p className="text-white/50 text-sm">Get USDC against your assets</p>
            </div>
          </div>
        </div>
      </div>

      {/* Harvest Card Preview (disabled state) */}
      <HarvestCard
        earningsUSD={0}
        depositedUSD={0}
        dailyEarnings={0}
      />

      {/* Quick actions */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Get Started</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ActionCard 
            href="/app/fund" 
            icon={Wallet} 
            title="Fund Account" 
            description="Bridge from any chain"
            color="from-blue-500 to-cyan-500"
          />
          <ActionCard 
            href="/app/lend" 
            icon={PiggyBank} 
            title="Start Lending" 
            description="Earn yield on your assets"
            color="from-green-500 to-emerald-500"
          />
          <ActionCard 
            href="/app/borrow" 
            icon={Landmark} 
            title="Borrow USDC" 
            description="Against your collateral"
            color="from-amber-500 to-orange-500"
          />
          <ActionCard 
            href="/app/vaults" 
            icon={Sparkles} 
            title="Explore Portfolios" 
            description="Copy top traders"
            color="from-purple-500 to-pink-500"
          />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { isConnected } = useAccount();
  const position = useUserPosition();
  const { position: aavePosition, isLoading } = useAavePosition();
  
  // Check if user has real position
  const hasRealPosition = aavePosition && aavePosition.totalCollateralUSD > 0;
  const isDemoMode = isConnected && !hasRealPosition;
  
  // Use mock or real data
  const positionData = hasRealPosition ? {
    totalValue: aavePosition.totalCollateralUSD + (position.earningsUSD || 0),
    deposited: aavePosition.totalCollateralUSD,
    earnings: position.earningsUSD || 0,
    percentChange: position.earningsUSD > 0 ? (position.earningsUSD / aavePosition.totalCollateralUSD) * 100 : 0,
    currentApy: 14.2, // Calculate from actual rates
    dailyEarnings: position.dailyEarnings || 0,
    borrowCapacity: aavePosition.totalCollateralUSD * 0.6,
    currentlyBorrowed: aavePosition.totalDebtUSD,
    availableToBorrow: aavePosition.availableBorrowsUSD,
  } : MOCK_POSITION;
  
  // Loading state
  if (isConnected && isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-white/5 rounded-lg w-48" />
          <div className="h-64 bg-white/5 rounded-2xl" />
          <div className="h-48 bg-white/5 rounded-2xl" />
        </div>
      </div>
    );
  }
  
  // Not connected - show welcome/empty state
  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-white mb-2">Dashboard</h1>
          <p className="text-white/60">Connect your wallet to get started</p>
        </div>
        <EmptyDashboard />
      </div>
    );
  }

  // Mock recent activity
  const recentActivity = isDemoMode ? [
    { type: 'Supplied', amount: '3.0', asset: 'ETH', time: '2h ago' },
    { type: 'Borrowed', amount: '2,000', asset: 'USDC', time: '2h ago' },
    { type: 'Deposited', amount: '2,500', asset: 'USDC', time: '1h ago' },
  ] : [];
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-white mb-2">Dashboard</h1>
        <p className="text-white/60">Your yield is growing every second</p>
      </div>

      {/* Demo Mode Banner */}
      {isDemoMode && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-mint/20 border border-purple-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <span className="text-xl">🎭</span>
            </div>
            <div>
              <p className="text-white font-medium">Demo Mode</p>
              <p className="text-white/60 text-sm">Showing mock data. Supply collateral to see your real position.</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Your Position - takes 2 columns */}
        <div className="lg:col-span-2">
          <PositionCard
            {...positionData}
            isDemoMode={isDemoMode}
          />
        </div>

        {/* Harvest Card */}
        <div>
          <HarvestCard
            earningsUSD={isDemoMode ? MOCK_POSITION.earnings : position.earningsUSD}
            depositedUSD={positionData.deposited}
            dailyEarnings={positionData.dailyEarnings}
            onHarvestComplete={() => position.refetch?.()}
          />
        </div>
      </div>

      {/* Your Portfolios Section */}
      <div className="glass-card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <Users size={16} className="text-purple-400" />
            </div>
            Your Portfolios
          </h2>
          <Link href="/app/vaults" className="text-mint text-sm hover:underline flex items-center gap-1">
            View All
            <ChevronRight size={14} />
          </Link>
        </div>

        {(isDemoMode ? MOCK_PORTFOLIOS : []).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(isDemoMode ? MOCK_PORTFOLIOS : []).map((portfolio) => (
              <PortfolioMiniCard key={portfolio.id} {...portfolio} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-white/40 mb-4">You haven't deposited into any portfolios yet</p>
            <Link href="/app/vaults" className="btn-secondary inline-flex items-center gap-2">
              <Sparkles size={16} />
              Explore Portfolios
            </Link>
          </div>
        )}
      </div>

      {/* Two column layout - Quick Actions & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick actions */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ActionCard 
              href="/app/lend" 
              icon={PiggyBank} 
              title="Supply More" 
              description="Increase your lending position"
              color="from-green-500 to-emerald-500"
            />
            <ActionCard 
              href="/app/pools" 
              icon={Layers} 
              title="Explore Pools" 
              description="Earn 15-25% APY on USDC"
              color="from-blue-500 to-indigo-500"
            />
          </div>
        </div>

        {/* Recent activity */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
          
          {recentActivity.length > 0 ? (
            <div>
              {recentActivity.map((activity, i) => (
                <ActivityItem key={i} {...activity} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-white/40">No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
