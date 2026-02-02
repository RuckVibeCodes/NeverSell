'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
 * Uses React Portal to render at document.body level
 */
export function HamburgerMenu({ onOpenChange }: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // Wait for client-side mount for portal
  useEffect(() => {
    setMounted(true);
  }, []);

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
      document.body.style.top = `-${window.scrollY}px`;
    } else {
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
    };
  }, [isOpen]);

  const menuContent = isOpen && mounted ? (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        backgroundColor: '#030508',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Close button in top right */}
      <div 
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          padding: '12px 16px',
          height: '64px',
          alignItems: 'center',
        }}
      >
        <button
          onClick={() => setIsOpen(false)}
          style={{
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
          aria-label="Close menu"
        >
          <X size={24} color="white" />
        </button>
      </div>
      
      {/* Scrollable content area */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Nav links - centered */}
        <nav style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '8px',
          padding: '16px 24px',
        }}>
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
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          padding: '16px 24px 32px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}>
          <div className="w-full max-w-xs">
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                mounted: walletMounted,
              }) => {
                const ready = walletMounted;
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
  ) : null;

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-white/5 transition-colors"
        aria-label="Toggle menu"
      >
        <Menu size={24} className="text-white" />
      </button>

      {/* Portal to body - ensures menu renders above everything */}
      {mounted && menuContent && createPortal(menuContent, document.body)}
    </>
  );
}
