"use client";

import { useEffect, useState, useCallback } from 'react';
import { MessageCircle, RefreshCw } from 'lucide-react';
import { StrategyUpdateCard, StrategyUpdateCardSkeleton } from './StrategyUpdateCard';
import type { StrategyUpdate } from '@/lib/supabase';

interface StrategyUpdateFeedProps {
  portfolioId: string;
  creatorName?: string;
  creatorAvatar?: string;
  limit?: number;
}

interface UpdatesResponse {
  success: boolean;
  data?: {
    updates: StrategyUpdate[];
    total: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

export function StrategyUpdateFeed({
  portfolioId,
  creatorName,
  creatorAvatar,
  limit = 10,
}: StrategyUpdateFeedProps) {
  const [updates, setUpdates] = useState<StrategyUpdate[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);

  const fetchUpdates = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
        setOffset(0);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const currentOffset = isRefresh ? 0 : offset;
      const response = await fetch(
        `/api/earn/updates/${portfolioId}?limit=${limit}&offset=${currentOffset}`
      );
      
      const data: UpdatesResponse = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.error?.message || 'Failed to fetch updates');
      }

      if (isRefresh || offset === 0) {
        setUpdates(data.data.updates);
      } else {
        setUpdates(prev => [...prev, ...data.data!.updates]);
      }
      setTotal(data.data.total);
    } catch (err) {
      console.error('Error fetching updates:', err);
      setError(err instanceof Error ? err.message : 'Failed to load updates');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [portfolioId, limit, offset]);

  useEffect(() => {
    fetchUpdates();
  }, [fetchUpdates]);

  const handleRefresh = () => {
    fetchUpdates(true);
  };

  const handleLoadMore = () => {
    setOffset(prev => prev + limit);
  };

  const hasMore = updates.length < total;

  // Loading state
  if (isLoading && updates.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <MessageCircle size={20} className="text-purple-400" />
            Strategy Updates
          </h3>
        </div>
        {[...Array(3)].map((_, i) => (
          <StrategyUpdateCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Error state
  if (error && updates.length === 0) {
    return (
      <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
        <p className="text-red-400 mb-3">{error}</p>
        <button
          onClick={handleRefresh}
          className="text-white/60 hover:text-white transition-colors text-sm flex items-center gap-2 mx-auto"
        >
          <RefreshCw size={14} />
          Try again
        </button>
      </div>
    );
  }

  // Empty state
  if (updates.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <MessageCircle size={20} className="text-purple-400" />
            Strategy Updates
          </h3>
        </div>
        <div className="p-8 rounded-xl bg-white/[0.02] border border-white/10 text-center">
          <div className="text-4xl mb-3">📝</div>
          <p className="text-white/40 text-sm">No updates yet</p>
          <p className="text-white/20 text-xs mt-1">The creator hasn&apos;t posted any strategy updates.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <MessageCircle size={20} className="text-purple-400" />
          Strategy Updates
          <span className="text-white/40 text-sm font-normal">({total})</span>
        </h3>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="text-white/40 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5 disabled:opacity-50"
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Updates list */}
      <div className="space-y-3">
        {updates.map((update) => (
          <StrategyUpdateCard
            key={update.id}
            update={update}
            creatorName={creatorName}
            creatorAvatar={creatorAvatar}
          />
        ))}
      </div>

      {/* Load more button */}
      {hasMore && (
        <button
          onClick={handleLoadMore}
          disabled={isLoading}
          className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all text-sm font-medium disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : `Load more (${total - updates.length} remaining)`}
        </button>
      )}
    </div>
  );
}
