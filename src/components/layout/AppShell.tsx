'use client';

import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { AppNavbar } from './AppNavbar';
import { MobileNav } from './MobileNav';

interface AppShellProps {
  children: ReactNode;
}

/**
 * App Shell - Main layout wrapper for authenticated app pages
 * 
 * - Desktop: Sidebar on left, content on right
 * - Mobile: Top navbar with hamburger menu + bottom tab bar
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-navy">
      {/* Top navbar with hamburger menu for mobile */}
      <AppNavbar />
      
      {/* Main layout */}
      <div className="flex">
        {/* Desktop sidebar - hidden on mobile */}
        <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:pt-16">
          <Sidebar />
        </aside>
        
        {/* Main content */}
        <main className="flex-1 lg:pl-64">
          {/* Content area with padding for navbar and mobile bottom nav */}
          <div className="pt-16 pb-24 lg:pb-8 min-h-screen">
            {children}
          </div>
        </main>
      </div>
      
      {/* Mobile bottom navigation - hidden on desktop */}
      <MobileNav />
    </div>
  );
}
