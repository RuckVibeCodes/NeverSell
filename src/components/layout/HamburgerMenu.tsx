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

interface HamburgerMenuProps {
  onOpenChange?: (isOpen: boolean) => void;
}

/**
 * HamburgerMenu - Fullscreen overlay menu for mobile
 * Completely solid background - no transparency
 */
export function HamburgerMenu({ onOpenChange }: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Notify parent of state changes
  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-white/5 transition-colors"
        style={{ zIndex: isOpen ? 10001 : 70 }}
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={24} className="text-white" /> : <Menu size={24} className="text-white" />}
      </button>

      {/* Fullscreen Mobile Menu */}
      {isOpen && (
        <div 
          className="lg:hidden"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10000,
            backgroundColor: '#05070A',
          }}
        >
          {/* Header spacer for hamburger button */}
          <div className="h-16" />
          
          {/* Scrollable content area */}
          <div className="flex flex-col h-[calc(100%-4rem)] overflow-y-auto">
            {/* Nav links - centered */}
            <nav className="flex-1 flex flex-col items-center justify-center gap-2 px-6 py-8">
              {navItems.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== '/app' && pathname.startsWith(item.href));
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-6 py-3 rounded-2xl text-xl font-display transition-all duration-200 w-full max-w-xs justify-center',
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
            <div className="flex flex-col items-center gap-4 px-6 pb-8 pt-4 border-t border-white/5">
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
                                className="w-full bg-mint text-navy hover:bg-mint/90 px-8 py-4 rounded-2xl text-lg font-semibold transition-all flex items-center justify-center gap-2"
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
                                className="w-full bg-mint text-navy px-8 py-4 rounded-2xl text-lg font-semibold transition-all flex items-center justify-center gap-2"
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
