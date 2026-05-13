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
    <nav className="absolute bottom-0 left-0 right-0 z-40 flex min-h-[80px] items-center border-t border-grayscale-100 bg-surface px-3 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-10px_16px_0_rgba(11,13,14,0.08)]">
      {navItems.map((item) => {
        const isActive = item.path === '/' ? pathname === '/' : pathname.startsWith(item.path);

        return (
          <Link
            key={item.path}
            href={item.path}
            className={cn(
              'flex h-14 flex-1 flex-col items-center justify-center transition-all duration-200 active:scale-95',
              isActive ? 'text-primary font-semibold' : 'text-grayscale-500 font-normal'
            )}
          >
            <item.icon className="w-6 h-6" />
            <span className="text-[10px] mt-1">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
