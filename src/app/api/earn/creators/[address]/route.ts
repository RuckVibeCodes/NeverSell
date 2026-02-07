import { NextResponse } from 'next/server';

// Mock creator data - in production this would come from a database/blockchain
const mockCreators: Record<string, {
  address: string;
  avatar: string;
  name: string;
  handle: string;
  verified: boolean;
  bio: string;
  color: string;
  stats: {
    followers: number;
    tvl: number;
    thirtyDayReturn: number;
    copiers: number;
    allTimeReturn: number;
    apy: number;
  };
  socials: {
    twitter?: string;
    telegram?: string;
    discord?: string;
    website?: string;
  };
  allocations: Array<{
    poolId: string;
    name: string;
    percentage: number;
    color: string;
  }>;
  strategyUpdates: Array<{
    id: string;
    timestamp: string;
    type: 'rebalance' | 'add' | 'remove' | 'update';
    message: string;
  }>;
  performanceHistory: Array<{
    date: string;
    value: number;
  }>;
}> = {
  '0x1234567890abcdef1234567890abcdef12345678': {
    address: '0x1234567890abcdef1234567890abcdef12345678',
    avatar: '👑',
    name: 'CryptoKing',
    handle: '@cryptoking_trades',
    verified: true,
    bio: 'Professional trader with 8+ years in crypto. Focused on momentum strategies with strict risk management. Former Wall Street quantitative analyst.',
    color: 'from-amber-400 via-orange-500 to-red-500',
    stats: {
      followers: 15200,
      tvl: 2340000,
      thirtyDayReturn: 34.5,
      copiers: 892,
      allTimeReturn: 156.2,
      apy: 28.5,
    },
    socials: {
      twitter: '@cryptoking_trades',
      telegram: 'cryptoking_trades',
      website: 'cryptoking.io',
    },
    allocations: [
      { poolId: 'BTC/USD', name: 'Bitcoin', percentage: 40, color: 'from-orange-500 to-amber-500' },
      { poolId: 'ETH/USD', name: 'Ethereum', percentage: 30, color: 'from-blue-500 to-purple-500' },
      { poolId: 'SOL/USD', name: 'Solana', percentage: 15, color: 'from-purple-500 to-pink-500' },
      { poolId: 'LINK/USD', name: 'Chainlink', percentage: 10, color: 'from-blue-400 to-blue-600' },
      { poolId: 'ARB/USD', name: 'Arbitrum', percentage: 5, color: 'from-blue-600 to-indigo-500' },
    ],
    strategyUpdates: [
      { id: '1', timestamp: '2025-02-06T10:30:00Z', type: 'rebalance', message: 'Increased BTC allocation from 35% to 40% ahead of halving momentum' },
      { id: '2', timestamp: '2025-02-04T15:45:00Z', type: 'add', message: 'Added ARB/USD position at 5% - Arbitrum ecosystem showing strength' },
      { id: '3', timestamp: '2025-02-01T09:00:00Z', type: 'update', message: 'Reduced SOL exposure from 20% to 15% after taking profits' },
      { id: '4', timestamp: '2025-01-28T14:20:00Z', type: 'remove', message: 'Exited AVAX position completely - rotating into LINK' },
    ],
    performanceHistory: [
      { date: '2025-01-07', value: 100 },
      { date: '2025-01-14', value: 108 },
      { date: '2025-01-21', value: 115 },
      { date: '2025-01-28', value: 122 },
      { date: '2025-02-04', value: 128 },
      { date: '2025-02-07', value: 134.5 },
    ],
  },
  '0xabcdef1234567890abcdef1234567890abcdef12': {
    address: '0xabcdef1234567890abcdef1234567890abcdef12',
    avatar: '👸',
    name: 'DeFi Queen',
    handle: '@defi_queen',
    verified: true,
    bio: 'DeFi native since 2020. Yield optimization specialist. Focused on sustainable returns with diversified strategies across top protocols.',
    color: 'from-purple-400 via-pink-500 to-rose-500',
    stats: {
      followers: 12400,
      tvl: 1890000,
      thirtyDayReturn: 21.8,
      copiers: 654,
      allTimeReturn: 89.4,
      apy: 24.2,
    },
    socials: {
      twitter: '@defi_queen',
      telegram: 'defiqueen',
      discord: 'discord.gg/defiqueen',
    },
    allocations: [
      { poolId: 'ETH/USD', name: 'Ethereum', percentage: 35, color: 'from-blue-500 to-purple-500' },
      { poolId: 'BTC/USD', name: 'Bitcoin', percentage: 25, color: 'from-orange-500 to-amber-500' },
      { poolId: 'ARB/USD', name: 'Arbitrum', percentage: 15, color: 'from-blue-600 to-indigo-500' },
      { poolId: 'LINK/USD', name: 'Chainlink', percentage: 15, color: 'from-blue-400 to-blue-600' },
      { poolId: 'UNI/USD', name: 'Uniswap', percentage: 10, color: 'from-pink-400 to-pink-600' },
    ],
    strategyUpdates: [
      { id: '1', timestamp: '2025-02-05T11:00:00Z', type: 'rebalance', message: 'Quarterly rebalance - maintaining core ETH/BTC weighting' },
      { id: '2', timestamp: '2025-02-02T16:30:00Z', type: 'update', message: 'UNI showing strength, monitoring for potential increase' },
    ],
    performanceHistory: [
      { date: '2025-01-07', value: 100 },
      { date: '2025-01-14', value: 105 },
      { date: '2025-01-21', value: 112 },
      { date: '2025-01-28', value: 116 },
      { date: '2025-02-04', value: 119 },
      { date: '2025-02-07', value: 121.8 },
    ],
  },
  '0x9876543210fedcba9876543210fedcba98765432': {
    address: '0x9876543210fedcba9876543210fedcba98765432',
    avatar: '🎯',
    name: 'Alpha Hunter',
    handle: '@alpha_hunter',
    verified: true,
    bio: 'High-conviction trader. Early to narratives, quick on exits. Not for the faint of heart. DYOR and only invest what you can afford to lose.',
    color: 'from-emerald-400 via-cyan-500 to-blue-500',
    stats: {
      followers: 8900,
      tvl: 890000,
      thirtyDayReturn: 45.2,
      copiers: 423,
      allTimeReturn: 210.8,
      apy: 35.8,
    },
    socials: {
      twitter: '@alpha_hunter',
      website: 'alphahunter.xyz',
    },
    allocations: [
      { poolId: 'SOL/USD', name: 'Solana', percentage: 35, color: 'from-purple-500 to-pink-500' },
      { poolId: 'PEPE/USD', name: 'Pepe', percentage: 20, color: 'from-green-400 to-green-600' },
      { poolId: 'WIF/USD', name: 'dogwifhat', percentage: 20, color: 'from-amber-400 to-orange-500' },
      { poolId: 'ETH/USD', name: 'Ethereum', percentage: 15, color: 'from-blue-500 to-purple-500' },
      { poolId: 'BONK/USD', name: 'Bonk', percentage: 10, color: 'from-orange-400 to-yellow-500' },
    ],
    strategyUpdates: [
      { id: '1', timestamp: '2025-02-06T08:15:00Z', type: 'add', message: '🚀 Added WIF position - memecoin szn heating up' },
      { id: '2', timestamp: '2025-02-05T19:30:00Z', type: 'rebalance', message: 'Taking profits on BONK, rotating partial into PEPE' },
      { id: '3', timestamp: '2025-02-03T12:00:00Z', type: 'update', message: 'SOL looking strong, maintaining high conviction position' },
    ],
    performanceHistory: [
      { date: '2025-01-07', value: 100 },
      { date: '2025-01-14', value: 118 },
      { date: '2025-01-21', value: 125 },
      { date: '2025-01-28', value: 138 },
      { date: '2025-02-04', value: 142 },
      { date: '2025-02-07', value: 145.2 },
    ],
  },
  '0xfedcba0987654321fedcba0987654321fedcba09': {
    address: '0xfedcba0987654321fedcba0987654321fedcba09',
    avatar: '🚀',
    name: 'Meme Lord',
    handle: '@meme_lord',
    verified: false,
    bio: 'Full degen. Memecoin specialist. High risk, high reward. If you\'re here for stability, wrong vault. 🐸🚀',
    color: 'from-yellow-400 via-orange-500 to-pink-500',
    stats: {
      followers: 32100,
      tvl: 450000,
      thirtyDayReturn: 89.2,
      copiers: 1205,
      allTimeReturn: 320.5,
      apy: 65.2,
    },
    socials: {
      twitter: '@meme_lord_degen',
      telegram: 'memelordcalls',
    },
    allocations: [
      { poolId: 'PEPE/USD', name: 'Pepe', percentage: 30, color: 'from-green-400 to-green-600' },
      { poolId: 'DOGE/USD', name: 'Dogecoin', percentage: 25, color: 'from-yellow-400 to-amber-500' },
      { poolId: 'WIF/USD', name: 'dogwifhat', percentage: 20, color: 'from-amber-400 to-orange-500' },
      { poolId: 'BONK/USD', name: 'Bonk', percentage: 15, color: 'from-orange-400 to-yellow-500' },
      { poolId: 'SHIB/USD', name: 'Shiba Inu', percentage: 10, color: 'from-orange-400 to-red-500' },
    ],
    strategyUpdates: [
      { id: '1', timestamp: '2025-02-06T14:00:00Z', type: 'add', message: '🐸 PEPE looking primed for another leg up, added more' },
      { id: '2', timestamp: '2025-02-05T10:00:00Z', type: 'rebalance', message: 'WIF pumping, taking some profits to DOGE' },
      { id: '3', timestamp: '2025-02-04T22:00:00Z', type: 'update', message: 'Meme szn in full effect 🔥' },
    ],
    performanceHistory: [
      { date: '2025-01-07', value: 100 },
      { date: '2025-01-14', value: 135 },
      { date: '2025-01-21', value: 155 },
      { date: '2025-01-28', value: 168 },
      { date: '2025-02-04', value: 182 },
      { date: '2025-02-07', value: 189.2 },
    ],
  },
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;
  
  // Look up creator by address
  const creator = mockCreators[address.toLowerCase()] || mockCreators[address];
  
  if (!creator) {
    return NextResponse.json(
      { error: 'Creator not found' },
      { status: 404 }
    );
  }
  
  return NextResponse.json(creator);
}
