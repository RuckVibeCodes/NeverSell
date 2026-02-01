'use client';

import { useState } from 'react';
import { Leaf, ChevronDown, X, Loader2, CheckCircle, ExternalLink } from 'lucide-react';
import { useAccount } from 'wagmi';
import { cn } from '@/lib/utils';
import { useAaveWithdraw, AAVE_V3_ADDRESSES } from '@/hooks';

interface HarvestCardProps {
  earningsUSD: number;
  depositedUSD: number;
  dailyEarnings: number;
  onHarvestComplete?: () => void;
}

/**
 * HarvestCard - Allows users to withdraw their earnings without touching principal
 * 🌾 harvest/growth theme with green accents
 */
export function HarvestCard({
  earningsUSD,
  depositedUSD,
  dailyEarnings,
  onHarvestComplete,
}: HarvestCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Don't show if no earnings
  if (earningsUSD <= 0) return null;
  
  return (
    <>
      <div className="glass-card p-6 border-mint/10 hover:border-mint/20 transition-colors">
        {/* Header with harvest emoji */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-mint/20 to-emerald-500/20 flex items-center justify-center">
              <span className="text-xl">🌾</span>
            </div>
            <h2 className="text-lg font-semibold text-white/80">Your Earnings</h2>
          </div>
          <div className="text-mint text-sm font-medium">
            +${dailyEarnings.toFixed(2)}/day
          </div>
        </div>
        
        {/* Earnings breakdown */}
        <div className="space-y-3 mb-5">
          <div className="flex justify-between items-center">
            <span className="text-white/50 text-sm">Total Earned</span>
            <span className="text-mint text-xl font-bold">
              ${earningsUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/50 text-sm">Available to Harvest</span>
            <span className="text-white font-medium">
              ${earningsUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
        
        {/* Harvest button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-mint to-emerald-500 text-white rounded-xl font-semibold hover:from-mint/90 hover:to-emerald-500/90 transition-all shadow-lg shadow-mint/20"
        >
          <Leaf size={18} />
          Harvest ${earningsUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </button>
        
        {/* Info note */}
        <p className="text-white/40 text-xs mt-4 text-center">
          💡 Harvesting withdraws only your yield. Your ${depositedUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })} principal keeps compounding.
        </p>
      </div>
      
      {/* Modal */}
      {isModalOpen && (
        <HarvestModal
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

interface HarvestModalProps {
  earningsUSD: number;
  onClose: () => void;
  onComplete: () => void;
}

function HarvestModal({ earningsUSD, onClose, onComplete }: HarvestModalProps) {
  const { address } = useAccount();
  const [selectedAsset, setSelectedAsset] = useState<'USDC' | 'USDC.e'>('USDC');
  const [showAssetDropdown, setShowAssetDropdown] = useState(false);
  
  // Use the appropriate USDC address based on selection
  const assetAddress = selectedAsset === 'USDC' 
    ? AAVE_V3_ADDRESSES.USDC 
    : AAVE_V3_ADDRESSES.USDC_E;
  
  const {
    withdraw,
    isWithdrawing,
    isPending,
    isSuccess,
    error,
    hash,
  } = useAaveWithdraw({
    asset: assetAddress,
    amount: earningsUSD, // Withdraw earnings amount
    withdrawMax: false,
    to: address,
  });
  
  const handleHarvest = () => {
    withdraw();
  };
  
  // Success state
  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onComplete} />
        <div className="relative glass-card-strong p-8 rounded-3xl max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-mint/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-mint" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Harvest Complete!</h3>
          <p className="text-white/60 mb-6">
            ${earningsUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })} has been sent to your wallet.
          </p>
          
          {hash && (
            <a
              href={`https://arbiscan.io/tx/${hash}`}
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
      <div className="relative glass-card-strong p-6 rounded-3xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-mint/20 to-emerald-500/20 flex items-center justify-center">
              <span className="text-2xl">🌾</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Harvest Earnings</h3>
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
        
        {/* Amount */}
        <div className="bg-white/5 rounded-2xl p-4 mb-4">
          <span className="text-white/50 text-sm">You will receive</span>
          <div className="text-3xl font-bold text-mint mt-1">
            ${earningsUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        
        {/* Asset selector */}
        <div className="mb-4">
          <label className="text-white/50 text-sm mb-2 block">Receive as</label>
          <div className="relative">
            <button
              onClick={() => setShowAssetDropdown(!showAssetDropdown)}
              className="w-full flex items-center justify-between px-4 py-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                  $
                </div>
                <span className="text-white font-medium">{selectedAsset}</span>
              </div>
              <ChevronDown className={cn(
                "w-5 h-5 text-white/60 transition-transform",
                showAssetDropdown && "rotate-180"
              )} />
            </button>
            
            {showAssetDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#0a0e17] border border-white/10 rounded-xl overflow-hidden z-10">
                {(['USDC', 'USDC.e'] as const).map((asset) => (
                  <button
                    key={asset}
                    onClick={() => {
                      setSelectedAsset(asset);
                      setShowAssetDropdown(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-2 px-4 py-3 hover:bg-white/5 transition-colors",
                      selectedAsset === asset && "bg-white/5"
                    )}
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                      $
                    </div>
                    <span className="text-white">{asset}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Info box */}
        <div className="bg-mint/5 border border-mint/20 rounded-xl p-4 mb-6">
          <p className="text-white/70 text-sm">
            💡 Only your earnings will be withdrawn. Your principal continues compounding — earning more yield every day.
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
        
        {/* Harvest button */}
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
              Harvest Earnings
            </>
          )}
        </button>
        
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
