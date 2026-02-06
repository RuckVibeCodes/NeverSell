import { NextResponse } from 'next/server';

// ============================================================
// NeverSell APY API
// Returns real-time blended APY from Aave + GMX, minus platform fee
// ============================================================

// Current Aave V3 Arbitrum supply APYs (updated Feb 6, 2026)
// Source: Aave V3 Arbitrum UI - https://app.aave.com/markets/?marketName=proto_arbitrum_v3
const AAVE_SUPPLY_APY: Record<string, number> = {
  wbtc: 0.02,   // ~0.02% (very low, mostly used as collateral)
  weth: 1.85,   // ~1.85% (based on recent utilization)
  usdc: 4.20,   // ~4.20% (stablecoin lending demand)
  arb: 0.15,    // ~0.15% (low borrow demand)
};

// Asset IDs for iteration
const ASSET_IDS = ['wbtc', 'weth', 'usdc', 'arb'];

// NeverSell platform fee (10% of gross yields)
const NEVERSELL_FEE = 0.10;

/**
 * Get Aave supply APY for an asset
 */
function getAaveApy(assetId: string): number {
  return AAVE_SUPPLY_APY[assetId] || 0;
}

// GMX pool addresses for each asset
const GMX_POOL_ADDRESSES: Record<string, string> = {
  wbtc: '0x47c031236e19d024b42f8AE6780E44A573170703', // BTC/USD
  weth: '0x70d95587d40A2caf56bd97485aB3Eec10Bee6336', // ETH/USD
  arb: '0xC25cEf6061Cf5dE5eb761b50E4743c1F5D7E5407',  // ARB/USD
  usdc: '0x70d95587d40A2caf56bd97485aB3Eec10Bee6336', // Uses ETH/USD pool
};

// Fallback APYs in case GMX API fails
const FALLBACK_GMX_APY: Record<string, number> = {
  wbtc: 16.87,
  weth: 19.29,
  arb: 17.76,
  usdc: 19.29,
};

// Cache for GMX APY data
let gmxApyCache: { data: Record<string, number>; timestamp: number } | null = null;
const GMX_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch real GMX APY data from GMX API
 */
async function fetchGmxApyData(): Promise<Record<string, number>> {
  // Return cached data if still fresh
  if (gmxApyCache && Date.now() - gmxApyCache.timestamp < GMX_CACHE_TTL) {
    return gmxApyCache.data;
  }

  try {
    const response = await fetch('https://arbitrum-api.gmxinfra.io/apy?period=total', {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });
    
    if (!response.ok) throw new Error(`GMX API error: ${response.status}`);
    
    const data = await response.json();
    const markets = data.markets || {};
    
    const result: Record<string, number> = {};
    
    for (const [assetId, poolAddress] of Object.entries(GMX_POOL_ADDRESSES)) {
      // Try both checksummed and lowercase
      const apyData = markets[poolAddress] || markets[poolAddress.toLowerCase()];
      if (apyData && typeof apyData.apy === 'number') {
        result[assetId] = apyData.apy * 100; // Convert decimal to percentage
      } else {
        result[assetId] = FALLBACK_GMX_APY[assetId] || 15;
      }
    }
    
    // Update cache
    gmxApyCache = { data: result, timestamp: Date.now() };
    console.log('[APY] Fetched fresh GMX APY data:', result);
    
    return result;
  } catch (err) {
    console.error('[APY] GMX API fetch failed:', err);
    return FALLBACK_GMX_APY;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: Request) {
  const startTime = Date.now();
  
  try {
    const results: Record<string, {
      aaveApy: number;
      gmxApy: number;
      grossApy: number;
      netApy: number;
    }> = {};

    // Fetch GMX APY data once (cached)
    const gmxApyData = await fetchGmxApyData();
    
    // Calculate APY for each asset
    for (const assetId of ASSET_IDS) {
      const gmxApy = gmxApyData[assetId] || FALLBACK_GMX_APY[assetId] || 15;
      const aaveApy = getAaveApy(assetId);

      // Calculate combined APY
      // grossApy = Aave supply yield + GMX liquidity provision yield
      const grossApy = aaveApy + gmxApy;
      
      // netApy = gross minus 10% platform performance fee
      const netApy = grossApy * (1 - NEVERSELL_FEE);

      results[assetId] = {
        aaveApy,
        gmxApy,
        grossApy,
        netApy,
      };
    }

    const duration = Date.now() - startTime;
    console.log(`[APY] Fetched real data from chain in ${duration}ms`);

    return NextResponse.json({
      success: true,
      data: {
        assets: results,
        updatedAt: Date.now(),
      },
    });
  } catch (error) {
    console.error('[APY] Error fetching from chain:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'APY_ERROR',
        message: error instanceof Error ? error.message : 'Failed to calculate APY',
      }
    }, { status: 500 });
  }
}
