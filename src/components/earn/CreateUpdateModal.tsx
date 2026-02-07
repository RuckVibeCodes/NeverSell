"use client";

import { useState } from 'react';
import { X, Send, Loader2, Check, AlertCircle } from 'lucide-react';
import { useAccount } from 'wagmi';

interface CreateUpdateModalProps {
  portfolioId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateUpdateModal({ 
  portfolioId, 
  onClose, 
  onSuccess 
}: CreateUpdateModalProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { address, isConnected } = useAccount();
  
  const MAX_CHARS = 280;
  const remainingChars = MAX_CHARS - content.length;
  const isOverLimit = remainingChars < 0;
  const canSubmit = content.trim().length > 0 && !isOverLimit && isConnected && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit || !address) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/earn/updates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creator_id: address,
          portfolio_id: portfolioId,
          content: content.trim(),
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to create update');
      }
      
      setIsSuccess(true);
      
      // Auto close after success
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error creating update:', err);
      setError(err instanceof Error ? err.message : 'Failed to post update');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && canSubmit) {
      handleSubmit();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg relative animate-in fade-in zoom-in-95 duration-300">
        {/* Gradient border effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 opacity-30 blur-xl" />
        
        <div className="glass-card relative p-6 border-2 border-white/10">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Post Strategy Update</h2>
            <button 
              onClick={onClose}
              className="text-white/40 hover:text-white transition-colors p-1"
            >
              <X size={20} />
            </button>
          </div>

          {/* Not connected warning */}
          {!isConnected && (
            <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-amber-400 text-sm">
              <AlertCircle size={16} />
              Connect your wallet to post updates
            </div>
          )}

          {/* Textarea */}
          <div className="relative mb-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Share an update about your strategy..."
              className="w-full h-32 bg-navy-light border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 transition-colors resize-none"
              disabled={!isConnected || isSubmitting || isSuccess}
              autoFocus
            />
            
            {/* Character counter */}
            <div className={`absolute bottom-3 right-3 text-sm ${
              isOverLimit 
                ? 'text-red-400' 
                : remainingChars <= 20 
                  ? 'text-amber-400' 
                  : 'text-white/30'
            }`}>
              {remainingChars}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Success message */}
          {isSuccess && (
            <div className="mb-4 p-3 rounded-xl bg-mint/10 border border-mint/20 flex items-center gap-2 text-mint text-sm">
              <Check size={16} />
              Update posted successfully!
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <p className="text-white/30 text-xs">
              Press ⌘+Enter to post
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all text-sm font-medium"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-purple-500/25 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Posting...
                  </>
                ) : isSuccess ? (
                  <>
                    <Check size={16} />
                    Posted!
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Post Update
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
