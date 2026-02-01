// GMX APY Calculation Utilities
// Calculates fee APY and performance APY from on-chain/API data

import type { MarketInfo } from '@/hooks/useGMXMarketsInfo';

// GMX uses 30 decimal precision for rates
const SECONDS_PER_YEAR = BigInt(31536000); // 365 days
// 10^28 as a BigInt (can't use ** operator with older ES targets)
const PRECISION_DIVISOR = BigInt('10000000000000000000000000000');

/**
 * Convert a bigint rate (per second) to annualized percentage
 * GMX rates are in 30 decimal precision per second
 */
export function annualizeRate(ratePerSecond: bigint): number {
  if (ratePerSecond === BigInt(0)) return 0;
  
  // Rate per year = rate per second * seconds per year
  const annualRate = ratePerSecond * SECONDS_PER_YEAR;
  
  // Convert to percentage (divide by 10^30, multiply by 100)
  // Result: (annualRate / 10^30) * 100 = annualRate / 10^28
  const percentage = Number(annualRate) / Number(PRECISION_DIVISOR);
  
  return Math.round(percentage * 100) / 100; // Round to 2 decimals
}

/**
 * Parse rate string from REST API (e.g., "-730557226476303949502531000946")
 * Returns annualized percentage
 */
export function parseRateString(rateStr: string | undefined): number {
  if (!rateStr) return 0;
  
  try {
    const rateBigInt = BigInt(rateStr);
    return annualizeRate(rateBigInt);
  } catch {
    return 0;
  }
}

/**
 * Calculate the borrowing APY for a market
 * Borrowers pay this rate to the pool
 */
export function calculateBorrowingApy(market: MarketInfo): {
  long: number;
  short: number;
} {
  const longApy = parseRateString(market.borrowingRateLong);
  const shortApy = parseRateString(market.borrowingRateShort);
  
  return {
    long: Math.abs(longApy),
    short: Math.abs(shortApy),
  };
}

/**
 * Calculate the funding APY for a market
 * One side pays, other side receives
 */
export function calculateFundingApy(market: MarketInfo): {
  long: number;
  short: number;
} {
  return {
    long: parseRateString(market.fundingRateLong),
    short: parseRateString(market.fundingRateShort),
  };
}

/**
 * Calculate net rate for liquidity providers
 * This is what GM token holders effectively earn
 */
export function calculateNetRate(market: MarketInfo): {
  long: number;
  short: number;
} {
  return {
    long: parseRateString(market.netRateLong),
    short: parseRateString(market.netRateShort),
  };
}

/**
 * Calculate the fee APY for a GM pool
 * This is derived from trading fees, borrowing fees paid to pool, etc.
 * 
 * Fee APY comes from:
 * 1. Trading fees (swap fees, position fees)
 * 2. Borrowing fees from traders
 * 3. Funding fees (when applicable)
 */
export function calculateFeeApy(market: MarketInfo): number {
  // The net rate represents the combined effect of all fees
  // For GM pools, we use the average of long and short net rates
  // (since GM tokens represent both sides of the pool)
  
  const netRates = calculateNetRate(market);
  
  // Take the better rate (more positive) as the fee APY base
  // GM token holders benefit from the side that pays more fees
  const avgNetRate = (netRates.long + netRates.short) / 2;
  
  // Borrowing fees also contribute to LP yield
  const borrowingRates = calculateBorrowingApy(market);
  const avgBorrowingRate = (borrowingRates.long + borrowingRates.short) / 2;
  
  // The fee APY is approximately the borrowing rate + positive net rate components
  // This is a simplified model - actual APY depends on pool composition and utilization
  const feeApy = Math.max(0, avgBorrowingRate + Math.max(0, avgNetRate));
  
  return Math.round(feeApy * 100) / 100;
}

/**
 * Calculate performance APY (GM token price appreciation)
 * This requires historical price data - for now we estimate based on pool metrics
 */
export function calculatePerformanceApy(
  market: MarketInfo,
  // Optional: historical GM token prices for accurate calculation
  historicalPrices?: { timestamp: number; price: number }[]
): number {
  // If we have historical prices, calculate actual performance
  if (historicalPrices && historicalPrices.length >= 2) {
    const oldest = historicalPrices[0];
    const newest = historicalPrices[historicalPrices.length - 1];
    
    const timeDiffDays = (newest.timestamp - oldest.timestamp) / (24 * 60 * 60 * 1000);
    if (timeDiffDays > 0) {
      const priceChange = (newest.price - oldest.price) / oldest.price;
      const annualizedReturn = (priceChange / timeDiffDays) * 365 * 100;
      return Math.round(annualizedReturn * 100) / 100;
    }
  }
  
  // Estimate based on pool value growth indicators
  // This is a rough estimate - actual performance varies
  const poolValue = market.poolValueMin > BigInt(0) 
    ? Number(market.poolValueMin) / 1e30 
    : 0;
  
  // Larger pools tend to have more stable but lower performance APY
  // Smaller pools can have higher volatility
  if (poolValue > 100_000_000) {
    return 3.0; // Large pools: ~3% estimated performance
  } else if (poolValue > 10_000_000) {
    return 5.0; // Medium pools: ~5% estimated performance
  } else if (poolValue > 1_000_000) {
    return 7.0; // Smaller pools: ~7% estimated performance
  }
  
  return 4.0; // Default estimate
}

/**
 * Calculate total APY for a GM pool
 * Total = Fee APY + Performance APY
 */
export function calculateTotalApy(
  market: MarketInfo,
  historicalPrices?: { timestamp: number; price: number }[]
): {
  feeApy: number;
  performanceApy: number;
  totalApy: number;
} {
  const feeApy = calculateFeeApy(market);
  const performanceApy = calculatePerformanceApy(market, historicalPrices);
  const totalApy = feeApy + performanceApy;
  
  return {
    feeApy: Math.round(feeApy * 100) / 100,
    performanceApy: Math.round(performanceApy * 100) / 100,
    totalApy: Math.round(totalApy * 100) / 100,
  };
}

/**
 * Get TVL in USD from pool value
 */
export function getPoolTvlUsd(market: MarketInfo): number {
  // Pool value is in 30 decimal precision USD
  const poolValue = market.poolValueMax || market.poolValueMin;
  if (!poolValue || poolValue === BigInt(0)) return 0;
  
  return Number(poolValue) / 1e30;
}

/**
 * Format APY for display
 */
export function formatApy(apy: number): string {
  if (apy >= 100) {
    return `${apy.toFixed(0)}%`;
  } else if (apy >= 10) {
    return `${apy.toFixed(1)}%`;
  } else {
    return `${apy.toFixed(2)}%`;
  }
}

/**
 * Get APY color class based on value
 */
export function getApyColorClass(apy: number): string {
  if (apy >= 25) return 'text-green-400';
  if (apy >= 15) return 'text-lime-400';
  if (apy >= 10) return 'text-yellow-400';
  if (apy >= 5) return 'text-orange-400';
  return 'text-white/60';
}
