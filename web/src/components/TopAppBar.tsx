import { Trees, Bell } from 'lucide-react';

export function TopAppBar() {
  return (
    <header className="fixed top-0 w-full z-50 bg-surface flex justify-between items-center h-16 pt-2 px-4 max-w-7xl mx-auto shadow-sm">
      <div className="flex items-center gap-2">
        <Trees className="w-6 h-6 text-primary" />
        <h1 className="font-display font-medium text-xl text-primary">台北樂園通</h1>
      </div>
      <button className="p-2 text-grayscale-700 hover:opacity-80 transition-transform active:scale-95">
        <Bell className="w-6 h-6" />
      </button>
    </header>
  );
}
