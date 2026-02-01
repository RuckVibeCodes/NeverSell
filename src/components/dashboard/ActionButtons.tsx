'use client';

import Link from 'next/link';
import { Plus, ArrowUpFromLine, ArrowDownToLine } from 'lucide-react';

interface ActionButtonsProps {
  hasPosition: boolean;
}

/**
 * ActionButtons - Quick action buttons for deposit/withdraw/borrow
 */
export function ActionButtons({ hasPosition }: ActionButtonsProps) {
  if (!hasPosition) {
    return null;
  }
  
  return (
    <div className="glass-card p-4">
      <div className="grid grid-cols-3 gap-3">
        {/* Deposit More */}
        <Link
          href="/app/deposit"
          className="flex flex-col items-center gap-2 p-4 rounded-xl bg-mint/10 hover:bg-mint/20 transition-colors group"
        >
          <div className="w-10 h-10 rounded-xl bg-mint/20 flex items-center justify-center group-hover:bg-mint/30 transition-colors">
            <Plus className="w-5 h-5 text-mint" />
          </div>
          <span className="text-sm font-medium text-white">Deposit More</span>
        </Link>
        
        {/* Borrow */}
        <Link
          href="/app/borrow"
          className="flex flex-col items-center gap-2 p-4 rounded-xl bg-electric-blue/10 hover:bg-electric-blue/20 transition-colors group"
        >
          <div className="w-10 h-10 rounded-xl bg-electric-blue/20 flex items-center justify-center group-hover:bg-electric-blue/30 transition-colors">
            <ArrowUpFromLine className="w-5 h-5 text-electric-blue" />
          </div>
          <span className="text-sm font-medium text-white">Borrow</span>
        </Link>
        
        {/* Withdraw */}
        <Link
          href="/app/deposit?tab=withdraw"
          className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
        >
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/15 transition-colors">
            <ArrowDownToLine className="w-5 h-5 text-white/70" />
          </div>
          <span className="text-sm font-medium text-white">Withdraw</span>
        </Link>
      </div>
    </div>
  );
}
