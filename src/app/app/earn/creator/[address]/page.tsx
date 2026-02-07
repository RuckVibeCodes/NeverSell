'use client';

import { useState, useEffect, use } from 'react';
import { 
  ArrowLeft, 
  TrendingUp, 
  Calendar, 
  RefreshCw, 
  Plus, 
  Minus, 
  Edit3,
  Share2,
  Copy,
  Check,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { CreatorHeader, PortfolioComposition, CopyStrategyButton } from '@/components/earn';

interface CreatorData {
  address: string;
  avatar: string;
  name: string;
  handle: string;
  verified: boolean;
  bio: string;
  color: string;
  stats: {
    followers: number;
    tvl: number;
    thirtyDayReturn: number;
    copiers: number;
    allTimeReturn: number;
    apy: number;
  };
  socials: {
    twitter?: string;
    telegram?: string;
    discord?: string;
    website?: string;
  };
  allocations: Array<{
    poolId: string;
    name: string;
    percentage: number;
    color: string;
  }>;
  strategyUpdates: Array<{
    id: string;
    timestamp: string;
    type: 'rebalance' | 'add' | 'remove' | 'update';
    message: string;
  }>;
  performanceHistory: Array<{
    date: string;
    value: number;
  }>;
}

function getUpdateIcon(type: string) {
  switch (type) {
    case 'rebalance':
      return <RefreshCw size={16} className="text-purple-400" />;
    case 'add':
      return <Plus size={16} className="text-green-400" />;
    case 'remove':
      return <Minus size={16} className="text-red-400" />;
    case 'update':
      return <Edit3 size={16} className="text-blue-400" />;
    default:
      return <Edit3 size={16} className="text-white/40" />;
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins}m ago`;
    }
    return `${diffHours}h ago`;
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Simple mock chart component
function PerformanceChart({ data }: { data: Array<{ date: string; value: number }> }) {
  if (!data || data.length === 0) return null;
  
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;
  
  const startValue = data[0]?.value || 100;
  const endValue = data[data.length - 1]?.value || 100;
  const change = ((endValue - startValue) / startValue) * 100;
  
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-white">Performance</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5">
            <Calendar size={14} className="text-white/40" />
            <span className="text-white/60 text-sm">30D</span>
          </div>
          <div className={`flex items-center gap-1 ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            <TrendingUp size={18} />
            <span className="font-bold">{change >= 0 ? '+' : ''}{change.toFixed(1)}%</span>
          </div>
        </div>
      </div>
      
      {/* Chart area */}
      <div className="relative h-48 md:h-64">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-right pr-2">
          <span className="text-white/40 text-xs">{maxValue.toFixed(0)}%</span>
          <span className="text-white/40 text-xs">{((maxValue + minValue) / 2).toFixed(0)}%</span>
          <span className="text-white/40 text-xs">{minValue.toFixed(0)}%</span>
        </div>
        
        {/* Chart */}
        <div className="absolute left-14 right-0 top-0 bottom-0">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between">
            {[0, 1, 2].map(i => (
              <div key={i} className="border-t border-white/5" />
            ))}
          </div>
          
          {/* SVG line chart */}
          <svg className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={change >= 0 ? '#4ade80' : '#f87171'} stopOpacity="0.3" />
                <stop offset="100%" stopColor={change >= 0 ? '#4ade80' : '#f87171'} stopOpacity="0" />
              </linearGradient>
            </defs>
            
            {/* Area fill */}
            <path
              d={`
                M 0 ${100 - ((data[0].value - minValue) / range) * 100}
                ${data.map((d, i) => `L ${(i / (data.length - 1)) * 100} ${100 - ((d.value - minValue) / range) * 100}`).join(' ')}
                L 100 100
                L 0 100
                Z
              `}
              fill="url(#chartGradient)"
              className="transition-all duration-500"
            />
            
            {/* Line */}
            <path
              d={`
                M 0 ${100 - ((data[0].value - minValue) / range) * 100}
                ${data.map((d, i) => `L ${(i / (data.length - 1)) * 100} ${100 - ((d.value - minValue) / range) * 100}`).join(' ')}
              `}
              fill="none"
              stroke={change >= 0 ? '#4ade80' : '#f87171'}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              className="transition-all duration-500"
            />
            
            {/* Data points */}
            {data.map((d, i) => (
              <circle
                key={i}
                cx={`${(i / (data.length - 1)) * 100}%`}
                cy={`${100 - ((d.value - minValue) / range) * 100}%`}
                r="4"
                fill={change >= 0 ? '#4ade80' : '#f87171'}
                className="opacity-0 hover:opacity-100 transition-opacity"
              />
            ))}
          </svg>
          
          {/* X-axis labels */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between pt-2">
            {data.filter((_, i) => i % Math.ceil(data.length / 4) === 0 || i === data.length - 1).map((d, i) => (
              <span key={i} className="text-white/40 text-xs">
                {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            ))}
          </div>
        </div>
      </div>
      
      {/* Stats row below chart */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
        <div className="text-center">
          <p className="text-white/40 text-xs mb-1">Start Value</p>
          <p className="text-white font-medium">${startValue.toFixed(0)}</p>
        </div>
        <div className="text-center">
          <p className="text-white/40 text-xs mb-1">Current Value</p>
          <p className="text-white font-medium">${endValue.toFixed(0)}</p>
        </div>
        <div className="text-center">
          <p className="text-white/40 text-xs mb-1">Profit/Loss</p>
          <p className={`font-medium ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {change >= 0 ? '+' : ''}${(endValue - startValue).toFixed(0)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CreatorProfilePage({ params }: { params: Promise<{ address: string }> }) {
  const resolvedParams = use(params);
  const [creator, setCreator] = useState<CreatorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchCreator() {
      try {
        const res = await fetch(`/api/earn/creators/${resolvedParams.address}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError('Creator not found');
          } else {
            setError('Failed to load creator profile');
          }
          return;
        }
        const data = await res.json();
        setCreator(data);
      } catch (err) {
        console.error('Error fetching creator:', err);
        setError('Failed to load creator profile');
      } finally {
        setLoading(false);
      }
    }
    
    fetchCreator();
  }, [resolvedParams.address]);

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${creator?.name} on NeverSell`,
          text: `Check out ${creator?.name}'s trading strategy on NeverSell!`,
          url,
        });
      } catch {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 size={48} className="animate-spin text-mint" />
        </div>
      </div>
    );
  }

  if (error || !creator) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link 
          href="/app/vaults"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft size={18} />
          Back to Vaults
        </Link>
        
        <div className="glass-card p-12 text-center">
          <div className="w-20 h-20 rounded-2xl bg-red-500/20 flex items-center justify-center text-4xl mx-auto mb-4">
            😕
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{error || 'Creator not found'}</h2>
          <p className="text-white/60">The creator profile you&apos;re looking for doesn&apos;t exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back navigation */}
      <div className="flex items-center justify-between mb-6">
        <Link 
          href="/app/vaults"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft size={18} />
          Back to Vaults
        </Link>
        
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 transition-colors"
        >
          {copied ? <Check size={18} /> : <Share2 size={18} />}
          {copied ? 'Copied!' : 'Share'}
          {!copied && <Copy size={14} className="text-white/40" />}
        </button>
      </div>
      
      {/* Creator Header */}
      <div className="mb-6">
        <CreatorHeader
          avatar={creator.avatar}
          name={creator.name}
          handle={creator.handle}
          verified={creator.verified}
          bio={creator.bio}
          stats={{
            followers: creator.stats.followers,
            tvl: creator.stats.tvl,
            thirtyDayReturn: creator.stats.thirtyDayReturn,
            copiers: creator.stats.copiers,
          }}
          socials={creator.socials}
          color={creator.color}
        />
      </div>
      
      {/* Two column layout for desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Portfolio Composition - takes 2 columns */}
        <div className="lg:col-span-2">
          <PortfolioComposition
            allocations={creator.allocations}
            totalValue={creator.stats.tvl}
          />
        </div>
        
        {/* Copy Strategy CTA - takes 1 column */}
        <div className="glass-card p-6">
          <div className="mb-4">
            <p className="text-white/40 text-xs mb-1">Estimated APY</p>
            <p className="text-3xl font-bold text-mint">{creator.stats.apy}%</p>
          </div>
          
          <div className="mb-4">
            <p className="text-white/40 text-xs mb-1">All-Time Return</p>
            <p className={`text-2xl font-bold ${creator.stats.allTimeReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {creator.stats.allTimeReturn >= 0 ? '+' : ''}{creator.stats.allTimeReturn}%
            </p>
          </div>
          
          <CopyStrategyButton
            creatorName={creator.name}
            creatorFee={20}
            platformFee={10}
          />
        </div>
      </div>
      
      {/* Performance Chart */}
      <div className="mb-6">
        <PerformanceChart data={creator.performanceHistory} />
      </div>
      
      {/* Strategy Updates Feed */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-bold text-white mb-6">Strategy Updates</h2>
        
        <div className="space-y-4">
          {creator.strategyUpdates.map((update) => (
            <div 
              key={update.id}
              className="flex gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                {getUpdateIcon(update.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-white/90">{update.message}</p>
                <p className="text-white/40 text-sm mt-1">{formatDate(update.timestamp)}</p>
              </div>
            </div>
          ))}
        </div>
        
        {creator.strategyUpdates.length === 0 && (
          <p className="text-white/40 text-center py-8">No strategy updates yet.</p>
        )}
      </div>
    </div>
  );
}
