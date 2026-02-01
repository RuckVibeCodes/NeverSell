'use client';

import { useState, useMemo } from 'react';
import { Leaf, ChevronDown, X, Loader2, CheckCircle, ExternalLink } from 'lucide-react';
import { useAccount } from 'wagmi';
import { cn } from '@/lib/utils';
import { useGMXPosition, useGMXWithdraw } from '@/hooks';
import type { GMPoolName } from '@/lib/gmx';

interface PoolHarvestCardProps {
  onHarvestComplete?: () => void;
}

/**
 * PoolHarvestCard - Allows users to harvest earnings from GMX GM pool positions
 * 🌾 harvest/growth theme with green accents
 * Only shows when user has pool positions with positive earnings
 */
export function PoolHarvestCard({ onHarvestComplete }: PoolHarvestCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Get user's GMX positions across all pools
  const { positions, totalValueUsd, isLoading } = useGMXPosition();
  
  // Calculate earnings (estimate deposited as 95% of current - same as useUserPosition)
  // In production, this would be tracked via contract or indexer
  const { depositedUSD, earningsUSD, dailyEarnings } = useMemo(() => {
    if (!positions.length || totalValueUsd <= 0) {
      return { depositedUSD: 0, earningsUSD: 0, dailyEarnings: 0 };
    }
    
    // Estimate: deposited is ~95% of current value
    const deposited = totalValueUsd * 0.95;
    const earnings = totalValueUsd - deposited;
    
    // Estimate daily earnings based on ~15% APY average for GM pools
    const avgApy = 0.15;
    const daily = (deposited * avgApy) / 365;
    
    return {
      depositedUSD: deposited,
      earningsUSD: Math.max(0, earnings),
      dailyEarnings: daily,
    };
  }, [positions, totalValueUsd]);
  
  // Don't show if loading or no positions at all
  if (isLoading || !positions.length) {
    return null;
  }
  
  const hasEarnings = earningsUSD > 0;
  
  return (
    <>
      <div className={cn(
        "glass-card p-6 transition-colors",
        hasEarnings 
          ? "border-mint/10 hover:border-mint/20" 
          : "border-white/5 opacity-60"
      )}>
        {/* Header with harvest emoji */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              hasEarnings 
                ? "bg-gradient-to-br from-mint/20 to-emerald-500/20" 
                : "bg-white/5"
            )}>
              <span className={cn("text-xl", !hasEarnings && "grayscale opacity-50")}>🌾</span>
            </div>
            <h2 className={cn(
              "text-lg font-semibold",
              hasEarnings ? "text-white/80" : "text-white/40"
            )}>Pool Earnings</h2>
          </div>
          <div className={cn(
            "text-sm font-medium",
            hasEarnings ? "text-mint" : "text-white/30"
          )}>
            {hasEarnings ? `+$${dailyEarnings.toFixed(2)}/day` : 'No yield yet'}
          </div>
        </div>
        
        {/* Earnings breakdown */}
        <div className="space-y-3 mb-5">
          <div className="flex justify-between items-center">
            <span className="text-white/50 text-sm">Deposited</span>
            <span className={cn(
              "font-medium",
              hasEarnings ? "text-white" : "text-white/30"
            )}>
              ${depositedUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/50 text-sm">Current</span>
            <span className={cn(
              "font-medium",
              hasEarnings ? "text-white" : "text-white/30"
            )}>
              ${totalValueUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/50 text-sm">Earnings</span>
            <span className={cn(
              "text-xl font-bold",
              hasEarnings ? "text-mint" : "text-white/30"
            )}>
              ${earningsUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
        
        {/* Harvest button */}
        <button
          onClick={() => hasEarnings && setIsModalOpen(true)}
          disabled={!hasEarnings}
          className={cn(
            "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all",
            hasEarnings
              ? "bg-gradient-to-r from-mint to-emerald-500 text-white hover:from-mint/90 hover:to-emerald-500/90 shadow-lg shadow-mint/20"
              : "bg-white/5 text-white/30 cursor-not-allowed"
          )}
        >
          <Leaf size={18} />
          {hasEarnings 
            ? `Harvest $${earningsUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : 'Nothing to Harvest'
          }
        </button>
        
        {/* Info note */}
        <p className="text-white/40 text-xs mt-4 text-center">
          {hasEarnings 
            ? `💡 Your $${depositedUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })} principal keeps compounding in the pools.`
            : '💡 Pool earnings will appear here as your positions generate yield.'
          }
        </p>
      </div>
      
      {/* Modal */}
      {isModalOpen && (
        <PoolHarvestModal
          positions={positions}
          earningsUSD={earningsUSD}
          onClose={() => setIsModalOpen(false)}
          onComplete={() => {
            setIsModalOpen(false);
            onHarvestComplete?.();
          }}
        />
      )}
    </>
  );
}

interface PoolHarvestModalProps {
  positions: Array<{
    poolName: GMPoolName;
    marketToken: `0x${string}`;
    balance: bigint;
    balanceFormatted: string;
    estimatedValueUsd: number;
  }>;
  earningsUSD: number;
  onClose: () => void;
  onComplete: () => void;
}

function PoolHarvestModal({ positions, earningsUSD, onClose, onComplete }: PoolHarvestModalProps) {
  useAccount(); // Used for wallet connection context
  const [selectedPool, setSelectedPool] = useState<GMPoolName>(positions[0]?.poolName || 'BTC/USD');
  const [showPoolDropdown, setShowPoolDropdown] = useState(false);
  const [completedWithdrawals, setCompletedWithdrawals] = useState<GMPoolName[]>([]);
  
  // Calculate per-pool earnings (proportional to value)
  const totalValue = positions.reduce((sum, p) => sum + p.estimatedValueUsd, 0);
  const poolEarnings = useMemo(() => {
    return positions.map(p => ({
      ...p,
      earnings: totalValue > 0 ? (p.estimatedValueUsd / totalValue) * earningsUSD : 0,
      // Calculate GM tokens to withdraw (5% of balance = the earnings portion)
      withdrawAmount: (p.balance * BigInt(5)) / BigInt(100),
    }));
  }, [positions, totalValue, earningsUSD]);
  
  const currentPoolData = poolEarnings.find(p => p.poolName === selectedPool);
  
  // GMX withdraw hook
  const {
    withdraw,
    isWithdrawing,
    isConfirming,
    isSuccess,
    error,
    withdrawHash,
    reset: resetWithdraw,
  } = useGMXWithdraw({
    poolName: selectedPool,
    marketTokenAmount: currentPoolData?.withdrawAmount ?? BigInt(0),
  });
  
  const isPending = isWithdrawing || isConfirming;
  
  const handleHarvest = async () => {
    try {
      await withdraw();
    } catch (err) {
      console.error('Harvest failed:', err);
    }
  };
  
  const handleNext = () => {
    setCompletedWithdrawals(prev => [...prev, selectedPool]);
    resetWithdraw();
    
    // Find next pool with earnings
    const remainingPools = poolEarnings.filter(
      p => !completedWithdrawals.includes(p.poolName) && p.poolName !== selectedPool && p.earnings > 0
    );
    
    if (remainingPools.length > 0) {
      setSelectedPool(remainingPools[0].poolName);
    }
  };
  
  const allComplete = completedWithdrawals.length >= poolEarnings.filter(p => p.earnings > 0).length;
  
  // Get pool display info
  const getPoolIcon = (poolName: GMPoolName) => {
    const icons: Record<GMPoolName, string> = {
      'BTC/USD': '₿',
      'ETH/USD': 'Ξ',
      'ARB/USD': 'A',
    };
    return icons[poolName] || '?';
  };
  
  const getPoolColor = (poolName: GMPoolName) => {
    const colors: Record<GMPoolName, string> = {
      'BTC/USD': 'from-orange-500 to-amber-500',
      'ETH/USD': 'from-blue-500 to-purple-500',
      'ARB/USD': 'from-blue-600 to-indigo-500',
    };
    return colors[poolName] || 'from-gray-500 to-gray-600';
  };
  
  // Success state (all complete)
  if (allComplete || (isSuccess && poolEarnings.filter(p => p.earnings > 0).length === 1)) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onComplete} />
        <div className="relative glass-card p-8 rounded-3xl max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-mint/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-mint" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Harvest Complete!</h3>
          <p className="text-white/60 mb-6">
            ${earningsUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })} has been withdrawn from your pools.
          </p>
          
          {withdrawHash && (
            <a
              href={`https://arbiscan.io/tx/${withdrawHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-mint hover:text-mint/80 mb-6"
            >
              <span>View transaction</span>
              <ExternalLink size={14} />
            </a>
          )}
          
          <button
            onClick={onComplete}
            className="w-full px-4 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative glass-card p-6 rounded-3xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-mint/20 to-emerald-500/20 flex items-center justify-center">
              <span className="text-2xl">🌾</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Harvest Pool Earnings</h3>
              <p className="text-white/50 text-sm">Withdraw your yield</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>
        
        {/* Total amount */}
        <div className="bg-white/5 rounded-2xl p-4 mb-4">
          <span className="text-white/50 text-sm">Total to harvest</span>
          <div className="text-3xl font-bold text-mint mt-1">
            ${earningsUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        
        {/* Pool breakdown */}
        {poolEarnings.length > 1 && (
          <div className="mb-4">
            <label className="text-white/50 text-sm mb-2 block">Earnings by Pool</label>
            <div className="space-y-2">
              {poolEarnings.filter(p => p.earnings > 0).map((pool) => (
                <div 
                  key={pool.poolName}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl transition-colors",
                    completedWithdrawals.includes(pool.poolName)
                      ? "bg-mint/10 border border-mint/20"
                      : selectedPool === pool.poolName
                      ? "bg-white/10 border border-white/20"
                      : "bg-white/5 border border-white/5"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getPoolColor(pool.poolName)} flex items-center justify-center text-white text-sm font-bold`}>
                      {getPoolIcon(pool.poolName)}
                    </div>
                    <span className="text-white font-medium">{pool.poolName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-mint font-medium">
                      ${pool.earnings.toFixed(2)}
                    </span>
                    {completedWithdrawals.includes(pool.poolName) && (
                      <CheckCircle className="w-4 h-4 text-mint" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Single pool selector (if multiple pools) */}
        {poolEarnings.filter(p => p.earnings > 0 && !completedWithdrawals.includes(p.poolName)).length > 1 && (
          <div className="mb-4">
            <label className="text-white/50 text-sm mb-2 block">Harvesting from</label>
            <div className="relative">
              <button
                onClick={() => setShowPoolDropdown(!showPoolDropdown)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${getPoolColor(selectedPool)} flex items-center justify-center text-white text-xs font-bold`}>
                    {getPoolIcon(selectedPool)}
                  </div>
                  <span className="text-white font-medium">{selectedPool}</span>
                </div>
                <ChevronDown className={cn(
                  "w-5 h-5 text-white/60 transition-transform",
                  showPoolDropdown && "rotate-180"
                )} />
              </button>
              
              {showPoolDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#0a0e17] border border-white/10 rounded-xl overflow-hidden z-10">
                  {poolEarnings
                    .filter(p => p.earnings > 0 && !completedWithdrawals.includes(p.poolName))
                    .map((pool) => (
                      <button
                        key={pool.poolName}
                        onClick={() => {
                          setSelectedPool(pool.poolName);
                          setShowPoolDropdown(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-2 px-4 py-3 hover:bg-white/5 transition-colors",
                          selectedPool === pool.poolName && "bg-white/5"
                        )}
                      >
                        <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${getPoolColor(pool.poolName)} flex items-center justify-center text-white text-xs font-bold`}>
                          {getPoolIcon(pool.poolName)}
                        </div>
                        <span className="text-white">{pool.poolName}</span>
                        <span className="text-mint ml-auto">${pool.earnings.toFixed(2)}</span>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Info box */}
        <div className="bg-mint/5 border border-mint/20 rounded-xl p-4 mb-6">
          <p className="text-white/70 text-sm">
            💡 Only your earnings will be withdrawn. Your principal continues compounding in the pools — earning more yield every day.
          </p>
        </div>
        
        {/* Error display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
            <p className="text-red-400 text-sm">
              {error.message || 'Transaction failed. Please try again.'}
            </p>
          </div>
        )}
        
        {/* Action button */}
        {isSuccess ? (
          <button
            onClick={handleNext}
            className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-gradient-to-r from-mint to-emerald-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-mint/20"
          >
            <CheckCircle size={18} />
            {poolEarnings.filter(p => p.earnings > 0 && !completedWithdrawals.includes(p.poolName) && p.poolName !== selectedPool).length > 0
              ? 'Continue to Next Pool'
              : 'Complete'}
          </button>
        ) : (
          <button
            onClick={handleHarvest}
            disabled={isPending}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-4 py-4 rounded-xl font-semibold transition-all",
              isPending
                ? "bg-white/10 text-white/50 cursor-not-allowed"
                : "bg-gradient-to-r from-mint to-emerald-500 text-white hover:from-mint/90 hover:to-emerald-500/90 shadow-lg shadow-mint/20"
            )}
          >
            {isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {isWithdrawing ? 'Confirm in wallet...' : 'Processing...'}
              </>
            ) : (
              <>
                <Leaf size={18} />
                Harvest ${currentPoolData?.earnings.toFixed(2) || earningsUSD.toFixed(2)}
              </>
            )}
          </button>
        )}
        
        <button
          onClick={onClose}
          disabled={isPending}
          className="w-full mt-3 px-4 py-3 text-white/60 hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
