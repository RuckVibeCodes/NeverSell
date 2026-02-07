"use client";

import { formatDistanceToNow } from 'date-fns';
import type { StrategyUpdate } from '@/lib/supabase';

interface StrategyUpdateCardProps {
  update: StrategyUpdate;
  creatorName?: string;
  creatorAvatar?: string;
}

export function StrategyUpdateCard({ 
  update, 
  creatorName = 'Creator',
  creatorAvatar = '👤'
}: StrategyUpdateCardProps) {
  const timeAgo = formatDistanceToNow(new Date(update.created_at), { addSuffix: true });
  
  // Format the creator address for display
  const shortAddress = `${update.creator_id.slice(0, 6)}...${update.creator_id.slice(-4)}`;

  return (
    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all duration-300">
      {/* Header with avatar and timestamp */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-lg flex-shrink-0">
          {creatorAvatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white font-medium truncate">{creatorName}</span>
            <span className="text-white/30 text-sm hidden sm:inline">{shortAddress}</span>
          </div>
          <span className="text-white/40 text-xs">{timeAgo}</span>
        </div>
      </div>

      {/* Update content */}
      <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap break-words">
        {update.content}
      </p>
    </div>
  );
}

// Loading skeleton for the card
export function StrategyUpdateCardSkeleton() {
  return (
    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 animate-pulse">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-white/10" />
        <div className="flex-1">
          <div className="h-4 w-24 bg-white/10 rounded mb-1" />
          <div className="h-3 w-16 bg-white/5 rounded" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full bg-white/10 rounded" />
        <div className="h-3 w-4/5 bg-white/10 rounded" />
      </div>
    </div>
  );
}
