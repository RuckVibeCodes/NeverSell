'use client';

import { useAccount } from 'wagmi';
import { useUserPosition } from '@/hooks';
import {
  EmptyState,
  PositionSummary,
  APYDisplay,
  BorrowCapacityCard,
  ActionButtons,
  FeaturedVaults,
} from '@/components/dashboard';

/**
 * Dashboard Page
 * 
 * Two states:
 * 1. Empty - No deposits, show CTA to get started
 * 2. Has Position - Show position summary, APY, borrow capacity
 * 
 * CRITICAL: No protocol names (Aave/GMX), no health factors, ONE APY number
 */
export default function DashboardPage() {
  const { isConnected } = useAccount();
  const position = useUserPosition();
  
  // Loading state
  if (isConnected && position.isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-white/5 rounded-lg w-48" />
          <div className="h-48 bg-white/5 rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-40 bg-white/5 rounded-2xl" />
            <div className="h-40 bg-white/5 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }
  
  // Not connected or no position - show empty state
  if (!isConnected || !position.hasPosition) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-white mb-2">
            Dashboard
          </h1>
          <p className="text-white/60">
            {isConnected 
              ? 'Get started by making your first deposit'
              : 'Connect your wallet to get started'
            }
          </p>
        </div>
        
        {/* Empty state with CTA */}
        <div className="glass-card mb-8">
          <EmptyState />
        </div>
        
        {/* Featured vaults to inspire */}
        <FeaturedVaults />
      </div>
    );
  }
  
  // Has position - show full dashboard
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-white mb-2">
          Dashboard
        </h1>
        <p className="text-white/60">
          Your yield is growing every second
        </p>
      </div>
      
      {/* Position Summary - Full width */}
      <div className="mb-6">
        <PositionSummary
          totalValueUSD={position.totalValueUSD}
          depositedUSD={position.depositedUSD}
          earningsUSD={position.earningsUSD}
          earningsPercent={position.earningsPercent}
          dailyEarnings={position.dailyEarnings}
        />
      </div>
      
      {/* APY + Borrow Capacity - Two columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <APYDisplay
          apy={position.currentAPY}
          dailyEarnings={position.dailyEarnings}
          monthlyEarnings={position.monthlyEarnings}
          yearlyEarnings={position.yearlyEarnings}
        />
        
        <BorrowCapacityCard
          borrowCapacityUSD={position.borrowCapacityUSD}
          borrowedUSD={position.borrowedUSD}
          availableToBorrowUSD={position.availableToBorrowUSD}
          borrowUtilization={position.borrowUtilization}
          borrowAPR={position.borrowAPR}
        />
      </div>
      
      {/* Quick Actions */}
      <div className="mb-6">
        <ActionButtons hasPosition={position.hasPosition} />
      </div>
      
      {/* Featured Vaults */}
      <FeaturedVaults />
    </div>
  );
}
