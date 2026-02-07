import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, type StrategyUpdateInsert } from '@/lib/supabase';
import type { ApiResponse } from '@/types/api';

// POST /api/earn/updates - Create a new strategy update
export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!supabaseAdmin) {
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

    const body = await request.json();
    const { creator_id, portfolio_id, content } = body as StrategyUpdateInsert;

    // Validation
    if (!creator_id || !portfolio_id || !content) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Missing required fields: creator_id, portfolio_id, content',
        },
        meta: {
          timestamp: Date.now(),
          requestId: crypto.randomUUID(),
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

    if (content.length > 280) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'CONTENT_TOO_LONG',
          message: 'Content must be 280 characters or less',
        },
        meta: {
          timestamp: Date.now(),
          requestId: crypto.randomUUID(),
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

    // TODO: Add authentication to verify creator_id matches the connected wallet
    // For now, we trust the client (would use wallet signature verification in production)

    const { data, error } = await supabaseAdmin
      .from('strategy_updates')
      .insert({
        creator_id: creator_id.toLowerCase(),
        portfolio_id,
        content,
      })
      .select()
      .single();

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

    const response: ApiResponse<typeof data> = {
      success: true,
      data,
      meta: {
        timestamp: Date.now(),
        requestId: crypto.randomUUID(),
      },
    };

    return NextResponse.json(response, { status: 201 });
  } catch (err) {
    console.error('Error creating strategy update:', err);
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
