'use client';

import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';

/**
 * App Navbar - Top navigation bar for the app
 * Shows logo and wallet connection
 */
export function AppNavbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-white/5 bg-navy/80 backdrop-blur-xl">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Logo */}
        <Link href="/app" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-mint rounded-lg flex items-center justify-center">
            <span className="text-navy font-bold text-lg">N</span>
          </div>
          <span className="font-display font-bold text-xl text-white hidden sm:block">
            NeverSell
          </span>
        </Link>
        
        {/* Wallet connection */}
        <div className="flex items-center gap-4">
          <ConnectButton 
            chainStatus="icon"
            showBalance={false}
            accountStatus={{
              smallScreen: 'avatar',
              largeScreen: 'full',
            }}
          />
        </div>
      </div>
    </header>
  );
}
