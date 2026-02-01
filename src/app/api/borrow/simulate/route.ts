import { NextResponse } from 'next/server';
import type { ApiResponse, BorrowSimulation, BorrowSimulateRequest } from '@/types/api';

// Mock position data - in production, fetch from DB
const MOCK_POSITION_DATA = {
  pos_demo_001: {
    totalValueUsd: 125420.50,
    currentApy: 13.52,
    borrowedUsd: 15000,
    borrowCapacityUsd: 62710.25,
  },
};

export async function POST(request: Request) {
  try {
    const body: BorrowSimulateRequest = await request.json();
    const { positionId, borrowAmountUsdc } = body;

    // Get position data (mock)
    const position = MOCK_POSITION_DATA[positionId as keyof typeof MOCK_POSITION_DATA];
    if (!position) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'POSITION_NOT_FOUND',
            message: `Position ${positionId} not found`,
          },
        } as ApiResponse,
        { status: 404 }
      );
    }

    const borrowAmount = parseFloat(borrowAmountUsdc) / 1_000_000; // Convert from micro units
    const totalValue = position.totalValueUsd;
    const currentApy = position.currentApy;
    const currentBorrowed = position.borrowedUsd;
    const maxBorrow = position.borrowCapacityUsd;

    // Validate borrow amount
    const newTotalBorrowed = currentBorrowed + borrowAmount;
    if (newTotalBorrowed > maxBorrow) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INSUFFICIENT_COLLATERAL',
            message: `Cannot borrow $${borrowAmount.toFixed(2)}. Max available: $${(maxBorrow - currentBorrowed).toFixed(2)}`,
          },
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Calculate borrow APR (weighted average of asset borrow rates)
    const borrowApr = 4.8; // Mock weighted average

    // Calculate before/after states
    const dailyEarningsBefore = (totalValue * (currentApy / 100)) / 365;
    const monthlyEarningsBefore = dailyEarningsBefore * 30;
    const yearlyEarningsBefore = totalValue * (currentApy / 100);

    // Health factor calculation
    const healthFactorBefore = currentBorrowed > 0 ? maxBorrow / currentBorrowed : 999;
    const healthFactorAfter = newTotalBorrowed > 0 ? maxBorrow / newTotalBorrowed : 999;

    // After borrowing calculations
    const borrowInterestDaily = (borrowAmount * (borrowApr / 100)) / 365;
    const netDailyEarnings = dailyEarningsBefore - borrowInterestDaily;
    const netMonthlyEarnings = netDailyEarnings * 30;
    const netYearlyEarnings = netDailyEarnings * 365;
    const netApy = currentApy - (borrowAmount / totalValue) * borrowApr;

    // Calculate tradeoff
    const yearlyEarningsReduction = yearlyEarningsBefore - netYearlyEarnings;
    const breakEvenDays = 0; // Not applicable for NeverSell model

    // Generate warnings
    const warnings: { code: string; message: string; severity: 'info' | 'warning' | 'danger' }[] = [];
    if (healthFactorAfter < 1.5) {
      warnings.push({
        code: 'LOW_HEALTH_FACTOR',
        message: `Health factor will be ${healthFactorAfter.toFixed(2)}. Consider borrowing less.`,
        severity: healthFactorAfter < 1.2 ? 'danger' : 'warning',
      });
    }
    if (borrowAmount > totalValue * 0.4) {
      warnings.push({
        code: 'HIGH_UTILIZATION',
        message: 'Borrowing more than 40% of your position value increases risk.',
        severity: 'info',
      });
    }

    const simulation: BorrowSimulation = {
      simulation: {
        before: {
          totalValueUsd: totalValue.toFixed(2),
          currentApy: currentApy.toFixed(1),
          dailyEarnings: dailyEarningsBefore.toFixed(2),
          monthlyEarnings: monthlyEarningsBefore.toFixed(2),
          yearlyEarnings: yearlyEarningsBefore.toFixed(0),
          borrowedUsd: currentBorrowed.toFixed(0),
          healthFactor: healthFactorBefore > 100 ? '999' : healthFactorBefore.toFixed(2),
        },
        after: {
          totalValueUsd: totalValue.toFixed(2),
          grossApy: currentApy.toFixed(1),
          borrowCostApy: borrowApr.toFixed(1),
          netApy: netApy.toFixed(1),
          dailyEarnings: netDailyEarnings.toFixed(2),
          monthlyEarnings: netMonthlyEarnings.toFixed(2),
          yearlyEarnings: netYearlyEarnings.toFixed(0),
          borrowedUsd: newTotalBorrowed.toFixed(0),
          healthFactor: healthFactorAfter.toFixed(2),
        },
        tradeoff: {
          cashYouGet: borrowAmount.toFixed(0),
          earningsReduction: yearlyEarningsReduction.toFixed(0),
          breakEvenDays,
          whyBorrow: [
            'Get cash without selling your crypto',
            'No capital gains tax triggered',
            'Keep 100% of your asset upside',
            'Pay back anytime with no penalties',
          ],
        },
        warnings,
      },
      summary: {
        headline: `You'll earn $${Math.round(netMonthlyEarnings)}/mo instead of $${Math.round(monthlyEarningsBefore)}/mo`,
        subtext: `But you get $${borrowAmount.toLocaleString()} cash without selling`,
        recommendation: borrowAmount < totalValue * 0.3
          ? 'Good for short-term liquidity needs'
          : 'Consider if you really need this much - higher risk',
      },
    };

    const response: ApiResponse<BorrowSimulation> = {
      success: true,
      data: simulation,
      meta: {
        timestamp: Date.now(),
        requestId: crypto.randomUUID(),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Borrow simulation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to simulate borrow',
        },
      } as ApiResponse,
      { status: 500 }
    );
  }
}
