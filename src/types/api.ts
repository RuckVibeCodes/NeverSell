// API Response Types for NeverSell
// Following API-SPEC.md specification

// ========== Common Types ==========
export type Address = `0x${string}`;
export type ChainId = 42161; // Arbitrum One
export type BigIntString = string;

// Base response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    timestamp: number;
    requestId: string;
  };
}

// ========== Asset Types ==========
export interface YieldSource {
  protocol: string;
  apy: number;
  weight: number; // Percentage allocation (0-100)
}

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  address: Address;
  decimals: number;
  iconUrl: string;
  priceUsd: string;
  aaveSupported: boolean;
  gmxPoolAddress?: Address;
}

export interface AssetWithPricing extends Asset {
  pricing: {
    priceUsd: string;
    change24h: string;
    aaveApy: string;
    gmxApy: string;
    blendedApy: string;
  };
}

// Extended asset for internal use
export interface AssetFull {
  id: string;
  symbol: string;
  name: string;
  address: Address;
  decimals: number;
  iconUrl: string;
  priceUsd: string;
  aaveSupported: boolean;
  gmxPoolAddress?: Address;
  blendedApy: number;
  yieldSources: YieldSource[];
  tvl: number;
  minDeposit: number;
  maxLtv: number;
}

// ========== Position Types ==========
export interface PositionAsset {
  assetId: string;
  allocation: string;
  amountDeposited: BigIntString;
  currentValue: BigIntString;
  aaveAmount: BigIntString;
  gmxAmount: BigIntString;
  earnedYield: BigIntString;
}

export interface Position {
  id: string;
  userAddress: Address;
  vaultId?: string;
  assets: PositionAsset[];
  totalValueUsd: string;
  totalDepositedUsd: string;
  totalEarnedUsd: string;
  currentApy: string;
  borrowCapacityUsd: string;
  borrowedUsd: string;
  healthFactor: string;
  status: 'active' | 'liquidated' | 'withdrawn';
  createdAt: number;
  updatedAt: number;
}

export interface PositionQuoteRequest {
  amountUsdc: BigIntString;
  sourceChain: ChainId;
  allocations?: {
    assetId: string;
    percentage: string;
  }[];
  preset?: 'conservative' | 'balanced' | 'growth';
}

export interface PositionQuoteBreakdown {
  assetId: string;
  allocation: string;
  usdcAllocated: BigIntString;
  estimatedAmount: BigIntString;
  aaveAmount: BigIntString;
  gmxAmount: BigIntString;
  aaveApy: string;
  gmxApy: string;
}

export interface PositionQuote {
  id: string;
  expiresAt: number;
  inputAmountUsdc: BigIntString;
  sourceChain: ChainId;
  breakdown: PositionQuoteBreakdown[];
  estimatedApy: string;
  estimatedMonthlyEarnings: string;
  borrowCapacityUsd: string;
  bridgeFee: BigIntString;
  swapFee: BigIntString;
  protocolFee: BigIntString;
  totalFees: BigIntString;
  estimatedGas: BigIntString;
  gasPrice: BigIntString;
}

// ========== Borrow Types ==========
export interface Borrow {
  id: string;
  positionId: string;
  userAddress: Address;
  amountUsd: string;
  amountUsdc: BigIntString;
  interestRate: string;
  accruedInterest: BigIntString;
  status: 'active' | 'repaid' | 'liquidated';
  createdAt: number;
  updatedAt: number;
}

export interface BorrowSimulateRequest {
  positionId: string;
  borrowAmountUsdc: BigIntString;
}

export interface BorrowSimulationState {
  totalValueUsd: string;
  currentApy?: string;
  grossApy?: string;
  borrowCostApy?: string;
  netApy?: string;
  dailyEarnings: string;
  monthlyEarnings: string;
  yearlyEarnings: string;
  borrowedUsd: string;
  healthFactor: string;
}

export interface BorrowSimulationTradeoff {
  cashYouGet: string;
  earningsReduction: string;
  breakEvenDays: number;
  whyBorrow: string[];
}

export interface BorrowSimulationWarning {
  code: string;
  message: string;
  severity: 'info' | 'warning' | 'danger';
}

export interface BorrowSimulation {
  simulation: {
    before: BorrowSimulationState;
    after: BorrowSimulationState;
    tradeoff: BorrowSimulationTradeoff;
    warnings: BorrowSimulationWarning[];
  };
  summary: {
    headline: string;
    subtext: string;
    recommendation: string;
  };
}

// ========== Vault Types ==========
export interface VaultStrategy {
  allocations: { assetId: string; percentage: string }[];
  ltvTier: 'conservative' | 'moderate' | 'aggressive';
  rebalanceThreshold: string;
  timelockHours: number;
}

export interface Vault {
  id: string;
  creatorAddress: Address;
  name: string;
  description: string;
  strategy: VaultStrategy;
  tvlUsd: string;
  depositors: number;
  historicalApy: string;
  currentApy: string;
  performanceFee: string;
  createdAt: number;
  updatedAt: number;
}

export interface VaultWithDetails extends Vault {
  creator: {
    address: Address;
    totalTvl: string;
    vaultCount: number;
    joinedAt: number;
  };
  performance: {
    '7d': string;
    '30d': string;
    '90d': string;
    all: string;
  };
  holdings: {
    assetId: string;
    percentage: string;
    valueUsd: string;
  }[];
}

// ========== Protocol Stats Types ==========
export interface ProtocolStats {
  tvlUsd: string;
  totalDepositors: number;
  totalEarningsDistributed: string;
  averageApy: string;
  vaultCount: number;
  volume24h: string;
}

export interface ApyAssetBreakdown {
  assetId: string;
  aaveSupplyApy: string;
  gmxPoolApy: string;
  blendedApy: string;
}

export interface ApyStats {
  assets: ApyAssetBreakdown[];
  presets: {
    conservative: string;
    balanced: string;
    growth: string;
  };
}

// ========== Education Types ==========
export type ContentBlockType = 'text' | 'heading' | 'bullets' | 'example' | 'comparison' | 'warning' | 'tip' | 'math';

export interface ContentBlock {
  type: ContentBlockType;
  content: string | string[] | object;
}

export interface LearnTopic {
  id: string;
  title: string;
  description: string;
  readTimeMinutes: number;
  order: number;
  category: 'basics' | 'earning' | 'borrowing' | 'advanced' | 'safety';
}

export interface LearnTopicFull extends LearnTopic {
  headline: string;
  content: ContentBlock[];
  nextTopic?: string;
  relatedTopics: string[];
  quiz?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export interface GlossaryTerm {
  term: string;
  definition: string;
  example?: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'earning' | 'borrowing' | 'safety' | 'fees';
}

// ========== Error Codes ==========
export const ErrorCodes = {
  AUTH_INVALID: 'AUTH_INVALID',
  AUTH_SIGNATURE_INVALID: 'AUTH_SIGNATURE_INVALID',
  QUOTE_EXPIRED: 'QUOTE_EXPIRED',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  INSUFFICIENT_COLLATERAL: 'INSUFFICIENT_COLLATERAL',
  HEALTH_FACTOR_TOO_LOW: 'HEALTH_FACTOR_TOO_LOW',
  AMOUNT_TOO_LOW: 'AMOUNT_TOO_LOW',
  AMOUNT_TOO_HIGH: 'AMOUNT_TOO_HIGH',
  VAULT_NOT_FOUND: 'VAULT_NOT_FOUND',
  POSITION_NOT_FOUND: 'POSITION_NOT_FOUND',
  CHAIN_NOT_SUPPORTED: 'CHAIN_NOT_SUPPORTED',
  ASSET_NOT_SUPPORTED: 'ASSET_NOT_SUPPORTED',
  RATE_LIMITED: 'RATE_LIMITED',
} as const;
