// Mock leaderboard data for social trading feature

export interface Creator {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  verified: boolean;
  bio: string;
  socials?: {
    twitter?: string;
    youtube?: string;
    telegram?: string;
    discord?: string;
  };
}

export interface LeaderboardEntry {
  id: string;
  creator: Creator;
  performance: {
    thirtyDay: number;
    ninetyDay: number;
    allTime: number;
  };
  tvl: number;
  followers: number;
  followerGrowth: number; // percentage growth in last 7 days
  tvlGrowth: number; // percentage growth in last 7 days
  riskLevel: 'low' | 'medium' | 'high';
  strategyType: 'yield' | 'momentum' | 'degen' | 'diversified' | 'whale-copy';
  tags: string[];
  color: string;
  trending: boolean;
  joinedAt: string;
}

export type LeaderboardPeriod = '30d' | '90d' | 'all';
export type LeaderboardSort = 'returns' | 'tvl' | 'followers';

export const mockLeaderboardData: LeaderboardEntry[] = [
  {
    id: "1",
    creator: {
      id: "creator-1",
      name: "CryptoKing",
      handle: "@cryptoking_trades",
      avatar: "👑",
      verified: true,
      bio: "10+ years in TradFi, 5 years in crypto. Consistent gains, no YOLO.",
    },
    performance: {
      thirtyDay: 34.5,
      ninetyDay: 89.2,
      allTime: 256.8,
    },
    tvl: 4340000,
    followers: 25200,
    followerGrowth: 12.5,
    tvlGrowth: 8.3,
    riskLevel: 'medium',
    strategyType: 'momentum',
    tags: ["momentum", "BTC", "ETH", "macro"],
    trending: true,
    color: "from-amber-400 via-orange-500 to-red-500",
    joinedAt: "2024-03-15",
  },
  {
    id: "2",
    creator: {
      id: "creator-2",
      name: "DeFi Queen",
      handle: "@defi_queen",
      avatar: "👸",
      verified: true,
      bio: "Yield farming expert. Finding alpha in the noise.",
    },
    performance: {
      thirtyDay: 21.8,
      ninetyDay: 58.4,
      allTime: 189.4,
    },
    tvl: 3890000,
    followers: 18400,
    followerGrowth: 5.2,
    tvlGrowth: 3.1,
    riskLevel: 'low',
    strategyType: 'yield',
    tags: ["yield", "stable", "aave", "compound"],
    trending: false,
    color: "from-purple-400 via-pink-500 to-rose-500",
    joinedAt: "2024-02-20",
  },
  {
    id: "3",
    creator: {
      id: "creator-3",
      name: "Alpha Hunter",
      handle: "@alpha_hunter",
      avatar: "🎯",
      verified: true,
      bio: "Early to every narrative. High risk, high reward.",
    },
    performance: {
      thirtyDay: 67.2,
      ninetyDay: 145.8,
      allTime: 410.8,
    },
    tvl: 1290000,
    followers: 14900,
    followerGrowth: 28.5,
    tvlGrowth: 22.1,
    riskLevel: 'high',
    strategyType: 'degen',
    tags: ["alpha", "degen", "narratives", "memes"],
    trending: true,
    color: "from-emerald-400 via-cyan-500 to-blue-500",
    joinedAt: "2024-04-10",
  },
  {
    id: "4",
    creator: {
      id: "creator-4",
      name: "Whale Watcher",
      handle: "@whale_watcher",
      avatar: "🐋",
      verified: true,
      bio: "I follow the smart money. So should you.",
    },
    performance: {
      thirtyDay: 28.3,
      ninetyDay: 72.5,
      allTime: 167.2,
    },
    tvl: 5200000,
    followers: 21800,
    followerGrowth: 9.8,
    tvlGrowth: 11.2,
    riskLevel: 'medium',
    strategyType: 'whale-copy',
    tags: ["whales", "on-chain", "smart-money"],
    trending: false,
    color: "from-blue-400 via-indigo-500 to-violet-500",
    joinedAt: "2024-01-15",
  },
  {
    id: "5",
    creator: {
      id: "creator-5",
      name: "Yield Master",
      handle: "@yield_master",
      avatar: "💎",
      verified: true,
      bio: "Sleep well at night. Consistent 15-20% APY, always.",
    },
    performance: {
      thirtyDay: 15.6,
      ninetyDay: 42.3,
      allTime: 152.3,
    },
    tvl: 8500000,
    followers: 31300,
    followerGrowth: 3.2,
    tvlGrowth: 2.8,
    riskLevel: 'low',
    strategyType: 'yield',
    tags: ["stable", "low-risk", "consistent", "blue-chip"],
    trending: false,
    color: "from-teal-400 via-emerald-500 to-green-500",
    joinedAt: "2023-11-20",
  },
  {
    id: "6",
    creator: {
      id: "creator-6",
      name: "Meme Lord",
      handle: "@meme_lord",
      avatar: "🚀",
      verified: true,
      bio: "Memes are the narrative. DYOR, NFA, LFG 🚀",
    },
    performance: {
      thirtyDay: 89.2,
      ninetyDay: 178.5,
      allTime: 520.5,
    },
    tvl: 950000,
    followers: 42100,
    followerGrowth: 35.2,
    tvlGrowth: 28.5,
    riskLevel: 'high',
    strategyType: 'degen',
    tags: ["meme", "degen", "pepe", "wif", "volatile"],
    trending: true,
    color: "from-yellow-400 via-orange-500 to-pink-500",
    joinedAt: "2024-05-01",
  },
  {
    id: "7",
    creator: {
      id: "creator-7",
      name: "The Strategist",
      handle: "@the_strategist",
      avatar: "🧠",
      verified: true,
      bio: "Quant-driven. Data over emotions.",
    },
    performance: {
      thirtyDay: 24.8,
      ninetyDay: 68.9,
      allTime: 198.4,
    },
    tvl: 3100000,
    followers: 12600,
    followerGrowth: 7.4,
    tvlGrowth: 5.6,
    riskLevel: 'medium',
    strategyType: 'diversified',
    tags: ["quant", "data", "diversified", "balanced"],
    trending: false,
    color: "from-slate-400 via-gray-500 to-zinc-600",
    joinedAt: "2024-02-01",
  },
  {
    id: "8",
    creator: {
      id: "creator-8",
      name: "RWA Believer",
      handle: "@rwa_believer",
      avatar: "🏛️",
      verified: true,
      bio: "Real World Assets are the future. Tokenized everything.",
    },
    performance: {
      thirtyDay: 12.4,
      ninetyDay: 35.2,
      allTime: 98.6,
    },
    tvl: 2800000,
    followers: 8900,
    followerGrowth: 15.3,
    tvlGrowth: 12.1,
    riskLevel: 'low',
    strategyType: 'yield',
    tags: ["rwa", "tokenized", "real-estate", "treasuries"],
    trending: true,
    color: "from-amber-300 via-yellow-400 to-orange-400",
    joinedAt: "2024-06-15",
  },
  {
    id: "9",
    creator: {
      id: "creator-9",
      name: "Layer2 Larry",
      handle: "@l2_larry",
      avatar: "⚡",
      verified: false,
      bio: "L2 ecosystem maximalist. Arbitrum, Base, OP - I'm there.",
    },
    performance: {
      thirtyDay: 31.5,
      ninetyDay: 82.4,
      allTime: 175.3,
    },
    tvl: 1450000,
    followers: 9800,
    followerGrowth: 18.9,
    tvlGrowth: 14.2,
    riskLevel: 'medium',
    strategyType: 'momentum',
    tags: ["L2", "arbitrum", "base", "optimism"],
    trending: true,
    color: "from-sky-400 via-blue-500 to-indigo-600",
    joinedAt: "2024-07-01",
  },
  {
    id: "10",
    creator: {
      id: "creator-10",
      name: "Airdrop Andy",
      handle: "@airdrop_andy",
      avatar: "🪂",
      verified: false,
      bio: "Farming the future. Every airdrop, every protocol.",
    },
    performance: {
      thirtyDay: 45.8,
      ninetyDay: 112.6,
      allTime: 289.4,
    },
    tvl: 780000,
    followers: 15200,
    followerGrowth: 42.1,
    tvlGrowth: 38.5,
    riskLevel: 'high',
    strategyType: 'degen',
    tags: ["airdrops", "farming", "new-protocols"],
    trending: true,
    color: "from-violet-400 via-purple-500 to-fuchsia-500",
    joinedAt: "2024-08-01",
  },
  {
    id: "11",
    creator: {
      id: "creator-11",
      name: "Stablecoin Steve",
      handle: "@stable_steve",
      avatar: "🛡️",
      verified: true,
      bio: "Capital preservation first. Boring but profitable.",
    },
    performance: {
      thirtyDay: 8.2,
      ninetyDay: 24.5,
      allTime: 72.8,
    },
    tvl: 12500000,
    followers: 28400,
    followerGrowth: 2.1,
    tvlGrowth: 1.8,
    riskLevel: 'low',
    strategyType: 'yield',
    tags: ["stables", "usdc", "usdt", "conservative"],
    trending: false,
    color: "from-green-400 via-emerald-400 to-teal-400",
    joinedAt: "2023-09-01",
  },
  {
    id: "12",
    creator: {
      id: "creator-12",
      name: "NFT Nate",
      handle: "@nft_nate",
      avatar: "🖼️",
      verified: false,
      bio: "Blue chips only. Art meets investment.",
    },
    performance: {
      thirtyDay: 52.3,
      ninetyDay: 98.7,
      allTime: 312.5,
    },
    tvl: 620000,
    followers: 7200,
    followerGrowth: 22.4,
    tvlGrowth: 19.8,
    riskLevel: 'high',
    strategyType: 'degen',
    tags: ["nft", "art", "collectibles", "blue-chip"],
    trending: false,
    color: "from-rose-400 via-red-500 to-orange-500",
    joinedAt: "2024-04-20",
  },
];

// Helper to filter and sort leaderboard data
export function getLeaderboardData(options: {
  period?: LeaderboardPeriod;
  sort?: LeaderboardSort;
  riskLevel?: 'low' | 'medium' | 'high';
  minTvl?: number;
  strategyType?: string;
  limit?: number;
}): LeaderboardEntry[] {
  const { period = '30d', sort = 'returns', riskLevel, minTvl, strategyType, limit = 50 } = options;

  let data = [...mockLeaderboardData];

  // Filter by risk level
  if (riskLevel) {
    data = data.filter(entry => entry.riskLevel === riskLevel);
  }

  // Filter by min TVL
  if (minTvl) {
    data = data.filter(entry => entry.tvl >= minTvl);
  }

  // Filter by strategy type
  if (strategyType) {
    data = data.filter(entry => entry.strategyType === strategyType);
  }

  // Sort
  data.sort((a, b) => {
    if (sort === 'tvl') {
      return b.tvl - a.tvl;
    }
    if (sort === 'followers') {
      return b.followers - a.followers;
    }
    // Default: returns based on period
    if (period === '90d') {
      return b.performance.ninetyDay - a.performance.ninetyDay;
    }
    if (period === 'all') {
      return b.performance.allTime - a.performance.allTime;
    }
    return b.performance.thirtyDay - a.performance.thirtyDay;
  });

  return data.slice(0, limit);
}

// Get trending creators (fastest growing)
export function getTrendingCreators(limit = 6): LeaderboardEntry[] {
  return [...mockLeaderboardData]
    .filter(entry => entry.trending)
    .sort((a, b) => (b.followerGrowth + b.tvlGrowth) - (a.followerGrowth + a.tvlGrowth))
    .slice(0, limit);
}
