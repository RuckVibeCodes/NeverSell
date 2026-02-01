// Mock data for NeverSell API

import { Asset, YieldSource } from '@/types/api';

// Asset prices (mock)
export const ASSET_PRICES: Record<string, number> = {
  wbtc: 97500,
  weth: 3250,
  arb: 0.85,
  usdc: 1.00,
};

// Full asset data with yield sources
export const MOCK_ASSETS: Asset[] = [
  {
    id: 'wbtc',
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
    decimals: 8,
    logoUrl: '/assets/wbtc.svg',
    blendedApy: 15.12,
    yieldSources: [
      { protocol: 'Aave', apy: 1.5, weight: 40 },
      { protocol: 'GMX', apy: 18.0, weight: 60 },
    ],
    tvl: 1_250_000,
    minDeposit: 0.001,
    maxLtv: 75,
  },
  {
    id: 'weth',
    symbol: 'WETH',
    name: 'Wrapped Ether',
    address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    decimals: 18,
    logoUrl: '/assets/weth.svg',
    blendedApy: 14.28,
    yieldSources: [
      { protocol: 'Aave', apy: 2.1, weight: 35 },
      { protocol: 'GMX', apy: 21.0, weight: 45 },
      { protocol: 'Pendle', apy: 8.5, weight: 20 },
    ],
    tvl: 1_850_000,
    minDeposit: 0.01,
    maxLtv: 80,
  },
  {
    id: 'arb',
    symbol: 'ARB',
    name: 'Arbitrum',
    address: '0x912CE59144191C1204E64559FE8253a0e49E6548',
    decimals: 18,
    logoUrl: '/assets/arb.svg',
    blendedApy: 16.45,
    yieldSources: [
      { protocol: 'Aave', apy: 3.2, weight: 25 },
      { protocol: 'GMX', apy: 19.5, weight: 55 },
      { protocol: 'Camelot', apy: 22.0, weight: 20 },
    ],
    tvl: 650_000,
    minDeposit: 10,
    maxLtv: 65,
  },
  {
    id: 'usdc',
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    decimals: 6,
    logoUrl: '/assets/usdc.svg',
    blendedApy: 8.24,
    yieldSources: [
      { protocol: 'Aave', apy: 5.8, weight: 50 },
      { protocol: 'Compound', apy: 6.2, weight: 30 },
      { protocol: 'GMX', apy: 15.0, weight: 20 },
    ],
    tvl: 450_000,
    minDeposit: 10,
    maxLtv: 85,
  },
];

// Protocol stats
export const MOCK_PROTOCOL_STATS = {
  tvl: 4_200_000,
  tvlFormatted: '$4.2M',
  totalDepositors: 1247,
  totalPositions: 2891,
  totalYieldGenerated: 892_450,
  averageApy: 13.52,
  lastUpdated: new Date().toISOString(),
};

// APY breakdown with historical data
export const MOCK_APY_BREAKDOWN = MOCK_ASSETS.map((asset) => ({
  assetId: asset.id,
  symbol: asset.symbol,
  blendedApy: asset.blendedApy,
  sources: asset.yieldSources,
  historicalApy: {
    day7: asset.blendedApy * (0.95 + Math.random() * 0.1),
    day30: asset.blendedApy * (0.90 + Math.random() * 0.15),
    day90: asset.blendedApy * (0.85 + Math.random() * 0.2),
  },
}));

// Borrow rates (what users pay to borrow)
export const BORROW_RATES: Record<string, number> = {
  wbtc: 5.5,
  weth: 4.8,
  arb: 7.2,
  usdc: 3.5,
};
