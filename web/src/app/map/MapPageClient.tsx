'use client';

import { useSearchParams } from 'next/navigation';
import { TownPassMap } from '@/src/components/map/townpass-map';

export function MapPageClient() {
  const searchParams = useSearchParams();
  const pointId = searchParams.get('pointId');
  const focusOnly = searchParams.get('focus') === '1';
  const lat = Number(searchParams.get('lat'));
  const lng = Number(searchParams.get('lng'));
  const initialCenter =
    focusOnly && Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;

  return (
    <div className="h-full w-full">
      <TownPassMap
        initialPointId={pointId}
        initialPointFocusOnly={focusOnly}
        initialCenter={initialCenter}
      />
    </div>
  );
}
