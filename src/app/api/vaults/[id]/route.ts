import { NextResponse } from 'next/server';
import type { ApiResponse, VaultWithDetails, Address } from '@/types/api';

// Mock vault details
const MOCK_VAULT_DETAILS: Record<string, VaultWithDetails> = {
  vault_btc_maxi: {
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
    creator: {
      address: '0x1234567890123456789012345678901234567890' as Address,
      totalTvl: '1250000',
      vaultCount: 1,
      joinedAt: Date.now() - 365 * 24 * 60 * 60 * 1000,
    },
    performance: {
      '7d': '2.1',
      '30d': '8.5',
      '90d': '28.2',
      all: '45.8',
    },
    holdings: [
      { assetId: 'wbtc', percentage: '100', valueUsd: '1250000' },
    ],
  },
  vault_balanced_blue: {
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
    creator: {
      address: '0x2345678901234567890123456789012345678901' as Address,
      totalTvl: '3500000',
      vaultCount: 2,
      joinedAt: Date.now() - 300 * 24 * 60 * 60 * 1000,
    },
    performance: {
      '7d': '1.8',
      '30d': '7.2',
      '90d': '24.1',
      all: '38.5',
    },
    holdings: [
      { assetId: 'wbtc', percentage: '50', valueUsd: '1075000' },
      { assetId: 'weth', percentage: '50', valueUsd: '1075000' },
    ],
  },
  vault_arb_alpha: {
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
    creator: {
      address: '0x3456789012345678901234567890123456789012' as Address,
      totalTvl: '450000',
      vaultCount: 1,
      joinedAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
    },
    performance: {
      '7d': '3.2',
      '30d': '12.1',
      '90d': '-',
      all: '12.1',
    },
    holdings: [
      { assetId: 'arb', percentage: '60', valueUsd: '270000' },
      { assetId: 'weth', percentage: '30', valueUsd: '135000' },
      { assetId: 'usdc', percentage: '10', valueUsd: '45000' },
    ],
  },
  vault_stable_yield: {
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
    creator: {
      address: '0x4567890123456789012345678901234567890123' as Address,
      totalTvl: '890000',
      vaultCount: 1,
      joinedAt: Date.now() - 200 * 24 * 60 * 60 * 1000,
    },
    performance: {
      '7d': '0.5',
      '30d': '2.1',
      '90d': '6.2',
      all: '6.2',
    },
    holdings: [
      { assetId: 'usdc', percentage: '100', valueUsd: '890000' },
    ],
  },
};

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const vault = MOCK_VAULT_DETAILS[id];

  if (!vault) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VAULT_NOT_FOUND',
          message: `Vault '${id}' not found`,
        },
      } as ApiResponse,
      { status: 404 }
    );
  }

  const response: ApiResponse<{ vault: VaultWithDetails }> = {
    success: true,
    data: { vault },
    meta: {
      timestamp: Date.now(),
      requestId: crypto.randomUUID(),
    },
  };

  return NextResponse.json(response);
}
