import { NextResponse } from 'next/server';
import { MOCK_ASSETS } from '@/lib/mock-data';
import type { ApiResponse, ApyStats, ApyAssetBreakdown } from '@/types/api';

export async function GET() {
  // Calculate APY for each asset
  const assets: ApyAssetBreakdown[] = MOCK_ASSETS.map((asset) => {
    const aaveSource = asset.yieldSources.find((s) => s.protocol === 'Aave');
    const gmxSource = asset.yieldSources.find((s) => s.protocol === 'GMX');
    
    const aaveApy = aaveSource?.apy || 0;
    const gmxApy = gmxSource?.apy || 0;
    // 60/40 split for blended APY
    const blendedApy = (aaveApy * 0.6) + (gmxApy * 0.4);

    return {
      assetId: asset.id,
      aaveSupplyApy: aaveApy.toFixed(2),
      gmxPoolApy: gmxApy.toFixed(2),
      blendedApy: blendedApy.toFixed(2),
    };
  });

  // Calculate preset APYs
  const presets = {
    conservative: calculatePresetApy([
      { assetId: 'wbtc', weight: 50 },
      { assetId: 'weth', weight: 30 },
      { assetId: 'usdc', weight: 20 },
    ]),
    balanced: calculatePresetApy([
      { assetId: 'wbtc', weight: 35 },
      { assetId: 'weth', weight: 35 },
      { assetId: 'arb', weight: 20 },
      { assetId: 'usdc', weight: 10 },
    ]),
    growth: calculatePresetApy([
      { assetId: 'wbtc', weight: 25 },
      { assetId: 'weth', weight: 30 },
      { assetId: 'arb', weight: 35 },
      { assetId: 'usdc', weight: 10 },
    ]),
  };

  const stats: ApyStats = {
    assets,
    presets,
  };

  const response: ApiResponse<ApyStats> = {
    success: true,
    data: stats,
    meta: {
      timestamp: Date.now(),
      requestId: crypto.randomUUID(),
    },
  };

  return NextResponse.json(response);
}

function calculatePresetApy(allocations: { assetId: string; weight: number }[]): string {
  let totalApy = 0;
  
  for (const alloc of allocations) {
    const asset = MOCK_ASSETS.find((a) => a.id === alloc.assetId);
    if (asset) {
      totalApy += asset.blendedApy * (alloc.weight / 100);
    }
  }
  
  return totalApy.toFixed(2);
}
