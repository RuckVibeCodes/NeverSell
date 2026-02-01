import { NextResponse } from 'next/server';
import { MOCK_ASSETS, ASSET_PRICES } from '@/lib/mock-data';
import type { ApiResponse, Asset, Address } from '@/types/api';

export async function GET() {
  const assets: Asset[] = MOCK_ASSETS.map((asset) => ({
    id: asset.id,
    symbol: asset.symbol,
    name: asset.name,
    address: asset.address as Address,
    decimals: asset.decimals,
    iconUrl: asset.logoUrl,
    priceUsd: String(ASSET_PRICES[asset.id] || 0),
    aaveSupported: true,
    gmxPoolAddress: getGmxPoolAddress(asset.id),
  }));

  const response: ApiResponse<{ assets: Asset[] }> = {
    success: true,
    data: { assets },
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
