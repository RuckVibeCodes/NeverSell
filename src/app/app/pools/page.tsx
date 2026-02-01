"use client";

import { useState } from "react";
import { Layers, TrendingUp, Loader2, Check, AlertCircle, X, DollarSign, Droplets } from "lucide-react";
import { useAccount, useBalance } from "wagmi";
import { formatUnits } from "viem";
import { useGMXApy, formatAPY, getAPYColorClass } from "@/hooks/useGMXApy";
import { useGMXDeposit } from "@/hooks/useGMXDeposit";
import { AAVE_V3_ADDRESSES } from "@/lib/aave";
import type { Address } from "viem";
import type { GMPoolName } from "@/lib/gmx";

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

interface DepositModalProps {
  pool: typeof pools[0];
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
  const depositAmountWei = BigInt(Math.floor(depositAmount * 1e6)); // USDC has 6 decimals

  const {
    deposit,
    isDepositing,
    isConfirming,
    isSuccess,
    error,
  } = useGMXDeposit({
    poolName: pool.name,
    shortTokenAmount: depositAmountWei,
  });

  const isPending = isDepositing || isConfirming;

  const handleMaxClick = () => {
    if (balance) {
      setAmount(formatUnits(balance.value, 6));
    }
  };

  // Calculate estimated earnings
  const dailyEarnings = (depositAmount * apy / 100 / 365);
  const monthlyEarnings = dailyEarnings * 30;
  const yearlyEarnings = depositAmount * apy / 100;

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
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${pool.color} flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
            {pool.icon}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">{pool.name} Pool</h3>
            <p className="text-mint text-sm">{formatAPY(apy)} APY</p>
          </div>
        </div>

        <div className="mb-4 p-4 rounded-xl bg-white/5 border border-white/10">
          <p className="text-white/60 text-sm">
            Deposit USDC to provide liquidity and earn trading fees from the {pool.name} perpetuals market.
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
            <span>Balance: {balance ? parseFloat(formatUnits(balance.value, 6)).toFixed(2) : '0.00'} USDC</span>
          </div>
        </div>

        {/* Estimated earnings */}
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
          {isPending ? 'Processing...' : isSuccess ? 'Success!' : 'Deposit to Pool'}
        </button>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle size={16} />
            {error.message || 'Transaction failed'}
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

function PoolCard({ 
  pool, 
  apy, 
  tvl, 
  isLoading,
  onDeposit 
}: { 
  pool: typeof pools[0]; 
  apy: number;
  tvl: number;
  isLoading: boolean;
  onDeposit: () => void;
}) {
  const { isConnected } = useAccount();

  return (
    <div className="glass-card p-6 hover:border-mint/20 transition-all duration-300 group">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${pool.color} flex items-center justify-center text-white font-bold text-2xl shadow-lg group-hover:scale-105 transition-transform`}>
            {pool.icon}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">{pool.name}</h3>
            <p className="text-white/50 text-sm">{pool.description}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-mint" />
            <p className="text-white/40 text-xs">APY</p>
          </div>
          {isLoading ? (
            <div className="h-8 w-20 bg-white/10 rounded animate-pulse" />
          ) : (
            <p className={`text-2xl font-bold ${getAPYColorClass(apy)}`}>
              {formatAPY(apy)}
            </p>
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
            <p className="text-2xl font-bold text-white">
              ${(tvl / 1_000_000).toFixed(1)}M
            </p>
          )}
        </div>
      </div>

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

export default function PoolsPage() {
  const { isConnected } = useAccount();
  const [selectedPool, setSelectedPool] = useState<typeof pools[0] | null>(null);
  
  const { apyData, isLoading } = useGMXApy();

  const { data: usdcBalance } = useBalance({
    address: useAccount().address,
    token: AAVE_V3_ADDRESSES.USDC as Address,
  });

  const totalUsdcBalance = usdcBalance ? parseFloat(formatUnits(usdcBalance.value, 6)) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-white mb-2">Earn More Yield</h1>
        <p className="text-white/60">Deploy your USDC into liquidity pools to earn trading fees</p>
      </div>

      {/* Stats summary */}
      {isConnected && (
        <div className="glass-card p-6 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <p className="text-white/40 text-sm mb-1">Available USDC</p>
              <p className="text-2xl font-bold text-white">${totalUsdcBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
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

      {/* Info banner */}
      <div className="mb-8 p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-mint/10 border border-purple-500/20">
        <div className="flex items-start gap-3">
          <DollarSign size={20} className="text-mint mt-0.5" />
          <div>
            <p className="text-white font-medium">How Pool Yields Work</p>
            <p className="text-white/60 text-sm mt-1">
              When you deposit USDC into a pool, you earn fees from traders using leverage on that market. 
              Higher trading volume = higher yields. APYs are variable based on market activity.
            </p>
          </div>
        </div>
      </div>

      {!isConnected ? (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-mint/20 to-purple-500/20 flex items-center justify-center text-mint mx-auto mb-4">
            <Layers size={32} />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-white/60">Connect your wallet to deposit into liquidity pools.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pools.map((pool) => {
            const poolApy = apyData[pool.name];
            return (
              <PoolCard 
                key={pool.name}
                pool={pool}
                apy={poolApy?.apy7d || 0}
                tvl={poolApy?.tvlUsd || 0}
                isLoading={isLoading}
                onDeposit={() => setSelectedPool(pool)}
              />
            );
          })}
        </div>
      )}

      {/* Risk notice */}
      <div className="mt-8 p-4 rounded-xl bg-white/5 border border-white/10">
        <p className="text-white/50 text-sm">
          <strong className="text-white/70">Risk Notice:</strong> Providing liquidity involves risk. 
          Pool values can fluctuate based on trader profits/losses. APYs shown are estimates based on 
          recent performance and are not guaranteed.
        </p>
      </div>

      {/* Deposit Modal */}
      {selectedPool && (
        <DepositModal 
          pool={selectedPool}
          apy={apyData[selectedPool.name]?.apy7d || 0}
          onClose={() => setSelectedPool(null)} 
        />
      )}
    </div>
  );
}
