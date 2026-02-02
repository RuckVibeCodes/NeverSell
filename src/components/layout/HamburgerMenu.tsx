'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
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
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

const navItems: NavItem[] = [
  { href: '/app', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/app/fund', label: 'Fund', icon: Wallet },
  { href: '/app/pools', label: 'Quick Start', icon: Zap },
  { href: '/app/markets', label: 'Research', icon: BarChart3 },
  { href: '/app/vaults', label: 'Social Trading', icon: Users },
  { href: '/app/lend', label: 'Lend', icon: PiggyBank },
  { href: '/app/borrow', label: 'Borrow', icon: Landmark },
  { href: '/app/profile', label: 'Profile', icon: User },
];

/**
 * HamburgerMenu - Fullscreen overlay menu for mobile (matches landing page style)
 * Contains all navigation items with wallet connect at bottom
 */
// Export hook for parent components to know if menu is open
export function useHamburgerMenuState() {
  return { isOpen: typeof window !== 'undefined' && document.body.classList.contains('mobile-menu-open') };
}

export function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Add class to body when menu is open (for CSS-based hiding of navbar elements)
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('mobile-menu-open');
    } else {
      document.body.classList.remove('mobile-menu-open');
    }
    return () => {
      document.body.classList.remove('mobile-menu-open');
    };
  }, [isOpen]);

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

      {/* Fullscreen Mobile Menu - z-[60] to cover navbar (z-50) */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          {/* Background overlay */}
          <div
            className="absolute inset-0 bg-navy/98 backdrop-blur-xl"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Close button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/5 transition-colors z-50"
          >
            <X size={24} className="text-white/60" />
          </button>
          
          {/* Centered navigation links */}
          <div className="relative flex flex-col items-center justify-center h-full gap-4 px-6">
            {/* Nav links */}
            <nav className="flex flex-col items-center gap-3">
              {navItems.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== '/app' && pathname.startsWith(item.href));
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-6 py-3 rounded-2xl text-xl font-display transition-all duration-200',
                      isActive
                        ? 'bg-mint/10 text-mint border border-mint/20'
                        : 'text-white/80 hover:text-mint hover:bg-white/5'
                    )}
                  >
                    <item.icon 
                      size={22} 
                      className={cn(
                        'transition-colors',
                        isActive ? 'text-mint' : 'text-white/50'
                      )} 
                    />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
            
            {/* Wallet connect button at bottom */}
            <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-4 px-6">
              <div className="w-full max-w-xs">
                <ConnectButton.Custom>
                  {({
                    account,
                    chain,
                    openAccountModal,
                    openChainModal,
                    openConnectModal,
                    mounted,
                  }) => {
                    const ready = mounted;
                    const connected = ready && account && chain;

                    return (
                      <div
                        {...(!ready && {
                          'aria-hidden': true,
                          style: {
                            opacity: 0,
                            pointerEvents: 'none',
                            userSelect: 'none',
                          },
                        })}
                        className="w-full"
                      >
                        {(() => {
                          if (!connected) {
                            return (
                              <button
                                onClick={openConnectModal}
                                className="w-full btn-primary text-navy hover:opacity-90 px-8 py-4 rounded-2xl text-lg font-semibold transition-all flex items-center justify-center gap-2"
                              >
                                <Wallet size={20} />
                                Connect Wallet
                              </button>
                            );
                          }

                          if (chain.unsupported) {
                            return (
                              <button
                                onClick={openChainModal}
                                className="w-full bg-red-500 text-white px-8 py-4 rounded-2xl text-lg font-semibold transition-all"
                              >
                                Wrong Network
                              </button>
                            );
                          }

                          return (
                            <div className="flex flex-col gap-3 w-full">
                              <button
                                onClick={openChainModal}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-all"
                              >
                                {chain.hasIcon && chain.iconUrl && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    alt={chain.name ?? 'Chain'}
                                    src={chain.iconUrl}
                                    className="w-5 h-5 rounded-full"
                                  />
                                )}
                                <span className="font-medium">{chain.name}</span>
                              </button>
                              <button
                                onClick={openAccountModal}
                                className="w-full btn-primary text-navy px-8 py-4 rounded-2xl text-lg font-semibold transition-all flex items-center justify-center gap-2"
                              >
                                {account.displayName}
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  }}
                </ConnectButton.Custom>
              </div>
              
              {/* Version info */}
              <p className="text-xs text-white/30">
                NeverSell v1.0 • DeFi Made Simple
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
