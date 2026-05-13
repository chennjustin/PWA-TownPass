import { Trees, Bell } from 'lucide-react';

export function TopAppBar() {
  return (
    <header className="absolute left-0 right-0 top-0 z-40 h-16 bg-surface shadow-sm">
      <div className="pointer-events-none flex h-7 items-center justify-center">
        <div className="h-5 w-32 rounded-full bg-black/95" />
      </div>
      <div className="flex h-9 items-center justify-between px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Trees className="h-5 w-5 text-primary" />
          <h1 className="truncate font-display text-lg font-medium text-primary">台北樂園通</h1>
        </div>
        <button className="p-1 text-grayscale-700 transition-transform hover:opacity-80 active:scale-95">
          <Bell className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
