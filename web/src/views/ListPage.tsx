'use client';

import Image from 'next/image';
import { type ComponentType, useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal, ChevronDown, MapPin, ChevronRight, Layers, Rocket, Bike, Sparkles, Navigation, Bookmark, Crosshair, Ticket } from 'lucide-react';
import { IMAGES } from '@/src/constants';
import { loadTownPassPoints } from '@/src/lib/townpass-map-data';

type ListPageProps = {
  initialView?: 'list' | 'map';
};

type Attraction = {
  id: string;
  name: string;
  waitMinutes: number;
  wait: string;
  tag: string;
  restriction: string;
  area: string;
  floor: number | null;
  dist: string;
  image: string;
  icon: ComponentType<{ className?: string }>;
};

const fallbackAttractions: Attraction[] = [
  {
    id: 'fallback-1',
    name: '雲霄飛車',
    waitMinutes: 45,
    wait: '45 分鐘',
    tag: '驚險刺激',
    restriction: '120cm',
    area: '未來世界區',
    floor: null,
    dist: '250m',
    image: IMAGES.ROLLERCOASTER,
    icon: Rocket
  },
  {
    id: 'fallback-2',
    name: '夢幻旋轉木馬',
    waitMinutes: 5,
    wait: '5 分鐘',
    tag: '親子同樂',
    restriction: '無限制',
    area: '童話王國區',
    floor: null,
    dist: '100m',
    image: IMAGES.CAROUSEL,
    icon: Sparkles
  },
  {
    id: 'fallback-3',
    name: '擎天一柱',
    waitMinutes: 60,
    wait: '60 分鐘',
    tag: '驚險刺激',
    restriction: '140cm',
    area: '冒險之巔',
    floor: null,
    dist: '450m',
    image: IMAGES.DROP_TOWER,
    icon: Layers
  },
  {
    id: 'fallback-4',
    name: '叢林大探險',
    waitMinutes: 30,
    wait: '30 分鐘',
    tag: '水上樂園',
    restriction: '110cm',
    area: '熱帶雨林區',
    floor: null,
    dist: '800m',
    image: IMAGES.RIVER_RAPIDS,
    icon: Bike
  }
];

const attractionImages = [
  IMAGES.ROLLERCOASTER,
  IMAGES.CAROUSEL,
  IMAGES.DROP_TOWER,
  IMAGES.RIVER_RAPIDS,
];

const attractionIcons = [Rocket, Sparkles, Layers, Bike];

const sampleWaits = [15, 25, 35, 45, 5];

export function ListPage({ initialView = 'list' }: ListPageProps) {
  const viewMode = initialView;
  const [attractions, setAttractions] = useState<Attraction[]>(fallbackAttractions);
  const [query, setQuery] = useState('');
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadFacilities = async () => {
      try {
        const { facilityPoints } = await loadTownPassPoints();
        if (cancelled || facilityPoints.length === 0) {
          return;
        }

        setAttractions(
          facilityPoints.map((point, index) => ({
            id: point.id,
            name: point.name,
            waitMinutes: sampleWaits[index % sampleWaits.length],
            wait: `${sampleWaits[index % sampleWaits.length]} 分鐘`,
            tag: point.category,
            restriction: '無限制',
            area: typeof point.floor === 'number' ? `${point.floor} 樓` : '園區設施',
            floor: point.floor ?? null,
            dist: `${Math.max(80, Math.round(index * 35 + 100))}m`,
            image: attractionImages[index % attractionImages.length],
            icon: attractionIcons[index % attractionIcons.length],
          })),
        );
      } catch {
        if (!cancelled) {
          setAttractions(fallbackAttractions);
        }
      }
    };

    loadFacilities();

    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(attractions.map((attr) => attr.tag))).filter(Boolean),
    [attractions],
  );

  const floors = useMemo(
    () =>
      Array.from(
        new Set(
          attractions
            .map((attr) => attr.floor)
            .filter((floor): floor is number => typeof floor === 'number'),
        ),
      ).sort((a, b) => a - b),
    [attractions],
  );

  const visibleAttractions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const filteredAttractions = attractions.filter((attr) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        attr.name.toLowerCase().includes(normalizedQuery) ||
        attr.tag.toLowerCase().includes(normalizedQuery);
      const matchesCategory = !selectedCategory || attr.tag === selectedCategory;
      const matchesFloor = selectedFloor === null || attr.floor === selectedFloor;

      return matchesQuery && matchesCategory && matchesFloor;
    });

    if (!sortDirection) {
      return filteredAttractions;
    }

    return [...filteredAttractions].sort((a, b) =>
      sortDirection === 'asc'
        ? a.waitMinutes - b.waitMinutes
        : b.waitMinutes - a.waitMinutes,
    );
  }, [attractions, query, selectedCategory, selectedFloor, sortDirection]);

  const resetFilters = () => {
    setQuery('');
    setSortDirection(null);
    setSelectedCategory(null);
    setSelectedFloor(null);
  };

  const hasActiveFilters =
    query.trim().length > 0 ||
    sortDirection !== null ||
    selectedCategory !== null ||
    selectedFloor !== null;

  const selectClassName = (active: boolean) =>
    `h-10 appearance-none rounded-full border px-4 pr-9 text-sm font-semibold outline-none transition ${
      active
        ? 'border-primary bg-primary text-white shadow-sm'
        : 'border-grayscale-100 bg-white text-grayscale-700'
    }`;

  return (
    <div className="pt-16 h-full flex flex-col">
      {/* Header Controls */}
      <div className="fixed left-0 right-0 top-16 z-40 px-4 py-3 space-y-3 bg-surface shadow-sm border-b border-grayscale-100">
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-grayscale-500" />
            <input 
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full h-11 pl-10 pr-4 bg-white border border-grayscale-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" 
              placeholder="搜尋設施或表演..." 
            />
          </div>
          <button
            onClick={() => setFilterPanelOpen((open) => !open)}
            className={`w-11 h-11 flex items-center justify-center rounded-xl border transition-all active:scale-95 ${
              filterPanelOpen || hasActiveFilters
                ? 'border-primary bg-primary text-white shadow-sm'
                : 'border-grayscale-100 bg-white text-primary hover:bg-primary-50'
            }`}
            aria-expanded={filterPanelOpen}
            aria-label="開啟篩選器"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

        {filterPanelOpen && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            <label className="relative shrink-0">
              <select
                value={sortDirection ?? ''}
                onChange={(event) =>
                  setSortDirection(
                    event.target.value === ''
                      ? null
                      : (event.target.value as 'asc' | 'desc'),
                  )
                }
                className={selectClassName(sortDirection !== null)}
              >
                <option value="">等待時間</option>
                <option value="asc">等待時間（最短）</option>
                <option value="desc">等待時間（最長）</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            </label>

            <label className="relative shrink-0">
              <select
                value={selectedCategory ?? ''}
                onChange={(event) => setSelectedCategory(event.target.value || null)}
                className={selectClassName(selectedCategory !== null)}
              >
                <option value="">設施類型</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            </label>

            <label className="relative shrink-0">
              <select
                value={selectedFloor ?? ''}
                onChange={(event) =>
                  setSelectedFloor(event.target.value ? Number(event.target.value) : null)
                }
                className={selectClassName(selectedFloor !== null)}
              >
                <option value="">樓層</option>
                {floors.map((floor) => (
                  <option key={floor} value={floor}>
                    {floor} 樓
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            </label>

            <button
              onClick={resetFilters}
              className="h-10 shrink-0 rounded-full border border-grayscale-100 bg-white px-4 text-sm font-semibold text-grayscale-700 transition active:scale-95 disabled:opacity-40"
              disabled={!hasActiveFilters}
            >
              清除篩選
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 relative overflow-hidden flex flex-col">
        {viewMode === 'list' ? (
          <div className={`flex-1 overflow-y-auto px-4 pb-32 space-y-4 no-scrollbar ${filterPanelOpen ? 'pt-40' : 'pt-24'}`}>
            {visibleAttractions.length === 0 && (
              <div className="rounded-xl border border-grayscale-100 bg-white p-6 text-center text-sm font-medium text-grayscale-500">
                找不到符合條件的設施
              </div>
            )}
            {visibleAttractions.map((attr) => (
              <div key={attr.id} className="bg-white border border-grayscale-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row">
                  <div className="sm:w-32 h-40 sm:h-auto shrink-0 bg-grayscale-100 relative">
                    <Image src={attr.image} alt={attr.name} className="object-cover" fill sizes="(min-width: 640px) 128px, 100vw" />
                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm p-1.5 rounded-lg border border-grayscale-100">
                       <attr.icon className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="font-display font-semibold text-md text-on-surface">{attr.name}</h3>
                        <div className="flex flex-col items-end">
                          <span className="font-display font-semibold text-primary">{attr.wait}</span>
                          <span className="text-[10px] text-grayscale-500 font-bold">預估排隊</span>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="px-2 py-0.5 bg-primary-50 text-primary rounded-full text-[10px] font-bold">{attr.tag}</span>
                        <span className="px-2 py-0.5 bg-grayscale-100 text-grayscale-700 rounded-full text-[10px] font-bold">身高限制 {attr.restriction}</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-grayscale-100 flex items-center justify-between text-grayscale-500">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span className="text-[10px] font-bold">{attr.area} · {attr.dist}</span>
                      </div>
                      <button className="text-primary font-bold text-[12px] flex items-center">
                        查看詳情 <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 relative bg-primary-100">
            {/* Map Canvas */}
            <Image src={IMAGES.MAP} alt="Map" className="object-cover grayscale-[20%] opacity-80" fill sizes="100vw" />
            
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
                    <button className="flex-1 bg-primary text-white h-12 rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-95 transition-all">
                      <Navigation className="w-5 h-5" /> 立即前往
                    </button>
                    <button className="w-12 h-12 border border-primary text-primary rounded-xl flex items-center justify-center active:scale-95">
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
