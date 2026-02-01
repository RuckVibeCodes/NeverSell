"use client";

import { useState, useEffect } from "react";
import { Wallet, ArrowRight, Loader2, Check, AlertCircle, RefreshCw, ExternalLink } from "lucide-react";
import { useAccount, useChainId, useBalance, useSwitchChain } from "wagmi";
import { formatUnits } from "viem";
import { useLiFiBridge, TOKENS, SUPPORTED_SOURCE_CHAINS, ARBITRUM_CHAIN_ID } from "@/hooks/useLiFiBridge";

const supportedAssets = [
  { 
    symbol: "ETH", 
    name: "Ethereum", 
    icon: "Ξ",
    decimals: 18,
    tokenAddress: TOKENS.NATIVE,
    targetAddress: TOKENS.WETH_ARB,
    color: "from-blue-500 to-purple-500",
  },
  { 
    symbol: "USDC", 
    name: "USD Coin", 
    icon: "$",
    decimals: 6,
    tokenAddress: "USDC",
    targetAddress: TOKENS.USDC[ARBITRUM_CHAIN_ID],
    color: "from-blue-400 to-cyan-400",
  },
];

function BridgeCard({ asset }: { asset: typeof supportedAssets[0] }) {
  const [amount, setAmount] = useState("");
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  
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

  const { data: balance } = useBalance({
    address,
    token: asset.tokenAddress === TOKENS.NATIVE ? undefined : fromTokenAddress as `0x${string}`,
  });

  const currentChain = SUPPORTED_SOURCE_CHAINS.find(c => c.id === chainId);

  useEffect(() => {
    if (status === 'quoted' || status === 'error') {
      reset();
    }
  }, [amount]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAction = async () => {
    if (status === 'quoted') {
      await executeBridge();
    } else {
      await fetchQuote();
    }
  };

  const handleMaxClick = () => {
    if (balance) {
      const maxAmount = asset.tokenAddress === TOKENS.NATIVE
        ? Math.max(0, parseFloat(formatUnits(balance.value, balance.decimals)) - 0.01)
        : parseFloat(formatUnits(balance.value, balance.decimals));
      setAmount(maxAmount.toString());
    }
  };

  const getButtonText = () => {
    switch (status) {
      case 'quoting': return 'Getting Quote...';
      case 'quoted': return isCrossChain ? 'Bridge to Arbitrum' : 'Continue';
      case 'executing': return 'Processing...';
      case 'success': return 'Success!';
      default: return isCrossChain ? 'Get Quote' : 'Continue';
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
        return <ArrowRight size={18} />;
    }
  };

  return (
    <div className="glass-card p-6 hover:border-mint/20 transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${asset.color} flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
            {asset.icon}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">{asset.symbol}</h3>
            <p className="text-white/50 text-sm">{asset.name}</p>
          </div>
        </div>
      </div>

      {/* Chain indicator */}
      {isCrossChain && currentChain && (
        <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2 text-amber-400 text-sm">
            <span className="font-medium">{currentChain.name}</span>
            <ArrowRight size={14} />
            <span className="font-medium">Arbitrum</span>
            <span className="text-white/50 ml-auto text-xs">via Li.Fi</span>
          </div>
        </div>
      )}
      
      <div className="space-y-3">
        <div className="relative">
          <input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-navy-200 border border-white/10 rounded-xl px-4 py-4 text-white text-lg placeholder:text-white/30 focus:outline-none focus:border-mint/50 transition-colors"
            disabled={status === 'executing'}
          />
          <button 
            onClick={handleMaxClick}
            disabled={!balance || status === 'executing'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-mint text-sm hover:underline disabled:opacity-50"
          >
            MAX
          </button>
        </div>
        
        <div className="flex justify-between text-sm text-white/50 px-1">
          <span>Balance: {balance ? parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(4) : '0.00'} {asset.symbol}</span>
        </div>

        <button 
          onClick={handleAction}
          disabled={!isConnected || !amount || parseFloat(amount) <= 0 || status === 'quoting' || status === 'executing'}
          className="w-full btn-primary flex items-center justify-center gap-2 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {getButtonIcon()}
          {getButtonText()}
        </button>
      </div>

      {/* Quote details */}
      {status === 'quoted' && (
        <div className="mt-4 p-4 rounded-xl bg-mint/5 border border-mint/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-sm">You receive</span>
            <span className="text-mint font-semibold">{estimatedOutput} {asset.symbol}</span>
          </div>
          {isCrossChain && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-white/60 text-sm">Route</span>
                <span className="text-white/80 text-sm">{bridgePath}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60 text-sm">Time</span>
                <span className="text-white/80 text-sm">{estimatedTime}</span>
              </div>
            </>
          )}
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-sm">Gas</span>
            <span className="text-white/80 text-sm">{estimatedGas}</span>
          </div>
          <button
            onClick={fetchQuote}
            className="w-full mt-2 flex items-center justify-center gap-2 text-sm text-white/60 hover:text-mint transition-colors py-2"
          >
            <RefreshCw size={14} />
            Refresh quote
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {status === 'success' && (
        <div className="mt-4 p-3 rounded-xl bg-mint/10 border border-mint/20 flex items-center gap-2 text-mint text-sm">
          <Check size={16} />
          Funds bridged successfully!
        </div>
      )}
    </div>
  );
}

export default function FundPage() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  
  const currentChain = SUPPORTED_SOURCE_CHAINS.find(c => c.id === chainId);
  const isOnArbitrum = chainId === ARBITRUM_CHAIN_ID;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-white mb-2">Fund Your Account</h1>
        <p className="text-white/60">Bridge assets from any chain to start earning on Arbitrum</p>
      </div>

      {/* Network Status */}
      {isConnected && (
        <div className="glass-card p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${isOnArbitrum ? 'bg-mint' : 'bg-amber-400'} animate-pulse`} />
              <div>
                <p className="text-white font-medium">
                  {isOnArbitrum ? "You're on Arbitrum" : `Connected to ${currentChain?.name || 'Unknown'}`}
                </p>
                <p className="text-white/50 text-sm">
                  {isOnArbitrum 
                    ? 'Ready to deposit directly' 
                    : 'Bridge your assets to Arbitrum to get started'
                  }
                </p>
              </div>
            </div>
            
            {!isOnArbitrum && (
              <button
                onClick={() => switchChain?.({ chainId: ARBITRUM_CHAIN_ID })}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                <ExternalLink size={16} />
                Switch to Arbitrum
              </button>
            )}
          </div>
        </div>
      )}

      {!isConnected ? (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-mint/20 to-purple-500/20 flex items-center justify-center text-mint mx-auto mb-4">
            <Wallet size={32} />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-white/60">Connect your wallet to fund your account and start earning.</p>
        </div>
      ) : (
        <>
          {/* Info banner */}
          {!isOnArbitrum && (
            <div className="mb-8 p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-mint/10 border border-purple-500/20">
              <p className="text-white text-sm">
                <span className="text-mint font-semibold">Cross-chain funding enabled!</span>
                {" "}We use Li.Fi to automatically bridge your assets from {currentChain?.name} to Arbitrum. One transaction, no hassle.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {supportedAssets.map((asset) => (
              <BridgeCard key={asset.symbol} asset={asset} />
            ))}
          </div>

          {/* Supported chains */}
          <div className="mt-8 text-center">
            <p className="text-white/40 text-sm mb-3">Supported source chains</p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUPPORTED_SOURCE_CHAINS.map((chain) => (
                <span 
                  key={chain.id}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                    chain.id === chainId 
                      ? 'bg-mint/20 text-mint border border-mint/30' 
                      : 'bg-white/5 text-white/50'
                  }`}
                >
                  {chain.name}
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
