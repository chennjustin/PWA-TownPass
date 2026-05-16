import { Suspense } from 'react';
import { MapPageClient } from './MapPageClient';

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center text-sm font-medium text-grayscale-500">
          地圖載入中...
        </div>
      }
    >
      <MapPageClient />
    </Suspense>
  );
}
