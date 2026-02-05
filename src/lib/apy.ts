import { Asset } from '@/types/api';

// Asset prices (will be fetched from on-chain or API)
export const ASSET_PRICES: Record<string, number> = {
  wbtc: 97500,
  weth: 3250,
  arb: 0.85,
  usdc: 1.00,
};

// Aave V3 Pool address on Arbitrum
export const AAVE_POOL_ADDRESS = '0x794a61358d6845594f94dc1db02a252b5b4814ad';

// Asset addresses on Arbitrum
export const ASSET_ADDRESSES: Record<string, string> = {
  wbtc: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
  weth: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
  usdc: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  arb: '0x912CE59144191C1204E64559FE8253a0e49E6548',
};

// NeverSell fee percentage (10%)
export const NEVERSELL_FEE = 0.10;

/**
 * Fetch real APY data from Aave V3
 */
export async function fetchAaveApy(assetAddress: string): Promise<number> {
  try {
    const rpcUrl = process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc';
    const dataProviderAddress = '0x69fa688f1dc47d4b5d8029d5a35fb7a548310654';
    
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
      console.error('Aave RPC error:', result.error);
      return 0;
    }

    // Parse liquidity rate from returned data
    const data = result.result;
    const liquidityRateHex = '0x' + data.slice(64 * 3, 64 * 4);
    const liquidityRate = BigInt(liquidityRateHex);
    
    // Convert to APY: (1 + rate_per_second)^31536000 - 1
    const ratePerSecond = Number(liquidityRate) / 1e27;
    const apy = Math.pow(1 + ratePerSecond, 365 * 24 * 60 * 60) - 1;
    
    return apy * 100;
  } catch (error) {
    console.error('Failed to fetch Aave APY:', error);
    return 0;
  }
}

/**
 * Estimate GMX APY (based on 63% of trading fees)
 * In production, this would come from GMX analytics API
 */
export function estimateGmxApy(assetId: string): number {
  // These are estimates based on typical GMX performance
  // Real APY varies daily based on trading volume
  const estimates: Record<string, number> = {
    wbtc: 12.0,
    weth: 15.0,
    arb: 18.0,
    usdc: 5.0,
  };
  return estimates[assetId] || 10.0;
}

/**
 * Calculate net APY after NeverSell fee
 */
export function calculateNetApy(
  assetId: string,
  aaveApy: number,
  gmxApy: number
): { grossApy: number; netApy: number; aaveWeight: number; gmxWeight: number } {
  // Weight distribution
  const isStablecoin = assetId === 'usdc';
  const weights = isStablecoin 
    ? { aave: 0.50, gmx: 0.20 } // USDC: 50% Aave, 20% GMX, 30% other (compound, etc.)
    : { aave: 0.40, gmx: 0.60 }; // Crypto: 40% Aave, 60% GMX

  // Calculate gross APY
  const grossApy = (aaveApy * weights.aave) + (gmxApy * weights.gmx);
  
  // Apply NeverSell fee
  const netApy = grossApy * (1 - NEVERSELL_FEE);
  
  return { grossApy, netApy, aaveWeight: weights.aave, gmxWeight: weights.gmx };
}

/**
 * Generate real APY data for all assets
 */
export async function getRealApyData(): Promise<Record<string, {
  aaveApy: number;
  gmxApy: number;
  grossApy: number;
  netApy: number;
}>> {
  const result: Record<string, any> = {};
  
  for (const [assetId, address] of Object.entries(ASSET_ADDRESSES)) {
    // Fetch real Aave APY
    const aaveApy = await fetchAaveApy(address);
    
    // Estimate GMX APY
    const gmxApy = estimateGmxApy(assetId);
    
    // Calculate net APY
    const { grossApy, netApy } = calculateNetApy(assetId, aaveApy, gmxApy);
    
    result[assetId] = {
      aaveApy: Number(aaveApy.toFixed(2)),
      gmxApy,
      grossApy: Number(grossApy.toFixed(2)),
      netApy: Number(netApy.toFixed(2)),
    };
  }
  
  return result;
}

/**
 * Get mock assets with APY data (for development/demo)
 */
export function getMockAssets(): Asset[] {
  return [
    {
      id: 'wbtc',
      symbol: 'WBTC',
      name: 'Wrapped Bitcoin',
      address: ASSET_ADDRESSES.wbtc,
      decimals: 8,
      logoUrl: '/assets/wbtc.svg',
      aaveSupported: true,
      gmxPoolAddress: '0x70E95D7a09D4e584b97c5F38f5a04C8fC74E21c6',
    },
    {
      id: 'weth',
      symbol: 'WETH',
      name: 'Wrapped Ether',
      address: ASSET_ADDRESSES.weth,
      decimals: 18,
      logoUrl: '/assets/weth.svg',
      aaveSupported: true,
      gmxPoolAddress: '0x70E95D7a09D4e584b97c5F38f5a04C8fC74E21c6',
    },
    {
      id: 'arb',
      symbol: 'ARB',
      name: 'Arbitrum',
      address: ASSET_ADDRESSES.arb,
      decimals: 18,
      logoUrl: '/assets/arb.svg',
      aaveSupported: true,
      gmxPoolAddress: '0x70E95D7a09D4e584b97c5F38f5a04C8fC74E21c6',
    },
    {
      id: 'usdc',
      symbol: 'USDC',
      name: 'USD Coin',
      address: ASSET_ADDRESSES.usdc,
      decimals: 6,
      logoUrl: '/assets/usdc.svg',
      aaveSupported: true,
      gmxPoolAddress: '0x70E95D7a09D4e584b97c5F38f5a04C8fC74E21c6',
    },
  ];
}
