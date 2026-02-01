"use client";

import { useState, useMemo } from "react";
import { 
  Landmark, 
  AlertTriangle, 
  Loader2, 
  Check, 
  AlertCircle, 
  Shield,
  Lightbulb,
  ArrowRight,
  Info,
  Banknote,
  TrendingUp,
  ArrowDownToLine,
  ExternalLink
} from "lucide-react";
import { useAccount, useBalance } from "wagmi";
import { formatUnits } from "viem";
import { useAaveBorrow } from "@/hooks/useAaveBorrow";
import { useAavePosition } from "@/hooks/useAavePosition";
import { useAaveRepay } from "@/hooks/useAaveRepay";
import { useAaveWithdraw } from "@/hooks/useAaveWithdraw";
import { useAaveBorrowRate } from "@/hooks/useAaveBorrowRate";
import { AAVE_V3_ADDRESSES } from "@/lib/aave";
import type { Address } from "viem";

type ActionMode = 'borrow' | 'repay' | 'withdraw';

// Platform fee for withdrawals
const PLATFORM_FEE_PERCENT = 0.1;
const SAFE_HEALTH_FACTOR = 1.5;
const MIN_HEALTH_FACTOR = 1.0;

// Health Factor color coding
function getHealthFactorColor(hf: number): { 
  text: string; 
  bg: string; 
  label: string;
  emoji: string;
} {
  if (hf === Infinity || hf > 2.0) {
    return { text: 'text-green-400', bg: 'bg-green-400', label: 'Safe', emoji: '🟢' };
  }
  if (hf >= 1.5) {
    return { text: 'text-lime-400', bg: 'bg-lime-400', label: 'Good', emoji: '🟢' };
  }
  if (hf >= 1.2) {
    return { text: 'text-yellow-400', bg: 'bg-yellow-400', label: 'Caution', emoji: '🟡' };
  }
  if (hf >= 1.0) {
    return { text: 'text-orange-400', bg: 'bg-orange-400', label: 'At Risk', emoji: '🟠' };
  }
  return { text: 'text-red-500', bg: 'bg-red-500', label: 'Liquidation', emoji: '🔴' };
}

// Calculate max withdrawable amount that maintains a target health factor
function calculateMaxWithdrawable(
  totalCollateral: number,
  totalDebt: number,
  liquidationThreshold: number,
  targetHealthFactor: number = SAFE_HEALTH_FACTOR
): number {
  // If no debt, can withdraw everything
  if (totalDebt <= 0) return totalCollateral;
  
  // Health Factor = (Collateral * LiquidationThreshold) / Debt
  // We want: targetHF = ((Collateral - Withdraw) * LiqThreshold) / Debt
  // Solving for Withdraw:
  // targetHF * Debt = (Collateral - Withdraw) * LiqThreshold
  // (targetHF * Debt) / LiqThreshold = Collateral - Withdraw
  // Withdraw = Collateral - (targetHF * Debt) / LiqThreshold
  
  const liqThresholdDecimal = liquidationThreshold / 100;
  const minCollateralRequired = (targetHealthFactor * totalDebt) / liqThresholdDecimal;
  const maxWithdraw = totalCollateral - minCollateralRequired;
  
  return Math.max(0, maxWithdraw);
}

// Calculate new health factor after a withdrawal
function calculateNewHealthFactor(
  totalCollateral: number,
  totalDebt: number,
  withdrawAmount: number,
  liquidationThreshold: number
): number {
  if (totalDebt <= 0) return Infinity;
  const newCollateral = totalCollateral - withdrawAmount;
  if (newCollateral <= 0) return 0;
  return (newCollateral * (liquidationThreshold / 100)) / totalDebt;
}

// Position Summary Card
function PositionSummaryCard({
  totalCollateral,
  borrowCapacity,
  currentlyBorrowed,
  availableToBorrow,
  utilizationPercent,
}: {
  totalCollateral: number;
  borrowCapacity: number;
  currentlyBorrowed: number;
  availableToBorrow: number;
  utilizationPercent: number;
}) {
  return (
    <div className="glass-card p-6">
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-mint/20 to-purple-500/20 flex items-center justify-center">
          <Landmark size={16} className="text-mint" />
        </div>
        Your Position
      </h2>

      <div className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-white/40 text-sm mb-1">Total Collateral</p>
            <p className="text-xl font-bold text-white">
              ${totalCollateral.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-white/40 text-sm mb-1">Borrow Capacity (60%)</p>
            <p className="text-xl font-bold text-white">
              ${borrowCapacity.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-white/40 text-sm mb-1">Currently Borrowed</p>
            <p className="text-xl font-bold text-orange-400">
              ${currentlyBorrowed.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-white/40 text-sm mb-1">Available to Borrow</p>
            <p className="text-xl font-bold text-mint">
              ${availableToBorrow.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Utilization Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Borrow Capacity Used</span>
            <span className="text-white font-medium">{utilizationPercent.toFixed(1)}% used</span>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-mint to-purple-500 transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(100, utilizationPercent)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Health Factor Card
function HealthFactorCard({
  healthFactor,
  totalCollateral,
  totalDebt,
  liquidationThreshold,
}: {
  healthFactor: number;
  totalCollateral: number;
  totalDebt: number;
  liquidationThreshold: number;
}) {
  const hfColor = getHealthFactorColor(healthFactor);
  const displayValue = healthFactor === Infinity ? '∞' : healthFactor.toFixed(2);
  
  // Calculate position on the scale (0-100%)
  // Scale: 0 = 0.5 HF, 50 = 1.5 HF, 100 = 3.0+ HF
  const scalePosition = useMemo(() => {
    if (healthFactor === Infinity) return 100;
    if (healthFactor >= 3.0) return 100;
    if (healthFactor <= 0.5) return 0;
    // Linear interpolation
    return ((healthFactor - 0.5) / 2.5) * 100;
  }, [healthFactor]);

  // Calculate liquidation price for collateral
  // Simplified: assumes they'd need collateral to drop by factor to hit HF=1
  const liquidationDropPercent = useMemo(() => {
    if (healthFactor === Infinity || totalDebt === 0) return null;
    // At liquidation, HF = 1
    // HF = (collateral * liqThreshold) / debt
    // 1 = (newCollateral * liqThreshold) / debt
    // newCollateral = debt / liqThreshold
    const liqCollateral = totalDebt / (liquidationThreshold / 100);
    const dropPercent = ((totalCollateral - liqCollateral) / totalCollateral) * 100;
    return Math.max(0, dropPercent);
  }, [healthFactor, totalCollateral, totalDebt, liquidationThreshold]);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
            <Shield size={16} className="text-green-400" />
          </div>
          Health Factor
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{hfColor.emoji}</span>
          <span className={`text-3xl font-bold ${hfColor.text}`}>{displayValue}</span>
        </div>
      </div>

      {/* Health Factor Gauge */}
      <div className="space-y-2">
        <div className="relative h-4 bg-gradient-to-r from-red-500 via-yellow-400 to-green-400 rounded-full overflow-hidden">
          {/* Position indicator */}
          <div 
            className="absolute top-0 w-1 h-4 bg-white shadow-lg transition-all duration-500"
            style={{ left: `${scalePosition}%` }}
          />
        </div>
        
        {/* Scale labels */}
        <div className="flex justify-between text-xs text-white/50">
          <span>Liquidation (&lt;1.0)</span>
          <span>Caution (&lt;1.5)</span>
          <span>Safe (&gt;1.5)</span>
        </div>
      </div>

      {/* Liquidation Warning */}
      {liquidationDropPercent !== null && liquidationDropPercent < 50 && (
        <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
          <AlertTriangle size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <span className="text-amber-400 font-medium">Liquidation Alert: </span>
            <span className="text-white/70">
              Your collateral can drop {liquidationDropPercent.toFixed(0)}% before liquidation
            </span>
          </div>
        </div>
      )}

      {healthFactor < 1.5 && healthFactor !== Infinity && (
        <div className="mt-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-start gap-2">
          <Info size={16} className="text-yellow-400 mt-0.5 flex-shrink-0" />
          <span className="text-yellow-400 text-sm">
            {healthFactor < 1.2 
              ? 'Danger! Consider repaying debt or adding collateral immediately.' 
              : 'Consider improving your health factor for more safety margin.'}
          </span>
        </div>
      )}
    </div>
  );
}

// Loan Details Card - shows when user has active loan
function LoanDetailsCard({
  totalOwed,
  borrowRate,
  isLoadingRate,
}: {
  totalOwed: number;
  borrowRate: number | null;
  isLoadingRate: boolean;
}) {
  return (
    <div className="glass-card p-6">
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center">
          <Banknote size={16} className="text-orange-400" />
        </div>
        Your Loan
      </h2>

      <div className="space-y-4">
        {/* Total Owed */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="flex justify-between items-center">
            <p className="text-white/40 text-sm">Total Owed</p>
            <p className="text-2xl font-bold text-orange-400">
              ${totalOwed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <p className="text-white/30 text-xs mt-1">Includes accrued interest</p>
        </div>

        {/* Borrow Rate */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-white/40" />
              <p className="text-white/40 text-sm">Borrow Rate</p>
            </div>
            {isLoadingRate ? (
              <Loader2 size={16} className="animate-spin text-white/40" />
            ) : borrowRate !== null ? (
              <div className="text-right">
                <p className="text-xl font-bold text-white">
                  {borrowRate.toFixed(2)}% <span className="text-sm font-normal text-white/40">APR</span>
                </p>
                <p className="text-white/30 text-xs">Variable rate</p>
              </div>
            ) : (
              <p className="text-white/40">--</p>
            )}
          </div>
        </div>

        {/* Info note */}
        <div className="flex items-start gap-2 text-white/40 text-xs">
          <Info size={12} className="mt-0.5 flex-shrink-0" />
          <p>Interest accrues continuously. Variable rate may change based on market conditions.</p>
        </div>
      </div>
    </div>
  );
}

// Borrow/Repay/Withdraw Action Card
function ActionCard({
  mode,
  setMode,
  availableToBorrow,
  currentDebt,
  healthFactor,
  totalCollateral,
  liquidationThreshold,
}: {
  mode: ActionMode;
  setMode: (mode: ActionMode) => void;
  availableToBorrow: number;
  currentDebt: number;
  healthFactor: number;
  totalCollateral: number;
  liquidationThreshold: number;
}) {
  const { address } = useAccount();
  const [amount, setAmount] = useState("");
  
  const { data: usdcBalance } = useBalance({
    address,
    token: AAVE_V3_ADDRESSES.USDC as Address,
  });

  const {
    borrow,
    isPending: isBorrowPending,
    isSuccess: isBorrowSuccess,
    error: borrowError,
  } = useAaveBorrow({
    amount: parseFloat(amount) || 0,
  });

  const {
    needsApproval,
    approve,
    repay,
    isApproving,
    isApprovalPending,
    isRepaying,
    isRepayPending,
    isRepaySuccess,
    repayError,
    approvalError,
  } = useAaveRepay({
    asset: AAVE_V3_ADDRESSES.USDC as Address,
    amount: parseFloat(amount) || 0,
  });

  // For withdraw, we use WETH as the default asset (main collateral)
  const {
    withdraw,
    isWithdrawing,
    isPending: isWithdrawPending,
    isSuccess: isWithdrawSuccess,
    error: withdrawError,
  } = useAaveWithdraw({
    asset: AAVE_V3_ADDRESSES.WETH as Address,
    amount: parseFloat(amount) || 0,
  });

  const inputAmount = parseFloat(amount) || 0;

  // Calculate max withdrawable (safe = HF > 1.5, absolute = HF > 1.0)
  const safeMaxWithdrawable = useMemo(() => {
    return calculateMaxWithdrawable(totalCollateral, currentDebt, liquidationThreshold, SAFE_HEALTH_FACTOR);
  }, [totalCollateral, currentDebt, liquidationThreshold]);

  const absoluteMaxWithdrawable = useMemo(() => {
    return calculateMaxWithdrawable(totalCollateral, currentDebt, liquidationThreshold, MIN_HEALTH_FACTOR);
  }, [totalCollateral, currentDebt, liquidationThreshold]);

  // Calculate new health factor preview
  const newHealthFactor = useMemo(() => {
    if (inputAmount <= 0) return healthFactor;
    
    if (mode === 'borrow') {
      const newDebt = currentDebt + inputAmount;
      if (newDebt === 0) return Infinity;
      return (totalCollateral * (liquidationThreshold / 100)) / newDebt;
    } else if (mode === 'repay') {
      const newDebt = Math.max(0, currentDebt - inputAmount);
      if (newDebt === 0) return Infinity;
      return (totalCollateral * (liquidationThreshold / 100)) / newDebt;
    } else {
      // Withdraw
      return calculateNewHealthFactor(totalCollateral, currentDebt, inputAmount, liquidationThreshold);
    }
  }, [mode, inputAmount, currentDebt, totalCollateral, liquidationThreshold, healthFactor]);

  // Calculate withdrawal summary
  const withdrawSummary = useMemo(() => {
    if (mode !== 'withdraw' || inputAmount <= 0) return null;
    const platformFee = inputAmount * (PLATFORM_FEE_PERCENT / 100);
    const youReceive = inputAmount - platformFee;
    return {
      withdrawAmount: inputAmount,
      platformFee,
      youReceive,
      newHealthFactor,
    };
  }, [mode, inputAmount, newHealthFactor]);

  const hfChange = healthFactor !== Infinity && newHealthFactor !== Infinity
    ? newHealthFactor - healthFactor
    : null;

  // Withdraw warnings
  const withdrawWarning = useMemo(() => {
    if (mode !== 'withdraw' || inputAmount <= 0 || currentDebt <= 0) return null;
    
    if (newHealthFactor < MIN_HEALTH_FACTOR) {
      const maxAllowed = absoluteMaxWithdrawable;
      return {
        severity: 'error' as const,
        message: `Cannot withdraw this amount. Maximum withdrawable is $${maxAllowed.toFixed(2)} to maintain health factor above 1.0`,
      };
    }
    
    if (newHealthFactor < SAFE_HEALTH_FACTOR) {
      const repayAmount = ((currentDebt * SAFE_HEALTH_FACTOR) / (liquidationThreshold / 100)) - (totalCollateral - inputAmount);
      return {
        severity: 'warning' as const,
        message: `Withdrawing this amount will put your health factor at ${newHealthFactor.toFixed(2)}. Consider repaying $${Math.max(0, repayAmount).toFixed(2)} first or withdraw less.`,
      };
    }
    
    return null;
  }, [mode, inputAmount, currentDebt, newHealthFactor, absoluteMaxWithdrawable, totalCollateral, liquidationThreshold]);

  const handleMaxClick = () => {
    if (mode === 'borrow') {
      setAmount(availableToBorrow.toFixed(2));
    } else if (mode === 'repay' && usdcBalance) {
      const balanceNum = parseFloat(formatUnits(usdcBalance.value, 6));
      const maxRepay = Math.min(balanceNum, currentDebt);
      setAmount(maxRepay.toFixed(2));
    } else if (mode === 'withdraw') {
      // Use safe max by default
      setAmount(safeMaxWithdrawable.toFixed(2));
    }
  };

  const handleAction = () => {
    if (mode === 'borrow') {
      borrow();
    } else if (mode === 'repay') {
      if (needsApproval) {
        approve();
      } else {
        repay();
      }
    } else {
      withdraw();
    }
  };

  const isPending = mode === 'borrow' 
    ? isBorrowPending 
    : mode === 'repay'
    ? (isApproving || isApprovalPending || isRepaying || isRepayPending)
    : (isWithdrawing || isWithdrawPending);

  const isSuccess = mode === 'borrow' 
    ? isBorrowSuccess 
    : mode === 'repay'
    ? isRepaySuccess
    : isWithdrawSuccess;

  const error = mode === 'borrow' 
    ? borrowError 
    : mode === 'repay'
    ? (repayError || approvalError)
    : withdrawError;

  const getButtonText = () => {
    if (mode === 'borrow') {
      if (isBorrowPending) return 'Borrowing...';
      if (isBorrowSuccess) return 'Success!';
      return 'Borrow USDC';
    } else if (mode === 'repay') {
      if (isApproving || isApprovalPending) return 'Approving...';
      if (isRepaying || isRepayPending) return 'Repaying...';
      if (isRepaySuccess) return 'Success!';
      if (needsApproval) return 'Approve USDC';
      return 'Repay USDC';
    } else {
      if (isWithdrawing || isWithdrawPending) return 'Withdrawing...';
      if (isWithdrawSuccess) return 'Success!';
      return 'Withdraw';
    }
  };

  const isDisabled = () => {
    if (isPending || isSuccess) return true;
    if (!amount || inputAmount <= 0) return true;
    if (mode === 'borrow' && inputAmount > availableToBorrow) return true;
    if (mode === 'repay' && inputAmount > currentDebt) return true;
    if (mode === 'withdraw') {
      if (inputAmount > totalCollateral) return true;
      if (withdrawWarning?.severity === 'error') return true;
    }
    return false;
  };

  // Reset amount when switching modes
  const handleModeChange = (newMode: ActionMode) => {
    setMode(newMode);
    setAmount("");
  };

  const newHfColor = getHealthFactorColor(newHealthFactor);

  return (
    <div className="glass-card p-6">
      {/* Tab Toggle - 3 tabs */}
      <div className="flex mb-6 bg-white/5 rounded-xl p-1">
        <button
          onClick={() => handleModeChange('borrow')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
            mode === 'borrow'
              ? 'bg-gradient-to-r from-mint to-mint/80 text-navy-400'
              : 'text-white/60 hover:text-white'
          }`}
        >
          Borrow
        </button>
        <button
          onClick={() => handleModeChange('repay')}
          disabled={currentDebt === 0}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
            mode === 'repay'
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
              : 'text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed'
          }`}
        >
          Repay
        </button>
        <button
          onClick={() => handleModeChange('withdraw')}
          disabled={totalCollateral === 0}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
            mode === 'withdraw'
              ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white'
              : 'text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed'
          }`}
        >
          Withdraw
        </button>
      </div>

      {/* Info Banner - Mode-specific */}
      <div className="mb-4 p-3 rounded-xl bg-white/5 border border-white/10">
        {mode === 'borrow' ? (
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Available to Borrow</span>
            <span className="text-mint font-medium">
              ${availableToBorrow.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDC
            </span>
          </div>
        ) : mode === 'repay' ? (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Current Debt</span>
              <span className="text-orange-400 font-medium">
                ${currentDebt.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDC
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">USDC Balance</span>
              <span className="text-white font-medium">
                {usdcBalance ? parseFloat(formatUnits(usdcBalance.value, 6)).toFixed(2) : '0.00'} USDC
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Total Collateral</span>
              <span className="text-white font-medium">
                ${totalCollateral.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Currently Borrowed</span>
              <span className="text-orange-400 font-medium">
                ${currentDebt.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Available to Withdraw</span>
              <span className="text-purple-400 font-medium">
                ${safeMaxWithdrawable.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                <span className="text-white/40 text-xs ml-1">(safe)</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Amount Input */}
      <div className="space-y-4">
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
              disabled={isPending}
              className="text-mint text-sm hover:underline disabled:opacity-50"
            >
              MAX
            </button>
            <span className="text-white/50">{mode === 'withdraw' ? 'USD' : 'USDC'}</span>
          </div>
        </div>

        {/* Withdraw Warning */}
        {withdrawWarning && (
          <div className={`p-3 rounded-xl flex items-start gap-2 ${
            withdrawWarning.severity === 'error' 
              ? 'bg-red-500/10 border border-red-500/20' 
              : 'bg-amber-500/10 border border-amber-500/20'
          }`}>
            <AlertTriangle size={16} className={`mt-0.5 flex-shrink-0 ${
              withdrawWarning.severity === 'error' ? 'text-red-400' : 'text-amber-400'
            }`} />
            <span className={`text-sm ${
              withdrawWarning.severity === 'error' ? 'text-red-400' : 'text-amber-400'
            }`}>
              {withdrawWarning.message}
            </span>
          </div>
        )}

        {/* Health Factor Preview */}
        {inputAmount > 0 && (
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-white/60 text-sm">New Health Factor</span>
              <div className="flex items-center gap-2">
                <span className="text-white/40 text-sm">
                  {healthFactor === Infinity ? '∞' : healthFactor.toFixed(2)}
                </span>
                <ArrowRight size={14} className="text-white/40" />
                <span className={`font-bold ${newHfColor.text}`}>
                  {newHealthFactor === Infinity ? '∞' : newHealthFactor.toFixed(2)}
                </span>
                {hfChange !== null && (
                  <span className={`text-sm ${hfChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ({hfChange >= 0 ? '+' : ''}{hfChange.toFixed(2)})
                  </span>
                )}
              </div>
            </div>
            
            {newHealthFactor < 1.2 && newHealthFactor !== Infinity && (
              <div className="flex items-center gap-2 text-red-400 text-xs">
                <AlertTriangle size={14} />
                <span>Warning: High liquidation risk!</span>
              </div>
            )}
          </div>
        )}

        {/* Withdraw Summary */}
        {mode === 'withdraw' && withdrawSummary && (
          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-2">
            <h4 className="text-white font-medium text-sm mb-3">Withdrawal Summary</h4>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">You withdraw</span>
              <span className="text-white">${withdrawSummary.withdrawAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Platform fee ({PLATFORM_FEE_PERCENT}%)</span>
              <span className="text-white/70">-${withdrawSummary.platformFee.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </div>
            <div className="border-t border-white/10 pt-2 mt-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">You receive</span>
                <span className="text-purple-400 font-bold">~{withdrawSummary.youReceive.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDC</span>
              </div>
            </div>
          </div>
        )}

        {/* Destination selector for withdraw (future feature placeholder) */}
        {mode === 'withdraw' && inputAmount > 0 && (
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-sm">Receive on</span>
              <div className="flex items-center gap-2 text-white text-sm">
                <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                  <span className="text-[10px] font-bold">A</span>
                </div>
                Arbitrum
                <ExternalLink size={12} className="text-white/40" />
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <button 
          onClick={handleAction}
          disabled={isDisabled()}
          className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            mode === 'borrow'
              ? 'btn-primary'
              : mode === 'repay'
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white'
              : 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white'
          }`}
        >
          {isPending ? (
            <Loader2 size={18} className="animate-spin" />
          ) : isSuccess ? (
            <Check size={18} />
          ) : mode === 'withdraw' ? (
            <ArrowDownToLine size={18} />
          ) : null}
          {getButtonText()}
        </button>

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle size={16} />
            {error.message || 'Transaction failed'}
          </div>
        )}

        {/* Success Message */}
        {isSuccess && (
          <div className="p-3 rounded-xl bg-mint/10 border border-mint/20 flex items-center gap-2 text-mint text-sm">
            <Check size={16} />
            Successfully {mode === 'borrow' ? 'borrowed' : mode === 'repay' ? 'repaid' : 'withdrew'} {amount} {mode === 'withdraw' ? 'USD' : 'USDC'}!
          </div>
        )}
      </div>
    </div>
  );
}

// Safety Education Card
function SafetyEducationCard() {
  return (
    <div className="glass-card p-6">
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center">
          <Lightbulb size={16} className="text-amber-400" />
        </div>
        How to Stay Safe
      </h2>

      <div className="space-y-3 text-sm">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-green-400">✓</span>
          </div>
          <p className="text-white/70">
            <span className="text-white font-medium">Keep health factor above 1.5</span> for a comfortable safety margin
          </p>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-yellow-400">!</span>
          </div>
          <div className="text-white/70">
            <span className="text-white font-medium">If health drops below 1.2, consider:</span>
            <ul className="mt-1 ml-4 space-y-1">
              <li className="flex items-center gap-2">
                <ArrowRight size={12} className="text-white/40" />
                Repay some of your loan
              </li>
              <li className="flex items-center gap-2">
                <ArrowRight size={12} className="text-white/40" />
                Deposit more collateral
              </li>
            </ul>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-red-400">✕</span>
          </div>
          <p className="text-white/70">
            <span className="text-white font-medium">Liquidation occurs at health factor &lt; 1.0</span>
            <br />
            You lose collateral + pay 5% liquidation penalty
          </p>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <ArrowDownToLine size={12} className="text-purple-400" />
          </div>
          <p className="text-white/70">
            <span className="text-white font-medium">Withdrawals</span> reduce your collateral, which can lower your health factor if you have outstanding debt
          </p>
        </div>
      </div>

      <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-2 text-white/50 text-xs">
          <Info size={14} />
          <span>Market volatility affects your health factor. Monitor your position regularly.</span>
        </div>
      </div>
    </div>
  );
}

// Main Page Component
export default function BorrowPage() {
  const { isConnected } = useAccount();
  const [mode, setMode] = useState<ActionMode>('borrow');
  
  const { position, isLoading } = useAavePosition();
  const { variableBorrowRate, isLoading: isLoadingRate } = useAaveBorrowRate();

  const totalCollateral = position?.totalCollateralUSD || 0;
  const currentDebt = position?.totalDebtUSD || 0;
  const availableToBorrow = position?.availableBorrowsUSD || 0;
  const healthFactor = position?.healthFactor || Infinity;
  const liquidationThreshold = position?.liquidationThreshold || 82.5;

  // Borrow capacity based on LTV (show as 60%)
  const borrowCapacity = totalCollateral * 0.6;
  
  // Utilization percentage
  const utilizationPercent = borrowCapacity > 0 
    ? (currentDebt / borrowCapacity) * 100
    : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-display font-bold text-white mb-2">
          {mode === 'withdraw' ? 'Withdraw Your Collateral' : 'Borrow Against Your Collateral'}
        </h1>
        <p className="text-white/60">
          {mode === 'withdraw' 
            ? 'Convert your collateral back to USDC' 
            : 'Access liquidity without selling your assets'}
        </p>
      </div>

      {!isConnected ? (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-mint/20 to-purple-500/20 flex items-center justify-center text-mint mx-auto mb-4">
            <Landmark size={32} />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-white/60">Connect your wallet to borrow against your collateral.</p>
        </div>
      ) : isLoading ? (
        <div className="glass-card p-12 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-mint" />
        </div>
      ) : totalCollateral === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center text-amber-400 mx-auto mb-4">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">No Collateral Supplied</h2>
          <p className="text-white/60 mb-4">You need to supply collateral before you can borrow or withdraw.</p>
          <a href="/app/lend" className="btn-primary inline-block">
            Supply Collateral
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Position Summary */}
          <PositionSummaryCard
            totalCollateral={totalCollateral}
            borrowCapacity={borrowCapacity}
            currentlyBorrowed={currentDebt}
            availableToBorrow={availableToBorrow}
            utilizationPercent={utilizationPercent}
          />

          {/* Health Factor */}
          <HealthFactorCard
            healthFactor={healthFactor}
            totalCollateral={totalCollateral}
            totalDebt={currentDebt}
            liquidationThreshold={liquidationThreshold}
          />

          {/* Loan Details - only show when user has active loan */}
          {currentDebt > 0 && (
            <LoanDetailsCard
              totalOwed={currentDebt}
              borrowRate={variableBorrowRate}
              isLoadingRate={isLoadingRate}
            />
          )}

          {/* Borrow/Repay/Withdraw Action */}
          <ActionCard
            mode={mode}
            setMode={setMode}
            availableToBorrow={availableToBorrow}
            currentDebt={currentDebt}
            healthFactor={healthFactor}
            totalCollateral={totalCollateral}
            liquidationThreshold={liquidationThreshold}
          />

          {/* Safety Education */}
          <SafetyEducationCard />
        </div>
      )}
    </div>
  );
}
