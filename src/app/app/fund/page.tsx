"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { 
  ArrowDown, 
  Loader2, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  ChevronDown,
  Clock,
  Fuel,
  Route,
  Sparkles,
} from "lucide-react";
import { OnrampButton } from "@/components/coinbase";
import { useAccount, useChainId, useBalance, useSwitchChain } from "wagmi";
import { formatUnits } from "viem";
import { useLiFiBridge, ARBITRUM_CHAIN_ID } from "@/hooks/useLiFiBridge";
import { TokenLogo } from "@/components/ui/TokenLogo";

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

// Mutable chain type for state
type ChainItem = {
  id: number;
  name: string;
  symbol: string;
  icon: string;
  color: string;
};

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

// Dropdown component - mobile optimized
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
        className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-navy-light border border-white/10 hover:border-mint/30 transition-colors min-w-[100px] sm:min-w-[140px] ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {selected ? (
          <>
            <TokenLogo symbol={selected.symbol} size={20} className="sm:w-6 sm:h-6" />
            <span className="text-white font-medium text-sm sm:text-base">{selected.symbol}</span>
          </>
        ) : (
          <span className="text-white/50 text-sm sm:text-base">{label}</span>
        )}
        {!disabled && <ChevronDown size={14} className="text-white/50 ml-auto sm:w-4 sm:h-4" />}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-2 z-50 min-w-[160px] sm:min-w-[180px] glass-card rounded-xl py-2 shadow-xl max-h-[60vh] overflow-y-auto">
            {items.map((item) => (
              <button
                key={item.symbol}
                type="button"
                onClick={() => {
                  onSelect(item);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 hover:bg-mint/10 transition-colors text-left"
              >
                <TokenLogo symbol={item.symbol} size={20} className="sm:w-6 sm:h-6" />
                <div>
                  <div className="text-white font-medium text-sm sm:text-base">{item.symbol}</div>
                  <div className="text-white/40 text-[10px] sm:text-xs">{item.name}</div>
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

  // Bridge direction: 'in' = to Arbitrum, 'out' = from Arbitrum
  const [bridgeDirection, setBridgeDirection] = useState<'in' | 'out'>('in');

  // Source selection
  const [selectedChain, setSelectedChain] = useState<ChainItem>(CHAINS.find(c => c.id === currentChainId) || CHAINS[0] as ChainItem);
  const [selectedFromToken, setSelectedFromToken] = useState<typeof TOKENS_BY_CHAIN[1][0] | null>(null);
  const [amount, setAmount] = useState("");

  // Destination selection (for bridge OUT)
  const [selectedDestChain, setSelectedDestChain] = useState<ChainItem>(CHAINS[0] as ChainItem);
  const [selectedToToken, setSelectedToToken] = useState(DEST_TOKENS[0]);

  // Handle direction toggle
  const handleDirectionToggle = (direction: 'in' | 'out') => {
    setBridgeDirection(direction);
    setAmount("");
    if (direction === 'out') {
      // Switching to bridge OUT - source is Arbitrum
      setSelectedChain(CHAINS.find(c => c.id === ARBITRUM_CHAIN_ID) as ChainItem || CHAINS[1] as ChainItem);
      setSelectedFromToken(TOKENS_BY_CHAIN[ARBITRUM_CHAIN_ID]?.[0] || null);
    } else {
      // Switching to bridge IN - reset to current chain or Ethereum
      const chain = CHAINS.find(c => c.id === currentChainId) as ChainItem || CHAINS[0] as ChainItem;
      setSelectedChain(chain);
    }
  };

  // Get available tokens for selected chain
  const availableTokens = useMemo(() => {
    return TOKENS_BY_CHAIN[selectedChain.id] || TOKENS_BY_CHAIN[1];
  }, [selectedChain.id]);

  // Destination tokens for bridge OUT (tokens on destination chain)
  const destChainTokens = useMemo(() => {
    return TOKENS_BY_CHAIN[selectedDestChain.id] || TOKENS_BY_CHAIN[1];
  }, [selectedDestChain.id]);

  const [selectedDestToken, setSelectedDestToken] = useState(destChainTokens[0]);

  // Update dest token when dest chain changes
  useEffect(() => {
    const tokens = TOKENS_BY_CHAIN[selectedDestChain.id];
    if (tokens && tokens.length > 0) {
      setSelectedDestToken(tokens[0]);
    }
  }, [selectedDestChain.id]);

  // Switch network when chain selection changes
  const handleChainChange = useCallback((chain: ChainItem) => {
    setSelectedChain(chain);
    if ((chain.id as number) !== currentChainId && switchChain) {
      switchChain({ chainId: chain.id as number });
    }
  }, [currentChainId, switchChain]);

  // Balance query - use correct chain based on direction
  const sourceChainId = bridgeDirection === 'out' ? ARBITRUM_CHAIN_ID : selectedChain.id;
  const { data: balance, isLoading: balanceLoading } = useBalance({
    address,
    token: selectedFromToken?.isNative ? undefined : selectedFromToken?.address as `0x${string}`,
    chainId: sourceChainId,
  });

  // Check if user needs to switch networks for bridge OUT
  const needsNetworkSwitch = bridgeDirection === 'out' && currentChainId !== ARBITRUM_CHAIN_ID;

  // Li.Fi bridge hook - supports both directions
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
    toTokenAddress: bridgeDirection === 'in' ? selectedToToken.address : selectedDestToken?.address || "0x0000000000000000000000000000000000000000",
    amount,
    decimals: selectedFromToken?.decimals || 18,
    toChainId: bridgeDirection === 'in' ? ARBITRUM_CHAIN_ID : selectedDestChain.id,
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
    if (needsNetworkSwitch) return "Switch to Arbitrum";
    if (!amount || parseFloat(amount) <= 0) return "Enter Amount";
    if (insufficientBalance) return "Insufficient Balance";
    switch (status) {
      case 'quoting': return 'Getting Quote...';
      case 'quoted': return bridgeDirection === 'in' ? 'Swap & Fund' : 'Bridge Out';
      case 'executing': return 'Processing...';
      case 'success': return 'Success!';
      default: return 'Get Quote';
    }
  };

  // Handle swap/bridge action
  const handleAction = async () => {
    if (needsNetworkSwitch && switchChain) {
      switchChain({ chainId: ARBITRUM_CHAIN_ID });
      return;
    }
    await handleSwap();
  };

  const isCrossChain = bridgeDirection === 'in' 
    ? (selectedChain.id as number) !== ARBITRUM_CHAIN_ID 
    : (selectedDestChain.id as number) !== ARBITRUM_CHAIN_ID;

  return (
    <div className="max-w-xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mb-1 sm:mb-2">Fund Your Account</h1>
        <p className="text-white/60 text-sm sm:text-base">Swap any token to get started on Arbitrum</p>
      </div>

      {/* Coinbase Onramp - Buy with Card */}
      <div className="glass-card rounded-2xl p-4 sm:p-6 mb-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/5 to-mint/10" />
        <div className="relative">
          <div className="flex items-start sm:items-center gap-3 mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
              <Sparkles size={20} className="text-white sm:hidden" />
              <Sparkles size={24} className="text-white hidden sm:block" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-semibold text-white flex flex-wrap items-center gap-2">
                No crypto? No problem
                <span className="px-2 py-0.5 rounded-full bg-mint/20 text-mint text-xs">Easiest</span>
              </h2>
              <p className="text-white/60 text-xs sm:text-sm">Buy USDC instantly with Apple Pay, card, or bank</p>
            </div>
          </div>
          
          {/* Coinbase Onramp works with or without wallet */}
          <OnrampButton
            address={address}
            defaultAsset="USDC"
            defaultNetwork="arbitrum"
            presetFiatAmount={100}
            className="w-full"
          />
          
          <p className="text-center text-white/40 text-xs mt-3">
            Powered by Coinbase • {isConnected ? 'Instant delivery to your wallet' : 'No wallet needed to start'}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 border-t border-white/10" />
        <span className="text-white/40 text-sm">or swap existing crypto</span>
        <div className="flex-1 border-t border-white/10" />
      </div>

      {/* Direction Toggle */}
      <div className="glass-card rounded-2xl p-1.5 sm:p-2 mb-4 sm:mb-6 flex gap-1.5 sm:gap-2">
        <button
          onClick={() => handleDirectionToggle('in')}
          className={`flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl text-sm sm:text-base font-medium transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
            bridgeDirection === 'in'
              ? 'bg-mint/20 text-mint border border-mint/30'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <ArrowDown size={16} className="sm:w-[18px] sm:h-[18px]" />
          Bridge In
        </button>
        <button
          onClick={() => handleDirectionToggle('out')}
          className={`flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl text-sm sm:text-base font-medium transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
            bridgeDirection === 'out'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <ArrowDown size={16} className="rotate-180 sm:w-[18px] sm:h-[18px]" />
          Bridge Out
        </button>
      </div>

      {/* Swap Interface - Always visible */}
      <div className={`glass-card rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4 ${!isConnected ? 'opacity-75' : ''}`}>
          {/* From Section */}
          <div>
            <label className="text-white/60 text-xs sm:text-sm mb-1.5 sm:mb-2 block">From</label>
            <div className="bg-navy-light/50 border border-white/10 rounded-xl p-3 sm:p-4 space-y-2.5 sm:space-y-3">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                {bridgeDirection === 'out' ? (
                  /* Bridge OUT: Arbitrum is locked as source */
                  <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-blue-500/10 border border-blue-500/20 min-w-[100px] sm:min-w-[140px]">
                    <TokenLogo symbol="ARB" size={20} className="sm:w-6 sm:h-6" />
                    <span className="text-blue-400 font-medium text-sm sm:text-base">Arbitrum</span>
                  </div>
                ) : (
                  /* Bridge IN: Can select source chain */
                  <Dropdown
                    items={CHAINS as unknown as typeof CHAINS[number][]}
                    selected={selectedChain}
                    onSelect={handleChainChange}
                    label="Chain"
                    disabled={!isConnected}
                  />
                )}
                <Dropdown
                  items={bridgeDirection === 'out' ? TOKENS_BY_CHAIN[ARBITRUM_CHAIN_ID] : availableTokens}
                  selected={selectedFromToken}
                  onSelect={setSelectedFromToken}
                  label="Token"
                  disabled={!isConnected}
                />
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1 bg-transparent text-white text-xl sm:text-2xl font-semibold placeholder:text-white/20 focus:outline-none min-w-0"
                  disabled={status === 'executing' || !isConnected}
                />
                <div className="text-right flex-shrink-0">
                  <div className="text-white/40 text-xs sm:text-sm">
                    Bal: {balanceLoading ? "..." : balance ? parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(4) : "0.00"}
                  </div>
                  <button
                    onClick={handleMaxClick}
                    disabled={!balance || status === 'executing' || !isConnected}
                    className="text-mint text-xs sm:text-sm hover:underline disabled:opacity-50"
                  >
                    MAX
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Swap Direction Indicator */}
          <div className="flex justify-center">
            <div className="w-10 h-10 rounded-xl bg-navy-light border border-white/10 flex items-center justify-center">
              <ArrowDown size={20} className="text-mint" />
            </div>
          </div>

          {/* To Section */}
          <div>
            <label className="text-white/60 text-xs sm:text-sm mb-1.5 sm:mb-2 block">
              To {bridgeDirection === 'in' ? '(Arbitrum)' : `(${selectedDestChain.name})`}
            </label>
            <div className="bg-navy-light/50 border border-white/10 rounded-xl p-3 sm:p-4 space-y-2.5 sm:space-y-3">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                {bridgeDirection === 'in' ? (
                  /* Bridge IN: Arbitrum is locked as destination */
                  <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-blue-500/10 border border-blue-500/20 min-w-[100px] sm:min-w-[140px]">
                    <TokenLogo symbol="ARB" size={20} className="sm:w-6 sm:h-6" />
                    <span className="text-blue-400 font-medium text-sm sm:text-base">Arbitrum</span>
                  </div>
                ) : (
                  /* Bridge OUT: Can select destination chain */
                  <Dropdown
                    items={CHAINS.filter(c => (c.id as number) !== ARBITRUM_CHAIN_ID) as unknown as ChainItem[]}
                    selected={selectedDestChain}
                    onSelect={(item) => setSelectedDestChain(item as ChainItem)}
                    label="Chain"
                    disabled={!isConnected}
                  />
                )}
                <Dropdown
                  items={bridgeDirection === 'in' ? DEST_TOKENS : destChainTokens}
                  selected={bridgeDirection === 'in' ? selectedToToken : selectedDestToken}
                  onSelect={bridgeDirection === 'in' ? setSelectedToToken : setSelectedDestToken}
                  label="Token"
                  disabled={!isConnected}
                />
              </div>

              <div className="flex items-center">
                <div className="text-white/40 text-xs sm:text-sm">You receive:</div>
                <div className="ml-auto text-white text-base sm:text-xl font-semibold truncate max-w-[50%]">
                  {status === 'quoting' ? (
                    <span className="text-white/40">Calculating...</span>
                  ) : status === 'quoted' && feeCalculations ? (
                    `~${feeCalculations.finalAmount.toFixed(6)} ${bridgeDirection === 'in' ? selectedToToken.symbol : selectedDestToken?.symbol}`
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
                      {bridgeDirection === 'in' 
                        ? `${selectedChain.name} → ${bridgePath} → Arbitrum`
                        : `Arbitrum → ${bridgePath} → ${selectedDestChain.name}`
                      }
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
            onClick={handleAction}
            disabled={!isConnected || (!needsNetworkSwitch && (!canSwap || !!insufficientBalance))}
            className={`w-full flex items-center justify-center gap-2 py-4 text-lg font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed ${
              bridgeDirection === 'out' && !needsNetworkSwitch
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400'
                : 'btn-primary'
            }`}
          >
            {(status === 'quoting' || status === 'executing') && (
              <Loader2 size={20} className="animate-spin" />
            )}
            {status === 'success' && <Check size={20} />}
            {getButtonText()}
          </button>

          {/* Cross-chain info */}
          {isCrossChain && status === 'idle' && isConnected && (
            <p className="text-center text-white/40 text-xs">
              Powered by Li.Fi — automatically bridges {bridgeDirection === 'in' 
                ? `from ${selectedChain.name} to Arbitrum`
                : `from Arbitrum to ${selectedDestChain.name}`
              }
            </p>
          )}

          {/* Connect wallet prompt when not connected */}
          {!isConnected && (
            <p className="text-center text-white/40 text-xs">
              Connect your wallet to swap tokens from any chain to Arbitrum
            </p>
          )}
        </div>
    </div>
  );
}
