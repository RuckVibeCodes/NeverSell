"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Wallet, 
  ArrowDown, 
  Loader2, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  ChevronDown,
  Clock,
  Fuel,
  Route
} from "lucide-react";
import { useAccount, useChainId, useBalance, useSwitchChain } from "wagmi";
import { formatUnits } from "viem";
import { useLiFiBridge, ARBITRUM_CHAIN_ID } from "@/hooks/useLiFiBridge";

// Platform fee (0.1%)
const PLATFORM_FEE_PERCENT = 0.001;

// Chain definitions with metadata
const CHAINS = [
  { id: 1, name: "Ethereum", symbol: "ETH", icon: "⟠", color: "from-blue-500 to-purple-500" },
  { id: 42161, name: "Arbitrum", symbol: "ARB", icon: "🔷", color: "from-blue-400 to-cyan-400" },
  { id: 8453, name: "Base", symbol: "BASE", icon: "🔵", color: "from-blue-500 to-blue-600" },
  { id: 10, name: "Optimism", symbol: "OP", icon: "🔴", color: "from-red-500 to-red-600" },
  { id: 137, name: "Polygon", symbol: "POL", icon: "🟣", color: "from-purple-500 to-purple-600" },
  { id: 56, name: "BSC", symbol: "BNB", icon: "🟡", color: "from-yellow-500 to-yellow-600" },
  { id: 43114, name: "Avalanche", symbol: "AVAX", icon: "🔺", color: "from-red-500 to-orange-500" },
] as const;

// Token definitions per chain
const TOKENS_BY_CHAIN: Record<number, Array<{
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  icon: string;
  isNative?: boolean;
}>> = {
  1: [ // Ethereum
    { symbol: "ETH", name: "Ethereum", address: "0x0000000000000000000000000000000000000000", decimals: 18, icon: "Ξ", isNative: true },
    { symbol: "USDC", name: "USD Coin", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6, icon: "$" },
    { symbol: "USDT", name: "Tether", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6, icon: "₮" },
    { symbol: "DAI", name: "Dai", address: "0x6B175474E89094C44Da98b954EescdeCB5BE3830", decimals: 18, icon: "◈" },
    { symbol: "WBTC", name: "Wrapped BTC", address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", decimals: 8, icon: "₿" },
    { symbol: "WETH", name: "Wrapped ETH", address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", decimals: 18, icon: "Ξ" },
  ],
  42161: [ // Arbitrum
    { symbol: "ETH", name: "Ethereum", address: "0x0000000000000000000000000000000000000000", decimals: 18, icon: "Ξ", isNative: true },
    { symbol: "USDC", name: "USD Coin", address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", decimals: 6, icon: "$" },
    { symbol: "USDT", name: "Tether", address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", decimals: 6, icon: "₮" },
    { symbol: "DAI", name: "Dai", address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1", decimals: 18, icon: "◈" },
    { symbol: "WBTC", name: "Wrapped BTC", address: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f", decimals: 8, icon: "₿" },
    { symbol: "ARB", name: "Arbitrum", address: "0x912CE59144191C1204E64559FE8253a0e49E6548", decimals: 18, icon: "🔷" },
  ],
  8453: [ // Base
    { symbol: "ETH", name: "Ethereum", address: "0x0000000000000000000000000000000000000000", decimals: 18, icon: "Ξ", isNative: true },
    { symbol: "USDC", name: "USD Coin", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6, icon: "$" },
    { symbol: "DAI", name: "Dai", address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb", decimals: 18, icon: "◈" },
    { symbol: "WETH", name: "Wrapped ETH", address: "0x4200000000000000000000000000000000000006", decimals: 18, icon: "Ξ" },
  ],
  10: [ // Optimism
    { symbol: "ETH", name: "Ethereum", address: "0x0000000000000000000000000000000000000000", decimals: 18, icon: "Ξ", isNative: true },
    { symbol: "USDC", name: "USD Coin", address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", decimals: 6, icon: "$" },
    { symbol: "USDT", name: "Tether", address: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58", decimals: 6, icon: "₮" },
    { symbol: "DAI", name: "Dai", address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1", decimals: 18, icon: "◈" },
    { symbol: "WBTC", name: "Wrapped BTC", address: "0x68f180fcCe6836688e9084f035309E29Bf0A2095", decimals: 8, icon: "₿" },
  ],
  137: [ // Polygon
    { symbol: "MATIC", name: "Polygon", address: "0x0000000000000000000000000000000000000000", decimals: 18, icon: "🟣", isNative: true },
    { symbol: "USDC", name: "USD Coin", address: "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359", decimals: 6, icon: "$" },
    { symbol: "USDT", name: "Tether", address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", decimals: 6, icon: "₮" },
    { symbol: "DAI", name: "Dai", address: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063", decimals: 18, icon: "◈" },
    { symbol: "WBTC", name: "Wrapped BTC", address: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6", decimals: 8, icon: "₿" },
  ],
  56: [ // BSC
    { symbol: "BNB", name: "BNB", address: "0x0000000000000000000000000000000000000000", decimals: 18, icon: "🟡", isNative: true },
    { symbol: "USDC", name: "USD Coin", address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", decimals: 18, icon: "$" },
    { symbol: "USDT", name: "Tether", address: "0x55d398326f99059fF775485246999027B3197955", decimals: 18, icon: "₮" },
    { symbol: "DAI", name: "Dai", address: "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3", decimals: 18, icon: "◈" },
    { symbol: "BTCB", name: "Bitcoin BEP2", address: "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c", decimals: 18, icon: "₿" },
  ],
  43114: [ // Avalanche
    { symbol: "AVAX", name: "Avalanche", address: "0x0000000000000000000000000000000000000000", decimals: 18, icon: "🔺", isNative: true },
    { symbol: "USDC", name: "USD Coin", address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", decimals: 6, icon: "$" },
    { symbol: "USDT", name: "Tether", address: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7", decimals: 6, icon: "₮" },
    { symbol: "DAI.e", name: "Dai", address: "0xd586E7F844cEa2F87f50152665BCbc2C279D8d70", decimals: 18, icon: "◈" },
    { symbol: "WBTC.e", name: "Wrapped BTC", address: "0x50b7545627a5162F82A992c33b87aDc75187B218", decimals: 8, icon: "₿" },
  ],
};

// Destination tokens (Arbitrum only)
const DEST_TOKENS = [
  { symbol: "ETH", name: "Ethereum", address: "0x0000000000000000000000000000000000000000", decimals: 18, icon: "Ξ" },
  { symbol: "WBTC", name: "Wrapped BTC", address: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f", decimals: 8, icon: "₿" },
  { symbol: "USDC", name: "USD Coin", address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", decimals: 6, icon: "$" },
  { symbol: "ARB", name: "Arbitrum", address: "0x912CE59144191C1204E64559FE8253a0e49E6548", decimals: 18, icon: "🔷" },
];

// Dropdown component
function Dropdown<T extends { symbol: string; name: string; icon: string }>({
  items,
  selected,
  onSelect,
  label,
  disabled = false,
}: {
  items: T[];
  selected: T | null;
  onSelect: (item: T) => void;
  label: string;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-navy-200 border border-white/10 hover:border-mint/30 transition-colors min-w-[140px] ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {selected ? (
          <>
            <span className="text-lg">{selected.icon}</span>
            <span className="text-white font-medium">{selected.symbol}</span>
          </>
        ) : (
          <span className="text-white/50">{label}</span>
        )}
        {!disabled && <ChevronDown size={16} className="text-white/50 ml-auto" />}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-2 z-50 min-w-[180px] glass-card rounded-xl py-2 shadow-xl">
            {items.map((item) => (
              <button
                key={item.symbol}
                type="button"
                onClick={() => {
                  onSelect(item);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-mint/10 transition-colors text-left"
              >
                <span className="text-lg">{item.icon}</span>
                <div>
                  <div className="text-white font-medium">{item.symbol}</div>
                  <div className="text-white/40 text-xs">{item.name}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function FundPage() {
  const { address, isConnected } = useAccount();
  const currentChainId = useChainId();
  const { switchChain } = useSwitchChain();

  // Source selection
  const [selectedChain, setSelectedChain] = useState(CHAINS.find(c => c.id === currentChainId) || CHAINS[0]);
  const [selectedFromToken, setSelectedFromToken] = useState<typeof TOKENS_BY_CHAIN[1][0] | null>(null);
  const [amount, setAmount] = useState("");

  // Destination selection
  const [selectedToToken, setSelectedToToken] = useState(DEST_TOKENS[0]);

  // Get available tokens for selected chain
  const availableTokens = useMemo(() => {
    return TOKENS_BY_CHAIN[selectedChain.id] || TOKENS_BY_CHAIN[1];
  }, [selectedChain.id]);

  // Update token when chain changes
  useEffect(() => {
    const tokens = TOKENS_BY_CHAIN[selectedChain.id];
    if (tokens && tokens.length > 0) {
      setSelectedFromToken(tokens[0]);
    }
  }, [selectedChain.id]);

  // Switch network when chain selection changes
  const handleChainChange = useCallback((chain: typeof CHAINS[number]) => {
    setSelectedChain(chain);
    if (chain.id !== currentChainId && switchChain) {
      switchChain({ chainId: chain.id });
    }
  }, [currentChainId, switchChain]);

  // Balance query
  const { data: balance, isLoading: balanceLoading } = useBalance({
    address,
    token: selectedFromToken?.isNative ? undefined : selectedFromToken?.address as `0x${string}`,
    chainId: selectedChain.id,
  });

  // Li.Fi bridge hook
  const {
    status,
    quote,
    error,
    fetchQuote,
    executeBridge,
    reset,
    estimatedOutput,
    estimatedGas,
    estimatedTime,
    bridgePath,
  } = useLiFiBridge({
    fromTokenAddress: selectedFromToken?.address || "0x0000000000000000000000000000000000000000",
    toTokenAddress: selectedToToken.address,
    amount,
    decimals: selectedFromToken?.decimals || 18,
  });

  // Calculate platform fee and final amounts
  const feeCalculations = useMemo(() => {
    if (!estimatedOutput || status !== 'quoted') {
      return null;
    }

    const outputAmount = parseFloat(estimatedOutput);
    const platformFee = outputAmount * PLATFORM_FEE_PERCENT;
    const finalAmount = outputAmount - platformFee;
    
    // Calculate exchange rate
    const inputAmount = parseFloat(amount) || 0;
    const exchangeRate = inputAmount > 0 ? outputAmount / inputAmount : 0;
    
    // Estimate fee in USD (rough estimate based on output token)
    // For stablecoins, 1 token ≈ $1, for others use the exchange rate context
    const isStablecoin = ['USDC', 'USDT', 'DAI'].includes(selectedToToken.symbol);
    const feeUsd = isStablecoin ? platformFee : platformFee * (quote?.step?.estimate?.toAmountUSD ? parseFloat(quote.step.estimate.toAmountUSD) / outputAmount : 1);

    return {
      outputBeforeFee: outputAmount,
      platformFee,
      platformFeeUsd: feeUsd,
      finalAmount,
      exchangeRate,
    };
  }, [estimatedOutput, status, amount, selectedToToken.symbol, quote]);

  // Reset quote when inputs change
  useEffect(() => {
    if (status === 'quoted' || status === 'error') {
      reset();
    }
  }, [amount, selectedFromToken, selectedToToken, selectedChain]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle MAX button
  const handleMaxClick = () => {
    if (balance) {
      const maxAmount = selectedFromToken?.isNative
        ? Math.max(0, parseFloat(formatUnits(balance.value, balance.decimals)) - 0.01)
        : parseFloat(formatUnits(balance.value, balance.decimals));
      setAmount(maxAmount > 0 ? maxAmount.toString() : "0");
    }
  };

  // Handle swap action
  const handleSwap = async () => {
    if (status === 'quoted') {
      await executeBridge();
    } else {
      await fetchQuote();
    }
  };

  // Check if swap is possible
  const canSwap = isConnected && 
    amount && 
    parseFloat(amount) > 0 && 
    selectedFromToken && 
    (status === 'idle' || status === 'quoted');

  const insufficientBalance = balance && 
    amount && 
    parseFloat(amount) > parseFloat(formatUnits(balance.value, balance.decimals));

  // Get button text
  const getButtonText = () => {
    if (!isConnected) return "Connect Wallet";
    if (!amount || parseFloat(amount) <= 0) return "Enter Amount";
    if (insufficientBalance) return "Insufficient Balance";
    switch (status) {
      case 'quoting': return 'Getting Quote...';
      case 'quoted': return 'Swap & Fund';
      case 'executing': return 'Processing...';
      case 'success': return 'Success!';
      default: return 'Get Quote';
    }
  };

  const isCrossChain = selectedChain.id !== ARBITRUM_CHAIN_ID;

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-display font-bold text-white mb-2">Fund Your Account</h1>
        <p className="text-white/60">Swap any token to get started on Arbitrum</p>
      </div>

      {!isConnected ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-mint/20 to-purple-500/20 flex items-center justify-center text-mint mx-auto mb-4">
            <Wallet size={32} />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-white/60">Connect your wallet to fund your account and start earning.</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-6 space-y-4">
          {/* From Section */}
          <div>
            <label className="text-white/60 text-sm mb-2 block">From</label>
            <div className="bg-navy-200/50 border border-white/10 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Dropdown
                  items={CHAINS as unknown as typeof CHAINS[number][]}
                  selected={selectedChain}
                  onSelect={handleChainChange}
                  label="Chain"
                />
                <Dropdown
                  items={availableTokens}
                  selected={selectedFromToken}
                  onSelect={setSelectedFromToken}
                  label="Token"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1 bg-transparent text-white text-2xl font-semibold placeholder:text-white/20 focus:outline-none"
                  disabled={status === 'executing'}
                />
                <div className="text-right">
                  <div className="text-white/40 text-sm">
                    Balance: {balanceLoading ? "..." : balance ? parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(4) : "0.00"}
                  </div>
                  <button
                    onClick={handleMaxClick}
                    disabled={!balance || status === 'executing'}
                    className="text-mint text-sm hover:underline disabled:opacity-50"
                  >
                    MAX
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Swap Direction Indicator */}
          <div className="flex justify-center">
            <div className="w-10 h-10 rounded-xl bg-navy-200 border border-white/10 flex items-center justify-center">
              <ArrowDown size={20} className="text-mint" />
            </div>
          </div>

          {/* To Section */}
          <div>
            <label className="text-white/60 text-sm mb-2 block">To (Arbitrum)</label>
            <div className="bg-navy-200/50 border border-white/10 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                {/* Arbitrum - Locked */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 min-w-[140px]">
                  <span className="text-lg">🔷</span>
                  <span className="text-blue-400 font-medium">Arbitrum</span>
                </div>
                <Dropdown
                  items={DEST_TOKENS}
                  selected={selectedToToken}
                  onSelect={setSelectedToToken}
                  label="Token"
                />
              </div>

              <div className="flex items-center">
                <div className="text-white/40 text-sm">You receive:</div>
                <div className="ml-auto text-white text-xl font-semibold">
                  {status === 'quoting' ? (
                    <span className="text-white/40">Calculating...</span>
                  ) : status === 'quoted' && feeCalculations ? (
                    `~${feeCalculations.finalAmount.toFixed(6)} ${selectedToToken.symbol}`
                  ) : (
                    <span className="text-white/40">-</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quote Details */}
          {status === 'quoted' && feeCalculations && (
            <div className="bg-mint/5 border border-mint/20 rounded-xl p-4 space-y-3">
              {/* Exchange Rate */}
              <div className="flex items-center justify-between">
                <div className="text-white/60 text-sm">Exchange rate</div>
                <div className="text-white text-sm font-medium">
                  1 {selectedFromToken?.symbol} = {feeCalculations.exchangeRate.toFixed(4)} {selectedToToken.symbol}
                </div>
              </div>

              {/* Platform Fee */}
              <div className="flex items-center justify-between">
                <div className="text-white/60 text-sm">
                  Platform fee (0.1%)
                </div>
                <div className="text-amber-400 text-sm">
                  ~{feeCalculations.platformFee.toFixed(6)} {selectedToToken.symbol}
                  <span className="text-white/40 ml-1">
                    (~${feeCalculations.platformFeeUsd.toFixed(2)})
                  </span>
                </div>
              </div>

              {/* Network Gas */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <Fuel size={14} />
                  Network gas
                </div>
                <div className="text-white text-sm">{estimatedGas}</div>
              </div>

              {/* Divider */}
              <div className="border-t border-white/10 my-2" />

              {/* You Receive (highlighted) */}
              <div className="flex items-center justify-between">
                <div className="text-white font-medium">You receive</div>
                <div className="text-mint text-lg font-semibold">
                  ~{feeCalculations.finalAmount.toFixed(6)} {selectedToToken.symbol}
                </div>
              </div>

              {isCrossChain && (
                <>
                  <div className="border-t border-white/10 my-2" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white/60 text-sm">
                      <Route size={14} />
                      Route
                    </div>
                    <div className="text-white text-sm">
                      {selectedChain.name} → {bridgePath} → Arbitrum
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white/60 text-sm">
                      <Clock size={14} />
                      Est. time
                    </div>
                    <div className="text-white text-sm">{estimatedTime}</div>
                  </div>
                </>
              )}

              <button
                onClick={fetchQuote}
                className="w-full flex items-center justify-center gap-2 text-sm text-white/60 hover:text-mint transition-colors py-2 mt-2"
              >
                <RefreshCw size={14} />
                Refresh quote
              </button>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Success Display */}
          {status === 'success' && (
            <div className="p-3 rounded-xl bg-mint/10 border border-mint/20 flex items-center gap-2 text-mint text-sm">
              <Check size={16} />
              Funds swapped and deposited successfully!
            </div>
          )}

          {/* Swap Button */}
          <button
            onClick={handleSwap}
            disabled={!canSwap || !!insufficientBalance}
            className="w-full btn-primary flex items-center justify-center gap-2 py-4 text-lg font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {(status === 'quoting' || status === 'executing') && (
              <Loader2 size={20} className="animate-spin" />
            )}
            {status === 'success' && <Check size={20} />}
            {getButtonText()}
          </button>

          {/* Cross-chain info */}
          {isCrossChain && status === 'idle' && (
            <p className="text-center text-white/40 text-xs">
              Powered by Li.Fi — automatically bridges from {selectedChain.name} to Arbitrum
            </p>
          )}
        </div>
      )}
    </div>
  );
}
