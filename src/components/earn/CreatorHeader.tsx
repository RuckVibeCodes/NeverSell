"use client";

import { Check, Users, DollarSign, TrendingUp, UserPlus, Twitter, MessageCircle, Link as LinkIcon } from 'lucide-react';

interface CreatorHeaderProps {
  avatar: string;
  name: string;
  handle: string;
  verified: boolean;
  bio: string;
  stats: {
    followers: number;
    tvl: number;
    thirtyDayReturn: number;
    copiers: number;
  };
  socials: {
    twitter?: string;
    telegram?: string;
    discord?: string;
    website?: string;
  };
  color: string;
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toString();
}

export function CreatorHeader({
  avatar,
  name,
  handle,
  verified,
  bio,
  stats,
  socials,
  color,
}: CreatorHeaderProps) {
  return (
    <div className="glass-card p-6 relative overflow-hidden">
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-5`} />
      
      <div className="relative">
        {/* Top section with avatar and info */}
        <div className="flex items-start gap-6 mb-6">
          {/* Avatar */}
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-4xl shadow-xl flex-shrink-0`}>
            {avatar}
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Name and verification */}
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-white truncate">{name}</h1>
              {verified && (
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <Check size={14} className="text-white" />
                </div>
              )}
            </div>
            
            <p className="text-white/40 mb-3">{handle}</p>
            
            {/* Bio */}
            {bio && (
              <p className="text-white/70 text-sm leading-relaxed">{bio}</p>
            )}
          </div>
        </div>
        
        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <Users size={16} className="text-purple-400" />
              <span className="text-white/40 text-xs">Followers</span>
            </div>
            <p className="text-white font-bold text-lg">{formatNumber(stats.followers)}</p>
          </div>
          
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={16} className="text-mint" />
              <span className="text-white/40 text-xs">TVL</span>
            </div>
            <p className="text-white font-bold text-lg">${formatNumber(stats.tvl)}</p>
          </div>
          
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={16} className="text-green-400" />
              <span className="text-white/40 text-xs">30d Return</span>
            </div>
            <p className={`font-bold text-lg ${stats.thirtyDayReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.thirtyDayReturn >= 0 ? '+' : ''}{stats.thirtyDayReturn}%
            </p>
          </div>
          
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <UserPlus size={16} className="text-orange-400" />
              <span className="text-white/40 text-xs">Copiers</span>
            </div>
            <p className="text-white font-bold text-lg">{formatNumber(stats.copiers)}</p>
          </div>
        </div>
        
        {/* Socials */}
        {(socials.twitter || socials.telegram || socials.discord || socials.website) && (
          <div className="flex items-center gap-3">
            {socials.twitter && (
              <a
                href={socials.twitter.startsWith('http') ? socials.twitter : `https://twitter.com/${socials.twitter.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-white/60 hover:text-[#1DA1F2] hover:bg-[#1DA1F2]/10 transition-colors"
              >
                <Twitter size={16} />
                <span className="text-sm">{socials.twitter.startsWith('@') ? socials.twitter : `@${socials.twitter}`}</span>
              </a>
            )}
            
            {socials.telegram && (
              <a
                href={socials.telegram.startsWith('http') ? socials.telegram : `https://t.me/${socials.telegram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-white/60 hover:text-[#0088cc] hover:bg-[#0088cc]/10 transition-colors"
              >
                <MessageCircle size={16} />
                <span className="text-sm">Telegram</span>
              </a>
            )}
            
            {socials.discord && (
              <a
                href={socials.discord}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-white/60 hover:text-[#5865F2] hover:bg-[#5865F2]/10 transition-colors"
              >
                <div className="w-4 h-4 rounded-full bg-[#5865F2] flex items-center justify-center text-white text-[10px] font-bold">D</div>
                <span className="text-sm">Discord</span>
              </a>
            )}
            
            {socials.website && (
              <a
                href={socials.website.startsWith('http') ? socials.website : `https://${socials.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <LinkIcon size={16} />
                <span className="text-sm">Website</span>
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
