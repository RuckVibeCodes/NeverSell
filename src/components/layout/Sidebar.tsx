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
  { href: '/app', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/app/deposit', label: 'Deposit', icon: ArrowDownToLine },
  { href: '/app/borrow', label: 'Borrow', icon: Landmark },
  { href: '/app/vaults', label: 'Vaults', icon: Vault },
  { href: '/app/settings', label: 'Settings', icon: Settings },
];

/**
 * Sidebar - Desktop navigation
 * Fixed left sidebar with navigation links
 */
export function Sidebar() {
  const pathname = usePathname();
  
  return (
    <div className="flex flex-col h-full pt-4 px-3 bg-navy border-r border-white/5">
      {/* Navigation links */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/app' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-mint/10 text-mint'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              )}
            >
              <item.icon 
                size={20} 
                className={cn(
                  'transition-colors',
                  isActive ? 'text-mint' : 'text-white/40'
                )} 
              />
              <span>{item.label}</span>
              
              {/* Active indicator */}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-mint" />
              )}
            </Link>
          );
        })}
      </nav>
      
      {/* Bottom section - could add help/docs links */}
      <div className="pb-4 pt-4 border-t border-white/5">
        <div className="px-3 py-2 text-xs text-white/30">
          NeverSell v1.0
        </div>
      </div>
    </div>
  );
}
