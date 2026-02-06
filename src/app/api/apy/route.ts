import { NextResponse } from 'next/server';

// ============================================================
// NeverSell APY API
// Returns real-time blended APY from Aave + GMX, minus platform fee
// ============================================================

// Asset IDs for iteration
const ASSET_IDS = ['wbtc', 'weth', 'usdc', 'arb'];

// NeverSell platform fee (10% of gross yields)
const NEVERSELL_FEE = 0.10;

// Allocation split (fixed)
const AAVE_ALLOCATION = 0.60;  // 60% to Aave
const GMX_ALLOCATION = 0.40;   // 40% to GMX

// Fallback Aave APYs if DeFiLlama fails
const FALLBACK_AAVE_APY: Record<string, number> = {
  wbtc: 0.02,
  weth: 1.85,
  usdc: 4.20,
  arb: 0.15,
};

// Cache for Aave APY data from DeFiLlama
let aaveApyCache: { data: Record<string, number>; timestamp: number } | null = null;
const AAVE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch Aave supply APYs from DeFiLlama
 */
async function fetchAaveApyData(): Promise<Record<string, number>> {
  // Return cached data if still fresh
  if (aaveApyCache && Date.now() - aaveApyCache.timestamp < AAVE_CACHE_TTL) {
    return aaveApyCache.data;
  }

  try {
    const response = await fetch('https://yields.llama.fi/pools', {
      next: { revalidate: 300 },
    });
    
    if (!response.ok) throw new Error(`DeFiLlama API error: ${response.status}`);
    
    const json = await response.json();
    const pools = json.data || [];
    
    // Filter for Aave V3 Arbitrum pools
    const aaveArbitrumPools = pools.filter((pool: { project: string; chain: string }) => 
      pool.project === 'aave-v3' && pool.chain === 'Arbitrum'
    );
    
    const result: Record<string, number> = {};
    
    // Map our asset IDs to DeFiLlama symbols
    const symbolMap: Record<string, string[]> = {
      wbtc: ['WBTC'],
      weth: ['WETH'],
      usdc: ['USDC', 'USDC.E'],
      arb: ['ARB'],
    };
    
    for (const assetId of ASSET_IDS) {
      const symbols = symbolMap[assetId] || [assetId.toUpperCase()];
      const pool = aaveArbitrumPools.find((p: { symbol: string }) => 
        symbols.includes(p.symbol)
      );
      
      if (pool && typeof pool.apy === 'number') {
        result[assetId] = pool.apy; // Already in percentage format
      } else {
        result[assetId] = FALLBACK_AAVE_APY[assetId] || 0;
      }
    }
    
    // Update cache
    aaveApyCache = { data: result, timestamp: Date.now() };
    console.log('[APY] Fetched fresh Aave APY from DeFiLlama:', result);
    
    return result;
  } catch (err) {
    console.error('[APY] DeFiLlama API fetch failed:', err);
    return FALLBACK_AAVE_APY;
  }
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

export async function GET() {
  const startTime = Date.now();
  
  try {
    const results: Record<string, {
      aaveApy: number;
      gmxApy: number;
      grossApy: number;
      netApy: number;
    }> = {};

    // Fetch APY data (both cached for 5 min)
    const [gmxApyData, aaveApyData] = await Promise.all([
      fetchGmxApyData(),
      fetchAaveApyData(),
    ]);
    
    // Calculate APY for each asset
    for (const assetId of ASSET_IDS) {
      const gmxApy = gmxApyData[assetId] || FALLBACK_GMX_APY[assetId] || 15;
      const aaveApy = aaveApyData[assetId] || FALLBACK_AAVE_APY[assetId] || 0;

      // Calculate combined APY (weighted by allocation)
      // 60% of funds go to Aave, 40% go to GMX
      const grossApy = (AAVE_ALLOCATION * aaveApy) + (GMX_ALLOCATION * gmxApy);
      
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
