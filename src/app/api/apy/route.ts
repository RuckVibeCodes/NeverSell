import { NextResponse } from 'next/server';

// Aave Protocol Data Provider addresses
const AAVE_DATA_PROVIDER_ADDRESSES: Record<number, string> = {
  42161: '0x69fa688f1dc47d4b5d8029d5a35fb7a548310654', // Arbitrum
  1: '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9', // Ethereum
  137: '0x69fa688f1dc47d4b5d8029d5a35fb7a548310654', // Polygon
};

// Public RPC URLs (no API key needed for low traffic)
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
  
  if (!rpcUrl) {
    throw new Error(`No RPC URL for chain ${chainId}`);
  }
  if (!dataProviderAddress) {
    throw new Error(`Unsupported chain: ${chainId}`);
  }

  // Function selector for getReserveData
  const methodId = '0x35ea6a75';
  
  try {
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
    
    if (result.error) {
      throw new Error(`RPC error: ${result.error.message}`);
    }

    if (!result.result || result.result === '0x') {
      throw new Error('Empty response from RPC');
    }

    // Parse the returned data
    // getReserveData returns: [availableLiquidity, totalStableDebt, totalVariableDebt, liquidityRate, stableBorrowRate, variableBorrowRate, lastUpdateTimestamp, ...]
    const data = result.result as string;
    const liquidityRateHex = '0x' + data.slice(64 * 3, 64 * 4); // 4th field (0-indexed)
    const liquidityRate = BigInt(liquidityRateHex);
    
    return liquidityRateToApy(liquidityRate);
  } catch (err) {
    throw new Error(`Failed to fetch Aave APY: ${err}`);
  }
}

/**
 * Estimate GMX APY based on typical performance
 */
function estimateGmxApy(assetSymbol: string): number {
  const baseApy: Record<string, number> = {
    wbtc: 12.0,
    weth: 15.0,
    arb: 18.0,
    usdc: 5.0,
  };
  return baseApy[assetSymbol] || 10.0;
}

/**
 * Fallback APY when on-chain fetch fails
 */
function getFallbackApy(assetId: string): { aave: number; gmx: number } {
  const fallbacks: Record<string, { aave: number; gmx: number }> = {
    wbtc: { aave: 1.5, gmx: 12.0 },
    weth: { aave: 2.5, gmx: 15.0 },
    usdc: { aave: 5.0, gmx: 5.0 },
    arb: { aave: 3.0, gmx: 18.0 },
  };
  return fallbacks[assetId] || { aave: 2.0, gmx: 10.0 };
}

export async function GET(request: Request) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const chainId = parseInt(searchParams.get('chainId') || '42161');
    const assetId = searchParams.get('asset');

    // Asset configurations
    const assets = assetId 
      ? [{ id: assetId, address: ASSET_ADDRESSES[assetId] }].filter(a => a.address)
      : Object.entries(ASSET_ADDRESSES).map(([id, address]) => ({ id, address }));

    const results: Record<string, {
      aaveApy: number;
      gmxApy: number;
      rawAaveApy: number;
      rawGmxApy: number;
      grossApy: number;
      netApy: number;
    }> = {};

    for (const asset of assets) {
      // Get real Aave APY
      let aaveApy = 0;
      
      try {
        aaveApy = await getAaveApy(chainId, asset.address);
      } catch {
        // eslint-disable-next-line no-console
        console.warn(`[APY] Failed to fetch ${asset.id} from chain, using fallback`);
        const fallback = getFallbackApy(asset.id);
        aaveApy = fallback.aave;
      }

      // Estimate GMX APY
      const rawGmxApy = estimateGmxApy(asset.id);
      const gmxApy = rawGmxApy;

      // Calculate weighted APY
      const isStablecoin = asset.id === 'usdc';
      const weights = isStablecoin 
        ? { aave: 0.50, gmx: 0.20 }
        : { aave: 0.40, gmx: 0.60 };

      const grossApy = (aaveApy * weights.aave) + (gmxApy * weights.gmx);
      const netApy = grossApy * (1 - NEVERSELL_FEE);

      results[asset.id] = {
        aaveApy: Number(aaveApy.toFixed(2)),
        gmxApy,
        rawAaveApy: aaveApy,
        rawGmxApy: rawGmxApy,
        grossApy: Number(grossApy.toFixed(2)),
        netApy: Number(netApy.toFixed(2)),
      };
    }

    const duration = Date.now() - startTime;
    console.log(`[APY] Generated in ${duration}ms`);

    return NextResponse.json({
      success: true,
      data: {
        assets: results,
        fee: NEVERSELL_FEE * 100,
        updatedAt: Date.now(),
      },
    });
  } catch (error) {
    console.error('[APY] Error:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'APY_ERROR',
        message: error instanceof Error ? error.message : 'Failed to calculate APY',
      }
    }, { status: 500 });
  }
}
