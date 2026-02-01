'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ArrowDownToLine, 
  Landmark, 
  Vault, 
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { href: '/app', label: 'Home', icon: LayoutDashboard },
  { href: '/app/deposit', label: 'Deposit', icon: ArrowDownToLine },
  { href: '/app/borrow', label: 'Borrow', icon: Landmark },
  { href: '/app/vaults', label: 'Vaults', icon: Vault },
  { href: '/app/settings', label: 'Settings', icon: Settings },
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
                'flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors',
                isActive ? 'text-mint' : 'text-white/40'
              )}
            >
              <item.icon 
                size={22} 
                className={cn(
                  'transition-all',
                  isActive && 'drop-shadow-[0_0_8px_rgba(46,213,115,0.5)]'
                )} 
              />
              <span className={cn(
                'text-[10px] font-medium',
                isActive ? 'text-mint' : 'text-white/40'
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
