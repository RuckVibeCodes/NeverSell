'use client';

import Link from 'next/link';
import { useAccount } from 'wagmi';
import { useUserPosition } from '@/hooks';
import { useAavePosition } from '@/hooks/useAavePosition';
import { 
  Wallet, 
  PiggyBank, 
  Landmark, 
  Layers, 
  Sparkles,
  TrendingUp,
  ArrowRight,
  Clock,
  Zap,
} from 'lucide-react';

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

// Stats card
function StatCard({ 
  label, 
  value, 
  subValue,
  trend,
  color = "text-white" 
}: { 
  label: string; 
  value: string; 
  subValue?: string;
  trend?: number;
  color?: string;
}) {
  return (
    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
      <p className="text-white/40 text-sm mb-2">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {subValue && <p className="text-white/40 text-sm mt-1">{subValue}</p>}
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-sm ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          <TrendingUp size={14} className={trend < 0 ? 'rotate-180' : ''} />
          <span>{trend >= 0 ? '+' : ''}{trend}%</span>
        </div>
      )}
    </div>
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
            title="Explore Vaults" 
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
  
  // Loading state
  if (isConnected && isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-white/5 rounded-lg w-48" />
          <div className="h-48 bg-white/5 rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-white/5 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  // Not connected or no position - show welcome/empty state
  if (!isConnected || !position.hasPosition) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-white mb-2">Dashboard</h1>
          <p className="text-white/60">
            {isConnected 
              ? 'Get started by funding your account'
              : 'Connect your wallet to get started'
            }
          </p>
        </div>
        
        <EmptyDashboard />
      </div>
    );
  }

  // Calculate totals
  const totalLending = aavePosition?.totalCollateralUSD || 0;
  const totalBorrowed = aavePosition?.totalDebtUSD || 0;
  const poolDeposits = 0; // TODO: Add GMX position tracking
  const vaultDeposits = 0; // TODO: Add vault position tracking
  const netPosition = totalLending - totalBorrowed + poolDeposits + vaultDeposits;
  
  // Calculate net APY (simplified)
  const lendingApy = 3.5; // Weighted average
  const borrowApy = 5.2;
  const poolApy = 18.5;
  const netApy = totalLending > 0 
    ? ((totalLending * lendingApy) - (totalBorrowed * borrowApy) + (poolDeposits * poolApy)) / (totalLending + poolDeposits || 1)
    : 0;

  // Mock recent activity
  const recentActivity = [
    { type: 'Supplied', amount: '1.5', asset: 'ETH', time: '2h ago' },
    { type: 'Borrowed', amount: '2,500', asset: 'USDC', time: '2h ago' },
    { type: 'Deposited', amount: '2,000', asset: 'USDC', time: '1h ago' },
  ];
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-white mb-2">Dashboard</h1>
        <p className="text-white/60">Your yield is growing every second</p>
      </div>
      
      {/* Main stats */}
      <div className="glass-card p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <p className="text-white/40 text-sm mb-1">Net Position</p>
            <p className="text-4xl font-bold text-white">
              ${netPosition.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
            {netApy > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-mint font-semibold">{netApy.toFixed(2)}% Net APY</span>
                <span className="text-white/40">•</span>
                <span className="text-white/40">~${(netPosition * netApy / 100 / 12).toFixed(2)}/mo</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            <Link href="/app/fund" className="btn-secondary flex items-center gap-2">
              <Wallet size={18} />
              Fund
            </Link>
            <Link href="/app/lend" className="btn-primary flex items-center gap-2">
              <PiggyBank size={18} />
              Lend More
            </Link>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard 
          label="Total Lending" 
          value={`$${totalLending.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
          subValue="Earning ~3.5% APY"
          color="text-green-400"
        />
        <StatCard 
          label="Total Borrowed" 
          value={`$${totalBorrowed.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
          subValue="Paying ~5.2% APY"
          color="text-amber-400"
        />
        <StatCard 
          label="Pool Deposits" 
          value={`$${poolDeposits.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
          subValue="Earning ~18.5% APY"
          color="text-purple-400"
        />
        <StatCard 
          label="Vault Deposits" 
          value={`$${vaultDeposits.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
          subValue="Variable returns"
          color="text-pink-400"
        />
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick actions */}
        <div className="lg:col-span-2 space-y-6">
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
              href="/app/borrow" 
              icon={Landmark} 
              title="Borrow" 
              description={`$${aavePosition?.availableBorrowsUSD.toLocaleString(undefined, { maximumFractionDigits: 0 }) || 0} available`}
              color="from-amber-500 to-orange-500"
            />
            <ActionCard 
              href="/app/pools" 
              icon={Layers} 
              title="Explore Pools" 
              description="Earn 15-25% APY on USDC"
              color="from-blue-500 to-indigo-500"
            />
            <ActionCard 
              href="/app/vaults" 
              icon={Sparkles} 
              title="Follow Traders" 
              description="Copy winning strategies"
              color="from-purple-500 to-pink-500"
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
