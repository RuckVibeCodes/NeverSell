import { NextResponse } from 'next/server';

// Aave V3 Pool addresses
const AAVE_POOL_ADDRESSES: Record<number, string> = {
  42161: '0x794a61358d6845594f94dc1db02a252b5b4814ad', // Arbitrum
  1: '0x87870Bca3F5f39fAf3580fedor1d09b5C0312E04', // Ethereum
  137: '0x794a61358d6845594f94dc1db02a252b5b4814ad', // Polygon
};

// Aave Protocol Data Provider addresses
const AAVE_DATA_PROVIDER_ADDRESSES: Record<number, string> = {
  42161: '0x69fa688f1dc47d4b5d8029d5a35fb7a548310654', // Arbitrum
  1: '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9', // Ethereum
  137: '0x69fa688f1dc47d4b5d8029d5a35fb7a548310654', // Polygon
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
  const rpcUrl = process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc';
  
  const dataProviderAddress = AAVE_DATA_PROVIDER_ADDRESSES[chainId];
  if (!dataProviderAddress) {
    throw new Error(`Unsupported chain: ${chainId}`);
  }

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
  
  if (result.error) {
    throw new Error(`RPC error: ${result.error.message}`);
  }

  // Parse the returned data
  // getReserveData returns: [availableLiquidity, totalStableDebt, totalVariableDebt, liquidityRate, stableBorrowRate, variableBorrowRate, lastUpdateTimestamp, ...]
  const data = result.result;
  const liquidityRateHex = '0x' + data.slice(64 * 3, 64 * 4); // 4th field (0-indexed)
  const liquidityRate = BigInt(liquidityRateHex);
  
  return liquidityRateToApy(liquidityRate);
}

/**
 * Estimate GMX APY based on 63% of trading fees
 * This is an estimate - real GMX APY varies daily
 */
function estimateGmxApy(assetSymbol: string): number {
  // Base estimates based on typical GMX performance
  const baseApy: Record<string, number> = {
    wbtc: 12.0,
    weth: 15.0,
    arb: 18.0,
    usdc: 5.0,
  };
  
  return baseApy[assetSymbol] || 10.0;
}

export async function GET(request: Request) {
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
      } catch (err) {
        console.error(`Failed to fetch Aave APY for ${asset.id}:`, err);
        // Fallback to estimate
        const estimates: Record<string, number> = {
          wbtc: 1.5,
          weth: 2.5,
          usdc: 5.0,
          arb: 3.0,
        };
        aaveApy = estimates[asset.id] || 2.0;
      }

      // Estimate GMX APY (63% of trading fees)
      // In production, this would come from GMX analytics API
      const rawGmxApy = estimateGmxApy(asset.id);
      const gmxApy = rawGmxApy;

      // Calculate weighted APY (60% GMX, 40% Aave for crypto assets)
      const isStablecoin = asset.id === 'usdc';
      const weights = isStablecoin 
        ? { aave: 0.50, gmx: 0.20 } // USDC: 50% Aave, 20% GMX, 30% other
        : { aave: 0.40, gmx: 0.60 }; // Crypto: 40% Aave, 60% GMX

      // Calculate gross APY (what the protocol earns)
      const grossApy = (aaveApy * weights.aave) + (gmxApy * weights.gmx);

      // Calculate net APY (what user sees, after NeverSell fee)
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

    return NextResponse.json({
      success: true,
      data: {
        assets: results,
        fee: NEVERSELL_FEE * 100,
        updatedAt: Date.now(),
      },
      meta: {
        timestamp: Date.now(),
        requestId: crypto.randomUUID(),
      }
    });
  } catch (error) {
    console.error('APY calculation error:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'APY_ERROR',
        message: error instanceof Error ? error.message : 'Failed to calculate APY',
      }
    }, { status: 500 });
  }
}
