'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Wallet, 
  PiggyBank, 
  Landmark, 
  Layers,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  highlight?: boolean;
}

const navItems: NavItem[] = [
  { href: '/app', label: 'Home', icon: LayoutDashboard },
  { href: '/app/fund', label: 'Fund', icon: Wallet },
  { href: '/app/lend', label: 'Lend', icon: PiggyBank },
  { href: '/app/borrow', label: 'Borrow', icon: Landmark },
  { href: '/app/pools', label: 'Pools', icon: Layers },
  { href: '/app/vaults', label: 'Portfolios', icon: Sparkles, highlight: true },
];

/**
 * MobileNav - Bottom navigation for mobile
 * Fixed bottom tab bar with icons and labels
 */
export function MobileNav() {
  const pathname = usePathname();
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      {/* Gradient fade */}
      <div className="absolute inset-x-0 -top-6 h-6 bg-gradient-to-t from-navy to-transparent pointer-events-none" />
      
      {/* Nav bar */}
      <div className="flex items-center justify-around h-16 px-2 bg-navy/95 backdrop-blur-xl border-t border-white/5 safe-area-pb">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/app' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors relative',
                isActive ? 'text-mint' : item.highlight ? 'text-purple-400' : 'text-white/40'
              )}
            >
              {/* Highlight glow for Portfolios */}
              {item.highlight && !isActive && (
                <div className="absolute inset-0 bg-gradient-to-t from-purple-500/10 to-transparent rounded-lg pointer-events-none" />
              )}
              
              <item.icon 
                size={22} 
                className={cn(
                  'transition-all',
                  isActive && 'drop-shadow-[0_0_8px_rgba(46,213,115,0.5)]',
                  item.highlight && !isActive && 'drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]'
                )} 
              />
              <span className={cn(
                'text-[10px] font-medium',
                isActive ? 'text-mint' : item.highlight ? 'text-purple-400' : 'text-white/40'
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
