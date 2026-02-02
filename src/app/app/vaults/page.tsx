"use client";

import { useState } from "react";
import { 
  Sparkles, 
  TrendingUp, 
  Users, 
  Star, 
  Flame, 
  Crown,
  ArrowUpRight,
  Heart,
  Zap,
  X,
  Check,
  Loader2,
  Info,
  Plus,
  Minus,
  Link,
  Copy,
  Twitter,
  MessageCircle,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { TokenLogo } from "@/components/ui/TokenLogo";
import { useAccount, useBalance } from "wagmi";
import { formatUnits } from "viem";
import { AAVE_V3_ADDRESSES } from "@/lib/aave";
import type { Address } from "viem";

// All available GM pools for vault strategies (including memes and RWA)
const ALL_GM_POOLS = [
  // Major pairs
  { id: "BTC/USD", name: "Bitcoin", icon: "₿", color: "from-orange-500 to-amber-500", category: "major" },
  { id: "ETH/USD", name: "Ethereum", icon: "Ξ", color: "from-blue-500 to-purple-500", category: "major" },
  { id: "ARB/USD", name: "Arbitrum", icon: "A", color: "from-blue-600 to-indigo-500", category: "major" },
  { id: "SOL/USD", name: "Solana", icon: "◎", color: "from-purple-500 to-pink-500", category: "major" },
  { id: "LINK/USD", name: "Chainlink", icon: "⬡", color: "from-blue-400 to-blue-600", category: "major" },
  { id: "UNI/USD", name: "Uniswap", icon: "🦄", color: "from-pink-400 to-pink-600", category: "major" },
  { id: "AVAX/USD", name: "Avalanche", icon: "🔺", color: "from-red-500 to-red-600", category: "major" },
  { id: "DOGE/USD", name: "Dogecoin", icon: "🐕", color: "from-yellow-400 to-amber-500", category: "meme" },
  { id: "SHIB/USD", name: "Shiba Inu", icon: "🐕", color: "from-orange-400 to-red-500", category: "meme" },
  { id: "PEPE/USD", name: "Pepe", icon: "🐸", color: "from-green-400 to-green-600", category: "meme" },
  { id: "WIF/USD", name: "dogwifhat", icon: "🎩", color: "from-amber-400 to-orange-500", category: "meme" },
  { id: "BONK/USD", name: "Bonk", icon: "🦴", color: "from-orange-400 to-yellow-500", category: "meme" },
  // RWA (Real World Assets)
  { id: "XAU/USD", name: "Gold", icon: "🥇", color: "from-yellow-500 to-amber-600", category: "rwa" },
  { id: "XAG/USD", name: "Silver", icon: "🥈", color: "from-gray-300 to-gray-500", category: "rwa" },
];

// Mock vault data - in production this would come from an API
const mockVaults = [
  {
    id: "1",
    creator: {
      name: "CryptoKing",
      handle: "@cryptoking_trades",
      avatar: "👑",
      verified: true,
    },
    performance: {
      thirtyDay: 34.5,
      allTime: 156.2,
    },
    tvl: 2340000,
    followers: 15200,
    apy: 28.5,
    strategy: "BTC/ETH momentum trading with strict risk management",
    tags: ["momentum", "BTC", "ETH"],
    trending: true,
    color: "from-amber-400 via-orange-500 to-red-500",
  },
  {
    id: "2",
    creator: {
      name: "DeFi Queen",
      handle: "@defi_queen",
      avatar: "👸",
      verified: true,
    },
    performance: {
      thirtyDay: 21.8,
      allTime: 89.4,
    },
    tvl: 1890000,
    followers: 12400,
    apy: 24.2,
    strategy: "Multi-strategy yield farming across top protocols",
    tags: ["yield", "diversified", "safe"],
    trending: false,
    color: "from-purple-400 via-pink-500 to-rose-500",
  },
  {
    id: "3",
    creator: {
      name: "Alpha Hunter",
      handle: "@alpha_hunter",
      avatar: "🎯",
      verified: true,
    },
    performance: {
      thirtyDay: 45.2,
      allTime: 210.8,
    },
    tvl: 890000,
    followers: 8900,
    apy: 35.8,
    strategy: "High-conviction plays on emerging narratives",
    tags: ["alpha", "degen", "high-risk"],
    trending: true,
    color: "from-emerald-400 via-cyan-500 to-blue-500",
  },
  {
    id: "4",
    creator: {
      name: "Whale Watcher",
      handle: "@whale_watcher",
      avatar: "🐋",
      verified: false,
    },
    performance: {
      thirtyDay: 18.3,
      allTime: 67.2,
    },
    tvl: 3200000,
    followers: 9800,
    apy: 19.5,
    strategy: "Copy whale movements with enhanced timing",
    tags: ["whales", "copy-trading", "safe"],
    trending: false,
    color: "from-blue-400 via-indigo-500 to-violet-500",
  },
  {
    id: "5",
    creator: {
      name: "Yield Master",
      handle: "@yield_master",
      avatar: "💎",
      verified: true,
    },
    performance: {
      thirtyDay: 15.6,
      allTime: 52.3,
    },
    tvl: 4500000,
    followers: 21300,
    apy: 16.8,
    strategy: "Stable yield optimization with minimal risk",
    tags: ["stable", "low-risk", "consistent"],
    trending: false,
    color: "from-teal-400 via-emerald-500 to-green-500",
  },
  {
    id: "6",
    creator: {
      name: "Meme Lord",
      handle: "@meme_lord",
      avatar: "🚀",
      verified: false,
    },
    performance: {
      thirtyDay: 89.2,
      allTime: 320.5,
    },
    tvl: 450000,
    followers: 32100,
    apy: 65.2,
    strategy: "Memecoin alpha with quick exits",
    tags: ["meme", "degen", "volatile"],
    trending: true,
    color: "from-yellow-400 via-orange-500 to-pink-500",
  },
];

// ========== Create Portfolio Modal ==========
interface CreateVaultModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface VaultAllocation {
  poolId: string;
  percentage: number;
}

function CreateVaultModal({ onClose, onSuccess }: CreateVaultModalProps) {
  const [step, setStep] = useState(1);
  const [depositAmount, setDepositAmount] = useState("");
  const [allocations, setAllocations] = useState<VaultAllocation[]>([]);
  const [vaultName, setVaultName] = useState("");
  const [vaultDescription, setVaultDescription] = useState("");
  const [twitter, setTwitter] = useState("");
  const [telegram, setTelegram] = useState("");
  const [discord, setDiscord] = useState("");
  const [website, setWebsite] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [copied, setCopied] = useState(false);

  const { address } = useAccount();
  const { data: balance } = useBalance({
    address,
    token: AAVE_V3_ADDRESSES.USDC as Address,
  });

  const totalAllocation = allocations.reduce((sum, a) => sum + a.percentage, 0);
  const depositNum = parseFloat(depositAmount) || 0;

  const handleAddPool = (poolId: string) => {
    if (allocations.length >= 10) return;
    if (allocations.find(a => a.poolId === poolId)) return;
    setAllocations([...allocations, { poolId, percentage: 0 }]);
  };

  const handleRemovePool = (poolId: string) => {
    setAllocations(allocations.filter(a => a.poolId !== poolId));
  };

  const handleAllocationChange = (poolId: string, percentage: number) => {
    setAllocations(allocations.map(a => 
      a.poolId === poolId ? { ...a, percentage: Math.max(0, Math.min(100, percentage)) } : a
    ));
  };

  const handleAutoBalance = () => {
    if (allocations.length === 0) return;
    const equalShare = Math.floor(100 / allocations.length);
    const remainder = 100 - (equalShare * allocations.length);
    setAllocations(allocations.map((a, i) => ({
      ...a,
      percentage: equalShare + (i === 0 ? remainder : 0)
    })));
  };

  const handleCreate = async () => {
    setIsCreating(true);
    // Mock creation - in production this would deploy a contract
    await new Promise(resolve => setTimeout(resolve, 2000));
    const mockVaultId = Math.random().toString(36).substring(7);
    setShareLink(`https://neversell.finance/portfolio/${mockVaultId}`);
    setIsCreating(false);
    setStep(4); // Success step
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const canProceedStep1 = depositNum >= 100; // Min $100 deposit
  const canProceedStep2 = totalAllocation === 100 && allocations.length > 0;
  const canProceedStep3 = vaultName.trim().length >= 3;

  const getPoolById = (id: string) => ALL_GM_POOLS.find(p => p.id === id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-2xl relative my-8">
        {/* Gradient border effect */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 opacity-30 blur-xl" />
        
        <div className="glass-card relative p-6 border-2 border-white/10 max-h-[90vh] overflow-y-auto">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors z-10"
          >
            <X size={24} />
          </button>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step >= s 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                    : 'bg-white/10 text-white/40'
                }`}>
                  {step > s ? <Check size={16} /> : s}
                </div>
                {s < 3 && (
                  <div className={`w-12 h-1 rounded-full transition-all ${
                    step > s ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-white/10'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Deposit USDC */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Fund Your Portfolio</h2>
                <p className="text-white/60">Deposit USDC to seed your strategy</p>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="number"
                    placeholder="0.00"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full bg-navy-light border border-white/10 rounded-xl px-4 py-4 text-white text-2xl placeholder:text-white/30 focus:outline-none focus:border-mint/50 transition-colors text-center"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <span className="text-white/50 text-lg">USDC</span>
                  </div>
                </div>
                
                <div className="flex justify-between text-sm text-white/50 px-1">
                  <span>Balance: {balance ? parseFloat(formatUnits(balance.value, 6)).toFixed(2) : '0.00'} USDC</span>
                  <button 
                    onClick={() => balance && setDepositAmount(formatUnits(balance.value, 6))}
                    className="text-mint hover:underline"
                  >
                    MAX
                  </button>
                </div>

                {depositNum > 0 && depositNum < 100 && (
                  <p className="text-amber-400 text-sm text-center">Minimum deposit: $100</p>
                )}
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-white/60 text-sm">
                  💡 This deposit seeds your portfolio. When followers deposit, their funds follow your strategy automatically.
                </p>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className="w-full btn-primary py-4 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                Continue
                <ChevronRight size={18} />
              </button>
            </div>
          )}

          {/* Step 2: Choose Strategy */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Build Your Strategy</h2>
                <p className="text-white/60">Select up to 10 pools (must total 100%)</p>
              </div>

              {/* Selected Allocations */}
              {allocations.length > 0 && (
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white/60 text-sm">Your Allocations</span>
                    <button 
                      onClick={handleAutoBalance}
                      className="text-mint text-sm hover:underline"
                    >
                      Auto-balance
                    </button>
                  </div>
                  
                  {allocations.map((alloc) => {
                    const pool = getPoolById(alloc.poolId);
                    if (!pool) return null;
                    return (
                      <div key={alloc.poolId} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                        <TokenLogo symbol={pool.name} size={40} />
                        <div className="flex-1">
                          <p className="text-white font-medium">{pool.id}</p>
                          <p className="text-white/40 text-xs">{pool.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAllocationChange(alloc.poolId, alloc.percentage - 5)}
                            className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20"
                          >
                            <Minus size={14} />
                          </button>
                          <input
                            type="number"
                            value={alloc.percentage}
                            onChange={(e) => handleAllocationChange(alloc.poolId, parseInt(e.target.value) || 0)}
                            className="w-16 bg-navy-light border border-white/10 rounded-lg px-2 py-1 text-white text-center"
                          />
                          <span className="text-white/40">%</span>
                          <button
                            onClick={() => handleAllocationChange(alloc.poolId, alloc.percentage + 5)}
                            className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20"
                          >
                            <Plus size={14} />
                          </button>
                          <button
                            onClick={() => handleRemovePool(alloc.poolId)}
                            className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/30"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Total indicator */}
                  <div className={`flex justify-between items-center p-3 rounded-xl ${
                    totalAllocation === 100 ? 'bg-mint/10 border border-mint/20' : 'bg-amber-500/10 border border-amber-500/20'
                  }`}>
                    <span className="text-white/60">Total Allocation</span>
                    <span className={`font-bold ${totalAllocation === 100 ? 'text-mint' : 'text-amber-400'}`}>
                      {totalAllocation}% {totalAllocation === 100 ? '✓' : `(need ${100 - totalAllocation}% more)`}
                    </span>
                  </div>
                </div>
              )}

              {/* Pool Categories */}
              {['major', 'meme', 'rwa'].map((category) => (
                <div key={category} className="space-y-2">
                  <h3 className="text-white/60 text-sm font-medium capitalize">
                    {category === 'rwa' ? 'Real World Assets' : category === 'meme' ? 'Meme Coins' : 'Major Pairs'}
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {ALL_GM_POOLS.filter(p => p.category === category).map((pool) => {
                      const isSelected = allocations.some(a => a.poolId === pool.id);
                      return (
                        <button
                          key={pool.id}
                          onClick={() => isSelected ? handleRemovePool(pool.id) : handleAddPool(pool.id)}
                          disabled={!isSelected && allocations.length >= 10}
                          className={`p-3 rounded-xl border transition-all ${
                            isSelected 
                              ? `bg-gradient-to-br ${pool.color} bg-opacity-20 border-white/30` 
                              : 'bg-white/5 border-white/10 hover:border-white/20 disabled:opacity-30'
                          }`}
                        >
                          <div className="flex justify-center mb-1">
                            <TokenLogo symbol={pool.name} size={32} />
                          </div>
                          <p className="text-white text-xs font-medium truncate">{pool.id}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 btn-secondary py-3 flex items-center justify-center gap-2"
                >
                  <ChevronLeft size={18} />
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!canProceedStep2}
                  className="flex-1 btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  Continue
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Name & Socials */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Personalize Your Portfolio</h2>
                <p className="text-white/60">Give it a name and connect your socials</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-white/60 text-sm mb-2 block">Portfolio Name *</label>
                  <input
                    type="text"
                    placeholder="e.g., Alpha Hunter Strategy"
                    value={vaultName}
                    onChange={(e) => setVaultName(e.target.value)}
                    className="w-full bg-navy-light border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-mint/50"
                    maxLength={50}
                  />
                </div>

                <div>
                  <label className="text-white/60 text-sm mb-2 block">Description</label>
                  <textarea
                    placeholder="Describe your strategy..."
                    value={vaultDescription}
                    onChange={(e) => setVaultDescription(e.target.value)}
                    className="w-full bg-navy-light border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-mint/50 resize-none"
                    rows={3}
                    maxLength={280}
                  />
                  <p className="text-white/30 text-xs mt-1 text-right">{vaultDescription.length}/280</p>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <label className="text-white/60 text-sm mb-3 block">Link Your Socials (optional)</label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
                      <Twitter size={18} className="text-[#1DA1F2]" />
                      <input
                        type="text"
                        placeholder="@username"
                        value={twitter}
                        onChange={(e) => setTwitter(e.target.value)}
                        className="flex-1 bg-transparent text-white placeholder:text-white/30 focus:outline-none"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
                      <MessageCircle size={18} className="text-[#0088cc]" />
                      <input
                        type="text"
                        placeholder="t.me/username"
                        value={telegram}
                        onChange={(e) => setTelegram(e.target.value)}
                        className="flex-1 bg-transparent text-white placeholder:text-white/30 focus:outline-none"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
                      <div className="w-[18px] h-[18px] rounded-full bg-[#5865F2] flex items-center justify-center text-white text-xs font-bold">D</div>
                      <input
                        type="text"
                        placeholder="discord.gg/invite"
                        value={discord}
                        onChange={(e) => setDiscord(e.target.value)}
                        className="flex-1 bg-transparent text-white placeholder:text-white/30 focus:outline-none"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
                      <Link size={18} className="text-white/60" />
                      <input
                        type="text"
                        placeholder="yoursite.com"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        className="flex-1 bg-transparent text-white placeholder:text-white/30 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 btn-secondary py-3 flex items-center justify-center gap-2"
                >
                  <ChevronLeft size={18} />
                  Back
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!canProceedStep3 || isCreating}
                  className="flex-1 btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isCreating ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Create Portfolio
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <div className="space-y-6 text-center py-8">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-mint to-emerald-500 flex items-center justify-center text-4xl mx-auto mb-4 animate-bounce">
                🎉
              </div>
              <h2 className="text-2xl font-bold text-white">Portfolio Created!</h2>
              <p className="text-white/60">Share your portfolio and start building your following</p>

              {/* Share link */}
              <div className="flex items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10">
                <input
                  type="text"
                  readOnly
                  value={shareLink}
                  className="flex-1 bg-transparent text-white text-sm focus:outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 rounded-lg bg-mint text-navy-400 font-medium hover:bg-mint/90 transition-colors flex items-center gap-2"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              {/* Strategy summary */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-left">
                <h3 className="text-white font-medium mb-3">{vaultName}</h3>
                <div className="flex flex-wrap gap-2">
                  {allocations.map((alloc) => {
                    const pool = getPoolById(alloc.poolId);
                    if (!pool) return null;
                    return (
                      <span key={alloc.poolId} className="px-2 py-1 rounded-full bg-white/10 text-white/80 text-sm flex items-center gap-1">
                        <TokenLogo symbol={pool.name} size={16} /> {alloc.poolId} ({alloc.percentage}%)
                      </span>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={() => { onSuccess(); onClose(); }}
                className="w-full btn-primary py-4"
              >
                View My Portfolio
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type FilterCategory = "all" | "trending" | "top-apy" | "most-followed" | "new";

interface DepositModalProps {
  vault: typeof mockVaults[0];
  onClose: () => void;
}

function DepositModal({ vault, onClose }: DepositModalProps) {
  const [amount, setAmount] = useState("");
  const [isDepositing, setIsDepositing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { address } = useAccount();
  
  const { data: balance } = useBalance({
    address,
    token: AAVE_V3_ADDRESSES.USDC as Address,
  });

  const handleMaxClick = () => {
    if (balance) {
      setAmount(formatUnits(balance.value, 6));
    }
  };

  const handleDeposit = async () => {
    setIsDepositing(true);
    // Mock deposit - in production this would call a smart contract
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsDepositing(false);
    setIsSuccess(true);
  };

  const depositAmount = parseFloat(amount) || 0;
  const estimatedMonthly = depositAmount * (vault.apy / 100 / 12);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="w-full max-w-md relative animate-in fade-in zoom-in-95 duration-300">
        {/* Gradient border effect */}
        <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${vault.color} opacity-50 blur-xl`} />
        
        <div className="glass-card relative p-6 border-2 border-white/10">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>

          {/* Creator info */}
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${vault.color} flex items-center justify-center text-3xl shadow-xl`}>
              {vault.creator.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white">{vault.creator.name}</h3>
                {vault.creator.verified && (
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </div>
                )}
              </div>
              <p className="text-white/50">{vault.creator.handle}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="p-3 rounded-xl bg-white/5 text-center">
              <p className="text-green-400 font-bold">+{vault.performance.thirtyDay}%</p>
              <p className="text-white/40 text-xs">30d Return</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 text-center">
              <p className="text-mint font-bold">{vault.apy}%</p>
              <p className="text-white/40 text-xs">APY</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 text-center">
              <p className="text-white font-bold">{(vault.followers / 1000).toFixed(1)}K</p>
              <p className="text-white/40 text-xs">Followers</p>
            </div>
          </div>

          {/* Deposit input */}
          <div className="space-y-3 mb-6">
            <div className="relative">
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-navy-light border border-white/10 rounded-xl px-4 py-4 text-white text-lg placeholder:text-white/30 focus:outline-none focus:border-mint/50 transition-colors"
                disabled={isDepositing}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <button 
                  onClick={handleMaxClick}
                  className="text-mint text-sm hover:underline"
                >
                  MAX
                </button>
                <span className="text-white/50">USDC</span>
              </div>
            </div>
            
            <div className="flex justify-between text-sm text-white/50 px-1">
              <span>Balance: {balance ? parseFloat(formatUnits(balance.value, 6)).toFixed(2) : '0.00'}</span>
              {depositAmount > 0 && (
                <span className="text-mint">~${estimatedMonthly.toFixed(2)}/mo</span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button 
              className="flex-1 btn-secondary py-3 flex items-center justify-center gap-2"
            >
              <Heart size={18} />
              Follow
            </button>
            <button 
              onClick={handleDeposit}
              disabled={!amount || parseFloat(amount) <= 0 || isDepositing || isSuccess}
              className="flex-1 btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isDepositing ? (
                <Loader2 size={18} className="animate-spin" />
              ) : isSuccess ? (
                <Check size={18} />
              ) : (
                <Zap size={18} />
              )}
              {isDepositing ? 'Depositing...' : isSuccess ? 'Done!' : 'Deposit'}
            </button>
          </div>

          {isSuccess && (
            <div className="mt-4 p-3 rounded-xl bg-mint/10 border border-mint/20 flex items-center gap-2 text-mint text-sm">
              <Check size={16} />
              You&apos;re now copying {vault.creator.name}&apos;s strategy!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function VaultCard({ vault, onSelect }: { vault: typeof mockVaults[0]; onSelect: () => void }) {
  const [isFollowed, setIsFollowed] = useState(false);

  return (
    <div 
      className="glass-card p-6 hover:border-white/20 transition-all duration-300 group cursor-pointer relative overflow-hidden"
      onClick={onSelect}
    >
      {/* Gradient glow on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${vault.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
      
      {/* Trending badge */}
      {vault.trending && (
        <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold">
          <Flame size={12} />
          TRENDING
        </div>
      )}

      {/* Creator header */}
      <div className="flex items-center gap-4 mb-4">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${vault.color} flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          {vault.creator.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white truncate">{vault.creator.name}</h3>
            {vault.creator.verified && (
              <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                <Check size={10} className="text-white" />
              </div>
            )}
          </div>
          <p className="text-white/40 text-sm truncate">{vault.creator.handle}</p>
        </div>
      </div>

      {/* Performance banner */}
      <div className={`mb-4 p-4 rounded-xl bg-gradient-to-r ${vault.color} bg-opacity-10`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 text-xs mb-1">30d Performance</p>
            <div className="flex items-center gap-1">
              <TrendingUp size={18} className="text-green-400" />
              <span className="text-2xl font-bold text-green-400">+{vault.performance.thirtyDay}%</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white/60 text-xs mb-1">APY</p>
            <span className="text-xl font-bold text-mint">{vault.apy}%</span>
          </div>
        </div>
      </div>

      {/* Strategy */}
      <p className="text-white/60 text-sm mb-4 line-clamp-2">{vault.strategy}</p>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {vault.tags.map(tag => (
          <span 
            key={tag}
            className="px-2 py-1 rounded-full text-xs bg-white/5 text-white/60"
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
        <div className="p-2 rounded-lg bg-white/[0.02]">
          <p className="text-white font-semibold">${(vault.tvl / 1_000_000).toFixed(1)}M</p>
          <p className="text-white/40 text-xs">TVL</p>
        </div>
        <div className="p-2 rounded-lg bg-white/[0.02]">
          <p className="text-white font-semibold">{(vault.followers / 1000).toFixed(1)}K</p>
          <p className="text-white/40 text-xs">Followers</p>
        </div>
        <div className="p-2 rounded-lg bg-white/[0.02]">
          <p className="text-green-400 font-semibold">+{vault.performance.allTime}%</p>
          <p className="text-white/40 text-xs">All Time</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        <button 
          onClick={() => setIsFollowed(!isFollowed)}
          className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all ${
            isFollowed 
              ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' 
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          <Heart size={16} className={isFollowed ? 'fill-current' : ''} />
          {isFollowed ? 'Following' : 'Follow'}
        </button>
        <button 
          onClick={onSelect}
          className="flex-1 btn-primary py-2.5 text-sm flex items-center justify-center gap-2"
        >
          <ArrowUpRight size={16} />
          Deposit
        </button>
      </div>
    </div>
  );
}

function Leaderboard({ vaults }: { vaults: typeof mockVaults }) {
  const topVaults = [...vaults].sort((a, b) => b.performance.thirtyDay - a.performance.thirtyDay).slice(0, 3);

  return (
    <div className="glass-card p-6 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
          <Crown size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Top Performers</h2>
          <p className="text-white/50 text-sm">This month&apos;s best portfolios</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {topVaults.map((vault, index) => (
          <div 
            key={vault.id}
            className={`p-4 rounded-xl border ${
              index === 0 
                ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30' 
                : 'bg-white/[0.02] border-white/5'
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold ${
                index === 0 ? 'bg-amber-500 text-white' :
                index === 1 ? 'bg-gray-400 text-white' :
                'bg-amber-700 text-white'
              }`}>
                {index + 1}
              </div>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${vault.color} flex items-center justify-center text-lg`}>
                {vault.creator.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{vault.creator.name}</p>
                <p className="text-white/40 text-xs truncate">{vault.creator.handle}</p>
              </div>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-white/40 text-xs">30d Return</p>
                <p className="text-green-400 font-bold text-lg">+{vault.performance.thirtyDay}%</p>
              </div>
              <div className="text-right">
                <p className="text-white/40 text-xs">TVL</p>
                <p className="text-white font-medium">${(vault.tvl / 1_000_000).toFixed(1)}M</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function VaultsPage() {
  const { isConnected } = useAccount();
  const [selectedVault, setSelectedVault] = useState<typeof mockVaults[0] | null>(null);
  const [filter, setFilter] = useState<FilterCategory>("all");
  const [showCreateVault, setShowCreateVault] = useState(false);

  const filters: { id: FilterCategory; label: string; icon: React.ReactNode }[] = [
    { id: "all", label: "All", icon: <Sparkles size={16} /> },
    { id: "trending", label: "Trending", icon: <Flame size={16} /> },
    { id: "top-apy", label: "Top APY", icon: <TrendingUp size={16} /> },
    { id: "most-followed", label: "Most Followed", icon: <Users size={16} /> },
    { id: "new", label: "New", icon: <Star size={16} /> },
  ];

  const filteredVaults = mockVaults.filter(vault => {
    if (filter === "all") return true;
    if (filter === "trending") return vault.trending;
    if (filter === "top-apy") return vault.apy > 25;
    if (filter === "most-followed") return vault.followers > 10000;
    if (filter === "new") return !vault.creator.verified; // Mock: treating unverified as "new"
    return true;
  }).sort((a, b) => {
    if (filter === "top-apy") return b.apy - a.apy;
    if (filter === "most-followed") return b.followers - a.followers;
    return 0;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with gradient text */}
      <div className="mb-8">
        <h1 className="text-4xl font-display font-bold mb-2">
          <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-orange-400 bg-clip-text text-transparent">
            Follow Top Traders
          </span>
        </h1>
        <p className="text-white/60 text-lg">Copy strategies from the best. Earn together.</p>
        
        {/* Fee structure tooltip */}
        <div className="mt-3 inline-flex items-center gap-2 group relative">
          <Info size={16} className="text-white/40" />
          <span className="text-white/40 text-sm">How earnings are split</span>
          <div className="absolute left-0 top-full mt-2 p-4 bg-navy-100 rounded-xl border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 min-w-[280px]">
            <p className="text-white font-medium mb-3">Yield Distribution</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">🎯 Depositors</span>
                <span className="text-mint font-medium">70%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">👑 Vault Creator</span>
                <span className="text-purple-400 font-medium">20%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">⚡ Platform Fee</span>
                <span className="text-white/60 font-medium">10%</span>
              </div>
            </div>
            <p className="text-white/40 text-xs mt-3">Creators earn when their followers profit!</p>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <Leaderboard vaults={mockVaults} />

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filter === f.id
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            {f.icon}
            {f.label}
          </button>
        ))}
      </div>

      {!isConnected ? (
        <div className="glass-card p-12 text-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center text-4xl mx-auto mb-6 animate-pulse">
            🚀
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Join the Movement</h2>
          <p className="text-white/60 mb-6">Connect your wallet to follow top traders and grow your portfolio.</p>
          <div className="flex flex-wrap justify-center gap-4 text-white/40 text-sm">
            <span className="flex items-center gap-1"><Users size={16} /> 50K+ Followers</span>
            <span className="flex items-center gap-1"><TrendingUp size={16} /> $15M+ TVL</span>
            <span className="flex items-center gap-1"><Star size={16} /> 100+ Portfolios</span>
          </div>
        </div>
      ) : (
        <>
          {/* Stats banner */}
          <div className="glass-card p-6 mb-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10" />
            <div className="relative grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-white/40 text-sm mb-1">Your Portfolio Deposits</p>
                <p className="text-2xl font-bold text-white">$0.00</p>
              </div>
              <div>
                <p className="text-white/40 text-sm mb-1">Total Earnings</p>
                <p className="text-2xl font-bold text-green-400">$0.00</p>
              </div>
              <div>
                <p className="text-white/40 text-sm mb-1">Portfolios Following</p>
                <p className="text-2xl font-bold text-white">0</p>
              </div>
              <div>
                <p className="text-white/40 text-sm mb-1">Avg APY</p>
                <p className="text-2xl font-bold text-mint">--%</p>
              </div>
            </div>
          </div>

          {/* Vault grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVaults.map(vault => (
              <VaultCard 
                key={vault.id}
                vault={vault}
                onSelect={() => setSelectedVault(vault)}
              />
            ))}
          </div>

          {filteredVaults.length === 0 && (
            <div className="glass-card p-12 text-center">
              <p className="text-white/40">No portfolios found for this filter.</p>
            </div>
          )}
        </>
      )}

      {/* Create vault CTA */}
      <div className="mt-12 glass-card p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-orange-500/5" />
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl mx-auto mb-4">
            🎯
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Become a Creator</h2>
          <p className="text-white/60 mb-6 max-w-md mx-auto">
            Share your trading strategies, build a following, and earn performance fees when your followers profit.
          </p>
          <button 
            onClick={() => setShowCreateVault(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus size={18} />
            Create Your Portfolio
          </button>
        </div>
      </div>

      {/* Deposit Modal */}
      {selectedVault && (
        <DepositModal 
          vault={selectedVault}
          onClose={() => setSelectedVault(null)} 
        />
      )}

      {/* Create Portfolio Modal */}
      {showCreateVault && (
        <CreateVaultModal 
          onClose={() => setShowCreateVault(false)}
          onSuccess={() => {
            // In production: refresh vault list, navigate to new portfolio
            console.log('Vault created successfully');
          }}
        />
      )}
    </div>
  );
}
