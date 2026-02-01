"use client";

import { useState } from "react";
import { Landmark, AlertTriangle, TrendingDown, Loader2, Check, AlertCircle, Shield, X } from "lucide-react";
import { useAccount, useBalance } from "wagmi";
import { formatUnits } from "viem";
import { useAaveBorrow } from "@/hooks/useAaveBorrow";
import { useAavePosition } from "@/hooks/useAavePosition";
import { useAaveRepay } from "@/hooks/useAaveRepay";
import { AAVE_V3_ADDRESSES } from "@/lib/aave";
import type { Address } from "viem";

function HealthIndicator({ healthFactor }: { healthFactor: number }) {
  const getHealthStatus = () => {
    if (healthFactor === Infinity || healthFactor > 3) {
      return { label: 'Safe', color: 'text-green-400', bgColor: 'bg-green-400', progress: 100 };
    }
    if (healthFactor >= 1.5) {
      return { label: 'Good', color: 'text-green-400', bgColor: 'bg-green-400', progress: Math.min(100, (healthFactor / 3) * 100) };
    }
    if (healthFactor >= 1.2) {
      return { label: 'Caution', color: 'text-yellow-400', bgColor: 'bg-yellow-400', progress: (healthFactor / 3) * 100 };
    }
    if (healthFactor >= 1) {
      return { label: 'At Risk', color: 'text-orange-400', bgColor: 'bg-orange-400', progress: (healthFactor / 3) * 100 };
    }
    return { label: 'Liquidation!', color: 'text-red-500', bgColor: 'bg-red-500', progress: 0 };
  };

  const status = getHealthStatus();
  const displayValue = healthFactor === Infinity ? '∞' : healthFactor.toFixed(2);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-white/60 text-sm">Health Factor</span>
        <div className="flex items-center gap-2">
          <Shield size={16} className={status.color} />
          <span className={`font-bold ${status.color}`}>{displayValue}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${status.bgColor}/20 ${status.color}`}>
            {status.label}
          </span>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div 
          className={`h-full ${status.bgColor} transition-all duration-500`}
          style={{ width: `${status.progress}%` }}
        />
      </div>
      
      {healthFactor < 1.5 && healthFactor !== Infinity && (
        <div className="flex items-center gap-2 text-yellow-400 text-xs mt-2">
          <AlertTriangle size={14} />
          <span>
            {healthFactor < 1.2 
              ? 'Danger! Your position may be liquidated soon.' 
              : 'Consider repaying some debt to improve your health factor.'}
          </span>
        </div>
      )}
    </div>
  );
}

interface RepayModalProps {
  currentDebt: number;
  onClose: () => void;
}

function RepayModal({ currentDebt, onClose }: RepayModalProps) {
  const [amount, setAmount] = useState("");
  const { address } = useAccount();
  
  const { data: balance } = useBalance({
    address,
    token: AAVE_V3_ADDRESSES.USDC as Address,
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

  const isPending = isApproving || isApprovalPending || isRepaying || isRepayPending;

  const handleMaxClick = () => {
    if (balance) {
      const balanceNum = parseFloat(formatUnits(balance.value, 6));
      const maxRepay = Math.min(balanceNum, currentDebt);
      setAmount(maxRepay.toString());
    }
  };

  const handleAction = () => {
    if (needsApproval) {
      approve();
    } else {
      repay();
    }
  };

  const getButtonText = () => {
    if (isApproving || isApprovalPending) return 'Approving...';
    if (isRepaying || isRepayPending) return 'Repaying...';
    if (isRepaySuccess) return 'Success!';
    if (needsApproval) return 'Approve USDC';
    return 'Repay';
  };

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
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
            <TrendingDown size={24} />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Repay USDC</h3>
            <p className="text-white/50 text-sm">Reduce your debt</p>
          </div>
        </div>

        <div className="mb-4 p-3 rounded-xl bg-white/5 border border-white/10">
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Current Debt</span>
            <span className="text-white font-medium">${currentDebt.toFixed(2)} USDC</span>
          </div>
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
            <button 
              onClick={handleMaxClick}
              disabled={!balance || isPending}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-mint text-sm hover:underline disabled:opacity-50"
            >
              MAX
            </button>
          </div>
          
          <div className="flex justify-between text-sm text-white/50 px-1">
            <span>USDC Balance: {balance ? parseFloat(formatUnits(balance.value, 6)).toFixed(2) : '0.00'}</span>
          </div>
        </div>

        <button 
          onClick={handleAction}
          disabled={!amount || parseFloat(amount) <= 0 || isPending || isRepaySuccess}
          className="w-full btn-primary flex items-center justify-center gap-2 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? <Loader2 size={18} className="animate-spin" /> : isRepaySuccess ? <Check size={18} /> : null}
          {getButtonText()}
        </button>

        {(repayError || approvalError) && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle size={16} />
            {(repayError || approvalError)?.message || 'Transaction failed'}
          </div>
        )}

        {isRepaySuccess && (
          <div className="mt-4 p-3 rounded-xl bg-mint/10 border border-mint/20 flex items-center gap-2 text-mint text-sm">
            <Check size={16} />
            Successfully repaid {amount} USDC!
          </div>
        )}
      </div>
    </div>
  );
}

export default function BorrowPage() {
  const { isConnected } = useAccount();
  const [borrowAmount, setBorrowAmount] = useState("");
  const [showRepayModal, setShowRepayModal] = useState(false);
  
  const { position, isLoading } = useAavePosition();

  const {
    borrow,
    isPending,
    isSuccess,
    error,
  } = useAaveBorrow({
    amount: parseFloat(borrowAmount) || 0,
  });

  const totalCollateral = position?.totalCollateralUSD || 0;
  const currentDebt = position?.totalDebtUSD || 0;
  const availableToBorrow = position?.availableBorrowsUSD || 0;
  const healthFactor = position?.healthFactor || Infinity;
  const ltv = position?.ltv || 70;
  const liquidationThreshold = position?.liquidationThreshold || 82.5;

  // Calculate new health factor after borrow
  const newBorrowAmount = parseFloat(borrowAmount) || 0;
  const newTotalDebt = currentDebt + newBorrowAmount;
  const newHealthFactor = newTotalDebt > 0 
    ? (totalCollateral * (liquidationThreshold / 100)) / newTotalDebt 
    : Infinity;

  // Calculate liquidation price (simplified - assumes single collateral)
  // Reserved for future use in UI
  const _liquidationPrice = newTotalDebt > 0 
    ? (newTotalDebt / (totalCollateral * (liquidationThreshold / 100))) * 100
    : 0;
  void _liquidationPrice; // Suppress unused warning

  const handleBorrow = () => {
    borrow();
  };

  const utilizationPercent = totalCollateral > 0 
    ? ((currentDebt / (totalCollateral * ltv / 100)) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-white mb-2">Borrow Against Your Collateral</h1>
        <p className="text-white/60">Take out a loan using your supplied assets as collateral (70% LTV)</p>
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
          <p className="text-white/60 mb-4">You need to supply collateral before you can borrow.</p>
          <a href="/app/lend" className="btn-primary inline-block">
            Supply Collateral
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main borrow card */}
          <div className="lg:col-span-2 space-y-6">
            {/* Position Overview */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Your Position</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <p className="text-white/40 text-sm mb-1">Total Collateral</p>
                  <p className="text-2xl font-bold text-white">${totalCollateral.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <p className="text-white/40 text-sm mb-1">Available to Borrow</p>
                  <p className="text-2xl font-bold text-mint">${availableToBorrow.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                </div>
              </div>

              {/* Health Factor */}
              <HealthIndicator healthFactor={healthFactor} />

              {/* Utilization bar */}
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Borrow Capacity Used</span>
                  <span className="text-white">{utilizationPercent.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-mint to-purple-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, utilizationPercent)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Borrow Input */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Borrow USDC</h2>
              
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="number"
                    placeholder="0.00"
                    value={borrowAmount}
                    onChange={(e) => setBorrowAmount(e.target.value)}
                    className="w-full bg-navy-200 border border-white/10 rounded-xl px-4 py-4 text-white text-lg placeholder:text-white/30 focus:outline-none focus:border-mint/50 transition-colors"
                    disabled={isPending}
                    max={availableToBorrow}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <button 
                      onClick={() => setBorrowAmount(availableToBorrow.toFixed(2))}
                      disabled={isPending}
                      className="text-mint text-sm hover:underline disabled:opacity-50"
                    >
                      MAX
                    </button>
                    <span className="text-white/50">USDC</span>
                  </div>
                </div>

                {/* Preview new health factor */}
                {newBorrowAmount > 0 && (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                    <p className="text-amber-400 text-sm font-medium">After this borrow:</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">New Total Debt</span>
                      <span className="text-white">${newTotalDebt.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">New Health Factor</span>
                      <span className={newHealthFactor < 1.5 ? 'text-yellow-400' : 'text-green-400'}>
                        {newHealthFactor === Infinity ? '∞' : newHealthFactor.toFixed(2)}
                      </span>
                    </div>
                    {newHealthFactor < 1.2 && (
                      <div className="flex items-center gap-2 text-red-400 text-xs">
                        <AlertTriangle size={14} />
                        <span>Warning: High liquidation risk!</span>
                      </div>
                    )}
                  </div>
                )}

                <button 
                  onClick={handleBorrow}
                  disabled={!borrowAmount || parseFloat(borrowAmount) <= 0 || parseFloat(borrowAmount) > availableToBorrow || isPending || isSuccess}
                  className="w-full btn-primary flex items-center justify-center gap-2 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : isSuccess ? (
                    <Check size={18} />
                  ) : null}
                  {isPending ? 'Borrowing...' : isSuccess ? 'Success!' : 'Borrow USDC'}
                </button>

                {error && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle size={16} />
                    {error.message || 'Transaction failed'}
                  </div>
                )}

                {isSuccess && (
                  <div className="p-3 rounded-xl bg-mint/10 border border-mint/20 flex items-center gap-2 text-mint text-sm">
                    <Check size={16} />
                    Successfully borrowed {borrowAmount} USDC!
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Active Loan */}
          <div className="space-y-6">
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Active Loan</h2>
              
              {currentDebt > 0 ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20">
                    <p className="text-white/40 text-sm mb-1">Total Debt</p>
                    <p className="text-2xl font-bold text-white">${currentDebt.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                    <p className="text-white/50 text-sm mt-1">USDC (Variable Rate)</p>
                  </div>

                  <button 
                    onClick={() => setShowRepayModal(true)}
                    className="w-full btn-secondary py-3"
                  >
                    Repay Loan
                  </button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-white/40">No active loans</p>
                </div>
              )}
            </div>

            {/* Risk Info */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Risk Parameters</h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">Loan-to-Value (LTV)</span>
                  <span className="text-white">{ltv}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Liquidation Threshold</span>
                  <span className="text-white">{liquidationThreshold}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Liquidation Penalty</span>
                  <span className="text-white">5%</span>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-white/5 text-white/50 text-xs">
                If your health factor drops below 1, your position may be liquidated with a 5% penalty.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Repay Modal */}
      {showRepayModal && (
        <RepayModal 
          currentDebt={currentDebt} 
          onClose={() => setShowRepayModal(false)} 
        />
      )}
    </div>
  );
}
