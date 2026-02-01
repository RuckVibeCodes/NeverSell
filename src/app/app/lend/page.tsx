"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { PiggyBank, TrendingUp, Loader2, Check, AlertCircle, X, Info, ExternalLink } from "lucide-react";
import { useAccount, useBalance } from "wagmi";
import { formatUnits } from "viem";
import Image from "next/image";
import { useAaveDeposit } from "@/hooks/useAaveDeposit";
import { useAavePosition } from "@/hooks/useAavePosition";
import { useGMXApy, formatAPY, formatLastUpdated } from "@/hooks/useGMXApy";
import { useAaveSupplyRates, FALLBACK_AAVE_SUPPLY_APY } from "@/hooks/useAaveSupplyRate";
import { AAVE_V3_ADDRESSES } from "@/lib/aave";
import { getArbiscanTxUrl, parseTransactionError } from "@/lib/arbiscan";
import { HarvestCard } from "@/components/dashboard";
import type { Address } from "viem";
import type { GMPoolName } from "@/lib/gmx";

// Mock data for demo mode
const MOCK_LEND_DATA = {
  totalSupplied: 15000,
  availableToBorrow: 9000,
  ltv: 60,
  earningsUSD: 125.50,
  dailyEarnings: 4.18,
};

// Asset logo URLs from CoinGecko
const ASSET_LOGOS = {
  WBTC: "https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png",
  ETH: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  USDC: "https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png",
  ARB: "https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg",
} as const;

// Approximate USD prices (replace with price feed hook in production)
const ASSET_PRICES: Record<string, number> = {
  WBTC: 97000,
  ETH: 3400,
  USDC: 1,
  ARB: 0.80,
};

// Map assets to their GM pool for APY
const ASSET_GM_POOL: Record<string, GMPoolName> = {
  WBTC: "BTC/USD",
  ETH: "ETH/USD",
  USDC: "ETH/USD", // USDC uses ETH/USD pool (short side)
  ARB: "ARB/USD",
};

const lendableAssets = [
  { 
    symbol: "WBTC", 
    name: "Wrapped Bitcoin", 
    logo: ASSET_LOGOS.WBTC,
    address: AAVE_V3_ADDRESSES.WBTC,
    color: "from-orange-500 to-amber-500",
  },
  { 
    symbol: "ETH", 
    name: "Ethereum", 
    logo: ASSET_LOGOS.ETH,
    address: AAVE_V3_ADDRESSES.WETH,
    color: "from-blue-500 to-purple-500",
  },
  { 
    symbol: "USDC", 
    name: "USD Coin", 
    logo: ASSET_LOGOS.USDC,
    address: AAVE_V3_ADDRESSES.USDC,
    color: "from-blue-400 to-cyan-400",
  },
  { 
    symbol: "ARB", 
    name: "Arbitrum", 
    logo: ASSET_LOGOS.ARB,
    address: AAVE_V3_ADDRESSES.ARB,
    color: "from-blue-600 to-indigo-500",
  },
];

interface SupplyModalProps {
  asset: typeof lendableAssets[0];
  apyData: { blended: number; aave: number; gmPool: number; gmPoolFee: number; gmPoolPerf: number };
  onClose: () => void;
  onSuccess?: () => void;
}

function SupplyModal({ asset, apyData, onClose, onSuccess }: SupplyModalProps) {
  const [amount, setAmount] = useState("");
  const { address } = useAccount();
  
  const { data: balance, refetch: refetchBalance } = useBalance({
    address,
    token: asset.address as Address,
  });

  // Handle successful deposit
  const handleDepositSuccess = useCallback((hash: string) => {
    refetchBalance();
    onSuccess?.();
  }, [refetchBalance, onSuccess]);

  const {
    needsApproval,
    approve,
    deposit,
    isApproving,
    isApprovalPending,
    isApprovalSuccess,
    isDepositing,
    isDepositPending,
    isDepositSuccess,
    depositError,
    approvalError,
    depositHash,
    reset,
  } = useAaveDeposit({
    asset: asset.address as Address,
    amount: parseFloat(amount) || 0,
    onDepositSuccess: handleDepositSuccess,
  });

  // Auto-proceed to deposit after approval succeeds
  useEffect(() => {
    if (isApprovalSuccess && !needsApproval && !isDepositing && !isDepositPending && !isDepositSuccess) {
      deposit();
    }
  }, [isApprovalSuccess, needsApproval, isDepositing, isDepositPending, isDepositSuccess, deposit]);

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

  const handleClose = () => {
    reset();
    onClose();
  };

  const getButtonText = () => {
    if (isApproving || isApprovalPending) return 'Approving...';
    if (isDepositing || isDepositPending) return 'Depositing...';
    if (isDepositSuccess) return 'Success!';
    if (needsApproval) return `Approve ${asset.symbol}`;
    return 'Deposit';
  };

  // Parse errors for user-friendly messages
  const errorMessage = parseTransactionError(depositError || approvalError);

  // Calculate projections based on NeverSell strategy
  const amountNum = parseFloat(amount) || 0;
  const assetPrice = ASSET_PRICES[asset.symbol] || 1;
  const depositValueUSD = amountNum * assetPrice;
  
  // 60% goes to Aave for borrowing capacity
  const borrowingCapacity = depositValueUSD * 0.6;
  
  // Monthly earnings based on blended APY
  // Blended = (Aave APY × 0.6) + (GM Pool Total APY × 0.4)
  const monthlyEarningsGross = (depositValueUSD * (apyData.blended / 100)) / 12;
  const monthlyEarningsNet = monthlyEarningsGross * 0.9; // After 10% platform fee

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-card w-full max-w-md p-6 relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${asset.color} flex items-center justify-center shadow-lg overflow-hidden`}>
            <Image 
              src={asset.logo} 
              alt={asset.symbol}
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">{asset.symbol}</h3>
            <p className="text-white/50 text-sm">{asset.name}</p>
          </div>
        </div>

        {/* Amount input */}
        <div className="space-y-3 mb-6">
          <label className="text-white/60 text-sm">Deposit Amount</label>
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

        {/* Divider */}
        <div className="border-t border-white/10 my-6" />

        {/* Strategy breakdown */}
        {amountNum > 0 && (
          <div className="mb-6 space-y-4">
            {/* Blended APY */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-white/60 text-sm">Blended APY</span>
                <div className="group relative">
                  <Info size={14} className="text-white/40 cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-navy-100 rounded-lg text-xs text-white/80 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 min-w-[220px]">
                    <div className="text-white/60 mb-1">APY Breakdown:</div>
                    <div className="mb-1">• Aave (60%): {formatAPY(apyData.aave)}</div>
                    <div className="mb-1">• GM Pool (40%): {formatAPY(apyData.gmPool)}</div>
                    <div className="text-white/50 pl-2 text-[10px]">Fee: {formatAPY(apyData.gmPoolFee)} + Perf: {formatAPY(apyData.gmPoolPerf)}</div>
                    <div className="mt-2 text-white/40 text-[10px] whitespace-normal max-w-[200px]">Performance APY reflects pool token appreciation and may vary.</div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-mint font-bold text-lg">{formatAPY(apyData.blended)}</span>
              </div>
            </div>

            {/* Monthly Earnings */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-white/60 text-sm">Monthly Earnings</span>
                <div className="group relative">
                  <Info size={14} className="text-white/40 cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-navy-100 rounded-lg text-xs text-white/80 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    After platform performance fee
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-mint font-bold text-lg">~${monthlyEarningsNet.toFixed(2)}</span>
                <span className="text-white/40 text-xs ml-1">(after performance fee)</span>
              </div>
            </div>

            {/* Borrowing Capacity */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-white/60 text-sm">Borrowing Capacity</span>
                <div className="group relative">
                  <Info size={14} className="text-white/40 cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-navy-100 rounded-lg text-xs text-white/80 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    60% of deposit available to borrow against
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-white font-bold text-lg">${borrowingCapacity.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                <span className="text-white/40 text-xs ml-1">(60% LTV)</span>
              </div>
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
        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle size={16} />
            {errorMessage}
          </div>
        )}

        {/* Success */}
        {isDepositSuccess && (
          <div className="mt-4 p-4 rounded-xl bg-mint/10 border border-mint/20 space-y-3">
            <div className="flex items-center gap-2 text-mint">
              <Check size={18} />
              <span className="font-medium">Successfully deposited {amount} {asset.symbol}!</span>
            </div>
            {depositHash && (
              <a 
                href={getArbiscanTxUrl(depositHash)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-mint/80 hover:text-mint text-sm transition-colors"
              >
                <ExternalLink size={14} />
                View on Arbiscan
              </a>
            )}
            <button
              onClick={handleClose}
              className="w-full mt-2 py-2 rounded-xl bg-mint/20 text-mint hover:bg-mint/30 transition-colors text-sm font-medium"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function AssetCard({ 
  asset, 
  apyData,
  onSupply 
}: { 
  asset: typeof lendableAssets[0]; 
  apyData: { blended: number; aave: number; gmPool: number; gmPoolFee: number; gmPoolPerf: number };
  onSupply: () => void;
}) {
  const { address, isConnected } = useAccount();
  
  const { data: balance } = useBalance({
    address,
    token: asset.address as Address,
  });

  const { assetPositions } = useAavePosition({
    assets: [asset.address as Address],
  });

  const supplied = assetPositions.find(p => p.asset === asset.address)?.aTokenBalance || 0;

  // Calculate borrowing capacity on supplied amount
  const assetPrice = ASSET_PRICES[asset.symbol] || 1;
  const suppliedValueUSD = supplied * assetPrice;
  const borrowingCapacity = suppliedValueUSD * 0.6;

  return (
    <div className="glass-card p-6 hover:border-mint/20 transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${asset.color} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform overflow-hidden`}>
            <Image 
              src={asset.logo} 
              alt={asset.symbol}
              width={36}
              height={36}
              className="object-contain"
            />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">{asset.symbol}</h3>
            <p className="text-white/50 text-sm">{asset.name}</p>
          </div>
        </div>
        
        <div className="text-right group/apy relative">
          <div className="flex items-center gap-1 text-mint text-xl font-bold">
            <TrendingUp size={18} />
            {formatAPY(apyData.blended)}
          </div>
          <p className="text-white/50 text-xs">Blended APY</p>
          {/* APY Breakdown Tooltip */}
          <div className="absolute top-full right-0 mt-2 px-3 py-2 bg-navy-100 rounded-lg text-xs text-white/80 opacity-0 group-hover/apy:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 border border-white/10 min-w-[220px]">
            <div className="text-white/60 mb-1">APY Breakdown:</div>
            <div className="mb-1">• Aave (60%): {formatAPY(apyData.aave)}</div>
            <div className="mb-1">• GM Pool (40%): {formatAPY(apyData.gmPool)}</div>
            <div className="text-white/50 pl-2 text-[10px]">Fee: {formatAPY(apyData.gmPoolFee)} + Perf: {formatAPY(apyData.gmPoolPerf)}</div>
            <div className="mt-2 text-white/40 text-[10px] whitespace-normal max-w-[200px]">Performance APY reflects pool token appreciation and may vary.</div>
          </div>
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

      {/* Borrowing capacity for supplied assets */}
      {supplied > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-mint/5 border border-mint/20">
          <div className="flex justify-between items-center">
            <span className="text-white/60 text-sm">Borrowing Capacity</span>
            <span className="text-mint font-medium">
              ${borrowingCapacity.toLocaleString(undefined, { maximumFractionDigits: 0 })} 
              <span className="text-white/40 text-xs ml-1">(60% LTV)</span>
            </span>
          </div>
        </div>
      )}

      <button 
        onClick={onSupply}
        disabled={!isConnected}
        className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Deposit
      </button>
    </div>
  );
}

// Blended APY calculation constants
const AAVE_WEIGHT = 0.6;  // 60% to Aave
const GMX_WEIGHT = 0.4;   // 40% to GM pools

export default function LendPage() {
  const { isConnected } = useAccount();
  const [selectedAsset, setSelectedAsset] = useState<typeof lendableAssets[0] | null>(null);
  
  const { position, refetch: refetchPosition } = useAavePosition();
  const { apyData, isLoading: gmxApyLoading, lastUpdated } = useGMXApy();
  const { supplyRates, isLoading: aaveApyLoading } = useAaveSupplyRates();
  
  const apyLoading = gmxApyLoading || aaveApyLoading;
  
  // Demo mode when connected but no real position
  const hasRealPosition = position && position.totalCollateralUSD > 0;
  const isDemoMode = isConnected && !hasRealPosition;
  
  // Use mock or real data
  const displayData = hasRealPosition ? {
    totalSupplied: position.totalCollateralUSD,
    availableToBorrow: position.availableBorrowsUSD,
    ltv: position.ltv,
  } : MOCK_LEND_DATA;

  // Calculate blended APY for each asset
  // Formula: (Aave Supply APY × 0.6) + (GM Pool Total APY × 0.4)
  const getBlendedApy = useMemo(() => {
    return (symbol: string): { blended: number; aave: number; gmPool: number; gmPoolFee: number; gmPoolPerf: number } => {
      // Get Aave supply rate
      const aaveApy = supplyRates[symbol] ?? FALLBACK_AAVE_SUPPLY_APY[symbol] ?? 0;
      
      // Get GM pool APY (total = fee + performance)
      const poolName = ASSET_GM_POOL[symbol];
      const poolApy = poolName ? apyData[poolName] : null;
      const gmPoolFeeApy = poolApy?.feeApy ?? 0;
      const gmPoolPerfApy = poolApy?.perfApy ?? 0;
      const gmPoolTotalApy = poolApy?.totalApy ?? 0;
      
      // Calculate blended APY using total APY (fee + performance)
      const blendedApy = (aaveApy * AAVE_WEIGHT) + (gmPoolTotalApy * GMX_WEIGHT);
      
      return {
        blended: Math.round(blendedApy * 100) / 100,
        aave: aaveApy,
        gmPool: gmPoolTotalApy,
        gmPoolFee: gmPoolFeeApy,
        gmPoolPerf: gmPoolPerfApy,
      };
    };
  }, [apyData, supplyRates]);

  const selectedAssetApy = selectedAsset ? getBlendedApy(selectedAsset.symbol) : { blended: 0, aave: 0, gmPool: 0, gmPoolFee: 0, gmPoolPerf: 0 };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-white mb-2">Lend & Earn</h1>
        <p className="text-white/60">Deposit assets to earn yield on GM pools and unlock borrowing capacity</p>
        {lastUpdated && (
          <p className="text-white/40 text-xs mt-2">
            APY data updated: {formatLastUpdated(lastUpdated)}
          </p>
        )}
      </div>

      {/* Strategy explanation */}
      <div className="glass-card p-6 mb-8 border-mint/20">
        <h2 className="text-lg font-semibold text-white mb-3">How NeverSell Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-mint/20 flex items-center justify-center text-mint font-bold shrink-0">
              60%
            </div>
            <div>
              <p className="text-white font-medium">Borrowing Collateral</p>
              <p className="text-white/50">Deposited to Aave for borrowing capacity</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-mint/20 flex items-center justify-center text-mint font-bold shrink-0">
              40%
            </div>
            <div>
              <p className="text-white font-medium">Yield Buffer</p>
              <p className="text-white/50">Deployed to GMX GM pools for yield</p>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Mode Banner */}
      {isDemoMode && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-mint/20 border border-purple-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <span className="text-xl">🎭</span>
            </div>
            <div>
              <p className="text-white font-medium">Demo Mode</p>
              <p className="text-white/60 text-sm">Showing mock data. Deposit assets to see your real position.</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats summary - show for real position OR demo mode */}
      {isConnected && (hasRealPosition || isDemoMode) && (
        <div className="glass-card p-6 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <p className="text-white/40 text-sm mb-1">Total Supplied</p>
              <p className="text-2xl font-bold text-white">${displayData.totalSupplied.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-white/40 text-sm mb-1">Available to Borrow</p>
              <p className="text-2xl font-bold text-mint">${displayData.availableToBorrow.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-white/40 text-sm mb-1">LTV</p>
              <p className="text-2xl font-bold text-white">{displayData.ltv}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Harvest Card */}
      {isConnected && (
        <div className="mb-8">
          <HarvestCard
            earningsUSD={hasRealPosition ? 0 : MOCK_LEND_DATA.earningsUSD}
            depositedUSD={displayData.totalSupplied}
            dailyEarnings={hasRealPosition ? 0 : MOCK_LEND_DATA.dailyEarnings}
          />
        </div>
      )}

      {!isConnected ? (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-mint/20 to-purple-500/20 flex items-center justify-center text-mint mx-auto mb-4">
            <PiggyBank size={32} />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-white/60">Connect your wallet to start earning yield.</p>
        </div>
      ) : apyLoading ? (
        <div className="glass-card p-12 text-center">
          <Loader2 size={32} className="animate-spin text-mint mx-auto mb-4" />
          <p className="text-white/60">Loading yield data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {lendableAssets.map((asset) => (
            <AssetCard 
              key={asset.symbol} 
              asset={asset} 
              apyData={getBlendedApy(asset.symbol)}
              onSupply={() => setSelectedAsset(asset)}
            />
          ))}
        </div>
      )}

      {/* Supply Modal */}
      {selectedAsset && (
        <SupplyModal 
          asset={selectedAsset} 
          apyData={selectedAssetApy}
          onClose={() => setSelectedAsset(null)}
          onSuccess={() => refetchPosition()}
        />
      )}
    </div>
  );
}
