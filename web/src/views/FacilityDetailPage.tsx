'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Navigation } from 'lucide-react';
import { FacilityPointDetailContent } from '@/src/components/FacilityPointDetailContent';
import { getAppNow } from '@/src/lib/app-time';
import { getFacilityImageUrl } from '@/src/lib/facility-images';
import {
  buildPlaceDetailsMap,
  getParkOperatingStatus,
  isRidePoint,
  normalizePlaceName,
} from '@/src/components/map/townpass-map-helpers';
import {
  getFacilityWaitMinutes,
  loadTownPassPoints,
  PLACE_DETAILS_URL,
  type PlaceDetail,
  type PlaceDetailsResponse,
  type TownPassPoint,
} from '@/src/lib/townpass-map-data';

type FacilityDetailState = {
  point: TownPassPoint;
  detail: PlaceDetail | null;
};

export function FacilityDetailPage() {
  const params = useParams<{ id: string }>();
  const facilityId = decodeURIComponent(params.id ?? '');
  const [state, setState] = useState<FacilityDetailState | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const operatingStatus = useMemo(() => getParkOperatingStatus(getAppNow()), []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setNotFound(false);

      try {
        const [{ facilityPoints }, detailsRes] = await Promise.all([
          loadTownPassPoints(),
          fetch(PLACE_DETAILS_URL, { cache: 'no-store' }).catch(() => null),
        ]);

        const ridePoints = facilityPoints.filter(isRidePoint);
        const point = ridePoints.find((item) => item.id === facilityId);

        if (!point) {
          if (!cancelled) {
            setState(null);
            setNotFound(true);
          }
          return;
        }

        let detail: PlaceDetail | null = null;
        if (detailsRes?.ok) {
          const detailsData = (await detailsRes.json()) as PlaceDetailsResponse;
          const detailsMap = buildPlaceDetailsMap(detailsData.places ?? []);
          detail = detailsMap.get(normalizePlaceName(point.name)) ?? null;
        }

        if (!cancelled) {
          setState({ point, detail });
          setNotFound(false);
        }
      } catch {
        if (!cancelled) {
          setState(null);
          setNotFound(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    if (facilityId) {
      load();
    } else {
      setLoading(false);
      setNotFound(true);
    }

    return () => {
      cancelled = true;
    };
  }, [facilityId]);

  const waitMinutes = useMemo(
    () => (state ? getFacilityWaitMinutes(state.point) : null),
    [state],
  );

  const mapHref = state
    ? `/map?pointId=${encodeURIComponent(facilityId)}&focus=1&lat=${state.point.lat}&lng=${state.point.lng}`
    : '/map';

  const imageUrl = useMemo(
    () => (state ? getFacilityImageUrl(state.point.id) : ''),
    [state],
  );

  return (
    <section className="flex h-full flex-col overflow-hidden">
      <header className="z-20 shrink-0 border-b border-grayscale-100 bg-white/95 px-4 pb-3 pt-4 backdrop-blur supports-[backdrop-filter]:bg-white/90">
        <div className="flex items-center gap-2">
          <Link
            href="/facilities"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-grayscale-700 transition hover:bg-grayscale-50 active:scale-95"
            aria-label={'\u8fd4\u56de'}
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="truncate text-lg font-semibold text-grayscale-900">{'\u8a2d\u65bd\u8a73\u60c5'}</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-28">
        {loading && (
          <div className="mx-4 mt-4 rounded-2xl border border-grayscale-100 bg-white p-8 text-center text-sm font-medium text-grayscale-500">
            {'\u8f09\u5165\u4e2d...'}
          </div>
        )}

        {!loading && notFound && (
          <div className="mx-4 mt-4 space-y-4 rounded-2xl border border-grayscale-100 bg-white p-8 text-center">
            <p className="text-sm font-medium text-grayscale-600">{'\u627e\u4e0d\u5230\u6b64\u8a2d\u65bd'}</p>
            <Link href="/facilities" className="tp-btn-outline inline-flex">
              {'\u8fd4\u56de\u8a2d\u65bd\u5217\u8868'}
            </Link>
          </div>
        )}

        {!loading && state && (
          <div className="flex flex-col gap-4 px-4 pt-4 pb-4">
            <FacilityPointDetailContent
              point={state.point}
              placeDetail={state.detail}
              operatingStatus={operatingStatus}
              waitMinutes={waitMinutes}
              imageUrl={imageUrl}
              imageSize="page"
            />

            <Link
              href={mapHref}
              className="tp-btn-primary mt-2 flex w-full shrink-0 items-center justify-center gap-2"
            >
              <Navigation className="h-5 w-5" />
              {'\u5728\u5730\u5716\u4e0a\u67e5\u770b'}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
