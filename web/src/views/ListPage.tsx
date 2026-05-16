'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, MapPin, ChevronRight, Layers, Rocket, Bike, Navigation, Bookmark, Crosshair, Ticket } from 'lucide-react';
import { APP_SHELL_IMAGE_SIZES, IMAGES } from '@/src/constants';
import { getFacilityImageUrl } from '@/src/lib/facility-images';
import {
  FacilityFilterToggleButton,
  FacilityRideFilterPanel,
  getActiveRideFilterCount,
} from '@/src/components/FacilityRideFilterPanel';
import {
  buildPlaceDetailsMap,
  getFloorText,
  getMatchingActiveFilterLabels,
  isRidePoint,
  matchesListFilter,
  matchesTextFilter,
  normalizePlaceName,
} from '@/src/components/map/townpass-map-helpers';
import {
  loadTownPassPoints,
  getFacilityWaitMinutes,
  type RideFilterState,
  type PlaceDetail,
  type PlaceDetailsResponse,
  PLACE_DETAILS_URL,
  defaultRideFilters,
} from '@/src/lib/townpass-map-data';
import { cn } from '@/src/lib/utils';

type ListPageProps = {
  initialView?: 'list' | 'map';
};

type Attraction = {
  id: string;
  name: string;
  waitMinutes: number;
  wait: string;
  area: string;
  image: string;
  filters?: PlaceDetail['filters'];
  description?: string;
  floor?: number | null;
};

const fallbackAttractions: Attraction[] = [
  {
    id: 'fallback-1',
    name: '雲霄飛車',
    waitMinutes: 45,
    wait: '45 分鐘',
    area: '未來世界區',
    floor: null,
    image: IMAGES.ROLLERCOASTER,
  },
  {
    id: 'fallback-2',
    name: '夢幻旋轉木馬',
    waitMinutes: 5,
    wait: '5 分鐘',
    area: '童話王國區',
    floor: null,
    image: IMAGES.CAROUSEL,
  },
  {
    id: 'fallback-3',
    name: '擎天一柱',
    waitMinutes: 60,
    wait: '60 分鐘',
    area: '冒險之巔',
    floor: null,
    image: IMAGES.DROP_TOWER,
  },
  {
    id: 'fallback-4',
    name: '叢林大探險',
    waitMinutes: 30,
    wait: '30 分鐘',
    area: '熱帶雨林區',
    floor: null,
    image: IMAGES.RIVER_RAPIDS,
  },
];

export function ListPage({ initialView = 'list' }: ListPageProps) {
  const viewMode = initialView;
  const [attractions, setAttractions] = useState<Attraction[]>(fallbackAttractions);
  const [query, setQuery] = useState('');
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);
  const [rideFilters, setRideFilters] = useState<RideFilterState>(defaultRideFilters);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        const [{ facilityPoints }, detailsRes] = await Promise.all([
          loadTownPassPoints(),
          fetch(PLACE_DETAILS_URL, { cache: "no-store" }).catch(() => null),
        ]);

        const ridePoints = facilityPoints.filter(isRidePoint);

        if (cancelled || ridePoints.length === 0) {
          return;
        }

        let detailsMap = new Map<string, PlaceDetail>();
        if (detailsRes?.ok) {
          const detailsData = (await detailsRes.json()) as PlaceDetailsResponse;
          detailsMap = buildPlaceDetailsMap(detailsData.places ?? []);
        }

        setAttractions(
          ridePoints.map((point, index) => {
            const detail = detailsMap.get(normalizePlaceName(point.name));
            const waitMin = getFacilityWaitMinutes(point);
            return {
              id: point.id,
              name: point.name,
              waitMinutes: waitMin,
              wait: `${waitMin} 分鐘`,
              description: detail?.description,
              area: getFloorText(point.floor),
              floor: point.floor ?? null,
              image: getFacilityImageUrl(point.id),
              filters: detail?.filters,
            };
          }),
        );
      } catch {
        if (!cancelled) {
          setAttractions(fallbackAttractions);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleAttractions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const filteredAttractions = attractions.filter((attr) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        attr.name.toLowerCase().includes(normalizedQuery) ||
        (attr.description?.toLowerCase().includes(normalizedQuery) ?? false) ||
        attr.area.toLowerCase().includes(normalizedQuery);
      
      if (!matchesQuery) return false;

      const filters = attr.filters;
      const combinedSpecial = [
        ...(filters?.special ?? []),
        ...(filters?.environment ?? []),
      ];

      if (!matchesTextFilter(filters?.height, rideFilters.height)) return false;
      if (!matchesTextFilter(filters?.thrill, rideFilters.thrill)) return false;
      if (!matchesListFilter(filters?.environment, rideFilters.environment)) return false;
      if (!matchesTextFilter(filters?.price, rideFilters.price)) return false;
      if (!matchesListFilter(combinedSpecial, rideFilters.special)) return false;

      return true;
    });

    if (!sortDirection) {
      return filteredAttractions;
    }

    return [...filteredAttractions].sort((a, b) =>
      sortDirection === 'asc'
        ? a.waitMinutes - b.waitMinutes
        : b.waitMinutes - a.waitMinutes,
    );
  }, [attractions, query, rideFilters, sortDirection]);

  const resetFilters = () => {
    setQuery('');
    setSortDirection(null);
    setRideFilters(defaultRideFilters);
  };

  const activeRideFilterCount = getActiveRideFilterCount(rideFilters);
  const hasActiveRideFilters = activeRideFilterCount > 0;
  const hasActiveFilters =
    query.trim().length > 0 || sortDirection !== null || hasActiveRideFilters;

  const sortOptions: { value: 'asc' | 'desc' | null; label: string }[] = [
    { value: null, label: '預設' },
    { value: 'asc', label: '等待最短' },
    { value: 'desc', label: '等待最長' },
  ];

  return (
    <div className="relative h-full flex flex-col">
      {/* Header Controls */}
      <div className="absolute left-0 right-0 top-0 z-20 space-y-3 border-b border-grayscale-100 bg-white/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/90">
        <div className="relative">
          <div className="relative pr-[4.25rem]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grayscale-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="tp-search-field shadow-sm"
              placeholder="搜尋設施或表演..."
            />
          </div>
          <FacilityFilterToggleButton
            className="absolute right-0 top-0"
            open={filterPanelOpen}
            activeCount={activeRideFilterCount}
            highlighted={filterPanelOpen || hasActiveRideFilters}
            onClick={() => setFilterPanelOpen((open) => !open)}
            ariaLabel="開啟設施篩選器"
          />
        </div>

        {filterPanelOpen && (
          <FacilityRideFilterPanel
            rideFilters={rideFilters}
            onRideFiltersChange={setRideFilters}
            onReset={resetFilters}
            resetDisabled={!hasActiveFilters}
            footer={
              <div className="space-y-2 border-t border-grayscale-100 pt-3">
                <p className="text-xs font-bold text-grayscale-500">等待時間排序</p>
                <div className="flex flex-wrap gap-2">
                  {sortOptions.map((option) => {
                    const selected = sortDirection === option.value;
                    return (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() => setSortDirection(option.value)}
                        className={cn(
                          'rounded-full border px-3 py-1.5 text-xs font-semibold transition active:scale-95',
                          selected
                            ? 'border-primary bg-primary text-white'
                            : 'border-grayscale-100 bg-white text-grayscale-700',
                        )}
                        aria-pressed={selected}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            }
          />
        )}

      </div>

      <div className="flex-1 relative overflow-hidden flex flex-col">
        {viewMode === 'list' ? (
          <div
            className={cn(
              'flex-1 space-y-3 overflow-y-auto px-4 pb-32 no-scrollbar',
              filterPanelOpen ? 'pt-[30rem]' : 'pt-24',
            )}
          >
            {visibleAttractions.length === 0 && (
              <div className="rounded-xl border border-grayscale-100 bg-white p-6 text-center text-sm font-medium text-grayscale-500">
                找不到符合條件的設施
              </div>
            )}
            {visibleAttractions.map((attr) => {
              const activeFilterLabels = hasActiveRideFilters
                ? getMatchingActiveFilterLabels(attr.filters, rideFilters)
                : [];

              return (
                <article
                  key={attr.id}
                  className="overflow-hidden rounded-2xl border border-grayscale-100 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex gap-3 p-3">
                    <div className="relative h-[5.5rem] w-[5.5rem] shrink-0 overflow-hidden rounded-xl bg-grayscale-100">
                      <Image
                        src={attr.image}
                        alt={attr.name}
                        className="object-cover"
                        fill
                        sizes="88px"
                      />
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-display text-base font-semibold text-grayscale-900">
                            {attr.name}
                          </h3>
                          <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-grayscale-500">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary/80" />
                            {attr.area}
                          </p>
                        </div>
                        <span className="shrink-0 whitespace-nowrap rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary ring-1 ring-primary/10">
                          等待 {attr.waitMinutes} 分鐘
                        </span>
                      </div>

                      {attr.description && (
                        <p className="mt-2 line-clamp-2 text-xs leading-5 text-grayscale-600">
                          {attr.description}
                        </p>
                      )}

                      {activeFilterLabels.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {activeFilterLabels.map((label) => (
                            <span
                              key={label}
                              className="rounded-full border border-primary/20 bg-primary-50 px-2 py-0.5 text-[10px] font-semibold text-primary"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      )}

                      <Link
                        href={`/facilities/${encodeURIComponent(attr.id)}`}
                        className="mt-2.5 inline-flex items-center text-xs font-bold text-primary"
                      >
                        查看詳情
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="flex-1 relative bg-primary-100">
            {/* Map Canvas */}
            <Image src={IMAGES.MAP} alt="Map" className="object-cover grayscale-[20%] opacity-80" fill sizes={APP_SHELL_IMAGE_SIZES} />
            
            {/* Markers */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 animate-bounce">
              <div className="flex flex-col items-center">
                <div className="bg-primary text-white px-3 py-1 rounded-full text-[10px] font-bold mb-1 shadow-md border border-white">25 min</div>
                <div className="relative">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white ring-4 ring-primary/20">
                    <Rocket className="w-6 h-6 fill-current" />
                  </div>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white" />
                </div>
              </div>
            </div>

            <div className="absolute top-[45%] left-[20%] z-20">
              <div className="flex flex-col items-center scale-90 opacity-90">
                <div className="bg-white text-grayscale-700 px-3 py-1 rounded-full text-[10px] font-bold mb-1 shadow-sm border border-grayscale-100">15 min</div>
                <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center text-white shadow-md border-2 border-white">
                  <Bike className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Floating Selection Sheet (Simulation) */}
            <div className="absolute bottom-20 left-0 right-0 p-4 transition-transform z-30">
              <div className="bg-white rounded-2xl shadow-xl border border-grayscale-100 overflow-hidden">
                <div className="w-10 h-1 bg-grayscale-200 rounded-full mx-auto my-3" />
                <div className="px-4 pb-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded">冒險區</span>
                        <span className="text-grayscale-500 text-[10px] font-bold">• 已開放</span>
                      </div>
                      <h2 className="text-xl font-display font-semibold text-on-surface">太空奇航</h2>
                    </div>
                    <div className="text-right">
                      <span className="text-primary font-display font-semibold text-2xl">25</span>
                      <p className="text-grayscale-500 text-[10px] font-bold">分鐘等候</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-grayscale-50 p-3 rounded-xl flex items-center gap-3">
                       <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-primary border border-grayscale-100"><Layers className="w-5 h-5" /></div>
                       <div><p className="text-grayscale-500 text-[10px] font-bold">身高限制</p><p className="text-sm font-semibold">110cm 以上</p></div>
                    </div>
                    <div className="bg-grayscale-50 p-3 rounded-xl flex items-center gap-3">
                       <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-secondary border border-grayscale-100"><Ticket className="w-5 h-5" /></div>
                       <div><p className="text-grayscale-500 text-[10px] font-bold">通行證</p><p className="text-sm font-semibold">適用快通</p></div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button className="tp-btn-primary h-12 flex-1">
                      <Navigation className="w-5 h-5" /> 立即前往
                    </button>
                    <button className="flex h-12 w-12 items-center justify-center rounded-full border border-primary text-primary active:scale-95">
                      <Bookmark className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button className="absolute right-4 bottom-72 z-30 w-12 h-12 bg-white shadow-lg rounded-full flex items-center justify-center text-grayscale-700 active:scale-90 border border-grayscale-100">
               <Crosshair className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
