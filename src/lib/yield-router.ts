/**
 * NeverSell Yield Router Algorithm
 * 
 * Core algorithm that finds the best yield opportunities across:
 * - Beefy Finance vaults
 * - GMX pools
 * - Aave lending
 * - Social/Copy portfolios
 */

import type { BeefyVaultWithStats } from './beefy';
import type { BeefyChain } from './beefy';

export type YieldSource = 'beefy' | 'gmx' | 'aave' | 'social';

export interface YieldOpportunity {
  id: string;
  source: YieldSource;
  chain: BeefyChain;
  protocol: string;
  name: string;
  
  // Token info
  token: string;
  tokens: string[];
  
  // Yield info
  apy: number;
  apr: number; // Without compounding
  tvl: number;
  
  // Risk
  riskScore: 'low' | 'medium' | 'high';
  riskFactors: string[];
  
  // Metadata
  depositToken: string;
  vaultAddress?: string;
  poolAddress?: string;
  lendingPool?: string;
  socialPortfolio?: string;
  
  // For sorting/display
  score: number; // Weighted score
}

export interface YieldRouterConfig {
  // Filters
  chains?: BeefyChain[];
  minApy?: number;
  maxRisk?: 'low' | 'medium' | 'high';
  minTvl?: number;
  excludeSources?: YieldSource[];
  
  // Strategy
  riskTolerance: 'low' | 'medium' | 'high'; // Affects scoring
  
  // Allocation
  maxAllocation?: number; // For diversification
}

export interface AllocationResult {
  opportunities: YieldOpportunity[];
  totalApy: number;
  weightedApy: number;
  diversificationScore: number;
  riskScore: number;
}

/**
 * Calculate yield score based on APY, TVL, and risk
 */
function calculateYieldScore(
  opportunity: YieldOpportunity,
  riskTolerance: 'low' | 'medium' | 'high'
): number {
  // Base score from APY (higher is better)
  const apyScore = Math.min(opportunity.apy / 100, 1) * 40; // Max 40 points
  
  // TVL score (higher TVL = more liquid = safer)
  const tvlScore = Math.min(Math.log10(opportunity.tvl + 1) / 7, 1) * 30; // Max 30 points
  
  // Risk penalty
  const riskPenalty = {
    low: 0,
    medium: 15,
    high: 30,
  }[opportunity.riskScore];
  
  // Risk tolerance multiplier
  const riskMultiplier = {
    low: 1.5, // Low tolerance values low risk more
    medium: 1,
    high: 0.8, // High tolerance can accept more risk
  }[riskTolerance];
  
  // Score adjustments
  let adjustedScore = (apyScore + tvlScore - riskPenalty) * riskMultiplier;
  
  // Boost for certain sources
  if (opportunity.source === 'social') {
    // Copy trading gets a slight boost for innovation
    adjustedScore *= 1.1;
  }
  
  // Penalty for very new opportunities
  if (opportunity.tvl < 10000) {
    adjustedScore *= 0.8;
  }
  
  return Math.max(0, adjustedScore);
}

/**
 * Main yield router - find best opportunities
 */
export async function findBestYields(
  vaults: BeefyVaultWithStats[],
  config: YieldRouterConfig
): Promise<YieldOpportunity[]> {
  // Convert Beefy vaults to opportunities
  const opportunities: YieldOpportunity[] = vaults.map(vault => ({
    id: vault.id,
    source: 'beefy',
    chain: vault.chain,
    protocol: vault.platformId,
    name: vault.name,
    token: vault.token,
    tokens: vault.assets,
    apy: vault.apy,
    apr: vault.apyBreakdown?.vaultApr || vault.apy * 0.8,
    tvl: vault.tvl,
    riskScore: vault.riskScore,
    riskFactors: vault.risks,
    depositToken: vault.token,
    vaultAddress: vault.earnContractAddress,
    score: 0, // Will be calculated
  }));
  
  // Apply filters
  const filtered = opportunities.filter(opp => {
    // Chain filter
    if (config.chains?.length && !config.chains.includes(opp.chain)) {
      return false;
    }
    
    // APY filter
    if (config.minApy && opp.apy < config.minApy) {
      return false;
    }
    
    // Risk filter
    if (config.maxRisk) {
      const riskOrder = { low: 1, medium: 2, high: 3 };
      if (riskOrder[opp.riskScore] > riskOrder[config.maxRisk]) {
        return false;
      }
    }
    
    // TVL filter
    if (config.minTvl && opp.tvl < config.minTvl) {
      return false;
    }
    
    // Exclude sources
    if (config.excludeSources?.includes(opp.source)) {
      return false;
    }
    
    return true;
  });
  
  // Calculate scores
  const scored = filtered.map(opp => ({
    ...opp,
    score: calculateYieldScore(opp, config.riskTolerance),
  }));
  
  // Sort by score
  scored.sort((a, b) => b.score - a.score);
  
  return scored;
}

/**
 * Auto-allocate deposits across multiple opportunities
 */
export function allocateDeposits(
  opportunities: YieldOpportunity[],
  totalAmount: number,
  maxPositions: number = 5,
  _config: YieldRouterConfig
): AllocationResult {
  // Note: config will be used for risk tolerance adjustments in future iterations
  if (opportunities.length === 0 || totalAmount <= 0) {
    return {
      opportunities: [],
      totalApy: 0,
      weightedApy: 0,
      diversificationScore: 0,
      riskScore: 2,
    };
  }
  
  // Select top opportunities with diversification
  const selected: YieldOpportunity[] = [];
  const chainCount: Record<string, number> = {};
  
  for (const opp of opportunities) {
    if (selected.length >= maxPositions) break;
    
    // Check chain diversification (max 50% in one chain)
    const chainKey = opp.chain;
    const chainAllocation = chainCount[chainKey] || 0;
    if (chainAllocation >= totalAmount * 0.5) continue;
    
    // Check risk diversification (max 30% in high risk)
    if (opp.riskScore === 'high') {
      const highRiskAlloc = selected
        .filter(o => o.riskScore === 'high')
        .reduce((sum, o) => sum + getAllocationAmount(o, totalAmount, selected.length), 0);
      if (highRiskAlloc >= totalAmount * 0.3) continue;
    }
    
    selected.push(opp);
    chainCount[chainKey] = (chainCount[chainKey] || 0) + getAllocationAmount(opp, totalAmount, selected.length);
  }
  
  // Calculate allocation percentages
  const allocations = selected.map(opp => ({
    ...opp,
    allocationPercent: getAllocationAmount(opp, totalAmount, selected.length) / totalAmount,
  }));
  
  // Calculate metrics
  const totalApy = Math.max(...allocations.map(a => a.apy));
  const weightedApy = allocations.reduce((sum, a) => {
    return sum + (a.apy * a.allocationPercent);
  }, 0);
  
  // Diversification score (higher = more diversified)
  const chainDiversity = Object.keys(chainCount).length;
  const diversificationScore = Math.min(chainDiversity / 3, 1) * 100;
  
  // Average risk score (1-3 scale)
  const avgRisk = allocations.reduce((sum, a) => {
    const riskOrder = { low: 1, medium: 2, high: 3 };
    return sum + riskOrder[a.riskScore];
  }, 0) / allocations.length;
  
  return {
    opportunities: allocations,
    totalApy,
    weightedApy,
    diversificationScore,
    riskScore: avgRisk,
  };
}

/**
 * Calculate allocation amount for an opportunity
 * Top opportunity gets more, but diversified
 */
function getAllocationAmount(
  opportunity: YieldOpportunity,
  total: number,
  position: number
): number {
  // First position gets 35%, decreasing for subsequent positions
  const basePercent = 0.35 * Math.pow(0.75, position);
  return total * basePercent;
}

/**
 * Quick Start: Find best single opportunity for easy onboarding
 */
export function getQuickStartRecommendation(
  opportunities: YieldOpportunity[]
): YieldOpportunity | null {
  if (opportunities.length === 0) return null;
  
  // Filter for "safe" defaults (low-medium risk, good TVL)
  const safe = opportunities.filter(o => 
    o.riskScore !== 'high' && o.tvl >= 100000
  );
  
  if (safe.length === 0) return opportunities[0];
  
  // Sort by score and return top
  return safe.sort((a, b) => b.score - a.score)[0];
}

/**
 * Safe Yield: Filter for stable, low-risk opportunities
 */
export function getSafeYield(
  opportunities: YieldOpportunity[]
): YieldOpportunity[] {
  return opportunities
    .filter(o => o.riskScore === 'low' && o.tvl >= 500000)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

/**
 * High Yield: Filter for maximum APY with acceptable risk
 */
export function getHighYield(
  opportunities: YieldOpportunity[]
): YieldOpportunity[] {
  return opportunities
    .filter(o => o.riskScore !== 'high' && o.apy >= 20)
    .sort((a, b) => b.apy - a.apy)
    .slice(0, 10);
}

/**
 * Balanced: Mix of yield and risk
 */
export function getBalancedYield(
  opportunities: YieldOpportunity[]
): YieldOpportunity[] {
  return opportunities
    .filter(o => o.riskScore !== 'high' && o.tvl >= 100000)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

/**
 * Strategy presets for different risk tolerances
 */
export const STRATEGY_PRESETS: Record<string, Partial<YieldRouterConfig>> = {
  conservative: {
    riskTolerance: 'low',
    maxRisk: 'low',
    minTvl: 1000000,
  },
  balanced: {
    riskTolerance: 'medium',
    maxRisk: 'medium',
    minTvl: 500000,
    minApy: 5,
  },
  aggressive: {
    riskTolerance: 'high',
    minApy: 15,
    minTvl: 100000,
  },
};

/**
 * Format APY for display with trend indicator
 */
export function formatApy(apy: number): string {
  if (apy >= 1000) return `${(apy / 1000).toFixed(1)}K%`;
  if (apy >= 100) return `${apy.toFixed(0)}%`;
  return `${apy.toFixed(2)}%`;
}

/**
 * Generate strategy name based on config
 */
export function getStrategyName(config: YieldRouterConfig): string {
  if (config.riskTolerance === 'low') return 'Conservative';
  if (config.riskTolerance === 'high') return 'High Yield';
  return 'Balanced';
}
