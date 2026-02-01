"use client";

import Link from "next/link";
import { 
  TrendingUp, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Activity,
  Wallet,
  Shield,
  Zap,
  ExternalLink,
  AlertTriangle,
  ChevronRight,
  type LucideIcon
} from "lucide-react";
import { useAavePosition } from "@/hooks/useAavePosition";
import { useGMXApy, formatAPY, getAPYColorClass } from "@/hooks/useGMXApy";
import { useAccount } from "wagmi";

// Skeleton loader component
function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-white/10 rounded ${className}`} />
  );
}

// Stat card component with loading state
function StatCard({ 
  label, 
  value, 
  subValue,
  isLoading,
  valueColor = "text-white",
  icon: Icon
}: { 
  label: string;
  value: string | number;
  subValue?: string;
  isLoading?: boolean;
  valueColor?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-white/50 text-sm">{label}</span>
        {Icon && <Icon className="text-white/30" size={18} />}
      </div>
      {isLoading ? (
        <Skeleton className="h-8 w-24" />
      ) : (
        <>
          <span className={`text-2xl font-bold ${valueColor}`}>
            {value}
          </span>
          {subValue && (
            <span className="text-white/40 text-xs">{subValue}</span>
          )}
        </>
      )}
    </div>
  );
}

// Market asset card for APY display
function MarketAssetCard({
  symbol,
  name,
  apy,
  icon,
  isLoading
}: {
  symbol: string;
  name: string;
  apy: number;
  icon: string;
  isLoading?: boolean;
}) {
  return (
    <div className="glass-card rounded-xl p-4 hover:border-mint/30 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-lg">
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-white font-medium">{symbol}</span>
            {isLoading ? (
              <Skeleton className="h-5 w-14" />
            ) : (
              <span className={`font-mono font-semibold ${apy >= 5 ? 'text-mint' : 'text-white/80'}`}>
                {apy.toFixed(2)}%
              </span>
            )}
          </div>
          <span className="text-white/40 text-xs">{name}</span>
        </div>
      </div>
    </div>
  );
}

// GMX Pool card
function GMXPoolCard({
  poolName,
  apy7d,
  tvl,
  isLoading
}: {
  poolName: string;
  apy7d: number;
  tvl: number;
  isLoading?: boolean;
}) {
  return (
    <div className="glass-card rounded-xl p-4 hover:border-electric-blue/30 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-white font-medium">{poolName}</span>
        <span className="text-xs px-2 py-0.5 bg-electric-blue/20 text-electric-blue rounded-full">GMX</span>
      </div>
      {isLoading ? (
        <Skeleton className="h-6 w-20 mb-1" />
      ) : (
        <>
          <span className={`text-xl font-bold ${getAPYColorClass(apy7d)}`}>
            {formatAPY(apy7d)} APY
          </span>
          <div className="text-white/40 text-xs mt-1">
            TVL: ${(tvl / 1_000_000).toFixed(1)}M
          </div>
        </>
      )}
    </div>
  );
}

// Quick start card for empty state
function QuickStartCard({
  title,
  description,
  apy,
  icon: Icon,
  href,
  gradient
}: {
  title: string;
  description: string;
  apy: string;
  icon: LucideIcon;
  href: string;
  gradient: string;
}) {
  return (
    <Link 
      href={href}
      className="glass-card rounded-2xl p-6 hover:border-mint/40 transition-all group relative overflow-hidden"
    >
      <div className={`absolute inset-0 opacity-5 ${gradient}`} />
      <div className="relative">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-mint/10 flex items-center justify-center group-hover:bg-mint/20 transition-colors">
            <Icon className="text-mint" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="text-white/50 text-sm">{description}</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-mint font-mono font-semibold text-lg">{apy} APY</span>
          <ChevronRight className="text-white/30 group-hover:text-mint transition-colors" size={20} />
        </div>
      </div>
    </Link>
  );
}

// Health factor indicator
function HealthFactorBadge({ value, isLoading }: { value: number; isLoading?: boolean }) {
  if (isLoading) return <Skeleton className="h-6 w-20" />;
  
  if (value === Infinity || value === 0) return <span className="text-white/40">—</span>;
  
  let color = "text-mint";
  let bgColor = "bg-mint/10";
  let label = "Safe";
  
  if (value < 1.1) {
    color = "text-red-400";
    bgColor = "bg-red-400/10";
    label = "Critical";
  } else if (value < 1.5) {
    color = "text-yellow-400";
    bgColor = "bg-yellow-400/10";
    label = "At Risk";
  }
  
  return (
    <div className="flex items-center gap-2">
      <span className={`text-2xl font-bold ${color}`}>
        {value.toFixed(2)}
      </span>
      <span className={`text-xs px-2 py-0.5 rounded-full ${bgColor} ${color}`}>
        {label}
      </span>
    </div>
  );
}

// Aave supply rates (estimated - in production would come from Aave API)
const AAVE_SUPPLY_RATES = {
  ETH: { symbol: "ETH", name: "Ethereum", apy: 2.1, icon: "⟠" },
  USDC: { symbol: "USDC", name: "USD Coin", apy: 4.8, icon: "💵" },
  WBTC: { symbol: "WBTC", name: "Wrapped Bitcoin", apy: 0.15, icon: "₿" },
  ARB: { symbol: "ARB", name: "Arbitrum", apy: 0.8, icon: "🔷" },
};

export default function Dashboard() {
  const { isConnected } = useAccount();
  const { position, isLoading: isPositionLoading, isAtRisk } = useAavePosition();
  const { apyData, isLoading: isGmxLoading } = useGMXApy();
  
  const hasPositions = position && (position.totalCollateralUSD > 0 || position.totalDebtUSD > 0);
  
  // Calculate net APY (simplified - in production would use weighted average)
  const netAPY = hasPositions ? 3.2 : 0;
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-white/60">
          {isConnected 
            ? "Overview of your positions and yields"
            : "Connect your wallet to view positions"
          }
        </p>
      </div>

      {/* Health Factor Warning */}
      {isAtRisk && (
        <div className="mb-6 glass-card rounded-xl p-4 border-yellow-400/30 bg-yellow-400/5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-yellow-400" size={24} />
            <div>
              <h3 className="text-yellow-400 font-semibold">Position at Risk</h3>
              <p className="text-white/60 text-sm">
                Your health factor is low. Consider repaying debt or adding collateral.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Deposited"
          value={`$${(position?.totalCollateralUSD ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          isLoading={isPositionLoading}
          icon={Wallet}
        />
        <StatCard
          label="Total Borrowed"
          value={`$${(position?.totalDebtUSD ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          isLoading={isPositionLoading}
          icon={ArrowUpFromLine}
        />
        <StatCard
          label="Net APY"
          value={`${netAPY.toFixed(1)}%`}
          subValue="Estimated annual yield"
          isLoading={isPositionLoading}
          valueColor="text-mint"
          icon={TrendingUp}
        />
        <div className="glass-card rounded-2xl p-6 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-white/50 text-sm">Health Factor</span>
            <Shield className="text-white/30" size={18} />
          </div>
          <HealthFactorBadge 
            value={position?.healthFactor ?? 0} 
            isLoading={isPositionLoading} 
          />
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Link href="/app/deposit" className="glass-card rounded-2xl p-6 hover:border-mint/50 transition-colors group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-mint/10 flex items-center justify-center group-hover:bg-mint/20 transition-colors">
              <ArrowDownToLine className="text-mint" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">Deposit Assets</h3>
              <p className="text-white/50 text-sm">Supply collateral and earn yield</p>
            </div>
            <ChevronRight className="text-white/30 group-hover:text-mint transition-colors" size={24} />
          </div>
        </Link>
        
        <Link href="/app/borrow" className="glass-card rounded-2xl p-6 hover:border-mint/50 transition-colors group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-mint/10 flex items-center justify-center group-hover:bg-mint/20 transition-colors">
              <ArrowUpFromLine className="text-mint" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">Borrow</h3>
              <p className="text-white/50 text-sm">Access liquidity without selling</p>
            </div>
            <ChevronRight className="text-white/30 group-hover:text-mint transition-colors" size={24} />
          </div>
        </Link>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Positions or Quick Start */}
        <div className="lg:col-span-2 space-y-6">
          {/* Your Positions */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Your Positions</h2>
              {hasPositions && (
                <Link 
                  href="/app/positions" 
                  className="text-mint text-sm hover:underline flex items-center gap-1"
                >
                  View all <ExternalLink size={14} />
                </Link>
              )}
            </div>
            
            {isPositionLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
              </div>
            ) : hasPositions ? (
              <div className="space-y-4">
                {/* Position summary */}
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white/60 text-sm">Aave V3 Position</span>
                    <span className="text-xs px-2 py-0.5 bg-mint/10 text-mint rounded-full">Active</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-white/40 text-xs">Supplied</span>
                      <div className="text-white font-semibold">
                        ${position.totalCollateralUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div>
                      <span className="text-white/40 text-xs">Borrowed</span>
                      <div className="text-white font-semibold">
                        ${position.totalDebtUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-white/40 text-xs">Available to borrow</span>
                      <span className="text-mint font-mono text-sm">
                        ${position.availableBorrowsUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Empty state - Quick start cards */
              <div className="space-y-4">
                <div className="text-center py-6 text-white/50 mb-4">
                  <TrendingUp className="mx-auto mb-3 opacity-50" size={40} />
                  <p className="text-lg font-medium text-white/70 mb-1">Start Earning Yield</p>
                  <p className="text-sm">Deposit assets to unlock DeFi opportunities</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <QuickStartCard
                    title="Deposit ETH"
                    description="Supply and earn"
                    apy="2.1%"
                    icon={ArrowDownToLine}
                    href="/app/deposit"
                    gradient="bg-gradient-to-br from-mint/20 to-transparent"
                  />
                  <QuickStartCard
                    title="Deposit USDC"
                    description="Stable yield"
                    apy="4.8%"
                    icon={ArrowDownToLine}
                    href="/app/deposit"
                    gradient="bg-gradient-to-br from-electric-blue/20 to-transparent"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
              <Activity className="text-white/30" size={20} />
            </div>
            
            <div className="text-center py-8 text-white/40">
              <Activity className="mx-auto mb-3 opacity-30" size={32} />
              <p className="text-sm">No recent activity</p>
              <p className="text-xs mt-1">Your transactions will appear here</p>
            </div>
          </div>
        </div>

        {/* Right Column - Market Data */}
        <div className="space-y-6">
          {/* Aave Market Overview */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Aave Supply APY</h2>
              <a 
                href="https://app.aave.com/markets/?marketName=proto_arbitrum_v3" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white/40 hover:text-mint transition-colors"
              >
                <ExternalLink size={16} />
              </a>
            </div>
            
            <div className="space-y-3">
              {Object.values(AAVE_SUPPLY_RATES).map((asset) => (
                <MarketAssetCard
                  key={asset.symbol}
                  symbol={asset.symbol}
                  name={asset.name}
                  apy={asset.apy}
                  icon={asset.icon}
                />
              ))}
            </div>
          </div>

          {/* GMX Yields */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-white">GMX Yields</h2>
                <Zap className="text-electric-blue" size={18} />
              </div>
              <a 
                href="https://app.gmx.io/#/earn" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white/40 hover:text-electric-blue transition-colors"
              >
                <ExternalLink size={16} />
              </a>
            </div>
            
            <div className="space-y-3">
              {(['BTC/USD', 'ETH/USD', 'ARB/USD'] as const).map((poolName) => {
                const poolData = apyData[poolName];
                return (
                  <GMXPoolCard
                    key={poolName}
                    poolName={poolName}
                    apy7d={poolData?.apy7d ?? 0}
                    tvl={poolData?.tvlUsd ?? 0}
                    isLoading={isGmxLoading}
                  />
                );
              })}
            </div>
            
            <p className="text-white/30 text-xs mt-4 text-center">
              7-day average APY • Fees + borrowing yield
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
