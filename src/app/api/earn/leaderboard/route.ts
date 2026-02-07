import { NextRequest, NextResponse } from 'next/server';
import { 
  getLeaderboardData, 
  getTrendingCreators,
  type LeaderboardPeriod,
  type LeaderboardSort 
} from '@/lib/mock-leaderboard-data';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Parse query params
  const period = (searchParams.get('period') || '30d') as LeaderboardPeriod;
  const sort = (searchParams.get('sort') || 'returns') as LeaderboardSort;
  const riskLevel = searchParams.get('riskLevel') as 'low' | 'medium' | 'high' | undefined;
  const minTvl = searchParams.get('minTvl') ? parseInt(searchParams.get('minTvl')!) : undefined;
  const strategyType = searchParams.get('strategyType') || undefined;
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
  const trending = searchParams.get('trending') === 'true';

  try {
    if (trending) {
      // Return trending creators only
      const trendingData = getTrendingCreators(limit);
      return NextResponse.json({
        success: true,
        data: trendingData,
        count: trendingData.length,
        type: 'trending',
      });
    }

    // Get filtered and sorted leaderboard data
    const data = getLeaderboardData({
      period,
      sort,
      riskLevel: riskLevel || undefined,
      minTvl,
      strategyType,
      limit,
    });

    return NextResponse.json({
      success: true,
      data,
      count: data.length,
      filters: {
        period,
        sort,
        riskLevel: riskLevel || null,
        minTvl: minTvl || null,
        strategyType: strategyType || null,
      },
    });
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leaderboard data' },
      { status: 500 }
    );
  }
}
