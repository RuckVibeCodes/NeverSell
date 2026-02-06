// Mock data for NeverSell API

import { AssetFull } from '@/types/api';

// Asset prices (mock)
export const ASSET_PRICES: Record<string, number> = {
  wbtc: 97500,
  weth: 3250,
  arb: 0.85,
  usdc: 1.00,
};

// Full asset data with yield sources
export const MOCK_ASSETS: AssetFull[] = [
  {
    id: 'wbtc',
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
    decimals: 8,
    iconUrl: '/assets/wbtc.svg',
    priceUsd: '97500',
    aaveSupported: true,
    blendedApy: 11.65, // (1.5 * 0.6) + (16.87 * 0.4)
    yieldSources: [
      { protocol: 'Aave', apy: 1.5, weight: 60 },
      { protocol: 'GMX', apy: 16.87, weight: 40 },
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
    iconUrl: '/assets/weth.svg',
    priceUsd: '3250',
    aaveSupported: true,
    blendedApy: 8.98, // (2.1 * 0.6) + (19.29 * 0.4)
    yieldSources: [
      { protocol: 'Aave', apy: 2.1, weight: 60 },
      { protocol: 'GMX', apy: 19.29, weight: 40 },
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
    iconUrl: '/assets/arb.svg',
    priceUsd: '0.85',
    aaveSupported: true,
    blendedApy: 9.02, // (3.2 * 0.6) + (17.76 * 0.4)
    yieldSources: [
      { protocol: 'Aave', apy: 3.2, weight: 60 },
      { protocol: 'GMX', apy: 17.76, weight: 40 },
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
    iconUrl: '/assets/usdc.svg',
    priceUsd: '1.00',
    aaveSupported: true,
    blendedApy: 11.20, // (5.8 * 0.6) + (19.29 * 0.4) - uses ETH/USD pool
    yieldSources: [
      { protocol: 'Aave', apy: 5.8, weight: 60 },
      { protocol: 'GMX', apy: 19.29, weight: 40 },
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
