'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  PiggyBank, 
  Landmark, 
  Zap,
  BarChart3,
  Users,
  User,
  Menu,
  X,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  description?: string;
}

const navItems: NavItem[] = [
  { href: '/app', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/app/fund', label: 'Fund', icon: Wallet },
  { href: '/app/pools', label: 'Quick Start', icon: Zap, description: '3 simple strategies' },
  { href: '/app/markets', label: 'Research', icon: BarChart3, description: 'Analyze GM pools' },
  { href: '/app/vaults', label: 'Social Trading', icon: Users, description: 'Copy top traders' },
  { href: '/app/lend', label: 'Lend', icon: PiggyBank },
  { href: '/app/borrow', label: 'Borrow', icon: Landmark },
  { href: '/app/profile', label: 'Profile', icon: User },
];

/**
 * HamburgerMenu - Slide-out drawer menu for mobile
 * Contains all navigation items with wallet connect at bottom
 */
export function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-white/5 transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={24} className="text-white" /> : <Menu size={24} className="text-white" />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-out Drawer */}
      <div className={cn(
        'fixed top-0 right-0 z-50 h-full w-80 max-w-[85vw] bg-navy border-l border-white/5 transform transition-transform duration-300 ease-out lg:hidden',
        isOpen ? 'translate-x-0' : 'translate-x-full'
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-white/5">
            <span className="font-display font-bold text-lg text-white">Menu</span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <X size={20} className="text-white/60" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-3">
              {navItems.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== '/app' && pathname.startsWith(item.href));
                
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-mint/10 text-mint'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      )}
                    >
                      <item.icon 
                        size={20} 
                        className={cn(
                          'transition-colors flex-shrink-0',
                          isActive ? 'text-mint' : 'text-white/40'
                        )} 
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span>{item.label}</span>
                          {item.badge && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className={cn(
                            'text-[11px] mt-0.5',
                            isActive ? 'text-mint/60' : 'text-white/40'
                          )}>
                            {item.description}
                          </p>
                        )}
                      </div>
                      <ChevronRight 
                        size={16} 
                        className={cn(
                          'transition-transform flex-shrink-0',
                          isActive ? 'text-mint' : 'text-white/30 group-hover:text-white/50'
                        )} 
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Bottom Section - Version */}
          <div className="border-t border-white/5 p-4 bg-navy/50 backdrop-blur-xl">
            <p className="text-[10px] text-white/30 text-center">
              NeverSell v1.0 • DeFi Made Simple
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
