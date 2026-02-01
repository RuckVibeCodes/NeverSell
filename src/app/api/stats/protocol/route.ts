import { NextResponse } from 'next/server';
import { MOCK_PROTOCOL_STATS } from '@/lib/mock-data';
import type { ApiResponse, ProtocolStats } from '@/types/api';

export async function GET() {
  const stats: ProtocolStats = {
    tvlUsd: String(MOCK_PROTOCOL_STATS.tvl),
    totalDepositors: MOCK_PROTOCOL_STATS.totalDepositors,
    totalEarningsDistributed: String(MOCK_PROTOCOL_STATS.totalYieldGenerated),
    averageApy: String(MOCK_PROTOCOL_STATS.averageApy.toFixed(2)),
    vaultCount: 12, // Mock vault count
    volume24h: String(Math.floor(MOCK_PROTOCOL_STATS.tvl * 0.05)), // ~5% daily volume
  };

  const response: ApiResponse<ProtocolStats> = {
    success: true,
    data: stats,
    meta: {
      timestamp: Date.now(),
      requestId: crypto.randomUUID(),
    },
  };

  return NextResponse.json(response);
}
