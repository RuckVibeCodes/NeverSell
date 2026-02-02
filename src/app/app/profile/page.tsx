'use client';

import { useState } from "react";
import Image from "next/image";
import { useAccount } from 'wagmi';
import { Wallet, LogOut, Edit2, Check, Twitter, MessageCircle, Link as LinkIcon, Plus, Users, Copy, CheckCheck, Upload, X, Loader2 } from "lucide-react";

// Mock portfolios for the profile
const mockUserPortfolios = [
  {
    id: "1",
    name: "Alpha Hunter Strategy",
    tvl: 2340000,
    apy: 28.5,
    followers: 15200,
    color: "from-amber-400 to-orange-500",
  },
  {
    id: "2",
    name: "Safe Yield Farm",
    tvl: 1890000,
    apy: 24.2,
    followers: 12400,
    color: "from-purple-400 to-pink-500",
  },
];

/**
 * Profile Page
 * Your creator profile — edit your info and showcase your portfolios
 */
export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState("Your Name");
  const [handle] = useState("@yourhandle");
  const [bio, setBio] = useState("Share your trading strategy and earn when your followers profit.");
  const [twitter, setTwitter] = useState("");
  const [telegram, setTelegram] = useState("");
  const [website, setWebsite] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate referral link based on address
  const referralLink = address 
    ? `https://neversell.finance/ref/${address.slice(0, 8)}`
    : '';

  const handleSave = () => {
    setIsEditing(false);
    // In production: save to backend/database
  };

  // Handle image upload with base64
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be less than 2MB');
      return;
    }

    setIsUploading(true);

    const reader = new FileReader();
    reader.onloadend = () => {
      // Compress image if needed (simple base64 for now)
      const result = reader.result as string;
      setAvatarUrl(result);
      setIsUploading(false);
      // In production: upload to cloud storage and save URL
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setAvatarUrl(null);
  };

  const handleCopyReferral = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-white mb-2">
          Your Profile
        </h1>
        <p className="text-white/60">
          Customize your creator profile and share your portfolios
        </p>
      </div>

      {/* Profile Card */}
      <div className="glass-card p-6 mb-6 relative overflow-hidden">
        {/* Banner background */}
        <div className="absolute inset-0 bg-gradient-to-r from-mint/10 via-purple-500/5 to-pink-500/10" />
        
        <div className="relative">
          {/* Avatar & Edit Button */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-mint to-emerald-500 flex items-center justify-center text-3xl font-bold text-white overflow-hidden">
                  {avatarUrl ? (
                    <Image 
                      src={avatarUrl} 
                      alt="Profile" 
                      fill
                      className="object-cover"
                    />
                  ) : (
                    displayName.charAt(0).toUpperCase()
                  )}
                </div>
                {/* Upload overlay */}
                {isEditing && (
                  <label className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                    {isUploading ? (
                      <Loader2 size={20} className="animate-spin text-white" />
                    ) : (
                      <Upload size={20} className="text-white" />
                    )}
                  </label>
                )}
                {/* Remove button */}
                {isEditing && avatarUrl && (
                  <button
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              <div>
                {isEditing ? (
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="bg-navy-light border border-white/10 rounded-lg px-3 py-2 text-white text-xl font-bold mb-1"
                  />
                ) : (
                  <h2 className="text-2xl font-bold text-white">{displayName}</h2>
                )}
                <p className="text-white/50">{handle}</p>
              </div>
            </div>
            <button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              {isEditing ? <Check size={16} /> : <Edit2 size={16} />}
              {isEditing ? 'Save' : 'Edit'}
            </button>
          </div>

          {/* Bio */}
          <div className="mb-6">
            {isEditing ? (
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-navy-light border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-mint/50 resize-none"
                rows={3}
                maxLength={280}
              />
            ) : (
              <p className="text-white/80">{bio}</p>
            )}
          </div>

          {/* Social Links */}
          <div className="space-y-3">
            <p className="text-white/50 text-sm">Your Links</p>
            <div className="flex flex-wrap gap-3">
              {isEditing ? (
                <>
                  <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 flex-1">
                    <Twitter size={16} className="text-[#1DA1F2]" />
                    <input
                      type="text"
                      placeholder="@twitter"
                      value={twitter}
                      onChange={(e) => setTwitter(e.target.value)}
                      className="bg-transparent text-white text-sm placeholder:text-white/30 focus:outline-none flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 flex-1">
                    <MessageCircle size={16} className="text-[#0088cc]" />
                    <input
                      type="text"
                      placeholder="t.me/username"
                      value={telegram}
                      onChange={(e) => setTelegram(e.target.value)}
                      className="bg-transparent text-white text-sm placeholder:text-white/30 focus:outline-none flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 flex-1">
                    <LinkIcon size={16} className="text-white/40" />
                    <input
                      type="text"
                      placeholder="yoursite.com"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="bg-transparent text-white text-sm placeholder:text-white/30 focus:outline-none flex-1"
                    />
                  </div>
                </>
              ) : (
                <>
                  {twitter && (
                    <a href={`https://twitter.com/${twitter.replace('@', '')}`} target="_blank" rel="noopener" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                      <Twitter size={16} className="text-[#1DA1F2]" />
                      <span className="text-white text-sm">{twitter}</span>
                    </a>
                  )}
                  {telegram && (
                    <a href={`https://t.me/${telegram.replace('t.me/', '')}`} target="_blank" rel="noopener" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                      <MessageCircle size={16} className="text-[#0088cc]" />
                      <span className="text-white text-sm">{telegram}</span>
                    </a>
                  )}
                  {website && (
                    <a href={website} target="_blank" rel="noopener" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                      <LinkIcon size={16} className="text-white/40" />
                      <span className="text-white text-sm">{website}</span>
                    </a>
                  )}
                  {!twitter && !telegram && !website && (
                    <p className="text-white/40 text-sm">No links added yet</p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Referral Link */}
          {isConnected && referralLink && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-white/50 text-sm mb-3 flex items-center gap-2">
                <Users size={14} className="text-mint" />
                Share Your Portfolio & Earn 20%
              </p>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-mint/10 to-purple-500/10 border border-mint/20">
                <input
                  type="text"
                  readOnly
                  value={referralLink}
                  className="flex-1 bg-transparent text-white text-sm placeholder:text-white/30 focus:outline-none font-mono"
                />
                <button
                  onClick={handleCopyReferral}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                    copied 
                      ? 'bg-green-500 text-white' 
                      : 'bg-mint text-navy-400 hover:bg-mint/90'
                  }`}
                >
                  {copied ? <CheckCheck size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-white/40 text-xs mt-2">
                You earn 20% of your followers' trading gains when they use your referral link
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Your Portfolios Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <Users size={16} className="text-purple-400" />
            </div>
            Your Portfolios
          </h2>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-mint text-navy-400 text-sm font-medium hover:bg-mint/90 transition-colors">
            <Plus size={14} />
            New Portfolio
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockUserPortfolios.map((portfolio) => (
            <div key={portfolio.id} className="glass-card p-5 hover:border-white/20 transition-all cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${portfolio.color} flex items-center justify-center text-lg`}>
                    👑
                  </div>
                  <div>
                    <h3 className="text-white font-medium">{portfolio.name}</h3>
                    <p className="text-white/40 text-xs">Created 30 days ago</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-mint font-bold">{portfolio.apy}%</p>
                  <p className="text-white/40 text-xs">APY</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-2 rounded-lg bg-white/[0.02]">
                  <p className="text-white/40 text-xs">TVL</p>
                  <p className="text-white font-medium">${(portfolio.tvl / 1_000_000).toFixed(1)}M</p>
                </div>
                <div className="p-2 rounded-lg bg-white/[0.02]">
                  <p className="text-white/40 text-xs">Followers</p>
                  <p className="text-white font-medium">{(portfolio.followers / 1000).toFixed(1)}K</p>
                </div>
              </div>
            </div>
          ))}

          {/* Add New Portfolio Card */}
          <div className="glass-card p-5 border-dashed border-2 border-white/10 hover:border-mint/30 transition-all cursor-pointer flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-3">
              <Plus size={24} className="text-white/40" />
            </div>
            <p className="text-white font-medium mb-1">Create New Portfolio</p>
            <p className="text-white/40 text-xs">Share your strategy with others</p>
          </div>
        </div>
      </div>

      {/* Account Section */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-mint" />
          Account
        </h2>
        
        {isConnected && address ? (
          <div className="space-y-4">
            <div className="p-4 bg-white/5 rounded-xl">
              <div className="text-white/50 text-sm mb-1">Wallet Address</div>
              <div className="font-mono text-white text-sm break-all">
                {address}
              </div>
            </div>
            
            <button
              onClick={() => {
                // In production: call disconnect
                console.log('Disconnect wallet');
              }}
              className="flex items-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 transition-colors"
            >
              <LogOut size={18} />
              <span>Disconnect Wallet</span>
            </button>
          </div>
        ) : (
          <p className="text-white/50">Connect your wallet to manage your profile</p>
        )}
      </div>
    </div>
  );
}
