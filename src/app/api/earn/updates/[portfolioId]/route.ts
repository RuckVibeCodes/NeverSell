import { NextRequest, NextResponse } from 'next/server';
import { supabase, type StrategyUpdate } from '@/lib/supabase';
import type { ApiResponse } from '@/types/api';

interface RouteParams {
  params: Promise<{ portfolioId: string }>;
}

// GET /api/earn/updates/[portfolioId] - Get all updates for a portfolio
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Check if Supabase is configured
    if (!supabase) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Database not configured',
        },
        meta: {
          timestamp: Date.now(),
          requestId: crypto.randomUUID(),
        },
      };
      return NextResponse.json(response, { status: 503 });
    }

    const { portfolioId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (!portfolioId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Portfolio ID is required',
        },
        meta: {
          timestamp: Date.now(),
          requestId: crypto.randomUUID(),
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

    const { data, error, count } = await supabase
      .from('strategy_updates')
      .select('*', { count: 'exact' })
      .eq('portfolio_id', portfolioId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Supabase error:', error);
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: error.message,
        },
        meta: {
          timestamp: Date.now(),
          requestId: crypto.randomUUID(),
        },
      };
      return NextResponse.json(response, { status: 500 });
    }

    const response: ApiResponse<{ updates: StrategyUpdate[]; total: number }> = {
      success: true,
      data: {
        updates: data || [],
        total: count || 0,
      },
      meta: {
        timestamp: Date.now(),
        requestId: crypto.randomUUID(),
      },
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error('Error fetching strategy updates:', err);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
      meta: {
        timestamp: Date.now(),
        requestId: crypto.randomUUID(),
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
}
