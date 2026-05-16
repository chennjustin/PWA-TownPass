'use client';

import { Home, List, Map, Calendar } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/src/lib/utils';

export function BottomNavBar() {
  const pathname = usePathname();
  const navItems = [
    { icon: Home, label: '首頁', path: '/' },
    { icon: List, label: '設施列表', path: '/facilities' },
    { icon: Map, label: '地圖', path: '/map' },
    { icon: Calendar, label: '活動', path: '/events' },
  ];

  return (
    <nav
      className="absolute bottom-0 left-0 right-0 z-40 flex min-h-[80px] items-center border-t border-grayscale-100 bg-white px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]"
      style={{ boxShadow: 'var(--shadow-nav)' }}
    >
      {navItems.map((item) => {
        const isActive = item.path === '/' ? pathname === '/' : pathname.startsWith(item.path);

        return (
          <Link
            key={item.path}
            href={item.path}
            className={cn(
              'relative flex h-14 flex-1 flex-col items-center justify-center gap-0.5 transition-all duration-200 active:scale-95',
              isActive ? 'text-primary' : 'text-grayscale-500',
            )}
          >
            {isActive && (
              <span className="absolute top-0 h-0.5 w-10 rounded-full bg-primary" aria-hidden />
            )}
            <item.icon className={cn('h-6 w-6', isActive && 'stroke-[2.25]')} />
            <span className={cn('text-[10px]', isActive ? 'font-semibold' : 'font-medium')}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
