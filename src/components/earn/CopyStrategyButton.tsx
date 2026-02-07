"use client";

import { useState } from 'react';
import { Zap, ChevronDown, ChevronUp, Info } from 'lucide-react';

interface CopyStrategyButtonProps {
  creatorName: string;
  creatorFee?: number; // Default 20%
  platformFee?: number; // Default 10%
  onCopy?: (amount: number) => void;
}

export function CopyStrategyButton({
  creatorName,
  creatorFee = 20,
  platformFee = 10,
  onCopy,
}: CopyStrategyButtonProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  const depositorShare = 100 - creatorFee - platformFee;
  
  return (
    <div className="space-y-4">
      {/* Main CTA button */}
      <button
        onClick={() => onCopy?.(0)}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white font-semibold text-lg flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-purple-500/25 transition-all group"
      >
        <Zap size={20} className="group-hover:animate-pulse" />
        Copy Strategy
      </button>
      
      {/* Fee breakdown toggle */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full flex items-center justify-center gap-2 text-white/40 hover:text-white/60 transition-colors text-sm"
      >
        <Info size={14} />
        How earnings are split
        {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      
      {/* Fee breakdown details */}
      {showDetails && (
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <p className="text-white/60 text-xs mb-3">When you earn yield:</p>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-mint" />
              <span className="text-white/70 text-sm">You Keep</span>
            </div>
            <span className="text-mint font-semibold">{depositorShare}%</span>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-400" />
              <span className="text-white/70 text-sm">{creatorName} (Creator)</span>
            </div>
            <span className="text-purple-400 font-semibold">{creatorFee}%</span>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-white/30" />
              <span className="text-white/70 text-sm">Platform</span>
            </div>
            <span className="text-white/40 font-semibold">{platformFee}%</span>
          </div>
          
          <div className="pt-3 border-t border-white/10">
            <p className="text-white/40 text-xs">
              Fees are only taken from your profits. If you don&apos;t earn, you don&apos;t pay.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
