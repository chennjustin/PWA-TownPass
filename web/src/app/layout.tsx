import type { Metadata, Viewport } from 'next';
import './globals.css';
import { TopAppBar } from '@/src/components/TopAppBar';
import { BottomNavBar } from '@/src/components/BottomNavBar';

export const metadata: Metadata = {
  title: '台北迪士尼',
  description: '台北迪士尼 PWA',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/brand-logo.svg',
    apple: '/brand-logo.svg',
    shortcut: '/brand-logo.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#00afb8',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant" suppressHydrationWarning>
      <body className="bg-grayscale-200">
        <div className="flex min-h-screen w-full items-center justify-center p-2 md:p-6">
          <div className="relative h-[100dvh] w-full max-w-[430px] overflow-hidden rounded-[2.5rem] bg-grayscale-800 p-2 shadow-[0_20px_48px_rgba(33,33,33,0.2)] md:h-[860px]">
            <div className="relative flex h-full flex-col overflow-hidden rounded-[2rem] bg-surface text-on-surface">
              <TopAppBar />
              <main className="tp-page absolute inset-x-0 bottom-[80px] top-16 overflow-y-auto overscroll-contain">
                {children}
              </main>
              <BottomNavBar />
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
