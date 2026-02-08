/**
 * User Position Tracking for NeverSell Earn
 */

import type { BeefyChain, BeefyVaultWithStats } from './beefy';

export interface UserPosition {
  id: string;
  vaultId: string;
  vault?: BeefyVaultWithStats;
  chain: BeefyChain;
  
  // Deposit info
  depositAmount: string;
  depositToken: string;
  depositTimestamp: number;
  depositTxHash: string;
  
  // Current state
  shares: string;
  currentValue: string;
  earnings: string;
  earningsPercent: number;
  
  // Tracking
  lastUpdated: number;
}

export interface PositionStats {
  totalDeposited: number;
  totalValue: number;
  totalEarnings: number;
  avgApy: number;
  positionCount: number;
  chainBreakdown: Record<BeefyChain, { value: number; count: number }>;
}

// Fetch user positions from API/blockchain
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function fetchUserPositions(walletAddress: string): Promise<UserPosition[]> {
  // TODO: Implement actual position fetching using walletAddress
  // Options:
  // 1. Read from blockchain (mooTokens balance for each vault)
  // 2. Read from Supabase (tracked deposits)
  // 3. Use Beefy's subgraph

  // For now, return mock data for UI development
  return [
    {
      id: 'pos_1',
      vaultId: 'beefy-eth-usdc',
      chain: 'arbitrum',
      depositAmount: '1.5',
      depositToken: 'ETH',
      depositTimestamp: Date.now() - 86400000 * 30, // 30 days ago
      depositTxHash: '0x1234...abcd',
      shares: '1.52',
      currentValue: '1.62',
      earnings: '0.12',
      earningsPercent: 8.0,
      lastUpdated: Date.now(),
    },
    {
      id: 'pos_2',
      vaultId: 'beefy-usdc-usdt',
      chain: 'base',
      depositAmount: '5000',
      depositToken: 'USDC',
      depositTimestamp: Date.now() - 86400000 * 60, // 60 days ago
      depositTxHash: '0x5678...efgh',
      shares: '5100',
      currentValue: '5150',
      earnings: '150',
      earningsPercent: 3.0,
      lastUpdated: Date.now(),
    },
  ];
}

// Calculate aggregate stats
export function calculatePositionStats(positions: UserPosition[]): PositionStats {
  const stats: PositionStats = {
    totalDeposited: 0,
    totalValue: 0,
    totalEarnings: 0,
    avgApy: 0,
    positionCount: positions.length,
    chainBreakdown: {
      arbitrum: { value: 0, count: 0 },
      base: { value: 0, count: 0 },
      optimism: { value: 0, count: 0 },
      polygon: { value: 0, count: 0 },
    },
  };

  positions.forEach(pos => {
    const depositValue = parseFloat(pos.depositAmount);
    const currentValue = parseFloat(pos.currentValue);
    const earnings = parseFloat(pos.earnings);

    stats.totalDeposited += depositValue;
    stats.totalValue += currentValue;
    stats.totalEarnings += earnings;
    
    stats.chainBreakdown[pos.chain].value += currentValue;
    stats.chainBreakdown[pos.chain].count += 1;
  });

  // Calculate weighted average APY
  if (positions.length > 0) {
    const totalWeight = positions.reduce((sum, pos) => sum + parseFloat(pos.currentValue), 0);
    const weightedApy = positions.reduce((sum, pos) => {
      const weight = parseFloat(pos.currentValue) / totalWeight;
      return sum + (pos.vault?.apy || 0) * weight;
    }, 0);
    stats.avgApy = weightedApy;
  }

  return stats;
}

// Format helpers
export function formatDuration(timestamp: number): string {
  const days = Math.floor((Date.now() - timestamp) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

export function formatValue(value: string | number, decimals: number = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(decimals)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(decimals)}K`;
  return `$${num.toFixed(decimals)}`;
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}
