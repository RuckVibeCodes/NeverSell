"use client";

import { useState, useMemo } from "react";
import { Layers, TrendingUp, Loader2, Check, AlertCircle, X, DollarSign, Droplets, ChevronDown, Shield, Scale, Flame } from "lucide-react";
import { useAccount, useBalance } from "wagmi";
import { formatUnits } from "viem";
import { useGMXApy, formatAPY, getAPYColorClass, formatLastUpdated } from "@/hooks/useGMXApy";
import { useGMXDeposit } from "@/hooks/useGMXDeposit";
import { AAVE_V3_ADDRESSES } from "@/lib/aave";
import type { Address } from "viem";
import type { GMPoolName } from "@/lib/gmx";

// ========== Types ==========
interface StrategyAllocation {
  pool: GMPoolName;
  percentage: number;
}

interface Strategy {
  id: string;
  name: string;
  icon: React.ReactNode;
  emoji: string;
  description: string;
  riskLevel: string;
  bestFor: string;
  estimatedApy: number;
  allocations: StrategyAllocation[];
  gradient: string;
  borderGradient: string;
  glowColor: string;
}

// ========== Strategy Presets ==========
const strategies: Strategy[] = [
  {
    id: "conservative",
    name: "Conservative",
    icon: <Shield size={24} />,
    emoji: "🛡️",
    description: "100% BTC Pool",
    riskLevel: "Lower risk",
    bestFor: "Safety-focused, long-term holders",
    estimatedApy: 12,
    allocations: [{ pool: "BTC/USD", percentage: 100 }],
    gradient: "from-blue-500/20 via-teal-500/20 to-cyan-500/20",
    borderGradient: "from-blue-500 via-teal-500 to-cyan-500",
    glowColor: "shadow-blue-500/20",
  },
  {
    id: "balanced",
    name: "Balanced",
    icon: <Scale size={24} />,
    emoji: "⚖️",
    description: "50% BTC / 30% ETH / 20% ARB",
    riskLevel: "Balanced",
    bestFor: "Diversified yield seekers",
    estimatedApy: 14,
    allocations: [
      { pool: "BTC/USD", percentage: 50 },
      { pool: "ETH/USD", percentage: 30 },
      { pool: "ARB/USD", percentage: 20 },
    ],
    gradient: "from-purple-500/20 via-violet-500/20 to-fuchsia-500/20",
    borderGradient: "from-purple-500 via-violet-500 to-fuchsia-500",
    glowColor: "shadow-purple-500/20",
  },
  {
    id: "growth",
    name: "Growth",
    icon: <Flame size={24} />,
    emoji: "🔥",
    description: "30% ETH / 40% ARB / 30% BTC",
    riskLevel: "Higher risk",
    bestFor: "Yield maximizers, risk tolerant",
    estimatedApy: 18,
    allocations: [
      { pool: "ETH/USD", percentage: 30 },
      { pool: "ARB/USD", percentage: 40 },
      { pool: "BTC/USD", percentage: 30 },
    ],
    gradient: "from-orange-500/20 via-red-500/20 to-amber-500/20",
    borderGradient: "from-orange-500 via-red-500 to-amber-500",
    glowColor: "shadow-orange-500/20",
  },
];

const pools = [
  {
    name: "BTC/USD" as GMPoolName,
    longAsset: "WBTC",
    shortAsset: "USDC",
    icon: "₿",
    color: "from-orange-500 to-amber-500",
    description: "Bitcoin perpetuals market",
  },
  {
    name: "ETH/USD" as GMPoolName,
    longAsset: "WETH",
    shortAsset: "USDC",
    icon: "Ξ",
    color: "from-blue-500 to-purple-500",
    description: "Ethereum perpetuals market",
  },
  {
    name: "ARB/USD" as GMPoolName,
    longAsset: "ARB",
    shortAsset: "USDC",
    icon: "A",
    color: "from-blue-600 to-indigo-500",
    description: "Arbitrum perpetuals market",
  },
];

// ========== Strategy Card Component ==========
function StrategyCard({
  strategy,
  apyData,
  isLoading,
  onSelect,
}: {
  strategy: Strategy;
  apyData: Record<string, { apy7d: number; tvlUsd: number } | null>;
  isLoading: boolean;
  onSelect: () => void;
}) {
  const { isConnected } = useAccount();

  // Calculate weighted APY from actual pool data
  const calculatedApy = useMemo(() => {
    if (isLoading || !apyData) return strategy.estimatedApy;
    
    let weightedApy = 0;
    for (const allocation of strategy.allocations) {
      const poolData = apyData[allocation.pool];
      if (poolData) {
        weightedApy += (poolData.apy7d * allocation.percentage) / 100;
      }
    }
    return weightedApy || strategy.estimatedApy;
  }, [apyData, isLoading, strategy]);

  return (
    <div className="group relative">
      {/* Gradient border effect */}
      <div className={`absolute -inset-[1px] rounded-2xl bg-gradient-to-br ${strategy.borderGradient} opacity-30 group-hover:opacity-60 transition-opacity duration-300 blur-sm`} />
      
      <div className={`relative glass-card p-6 hover:scale-[1.02] transition-all duration-300 ${strategy.glowColor} hover:shadow-lg`}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${strategy.gradient} flex items-center justify-center text-white`}>
            {strategy.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">{strategy.emoji}</span>
              <h3 className="text-lg font-semibold text-white">{strategy.name}</h3>
            </div>
            <p className="text-white/50 text-sm">{strategy.riskLevel}</p>
          </div>
        </div>

        {/* Allocation Display */}
        <div className="mb-4 p-3 rounded-xl bg-white/[0.03] border border-white/5">
          <p className="text-white/40 text-xs mb-2">Allocation</p>
          <p className="text-white font-medium">{strategy.description}</p>
        </div>

        {/* APY Display */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/50 text-sm">Estimated APY</span>
            {isLoading ? (
              <div className="h-8 w-16 bg-white/10 rounded animate-pulse" />
            ) : (
              <span className={`text-2xl font-bold ${getAPYColorClass(calculatedApy)}`}>
                ~{formatAPY(calculatedApy)}
              </span>
            )}
          </div>
          
          {/* APY bar visualization */}
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${strategy.borderGradient} transition-all duration-500`}
              style={{ width: `${Math.min(calculatedApy * 4, 100)}%` }}
            />
          </div>
        </div>

        {/* Best For */}
        <p className="text-white/40 text-xs mb-4">
          <span className="text-white/60">Best for:</span> {strategy.bestFor}
        </p>

        {/* Select Button */}
        <button
          onClick={onSelect}
          disabled={!isConnected}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-white/10 to-white/5 border border-white/10 text-white font-medium hover:from-white/15 hover:to-white/10 hover:border-white/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isConnected ? "Select Strategy" : "Connect Wallet"}
        </button>
      </div>
    </div>
  );
}

// ========== Strategy Modal Component ==========
function StrategyModal({
  strategy,
  apyData,
  onClose,
}: {
  strategy: Strategy;
  apyData: Record<string, { apy7d: number; tvlUsd: number } | null>;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { address } = useAccount();

  const { data: balance } = useBalance({
    address,
    token: AAVE_V3_ADDRESSES.USDC as Address,
  });

  const depositAmount = parseFloat(amount) || 0;

  // Calculate allocations in USDC
  const allocationsWithAmounts = useMemo(() => {
    return strategy.allocations.map((allocation) => ({
      ...allocation,
      usdcAmount: (depositAmount * allocation.percentage) / 100,
      poolData: apyData[allocation.pool],
    }));
  }, [strategy.allocations, depositAmount, apyData]);

  // Calculate weighted APY
  const weightedApy = useMemo(() => {
    let apy = 0;
    for (const allocation of strategy.allocations) {
      const poolData = apyData[allocation.pool];
      if (poolData) {
        apy += (poolData.apy7d * allocation.percentage) / 100;
      }
    }
    return apy || strategy.estimatedApy;
  }, [apyData, strategy]);

  // Calculate earnings
  const dailyEarnings = (depositAmount * weightedApy) / 100 / 365;
  const monthlyEarnings = dailyEarnings * 30;
  const yearlyEarnings = (depositAmount * weightedApy) / 100;

  const handleMaxClick = () => {
    if (balance) {
      setAmount(formatUnits(balance.value, 6));
    }
  };

  // Get the current allocation being processed
  const currentAllocation = allocationsWithAmounts[currentStep];

  // GMX deposit hook for current pool
  const depositAmountWei = currentAllocation
    ? BigInt(Math.floor(currentAllocation.usdcAmount * 1e6))
    : BigInt(0);

  const {
    deposit,
    isDepositing,
    isConfirming,
    isSuccess,
    error: depositError,
    reset: resetDeposit,
  } = useGMXDeposit({
    poolName: currentAllocation?.pool || "BTC/USD",
    shortTokenAmount: depositAmountWei,
  });

  const isPending = isDepositing || isConfirming;
  const allStepsComplete = completedSteps.length === strategy.allocations.length;

  // Handle deposit for current step
  const handleDeposit = async () => {
    if (!currentAllocation || currentAllocation.usdcAmount <= 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      await deposit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deposit failed");
      setIsProcessing(false);
    }
  };

  // Move to next step when current deposit succeeds
  const handleNextStep = () => {
    setCompletedSteps((prev) => [...prev, currentStep]);
    resetDeposit();

    if (currentStep < strategy.allocations.length - 1) {
      setCurrentStep(currentStep + 1);
    }
    setIsProcessing(false);
  };

  // Pool icon lookup
  const getPoolIcon = (poolName: GMPoolName) => {
    const pool = pools.find((p) => p.name === poolName);
    return pool?.icon || "?";
  };

  const getPoolColor = (poolName: GMPoolName) => {
    const pool = pools.find((p) => p.name === poolName);
    return pool?.color || "from-gray-500 to-gray-600";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-card w-full max-w-lg p-6 relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div
            className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${strategy.gradient} flex items-center justify-center text-white shadow-lg`}
          >
            {strategy.icon}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">
              {strategy.emoji} {strategy.name} Strategy
            </h3>
            <p className="text-white/50 text-sm">{strategy.riskLevel}</p>
          </div>
        </div>

        {/* Allocation Breakdown */}
        <div className="mb-6 p-4 rounded-xl bg-white/[0.03] border border-white/10">
          <p className="text-white/60 text-sm font-medium mb-3">Strategy Breakdown</p>

          {/* Visual bar */}
          <div className="h-4 rounded-full overflow-hidden flex mb-4">
            {strategy.allocations.map((allocation, index) => (
              <div
                key={allocation.pool}
                className={`h-full bg-gradient-to-r ${getPoolColor(allocation.pool)} ${
                  index > 0 ? "border-l border-black/20" : ""
                }`}
                style={{ width: `${allocation.percentage}%` }}
              />
            ))}
          </div>

          {/* Pool details */}
          <div className="space-y-2">
            {allocationsWithAmounts.map((allocation, index) => (
              <div
                key={allocation.pool}
                className={`flex items-center justify-between p-2 rounded-lg ${
                  completedSteps.includes(index)
                    ? "bg-mint/10 border border-mint/20"
                    : currentStep === index && isProcessing
                    ? "bg-white/5 border border-white/20"
                    : "bg-white/[0.02]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getPoolColor(
                      allocation.pool
                    )} flex items-center justify-center text-white text-sm font-bold`}
                  >
                    {getPoolIcon(allocation.pool)}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{allocation.pool}</p>
                    <p className="text-white/40 text-xs">
                      {allocation.poolData ? formatAPY(allocation.poolData.apy7d) : "~12%"} APY
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-medium">{allocation.percentage}%</p>
                  {depositAmount > 0 && (
                    <p className="text-white/40 text-xs">
                      ${allocation.usdcAmount.toFixed(2)}
                    </p>
                  )}
                  {completedSteps.includes(index) && (
                    <Check size={14} className="text-mint inline ml-1" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Deposit Input */}
        {!allStepsComplete && (
          <>
            <div className="space-y-3 mb-6">
              <label className="text-white/60 text-sm">Deposit Amount</label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-navy-200 border border-white/10 rounded-xl px-4 py-4 text-white text-lg placeholder:text-white/30 focus:outline-none focus:border-mint/50 transition-colors"
                  disabled={isProcessing}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <button
                    onClick={handleMaxClick}
                    disabled={!balance || isProcessing}
                    className="text-mint text-sm hover:underline disabled:opacity-50"
                  >
                    MAX
                  </button>
                  <span className="text-white/50">USDC</span>
                </div>
              </div>

              <div className="flex justify-between text-sm text-white/50 px-1">
                <span>
                  Balance:{" "}
                  {balance ? parseFloat(formatUnits(balance.value, 6)).toFixed(2) : "0.00"} USDC
                </span>
              </div>
            </div>

            {/* Estimated Earnings */}
            {depositAmount > 0 && (
              <div className="mb-6 p-4 rounded-xl bg-mint/5 border border-mint/20 space-y-2">
                <p className="text-white/60 text-sm font-medium mb-3">Estimated Earnings</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-white/40 text-xs mb-1">Daily</p>
                    <p className="text-mint font-medium">+${dailyEarnings.toFixed(2)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white/40 text-xs mb-1">Monthly</p>
                    <p className="text-mint font-medium">+${monthlyEarnings.toFixed(2)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white/40 text-xs mb-1">Yearly</p>
                    <p className="text-mint font-medium">+${yearlyEarnings.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Progress Indicator */}
        {isProcessing && !allStepsComplete && (
          <div className="mb-4 p-3 rounded-xl bg-white/5 border border-white/10">
            <p className="text-white/60 text-sm">
              Depositing to {currentAllocation?.pool}... ({currentStep + 1}/
              {strategy.allocations.length})
            </p>
          </div>
        )}

        {/* Action Buttons */}
        {!allStepsComplete ? (
          <>
            {isSuccess && !completedSteps.includes(currentStep) ? (
              <button
                onClick={handleNextStep}
                className="w-full btn-primary flex items-center justify-center gap-2 py-4"
              >
                <Check size={18} />
                {currentStep < strategy.allocations.length - 1
                  ? `Continue to ${allocationsWithAmounts[currentStep + 1]?.pool}`
                  : "Complete Strategy"}
              </button>
            ) : (
              <button
                onClick={handleDeposit}
                disabled={!amount || parseFloat(amount) <= 0 || isPending}
                className="w-full btn-primary flex items-center justify-center gap-2 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : null}
                {isPending
                  ? "Processing..."
                  : completedSteps.length === 0
                  ? "Deposit & Earn"
                  : `Deposit to ${currentAllocation?.pool}`}
              </button>
            )}
          </>
        ) : (
          <div className="text-center">
            <div className="mb-4 p-4 rounded-xl bg-mint/10 border border-mint/20">
              <Check size={32} className="text-mint mx-auto mb-2" />
              <p className="text-white font-medium">Strategy Deployed Successfully!</p>
              <p className="text-white/60 text-sm mt-1">
                Your ${depositAmount.toFixed(2)} is now earning across{" "}
                {strategy.allocations.length} pools
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-white/10 text-white hover:bg-white/15 transition-colors"
            >
              Done
            </button>
          </div>
        )}

        {/* Error Display */}
        {(error || depositError) && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle size={16} />
            {error || depositError?.message || "Transaction failed"}
          </div>
        )}
      </div>
    </div>
  );
}

// ========== Individual Pool Card Component ==========
function PoolCard({
  pool,
  apy,
  feeApy,
  perfApy,
  tvl,
  isLoading,
  onDeposit,
}: {
  pool: (typeof pools)[0];
  apy: number;
  feeApy: number;
  perfApy: number;
  tvl: number;
  isLoading: boolean;
  onDeposit: () => void;
}) {
  const { isConnected } = useAccount();

  return (
    <div className="glass-card p-6 hover:border-mint/20 transition-all duration-300 group">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${pool.color} flex items-center justify-center text-white font-bold text-2xl shadow-lg group-hover:scale-105 transition-transform`}
          >
            {pool.icon}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">{pool.name}</h3>
            <p className="text-white/50 text-sm">{pool.description}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-mint" />
            <p className="text-white/40 text-xs">Total APY</p>
          </div>
          {isLoading ? (
            <div className="h-8 w-20 bg-white/10 rounded animate-pulse" />
          ) : (
            <p className={`text-2xl font-bold ${getAPYColorClass(apy)}`}>{formatAPY(apy)}</p>
          )}
        </div>
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <Droplets size={16} className="text-purple-400" />
            <p className="text-white/40 text-xs">TVL</p>
          </div>
          {isLoading ? (
            <div className="h-8 w-24 bg-white/10 rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-white">${(tvl / 1_000_000).toFixed(1)}M</p>
          )}
        </div>
      </div>

      {/* APY Breakdown */}
      {!isLoading && (
        <div className="mb-6 p-3 rounded-xl bg-white/[0.02] border border-white/5">
          <p className="text-white/40 text-xs mb-2">APY Breakdown</p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">Fee APY</span>
            <span className="text-white">{formatAPY(feeApy)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">Performance</span>
            <span className="text-white">{formatAPY(perfApy)}</span>
          </div>
        </div>
      )}

      {/* Pool composition */}
      <div className="mb-6 p-3 rounded-xl bg-white/[0.02] border border-white/5">
        <p className="text-white/40 text-xs mb-2">Pool Composition</p>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-white">{pool.longAsset}</span>
          <span className="text-white/30">/</span>
          <span className="text-white">{pool.shortAsset}</span>
        </div>
      </div>

      <button
        onClick={onDeposit}
        disabled={!isConnected}
        className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Deposit USDC
      </button>
    </div>
  );
}

// ========== Individual Pool Deposit Modal ==========
interface DepositModalProps {
  pool: (typeof pools)[0];
  apy: number;
  onClose: () => void;
}

function DepositModal({ pool, apy, onClose }: DepositModalProps) {
  const [amount, setAmount] = useState("");
  const { address } = useAccount();

  const { data: balance } = useBalance({
    address,
    token: AAVE_V3_ADDRESSES.USDC as Address,
  });

  const depositAmount = parseFloat(amount) || 0;
  const depositAmountWei = BigInt(Math.floor(depositAmount * 1e6));

  const { deposit, isDepositing, isConfirming, isSuccess, error } = useGMXDeposit({
    poolName: pool.name,
    shortTokenAmount: depositAmountWei,
  });

  const isPending = isDepositing || isConfirming;

  const handleMaxClick = () => {
    if (balance) {
      setAmount(formatUnits(balance.value, 6));
    }
  };

  const dailyEarnings = (depositAmount * apy) / 100 / 365;
  const monthlyEarnings = dailyEarnings * 30;
  const yearlyEarnings = (depositAmount * apy) / 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-card w-full max-w-md p-6 relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div
            className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${pool.color} flex items-center justify-center text-white font-bold text-xl shadow-lg`}
          >
            {pool.icon}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">{pool.name} Pool</h3>
            <p className="text-mint text-sm">{formatAPY(apy)} APY</p>
          </div>
        </div>

        <div className="mb-4 p-4 rounded-xl bg-white/5 border border-white/10">
          <p className="text-white/60 text-sm">
            Deposit USDC to provide liquidity and earn trading fees from the {pool.name}{" "}
            perpetuals market.
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <div className="relative">
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-navy-200 border border-white/10 rounded-xl px-4 py-4 text-white text-lg placeholder:text-white/30 focus:outline-none focus:border-mint/50 transition-colors"
              disabled={isPending}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <button
                onClick={handleMaxClick}
                disabled={!balance || isPending}
                className="text-mint text-sm hover:underline disabled:opacity-50"
              >
                MAX
              </button>
              <span className="text-white/50">USDC</span>
            </div>
          </div>

          <div className="flex justify-between text-sm text-white/50 px-1">
            <span>
              Balance: {balance ? parseFloat(formatUnits(balance.value, 6)).toFixed(2) : "0.00"}{" "}
              USDC
            </span>
          </div>
        </div>

        {depositAmount > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-mint/5 border border-mint/20 space-y-2">
            <p className="text-white/60 text-sm font-medium mb-3">Estimated Earnings</p>
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-sm">Daily</span>
              <span className="text-mint font-medium">+${dailyEarnings.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-sm">Monthly</span>
              <span className="text-mint font-medium">+${monthlyEarnings.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-sm">Yearly</span>
              <span className="text-mint font-medium">+${yearlyEarnings.toFixed(2)}</span>
            </div>
          </div>
        )}

        <button
          onClick={() => deposit()}
          disabled={!amount || parseFloat(amount) <= 0 || isPending || isSuccess}
          className="w-full btn-primary flex items-center justify-center gap-2 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <Loader2 size={18} className="animate-spin" />
          ) : isSuccess ? (
            <Check size={18} />
          ) : null}
          {isPending ? "Processing..." : isSuccess ? "Success!" : "Deposit to Pool"}
        </button>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle size={16} />
            {error.message || "Transaction failed"}
          </div>
        )}

        {isSuccess && (
          <div className="mt-4 p-3 rounded-xl bg-mint/10 border border-mint/20 flex items-center gap-2 text-mint text-sm">
            <Check size={16} />
            Successfully deposited {amount} USDC!
          </div>
        )}
      </div>
    </div>
  );
}

// ========== Main Page Component ==========
export default function PoolsPage() {
  const { isConnected } = useAccount();
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [selectedPool, setSelectedPool] = useState<(typeof pools)[0] | null>(null);
  const [showIndividualPools, setShowIndividualPools] = useState(false);

  const { apyData, isLoading, lastUpdated } = useGMXApy();

  const { data: usdcBalance } = useBalance({
    address: useAccount().address,
    token: AAVE_V3_ADDRESSES.USDC as Address,
  });

  const totalUsdcBalance = usdcBalance ? parseFloat(formatUnits(usdcBalance.value, 6)) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-display font-bold text-white mb-2">Choose Your Strategy</h1>
        <p className="text-white/60">Deploy your USDC into yield-generating pools</p>
        {/* Last Updated indicator */}
        {lastUpdated && (
          <p className="text-white/40 text-xs mt-2">
            APY data updated: {formatLastUpdated(lastUpdated)}
          </p>
        )}
      </div>

      {/* Stats summary */}
      {isConnected && (
        <div className="glass-card p-6 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <p className="text-white/40 text-sm mb-1">Available USDC</p>
              <p className="text-2xl font-bold text-white">
                $
                {totalUsdcBalance.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <div>
              <p className="text-white/40 text-sm mb-1">In Pools</p>
              <p className="text-2xl font-bold text-mint">$0.00</p>
            </div>
            <div>
              <p className="text-white/40 text-sm mb-1">Pool Earnings</p>
              <p className="text-2xl font-bold text-green-400">$0.00</p>
            </div>
          </div>
        </div>
      )}

      {!isConnected ? (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-mint/20 to-purple-500/20 flex items-center justify-center text-mint mx-auto mb-4">
            <Layers size={32} />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-white/60">Connect your wallet to deploy yield strategies.</p>
        </div>
      ) : (
        <>
          {/* Strategy Preset Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {strategies.map((strategy) => (
              <StrategyCard
                key={strategy.id}
                strategy={strategy}
                apyData={apyData}
                isLoading={isLoading}
                onSelect={() => setSelectedStrategy(strategy)}
              />
            ))}
          </div>

          {/* How it works banner */}
          <div className="mb-8 p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-mint/10 border border-purple-500/20">
            <div className="flex items-start gap-3">
              <DollarSign size={20} className="text-mint mt-0.5" />
              <div>
                <p className="text-white font-medium">How Strategy Yields Work</p>
                <p className="text-white/60 text-sm mt-1">
                  Your USDC is automatically distributed across pools according to your chosen
                  strategy. Each pool earns fees from traders using leverage on that market.
                  Higher trading volume = higher yields. APYs are variable based on market
                  activity.
                </p>
              </div>
            </div>
          </div>

          {/* Individual Pools Section */}
          <div className="border-t border-white/10 pt-8">
            <button
              onClick={() => setShowIndividualPools(!showIndividualPools)}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6"
            >
              <ChevronDown
                size={20}
                className={`transition-transform ${showIndividualPools ? "rotate-180" : ""}`}
              />
              <span>Or choose individual pools</span>
            </button>

            {showIndividualPools && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pools.map((pool) => {
                  const poolApy = apyData[pool.name];
                  return (
                    <PoolCard
                      key={pool.name}
                      pool={pool}
                      apy={poolApy?.totalApy || 0}
                      feeApy={poolApy?.feeApy || 0}
                      perfApy={poolApy?.perfApy || 0}
                      tvl={poolApy?.tvlUsd || 0}
                      isLoading={isLoading}
                      onDeposit={() => setSelectedPool(pool)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Risk notice */}
      <div className="mt-8 p-4 rounded-xl bg-white/5 border border-white/10">
        <p className="text-white/50 text-sm">
          <strong className="text-white/70">Risk Notice:</strong> Providing liquidity involves
          risk. Pool values can fluctuate based on trader profits/losses. APYs shown are
          estimates based on recent performance and are not guaranteed.
        </p>
      </div>

      {/* Strategy Modal */}
      {selectedStrategy && (
        <StrategyModal
          strategy={selectedStrategy}
          apyData={apyData}
          onClose={() => setSelectedStrategy(null)}
        />
      )}

      {/* Individual Pool Deposit Modal */}
      {selectedPool && (
        <DepositModal
          pool={selectedPool}
          apy={apyData[selectedPool.name]?.totalApy || 0}
          onClose={() => setSelectedPool(null)}
        />
      )}
    </div>
  );
}
