import Image from 'next/image';
import { Bell } from 'lucide-react';

export function TopAppBar() {
  return (
    <header className="absolute left-0 right-0 top-0 z-40 h-16 border-b border-grayscale-100 bg-white">
      <div className="pointer-events-none flex h-7 items-center justify-center">
        <div className="h-5 w-32 rounded-full bg-grayscale-900/90" />
      </div>
      <div className="flex h-9 items-center justify-between px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Image
            src="/brand-logo.svg"
            alt="兒童新樂園 Logo"
            width={20}
            height={20}
            className="h-5 w-5 object-contain"
            priority
          />
          <h1 className="truncate font-display text-lg font-semibold text-grayscale-900">台北迪士尼</h1>
        </div>
        <button className="rounded-full p-2 text-grayscale-600 transition hover:bg-grayscale-50 active:scale-95">
          <Bell className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
