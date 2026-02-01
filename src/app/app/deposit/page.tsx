"use client";

import { useState, useEffect } from "react";
import { ArrowDownToLine, ArrowRight, Loader2, Check, AlertCircle, RefreshCw } from "lucide-react";
import { useAccount, useChainId, useBalance } from "wagmi";
import { formatUnits } from "viem";
import { useLiFiBridge, TOKENS, SUPPORTED_SOURCE_CHAINS, ARBITRUM_CHAIN_ID } from "@/hooks/useLiFiBridge";

const supportedAssets = [
  { 
    symbol: "ETH", 
    name: "Ethereum", 
    apy: 3.2, 
    icon: "Ξ",
    decimals: 18,
    tokenAddress: TOKENS.NATIVE, // Native ETH
    targetAddress: TOKENS.WETH_ARB, // WETH on Arbitrum
  },
  { 
    symbol: "USDC", 
    name: "USD Coin", 
    apy: 4.5, 
    icon: "$",
    decimals: 6,
    tokenAddress: "USDC", // Will be resolved per chain
    targetAddress: TOKENS.USDC[ARBITRUM_CHAIN_ID], // USDC on Arbitrum
  },
];

function DepositCard({ asset }: { asset: typeof supportedAssets[0] }) {
  const [amount, setAmount] = useState("");
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  
  // Get the correct token address for the current chain
  const getTokenAddress = () => {
    if (asset.tokenAddress === "USDC") {
      return TOKENS.USDC[chainId as keyof typeof TOKENS.USDC] || TOKENS.USDC[ARBITRUM_CHAIN_ID];
    }
    return asset.tokenAddress;
  };

  const fromTokenAddress = getTokenAddress();
  
  const {
    status,
    error,
    isCrossChain,
    fetchQuote,
    executeBridge,
    reset,
    estimatedOutput,
    estimatedGas,
    estimatedTime,
    bridgePath,
  } = useLiFiBridge({
    fromTokenAddress,
    toTokenAddress: asset.targetAddress,
    amount,
    decimals: asset.decimals,
  });

  // Get wallet balance
  const { data: balance } = useBalance({
    address,
    token: asset.tokenAddress === TOKENS.NATIVE ? undefined : fromTokenAddress as `0x${string}`,
  });

  const currentChain = SUPPORTED_SOURCE_CHAINS.find(c => c.id === chainId);

  // Reset quote when amount changes
  useEffect(() => {
    if (status === 'quoted' || status === 'error') {
      reset();
    }
  }, [amount]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGetQuote = async () => {
    await fetchQuote();
  };

  const handleDeposit = async () => {
    if (status === 'quoted') {
      await executeBridge();
    } else {
      await fetchQuote();
    }
  };

  const handleMaxClick = () => {
    if (balance) {
      // Leave a small amount for gas if native token
      const maxAmount = asset.tokenAddress === TOKENS.NATIVE
        ? Math.max(0, parseFloat(formatUnits(balance.value, balance.decimals)) - 0.01)
        : parseFloat(formatUnits(balance.value, balance.decimals));
      setAmount(maxAmount.toString());
    }
  };

  const getButtonText = () => {
    switch (status) {
      case 'quoting':
        return 'Getting Quote...';
      case 'quoted':
        return isCrossChain ? 'Bridge & Deposit' : 'Deposit';
      case 'executing':
        return 'Confirming...';
      case 'success':
        return 'Success!';
      default:
        return isCrossChain ? 'Get Bridge Quote' : 'Deposit';
    }
  };

  const getButtonIcon = () => {
    switch (status) {
      case 'quoting':
      case 'executing':
        return <Loader2 size={18} className="animate-spin" />;
      case 'success':
        return <Check size={18} />;
      default:
        return <ArrowDownToLine size={18} />;
    }
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-mint/10 flex items-center justify-center text-mint font-bold">
            {asset.icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{asset.symbol}</h3>
            <p className="text-white/50 text-sm">{asset.name}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-mint font-semibold">{asset.apy}% APY</div>
          <div className="text-white/50 text-sm">Supply Rate</div>
        </div>
      </div>

      {/* Chain indicator for cross-chain */}
      {isCrossChain && currentChain && (
        <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2 text-amber-400 text-sm">
            <span className="font-medium">{currentChain.name}</span>
            <ArrowRight size={14} />
            <span className="font-medium">Arbitrum</span>
            <span className="text-white/50 ml-auto">Cross-chain deposit</span>
          </div>
        </div>
      )}
      
      <div className="flex items-center gap-3">
        <input
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="flex-1 bg-navy-200 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-mint/50"
          disabled={status === 'executing'}
        />
        <button 
          onClick={handleDeposit}
          disabled={!isConnected || !amount || parseFloat(amount) <= 0 || status === 'quoting' || status === 'executing'}
          className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {getButtonIcon()}
          {getButtonText()}
        </button>
      </div>
      
      <div className="flex justify-between mt-3 text-sm text-white/50">
        <span>
          Wallet Balance: {balance ? parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(4) : '0.00'} {asset.symbol}
        </span>
        <button 
          onClick={handleMaxClick}
          disabled={!balance || status === 'executing'}
          className="text-mint hover:underline disabled:opacity-50"
        >
          MAX
        </button>
      </div>

      {/* Quote details */}
      {status === 'quoted' && (
        <div className="mt-4 p-4 rounded-lg bg-mint/5 border border-mint/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-sm">You will receive</span>
            <span className="text-mint font-semibold">{estimatedOutput} {asset.symbol}</span>
          </div>
          {isCrossChain && (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/60 text-sm">Route</span>
                <span className="text-white/80 text-sm">{bridgePath}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/60 text-sm">Estimated time</span>
                <span className="text-white/80 text-sm">{estimatedTime}</span>
              </div>
            </>
          )}
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-sm">Gas cost</span>
            <span className="text-white/80 text-sm">{estimatedGas}</span>
          </div>
          <button
            onClick={handleGetQuote}
            className="mt-3 w-full flex items-center justify-center gap-2 text-sm text-white/60 hover:text-mint transition-colors"
          >
            <RefreshCw size={14} />
            Refresh quote
          </button>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Success message */}
      {status === 'success' && (
        <div className="mt-4 p-3 rounded-lg bg-mint/10 border border-mint/20 flex items-center gap-2 text-mint text-sm">
          <Check size={16} />
          Deposit successful! Your funds are on the way to Arbitrum.
        </div>
      )}
    </div>
  );
}

export default function DepositPage() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  
  const currentChain = SUPPORTED_SOURCE_CHAINS.find(c => c.id === chainId);
  const isOnArbitrum = chainId === ARBITRUM_CHAIN_ID;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Deposit</h1>
        <p className="text-white/60">Supply assets to earn yield and use as collateral</p>
        
        {/* Cross-chain notice */}
        {isConnected && !isOnArbitrum && currentChain && (
          <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-mint/10 to-purple-500/10 border border-mint/20">
            <p className="text-white">
              <span className="text-mint font-semibold">Cross-chain deposits enabled!</span>
              {" "}You&apos;re connected to {currentChain.name}. We&apos;ll automatically bridge your assets to Arbitrum using Li.Fi.
            </p>
          </div>
        )}
      </div>

      {!isConnected ? (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-mint/10 flex items-center justify-center text-mint mx-auto mb-4">
            <ArrowDownToLine size={32} />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-white/60">Connect your wallet to start depositing assets and earning yield.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {supportedAssets.map((asset) => (
            <DepositCard key={asset.symbol} asset={asset} />
          ))}
        </div>
      )}
    </div>
  );
}
