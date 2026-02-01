"use client";

import { useState } from "react";
import { PiggyBank, TrendingUp, Loader2, Check, AlertCircle, X } from "lucide-react";
import { useAccount, useBalance } from "wagmi";
import { formatUnits } from "viem";
import { useAaveDeposit } from "@/hooks/useAaveDeposit";
import { useAavePosition } from "@/hooks/useAavePosition";
import { AAVE_V3_ADDRESSES } from "@/lib/aave";
import type { Address } from "viem";

const lendableAssets = [
  { 
    symbol: "WBTC", 
    name: "Wrapped Bitcoin", 
    icon: "₿",
    address: AAVE_V3_ADDRESSES.WBTC,
    apy: 0.45,
    color: "from-orange-500 to-amber-500",
  },
  { 
    symbol: "ETH", 
    name: "Ethereum", 
    icon: "Ξ",
    address: AAVE_V3_ADDRESSES.WETH,
    apy: 2.1,
    color: "from-blue-500 to-purple-500",
  },
  { 
    symbol: "USDC", 
    name: "USD Coin", 
    icon: "$",
    address: AAVE_V3_ADDRESSES.USDC,
    apy: 4.8,
    color: "from-blue-400 to-cyan-400",
  },
  { 
    symbol: "ARB", 
    name: "Arbitrum", 
    icon: "A",
    address: AAVE_V3_ADDRESSES.ARB,
    apy: 1.2,
    color: "from-blue-600 to-indigo-500",
  },
];

interface SupplyModalProps {
  asset: typeof lendableAssets[0];
  onClose: () => void;
}

function SupplyModal({ asset, onClose }: SupplyModalProps) {
  const [amount, setAmount] = useState("");
  const { address } = useAccount();
  
  const { data: balance } = useBalance({
    address,
    token: asset.address as Address,
  });

  const {
    needsApproval,
    approve,
    deposit,
    isApproving,
    isApprovalPending,
    isDepositing,
    isDepositPending,
    isDepositSuccess,
    depositError,
    approvalError,
  } = useAaveDeposit({
    asset: asset.address as Address,
    amount: parseFloat(amount) || 0,
  });

  const isPending = isApproving || isApprovalPending || isDepositing || isDepositPending;

  const handleMaxClick = () => {
    if (balance) {
      setAmount(formatUnits(balance.value, balance.decimals));
    }
  };

  const handleAction = () => {
    if (needsApproval) {
      approve();
    } else {
      deposit();
    }
  };

  const getButtonText = () => {
    if (isApproving || isApprovalPending) return 'Approving...';
    if (isDepositing || isDepositPending) return 'Supplying...';
    if (isDepositSuccess) return 'Success!';
    if (needsApproval) return `Approve ${asset.symbol}`;
    return 'Supply';
  };

  // Calculate estimated earnings
  const amountNum = parseFloat(amount) || 0;
  const dailyEarnings = (amountNum * asset.apy / 100 / 365);
  const monthlyEarnings = dailyEarnings * 30;
  const yearlyEarnings = amountNum * asset.apy / 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-card w-full max-w-md p-6 relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${asset.color} flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
            {asset.icon}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Supply {asset.symbol}</h3>
            <p className="text-mint text-sm">{asset.apy}% APY</p>
          </div>
        </div>

        {/* Amount input */}
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
            <span>Balance: {balance ? parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(6) : '0.00'} {asset.symbol}</span>
          </div>
        </div>

        {/* Estimated earnings */}
        {amountNum > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-mint/5 border border-mint/20 space-y-2">
            <p className="text-white/60 text-sm font-medium mb-3">Estimated Earnings</p>
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-sm">Daily</span>
              <span className="text-mint font-medium">+{dailyEarnings.toFixed(6)} {asset.symbol}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-sm">Monthly</span>
              <span className="text-mint font-medium">+{monthlyEarnings.toFixed(6)} {asset.symbol}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-sm">Yearly</span>
              <span className="text-mint font-medium">+{yearlyEarnings.toFixed(6)} {asset.symbol}</span>
            </div>
          </div>
        )}

        {/* Action button */}
        <button 
          onClick={handleAction}
          disabled={!amount || parseFloat(amount) <= 0 || isPending || isDepositSuccess}
          className="w-full btn-primary flex items-center justify-center gap-2 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <Loader2 size={18} className="animate-spin" />
          ) : isDepositSuccess ? (
            <Check size={18} />
          ) : null}
          {getButtonText()}
        </button>

        {/* Errors */}
        {(depositError || approvalError) && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle size={16} />
            {(depositError || approvalError)?.message || 'Transaction failed'}
          </div>
        )}

        {/* Success */}
        {isDepositSuccess && (
          <div className="mt-4 p-3 rounded-xl bg-mint/10 border border-mint/20 flex items-center gap-2 text-mint text-sm">
            <Check size={16} />
            Successfully supplied {amount} {asset.symbol}!
          </div>
        )}
      </div>
    </div>
  );
}

function AssetCard({ asset, onSupply }: { asset: typeof lendableAssets[0]; onSupply: () => void }) {
  const { address, isConnected } = useAccount();
  
  const { data: balance } = useBalance({
    address,
    token: asset.address as Address,
  });

  const { assetPositions } = useAavePosition({
    assets: [asset.address as Address],
  });

  const supplied = assetPositions.find(p => p.asset === asset.address)?.aTokenBalance || 0;

  return (
    <div className="glass-card p-6 hover:border-mint/20 transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${asset.color} flex items-center justify-center text-white font-bold text-2xl shadow-lg group-hover:scale-105 transition-transform`}>
            {asset.icon}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">{asset.symbol}</h3>
            <p className="text-white/50 text-sm">{asset.name}</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="flex items-center gap-1 text-mint text-xl font-bold">
            <TrendingUp size={18} />
            {asset.apy}%
          </div>
          <p className="text-white/50 text-sm">APY</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4 p-4 rounded-xl bg-white/[0.02]">
        <div>
          <p className="text-white/40 text-xs mb-1">Wallet Balance</p>
          <p className="text-white font-medium">
            {balance ? parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(4) : '0.00'}
          </p>
        </div>
        <div>
          <p className="text-white/40 text-xs mb-1">Supplied</p>
          <p className="text-mint font-medium">{supplied.toFixed(4)}</p>
        </div>
      </div>

      <button 
        onClick={onSupply}
        disabled={!isConnected}
        className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Supply
      </button>
    </div>
  );
}

export default function LendPage() {
  const { isConnected } = useAccount();
  const [selectedAsset, setSelectedAsset] = useState<typeof lendableAssets[0] | null>(null);
  
  const { position } = useAavePosition();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-white mb-2">Lend & Earn</h1>
        <p className="text-white/60">Supply assets to earn yield and use as collateral for borrowing</p>
      </div>

      {/* Stats summary */}
      {isConnected && position && position.totalCollateralUSD > 0 && (
        <div className="glass-card p-6 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <p className="text-white/40 text-sm mb-1">Total Supplied</p>
              <p className="text-2xl font-bold text-white">${position.totalCollateralUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-white/40 text-sm mb-1">Available to Borrow</p>
              <p className="text-2xl font-bold text-mint">${position.availableBorrowsUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-white/40 text-sm mb-1">LTV</p>
              <p className="text-2xl font-bold text-white">{position.ltv}%</p>
            </div>
          </div>
        </div>
      )}

      {!isConnected ? (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-mint/20 to-purple-500/20 flex items-center justify-center text-mint mx-auto mb-4">
            <PiggyBank size={32} />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-white/60">Connect your wallet to start lending and earning yield.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {lendableAssets.map((asset) => (
            <AssetCard 
              key={asset.symbol} 
              asset={asset} 
              onSupply={() => setSelectedAsset(asset)}
            />
          ))}
        </div>
      )}

      {/* Supply Modal */}
      {selectedAsset && (
        <SupplyModal 
          asset={selectedAsset} 
          onClose={() => setSelectedAsset(null)} 
        />
      )}
    </div>
  );
}
