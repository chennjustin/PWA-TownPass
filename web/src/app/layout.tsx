import type { Metadata, Viewport } from 'next';
import './globals.css';
import { TopAppBar } from '@/src/components/TopAppBar';
import { BottomNavBar } from '@/src/components/BottomNavBar';

export const metadata: Metadata = {
  title: '台北樂園通',
  description: '台北樂園通 PWA',
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#006876',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body>
        <div className="min-h-screen bg-surface flex flex-col">
          <TopAppBar />
          <main className="flex-1 overflow-hidden">{children}</main>
          <BottomNavBar />
        </div>
      </body>
    </html>
  );
}
