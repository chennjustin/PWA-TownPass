'use client';

import Image from 'next/image';
import { Clock, MapPin, Sparkles } from 'lucide-react';
import {
  getFloorText,
  getPlaceDetailFilterTags,
  type ParkOperatingStatus,
} from '@/src/components/map/townpass-map-helpers';
import type { PlaceDetail, TownPassPoint } from '@/src/lib/townpass-map-data';
import { cn } from '@/src/lib/utils';

type FacilityPointDetailContentProps = {
  point: TownPassPoint;
  placeDetail: PlaceDetail | null;
  operatingStatus: ParkOperatingStatus;
  waitMinutes: number | null;
  imageUrl: string;
  /** 詳情頁用大圖；地圖 sheet 用較矮橫幅 */
  imageSize?: 'page' | 'sheet';
};

type FacilityAttribute = {
  label: string;
  value: string;
};

function getFacilityAttributes(placeDetail: PlaceDetail | null): FacilityAttribute[] {
  if (!placeDetail?.filters) {
    return [];
  }

  const { height, thrill, environment } = placeDetail.filters;
  const attrs: FacilityAttribute[] = [];

  if (height) {
    attrs.push({ label: '身高', value: height });
  }
  if (thrill) {
    attrs.push({ label: '刺激度', value: thrill });
  }
  if (environment && environment.length > 0) {
    attrs.push({ label: '環境', value: environment.join(' · ') });
  }

  const special = getPlaceDetailFilterTags(placeDetail).filter(
    (tag) => tag !== height && tag !== thrill && !environment?.includes(tag),
  );
  for (const tag of special.slice(0, 2)) {
    attrs.push({ label: '備註', value: tag });
  }

  return attrs;
}

function FacilityAttributesPanel({ attributes }: { attributes: FacilityAttribute[] }) {
  if (attributes.length === 0) {
    return null;
  }

  if (attributes.length <= 3) {
    return (
      <div
        className={cn(
          'grid divide-grayscale-100 overflow-hidden rounded-2xl border border-grayscale-100 bg-white',
          attributes.length === 1 && 'grid-cols-1',
          attributes.length === 2 && 'grid-cols-2 divide-x',
          attributes.length === 3 && 'grid-cols-3 divide-x',
        )}
      >
        {attributes.map((attr) => (
          <div key={`${attr.label}-${attr.value}`} className="px-3 py-3.5 text-center">
            <p className="text-[10px] font-bold text-grayscale-400">{attr.label}</p>
            <p className="mt-1.5 text-[11px] font-semibold leading-snug text-grayscale-800">
              {attr.value}
            </p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-grayscale-100 bg-white divide-y divide-grayscale-100">
      {attributes.map((attr) => (
        <div
          key={`${attr.label}-${attr.value}`}
          className="flex items-start justify-between gap-4 px-4 py-3"
        >
          <span className="shrink-0 text-xs font-bold text-grayscale-400">{attr.label}</span>
          <span className="text-right text-xs font-semibold leading-snug text-grayscale-800">
            {attr.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function WaitBadge({
  waitMinutes,
  operatingStatus,
  size = 'md',
}: {
  waitMinutes: number;
  operatingStatus: ParkOperatingStatus;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClass =
    size === 'lg'
      ? 'min-w-[4.5rem] px-3 py-2'
      : size === 'sm'
        ? 'min-w-[3.25rem] px-2 py-1'
        : 'min-w-[4rem] px-2.5 py-1.5';

  return (
    <div
      className={cn(
        'shrink-0 rounded-xl bg-primary-50 text-center ring-1 ring-primary/15',
        sizeClass,
      )}
    >
      <p className="text-[10px] font-bold text-primary/80">
        {operatingStatus.isOpen ? '預估等待' : '狀態'}
      </p>
      <p
        className={cn(
          'font-display font-semibold leading-none text-primary',
          size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-lg' : 'text-xl',
        )}
      >
        {operatingStatus.isOpen ? waitMinutes : '—'}
      </p>
      <p className="text-[10px] font-semibold text-grayscale-500">
        {operatingStatus.isOpen ? '分鐘' : operatingStatus.label}
      </p>
    </div>
  );
}

function FacilityHeroImage({
  imageUrl,
  alt,
  size,
}: {
  imageUrl: string;
  alt: string;
  size: 'page' | 'sheet';
}) {
  return (
    <div
      className={cn(
        'relative w-full overflow-hidden bg-grayscale-100',
        size === 'page' ? 'aspect-[16/10] rounded-2xl' : 'aspect-[2.4/1] rounded-xl',
      )}
    >
      <Image src={imageUrl} alt={alt} fill className="object-cover" sizes="(max-width: 430px) 100vw, 430px" priority={size === 'page'} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
    </div>
  );
}

/** 地圖底部 sheet 收合時的精簡標題 */
export function FacilityPointDetailSummary({
  point,
  placeDetail,
  waitMinutes,
  operatingStatus,
}: Omit<FacilityPointDetailContentProps, 'imageUrl' | 'imageSize'>) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <h2 className="truncate font-display text-lg font-semibold text-grayscale-900">{point.name}</h2>
        <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-grayscale-500">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
          {getFloorText(point.floor)}
        </p>
        {!placeDetail?.description && waitMinutes === null && (
          <p className="mt-1 text-xs text-grayscale-400">點擊展開查看更多資訊</p>
        )}
      </div>
      {waitMinutes !== null && (
        <WaitBadge waitMinutes={waitMinutes} operatingStatus={operatingStatus} size="sm" />
      )}
    </div>
  );
}

/** 設施詳情完整內容（詳情頁與地圖展開區共用） */
export function FacilityPointDetailContent({
  point,
  placeDetail,
  operatingStatus,
  waitMinutes,
  imageUrl,
  imageSize = 'page',
}: FacilityPointDetailContentProps) {
  const attributes = getFacilityAttributes(placeDetail);
  const description =
    placeDetail?.description ??
    '目前顯示的是園區地圖點位資料，可依樓層與關鍵字搜尋，並在地圖上查看即時位置。';

  return (
    <div className="space-y-3">
      <FacilityHeroImage imageUrl={imageUrl} alt={point.name} size={imageSize} />

      <div className="flex items-start justify-between gap-3 rounded-2xl border border-grayscale-100 bg-white p-4 shadow-sm">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold text-primary">遊樂設施</p>
          <h2 className="mt-0.5 font-display text-xl font-semibold leading-tight text-grayscale-900">
            {point.name}
          </h2>
          <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-grayscale-600">
            <MapPin className="h-4 w-4 shrink-0 text-primary" />
            {getFloorText(point.floor)}
          </p>
          <p className="mt-1 text-xs font-medium text-grayscale-500">{operatingStatus.hours}</p>
        </div>
        {waitMinutes !== null && (
          <WaitBadge waitMinutes={waitMinutes} operatingStatus={operatingStatus} size="lg" />
        )}
      </div>

      <FacilityAttributesPanel attributes={attributes} />

      <div className="rounded-2xl border border-grayscale-100 bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center gap-2 text-primary">
          <Sparkles className="h-4 w-4" />
          <p className="text-sm font-semibold">設施介紹</p>
        </div>
        <p className="text-sm leading-7 text-grayscale-700">{description}</p>
      </div>
    </div>
  );
}
