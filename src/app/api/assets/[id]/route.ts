import { NextResponse } from 'next/server';
import { MOCK_ASSETS, ASSET_PRICES } from '@/lib/mock-data';
import type { ApiResponse, AssetWithPricing, Address } from '@/types/api';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const asset = MOCK_ASSETS.find((a) => a.id === id);

  if (!asset) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'ASSET_NOT_SUPPORTED',
          message: `Asset '${id}' not found`,
        },
      } as ApiResponse,
      { status: 404 }
    );
  }

  // Calculate APYs from yield sources
  const aaveSource = asset.yieldSources.find((s) => s.protocol === 'Aave');
  const gmxSource = asset.yieldSources.find((s) => s.protocol === 'GMX');
  
  // 60/40 split: 60% Aave, 40% GMX
  const aaveApy = aaveSource?.apy || 0;
  const gmxApy = gmxSource?.apy || 0;
  const blendedApy = (aaveApy * 0.6) + (gmxApy * 0.4);

  const response: ApiResponse<{ asset: AssetWithPricing }> = {
    success: true,
    data: {
      asset: {
        id: asset.id,
        symbol: asset.symbol,
        name: asset.name,
        address: asset.address as Address,
        decimals: asset.decimals,
        iconUrl: asset.iconUrl,
        priceUsd: String(ASSET_PRICES[asset.id] || 0),
        aaveSupported: true,
        gmxPoolAddress: getGmxPoolAddress(asset.id),
        pricing: {
          priceUsd: String(ASSET_PRICES[asset.id] || 0),
          change24h: getRandomChange(),
          aaveApy: String(aaveApy.toFixed(2)),
          gmxApy: String(gmxApy.toFixed(2)),
          blendedApy: String(blendedApy.toFixed(2)),
        },
      },
    },
    meta: {
      timestamp: Date.now(),
      requestId: crypto.randomUUID(),
    },
  };

  return NextResponse.json(response);
}

function getGmxPoolAddress(assetId: string): Address | undefined {
  const pools: Record<string, Address> = {
    wbtc: '0x47c031236e19d024b42f8AE6780E44A573170703',
    weth: '0x70d95587d40A2caf56bd97485aB3Eec10Bee6336',
    arb: '0xC25cEf6061Cf5dE5eb761b50E4743c1F5D7E5407',
  };
  return pools[assetId];
}

function getRandomChange(): string {
  const change = (Math.random() - 0.5) * 10; // -5% to +5%
  return change.toFixed(2);
}
