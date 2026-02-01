'use client';

import { useAccount, useDisconnect } from 'wagmi';
import { Bell, Wallet, LogOut, ExternalLink } from 'lucide-react';

/**
 * Settings Page
 * User preferences and wallet management
 */
export default function SettingsPage() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-white mb-2">
          Settings
        </h1>
        <p className="text-white/60">
          Manage your account and preferences
        </p>
      </div>
      
      {/* Wallet Section */}
      <div className="glass-card p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Wallet className="w-5 h-5 text-mint" />
          <h2 className="text-lg font-semibold text-white">Connected Wallet</h2>
        </div>
        
        {isConnected && address ? (
          <div className="space-y-4">
            <div className="p-4 bg-white/5 rounded-xl">
              <div className="text-white/50 text-sm mb-1">Address</div>
              <div className="font-mono text-white text-sm break-all">
                {address}
              </div>
            </div>
            
            <button
              onClick={() => disconnect()}
              className="flex items-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 transition-colors"
            >
              <LogOut size={18} />
              <span>Disconnect Wallet</span>
            </button>
          </div>
        ) : (
          <p className="text-white/50">No wallet connected</p>
        )}
      </div>
      
      {/* Notifications Section */}
      <div className="glass-card p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-5 h-5 text-electric-blue" />
          <h2 className="text-lg font-semibold text-white">Notifications</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
            <div>
              <div className="text-white font-medium">Low Borrow Capacity</div>
              <div className="text-white/50 text-sm">
                Get alerted when capacity drops below 20%
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-mint" />
            </label>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
            <div>
              <div className="text-white font-medium">Large Deposits</div>
              <div className="text-white/50 text-sm">
                Get alerted for deposits over $10,000
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-mint" />
            </label>
          </div>
        </div>
      </div>
      
      {/* Resources Section */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Resources</h2>
        
        <div className="space-y-2">
          <a
            href="https://docs.neversell.finance"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
          >
            <span className="text-white">Documentation</span>
            <ExternalLink size={16} className="text-white/40" />
          </a>
          
          <a
            href="https://twitter.com/neversellfi"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
          >
            <span className="text-white">Follow on X</span>
            <ExternalLink size={16} className="text-white/40" />
          </a>
          
          <a
            href="https://discord.gg/neversell"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
          >
            <span className="text-white">Join Discord</span>
            <ExternalLink size={16} className="text-white/40" />
          </a>
        </div>
      </div>
      
      {/* Version */}
      <div className="text-center mt-8 text-white/30 text-sm">
        NeverSell v1.0.0
      </div>
    </div>
  );
}
