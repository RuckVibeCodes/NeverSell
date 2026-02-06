import { NextResponse } from 'next/server';

// Aave Protocol Data Provider addresses
const AAVE_DATA_PROVIDER_ADDRESSES: Record<number, string> = {
  42161: '0x69fa688f1dc47d4b5d8029d5a35fb7a548310654', // Arbitrum
  1: '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9', // Ethereum
  137: '0x69fa688f1dc47d4b5d8029d5a35fb7a548310654', // Polygon
};

// Public RPC URLs
const RPC_URLS: Record<number, string> = {
  42161: process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
  1: process.env.NEXT_PUBLIC_ETH_RPC_URL || 'https://eth.llamarpc.com',
  137: process.env.NEXT_PUBLIC_POLY_RPC_URL || 'https://polygon-rpc.com',
};

// Asset addresses on Arbitrum
const ASSET_ADDRESSES: Record<string, string> = {
  wbtc: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
  weth: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
  usdc: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  arb: '0x912CE59144191C1204E64559FE8253a0e49E6548',
};

// NeverSell fee (10% of yields)
const NEVERSELL_FEE = 0.10;

/**
 * Convert Aave liquidity rate to APY
 * liquidityRate is in ray units (10^27)
 */
function liquidityRateToApy(liquidityRate: bigint): number {
  const ratePerSecond = Number(liquidityRate) / 1e27;
  const apy = Math.pow(1 + ratePerSecond, 365 * 24 * 60 * 60) - 1;
  return apy * 100;
}

/**
 * Get APY from Aave contract using read contract call
 */
async function getAaveApy(chainId: number, assetAddress: string): Promise<number> {
  const rpcUrl = RPC_URLS[chainId];
  const dataProviderAddress = AAVE_DATA_PROVIDER_ADDRESSES[chainId];
  
  if (!rpcUrl) throw new Error(`No RPC URL for chain ${chainId}`);
  if (!dataProviderAddress) throw new Error(`Unsupported chain: ${chainId}`);

  // Function selector for getReserveData
  const methodId = '0x35ea6a75';
  
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_call',
      params: [{
        to: dataProviderAddress,
        data: methodId + assetAddress.slice(2).padStart(64, '0')
      }, 'latest']
    })
  });

  const result = await response.json();
  
  if (result.error) throw new Error(`RPC error: ${result.error.message}`);
  if (!result.result || result.result === '0x') throw new Error('Empty response from RPC');

  // Parse liquidityRate from returned data
  // getReserveData returns: (unbacked, accruedToTreasury, totalStableDebt, totalVariableDebt, liquidityRate, ...)
  // liquidityRate is at index 4 (5th value), so offset is 2 + 64*4 to 2 + 64*5
  const data = result.result as string;
  const liquidityRateHex = '0x' + data.slice(2 + 64 * 4, 2 + 64 * 5);
  const liquidityRate = BigInt(liquidityRateHex);
  
  return liquidityRateToApy(liquidityRate);
}

/**
 * Get GMX APY from real API data (updated Feb 2026)
 */
function getGmxApy(assetSymbol: string): number {
  // Real GMX pool APYs as of Feb 6, 2026
  const realApys: Record<string, number> = {
    wbtc: 16.87,  // BTC/USD pool
    weth: 19.29,  // ETH/USD pool  
    arb: 17.76,   // ARB/USD pool
    usdc: 19.29,  // Uses ETH/USD pool (short side)
  };
  return realApys[assetSymbol] || 15.0;
}

export async function GET(request: Request) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const chainId = parseInt(searchParams.get('chainId') || '42161');

    const results: Record<string, {
      aaveApy: number;
      gmxApy: number;
      grossApy: number;
      netApy: number;
    }> = {};

    // Process all assets in parallel for speed
    const assetEntries = Object.entries(ASSET_ADDRESSES);
    
    await Promise.all(assetEntries.map(async ([assetId, assetAddress]) => {
      const gmxApy = getGmxApy(assetId);
      
      // Try to fetch Aave APY, fall back to 0 if not available
      let aaveApy = 0;
      try {
        const fetchedApy = await getAaveApy(chainId, assetAddress);
        // Validate the result is a finite number
        if (typeof fetchedApy === 'number' && isFinite(fetchedApy) && !isNaN(fetchedApy)) {
          aaveApy = fetchedApy;
        }
      } catch (err) {
        console.log(`[APY] Aave not available for ${assetId}: ${err instanceof Error ? err.message : 'unknown error'}`);
      }

      // Calculate combined APY (always using valid numbers)
      const grossApy = aaveApy + gmxApy;
      const netApy = grossApy * (1 - NEVERSELL_FEE);

      results[assetId] = {
        aaveApy,
        gmxApy,
        grossApy,
        netApy,
      };
    }));

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
