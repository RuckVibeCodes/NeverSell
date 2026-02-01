import { NextResponse } from 'next/server';
import { MOCK_ASSETS, ASSET_PRICES } from '@/lib/mock-data';
import type { ApiResponse, PositionQuote, PositionQuoteRequest } from '@/types/api';

// Preset allocations
const PRESETS = {
  conservative: [
    { assetId: 'wbtc', percentage: '50' },
    { assetId: 'weth', percentage: '30' },
    { assetId: 'usdc', percentage: '20' },
  ],
  balanced: [
    { assetId: 'wbtc', percentage: '35' },
    { assetId: 'weth', percentage: '35' },
    { assetId: 'arb', percentage: '20' },
    { assetId: 'usdc', percentage: '10' },
  ],
  growth: [
    { assetId: 'wbtc', percentage: '25' },
    { assetId: 'weth', percentage: '30' },
    { assetId: 'arb', percentage: '35' },
    { assetId: 'usdc', percentage: '10' },
  ],
};

export async function POST(request: Request) {
  try {
    const body: PositionQuoteRequest = await request.json();
    const { amountUsdc, sourceChain, allocations, preset } = body;

    // Validate input
    const inputAmount = parseFloat(amountUsdc);
    if (isNaN(inputAmount) || inputAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AMOUNT_TOO_LOW',
            message: 'Amount must be greater than 0',
          },
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Get allocations from preset or custom
    const effectiveAllocations = preset ? PRESETS[preset] : allocations;
    if (!effectiveAllocations || effectiveAllocations.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ALLOCATION',
            message: 'Must provide allocations or preset',
          },
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Validate allocations sum to 100
    const totalAllocation = effectiveAllocations.reduce(
      (sum, a) => sum + parseFloat(a.percentage),
      0
    );
    if (Math.abs(totalAllocation - 100) > 0.01) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ALLOCATION',
            message: `Allocations must sum to 100%, got ${totalAllocation}%`,
          },
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Calculate breakdown
    const breakdown = effectiveAllocations.map((alloc) => {
      const asset = MOCK_ASSETS.find((a) => a.id === alloc.assetId);
      if (!asset) {
        throw new Error(`Asset ${alloc.assetId} not found`);
      }

      const percentage = parseFloat(alloc.percentage);
      const usdcAllocated = inputAmount * (percentage / 100);
      const price = ASSET_PRICES[alloc.assetId] || 1;
      const estimatedAmount = usdcAllocated / price;

      // Get APYs
      const aaveSource = asset.yieldSources.find((s) => s.protocol === 'Aave');
      const gmxSource = asset.yieldSources.find((s) => s.protocol === 'GMX');
      const aaveApy = aaveSource?.apy || 1.5;
      const gmxApy = gmxSource?.apy || 18;

      return {
        assetId: alloc.assetId,
        allocation: alloc.percentage,
        usdcAllocated: String(Math.floor(usdcAllocated * 1_000_000)), // 6 decimals
        estimatedAmount: toAssetUnits(estimatedAmount, asset.decimals),
        aaveAmount: toAssetUnits(estimatedAmount * 0.6, asset.decimals), // 60%
        gmxAmount: toAssetUnits(estimatedAmount * 0.4, asset.decimals), // 40%
        aaveApy: String(aaveApy.toFixed(2)),
        gmxApy: String(gmxApy.toFixed(2)),
      };
    });

    // Calculate weighted APY
    const estimatedApy = effectiveAllocations.reduce((sum, alloc) => {
      const asset = MOCK_ASSETS.find((a) => a.id === alloc.assetId);
      if (!asset) return sum;
      return sum + asset.blendedApy * (parseFloat(alloc.percentage) / 100);
    }, 0);

    // Calculate earnings
    const monthlyEarnings = (inputAmount * (estimatedApy / 100)) / 12;

    // Calculate fees (mock)
    const bridgeFee = sourceChain !== 42161 ? Math.floor(inputAmount * 0.001 * 1_000_000) : 0;
    const swapFee = Math.floor(inputAmount * 0.003 * 1_000_000); // 0.3% swap fee
    const protocolFee = 0; // No deposit fee
    const totalFees = bridgeFee + swapFee + protocolFee;

    const quote: PositionQuote = {
      id: `quote_${crypto.randomUUID()}`,
      expiresAt: Date.now() + 60 * 1000, // 60 seconds
      inputAmountUsdc: amountUsdc,
      sourceChain: sourceChain || 42161,
      breakdown,
      estimatedApy: estimatedApy.toFixed(2),
      estimatedMonthlyEarnings: monthlyEarnings.toFixed(2),
      borrowCapacityUsd: (inputAmount * 0.6).toFixed(2), // 60% LTV
      bridgeFee: String(bridgeFee),
      swapFee: String(swapFee),
      protocolFee: String(protocolFee),
      totalFees: String(totalFees),
      estimatedGas: '150000',
      gasPrice: '50000000', // 0.05 gwei
    };

    const response: ApiResponse<{ quote: PositionQuote }> = {
      success: true,
      data: { quote },
      meta: {
        timestamp: Date.now(),
        requestId: crypto.randomUUID(),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Quote error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to generate quote',
        },
      } as ApiResponse,
      { status: 500 }
    );
  }
}

function toAssetUnits(amount: number, decimals: number): string {
  return String(Math.floor(amount * Math.pow(10, decimals)));
}
