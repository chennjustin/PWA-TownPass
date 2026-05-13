'use client';

import { Home, List, Calendar, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/src/lib/utils';

export function BottomNavBar() {
  const pathname = usePathname();
  const navItems = [
    { icon: Home, label: '首頁', path: '/' },
    { icon: List, label: '設施列表', path: '/facilities' },
    { icon: Calendar, label: '活動', path: '/events' },
    { icon: User, label: '我的', path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center px-4 pb-8 h-[72px] bg-surface border-t border-grayscale-100 shadow-[0_-10px_16px_0_rgba(11,13,14,0.08)]">
      {navItems.map((item) => {
        const isActive = item.path === '/' ? pathname === '/' : pathname.startsWith(item.path);

        return (
          <Link
            key={item.path}
            href={item.path}
            className={cn(
              'flex flex-col items-center justify-center transition-all duration-200 active:scale-95',
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
