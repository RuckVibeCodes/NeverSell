import { NextResponse } from 'next/server';
import type { ApiResponse, Vault, Address } from '@/types/api';

// Mock vaults data
const MOCK_VAULTS: Vault[] = [
  {
    id: 'vault_btc_maxi',
    creatorAddress: '0x1234567890123456789012345678901234567890' as Address,
    name: 'BTC Maximalist',
    description: 'Pure Bitcoin exposure with optimized yield. For believers in digital gold.',
    strategy: {
      allocations: [{ assetId: 'wbtc', percentage: '100' }],
      ltvTier: 'conservative',
      rebalanceThreshold: '5',
      timelockHours: 24,
    },
    tvlUsd: '1250000',
    depositors: 89,
    historicalApy: '14.8',
    currentApy: '15.12',
    performanceFee: '10',
    createdAt: Date.now() - 180 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now(),
  },
  {
    id: 'vault_balanced_blue',
    creatorAddress: '0x2345678901234567890123456789012345678901' as Address,
    name: 'Balanced Blue Chip',
    description: 'Diversified across BTC and ETH. The set-and-forget choice.',
    strategy: {
      allocations: [
        { assetId: 'wbtc', percentage: '50' },
        { assetId: 'weth', percentage: '50' },
      ],
      ltvTier: 'moderate',
      rebalanceThreshold: '5',
      timelockHours: 12,
    },
    tvlUsd: '2150000',
    depositors: 156,
    historicalApy: '13.2',
    currentApy: '14.70',
    performanceFee: '12',
    createdAt: Date.now() - 120 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now(),
  },
  {
    id: 'vault_arb_alpha',
    creatorAddress: '0x3456789012345678901234567890123456789012' as Address,
    name: 'ARB Alpha',
    description: 'High conviction Arbitrum play. Higher volatility, higher potential.',
    strategy: {
      allocations: [
        { assetId: 'arb', percentage: '60' },
        { assetId: 'weth', percentage: '30' },
        { assetId: 'usdc', percentage: '10' },
      ],
      ltvTier: 'aggressive',
      rebalanceThreshold: '3',
      timelockHours: 6,
    },
    tvlUsd: '450000',
    depositors: 42,
    historicalApy: '18.5',
    currentApy: '16.45',
    performanceFee: '15',
    createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now(),
  },
  {
    id: 'vault_stable_yield',
    creatorAddress: '0x4567890123456789012345678901234567890123' as Address,
    name: 'Stable Yield',
    description: 'No volatility, pure yield. Park your stables and earn.',
    strategy: {
      allocations: [{ assetId: 'usdc', percentage: '100' }],
      ltvTier: 'conservative',
      rebalanceThreshold: '10',
      timelockHours: 48,
    },
    tvlUsd: '890000',
    depositors: 234,
    historicalApy: '7.8',
    currentApy: '8.24',
    performanceFee: '8',
    createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now(),
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sort = searchParams.get('sort') || 'tvl';
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  // Sort vaults
  let sortedVaults = [...MOCK_VAULTS];
  switch (sort) {
    case 'apy':
      sortedVaults.sort((a, b) => parseFloat(b.currentApy) - parseFloat(a.currentApy));
      break;
    case 'depositors':
      sortedVaults.sort((a, b) => b.depositors - a.depositors);
      break;
    case 'newest':
      sortedVaults.sort((a, b) => b.createdAt - a.createdAt);
      break;
    case 'tvl':
    default:
      sortedVaults.sort((a, b) => parseFloat(b.tvlUsd) - parseFloat(a.tvlUsd));
      break;
  }

  // Apply pagination
  const total = sortedVaults.length;
  const paginatedVaults = sortedVaults.slice(offset, offset + limit);

  const response: ApiResponse<{ vaults: Vault[]; total: number }> = {
    success: true,
    data: {
      vaults: paginatedVaults,
      total,
    },
    meta: {
      timestamp: Date.now(),
      requestId: crypto.randomUUID(),
    },
  };

  return NextResponse.json(response);
}
