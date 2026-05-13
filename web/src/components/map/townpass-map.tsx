"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Baby,
  ChevronDown,
  Clock,
  FerrisWheel,
  MapPin,
  Navigation,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Tag,
  Utensils,
  X,
} from "lucide-react";
import { loadGoogleMapsScript } from "@/src/lib/google-maps-service";
import {
  loadTownPassPoints,
  parkBounds,
  parkCenter,
  type TownPassPoint,
  type RideFilterState,
  type PlaceDetail,
  type PlaceDetailsResponse,
  PLACE_DETAILS_URL,
  heightFilterOptions,
  thrillFilterOptions,
  environmentFilterOptions,
  priceFilterOptions,
  specialFilterOptions,
  defaultRideFilters,
  getFacilityWaitMinutes
} from "@/src/lib/townpass-map-data";

const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const googleMapsMapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;

type GoogleMapsMap = {
  fitBounds: (bounds: GoogleMapsLatLngBounds, padding?: number) => void;
  panTo: (position: { lat: number; lng: number }) => void;
  setZoom: (zoom: number) => void;
};

type GoogleMapsLegacyMarker = {
  addListener: (eventName: string, callback: () => void) => void;
  setMap: (map: GoogleMapsMap | null) => void;
  setIcon: (icon: any) => void;
  setZIndex: (zIndex: number) => void;
};

type GoogleMapsInfoWindow = {
  close: () => void;
};

type GoogleMapsLatLngBounds = {
  extend: (position: { lat: number; lng: number }) => void;
};

type GoogleMapsNamespace = {
  Map: new (
    element: HTMLElement,
    options: Record<string, unknown>,
  ) => GoogleMapsMap;
  Marker: new (options: Record<string, unknown>) => GoogleMapsLegacyMarker;
  InfoWindow: new () => GoogleMapsInfoWindow;
  LatLngBounds: new () => GoogleMapsLatLngBounds;
  Point: new (x: number, y: number) => unknown;
  Size: new (width: number, height: number) => unknown;
};

type MapLayerState = {
  facilities: boolean;
  restaurants: boolean;
};

type MapContentType = "facility" | "restaurant" | "shop";



type MarkerEntry = {
  marker: GoogleMapsLegacyMarker;
  pointId: string;
};

type MarkerKind = "restaurant" | "shop" | "ferrisWheel";



const contentTypeOptions: Array<{
  value: MapContentType;
  label: string;
  Icon: typeof FerrisWheel;
}> = [
  { value: "facility", label: "遊樂設施", Icon: FerrisWheel },
  { value: "restaurant", label: "餐廳", Icon: Utensils },
  { value: "shop", label: "商店", Icon: ShoppingBag },
];



function normalizePlaceName(name: string) {
  return name.replace(/\s+/g, "").replace(/[()（）]/g, "").toLowerCase();
}

function getMapsNamespace(): GoogleMapsNamespace | null {
  const maps = window.google?.maps;
  if (!maps) {
    return null;
  }
  return maps as unknown as GoogleMapsNamespace;
}

function getPointLabel(pointType: TownPassPoint["pointType"]) {
  return pointType === "facility" ? "設施" : "餐飲";
}

function getFloorText(floor?: number | null) {
  return typeof floor === "number" ? `${floor} 樓` : "樓層未標示";
}

function clearMarker(marker: GoogleMapsLegacyMarker) {
  marker.setMap(null);
}

function getMarkerKind(point: TownPassPoint): MarkerKind {
  const text = `${point.name}${point.category}`.toLowerCase();

  if (text.includes("商店") || text.includes("超商") || text.includes("拍貼") || text.includes("化石")) return "shop";
  if (point.pointType === "restaurant" || text.includes("餐") || text.includes("食")) return "restaurant";
  return "ferrisWheel";
}

function getPointContentType(point: TownPassPoint): MapContentType {
  if (point.pointType === "facility") {
    return "facility";
  }

  return getMarkerKind(point) === "shop" ? "shop" : "restaurant";
}

function isRidePoint(point: TownPassPoint) {
  return (
    point.pointType === "facility" &&
    ["大型遊樂設施", "K系列", "A系列"].includes(point.category)
  );
}

function getRecommendedHeightFilters(childHeight: string) {
  const height = Number(childHeight);
  if (!Number.isFinite(height) || height <= 0) {
    return [];
  }

  if (height < 90) {
    return ["幼童友善"];
  }

  if (height < 110) {
    return ["幼童友善", "小學門檻"];
  }

  return ["幼童友善", "小學門檻", "刺激挑戰"];
}

function matchesTextFilter(value: string | null | undefined, filter: string | null) {
  if (!filter) {
    return true;
  }

  if (!value) {
    return false;
  }

  return (
    value.includes(filter) ||
    (filter.includes("幼童友善") && value.includes("幼童友善")) ||
    (filter.includes("小學門檻") && value.includes("小學門檻")) ||
    (filter.includes("刺激挑戰") && value.includes("刺激挑戰"))
  );
}

function matchesListFilter(values: string[] | undefined, filter: string | null) {
  if (!filter) {
    return true;
  }

  return Boolean(values?.some((value) => value.includes(filter)));
}

function getMarkerIconPath(kind: MarkerKind) {
  switch (kind) {
    case "restaurant":
      return '<path d="M28 16v38M22 16v14a6 6 0 0 0 12 0V16M44 16v38M44 16c6 3 8 9 6 17-1 4-3 7-6 8"/>';
    case "ferrisWheel":
      return '<circle cx="36" cy="33" r="17"/><circle cx="36" cy="33" r="3"/><path d="M36 36v18M25 56h22M29 54l7-18 7 18M36 16v-6M24 21l-4-4M48 21l4-4M19 33h-6M59 33h-6M24 45l-4 4M48 45l4 4"/><rect x="32" y="9" width="8" height="6" rx="2"/><rect x="16" y="29" width="8" height="6" rx="2"/><rect x="48" y="29" width="8" height="6" rx="2"/><rect x="20" y="45" width="8" height="6" rx="2"/><rect x="44" y="45" width="8" height="6" rx="2"/>';
    case "shop":
      return '<path d="M25 29h22l3 24H22l3-24Z"/><path d="M30 29v-5a6 6 0 0 1 12 0v5"/>';
  }
}



function getParkOperatingStatus(date: Date) {
  const day = date.getDay();
  const minutes = date.getHours() * 60 + date.getMinutes();

  if (day === 1) {
    return {
      isOpen: false,
      label: "週一定期保養休園",
      hours: "週一休園（國定假日除外）",
    };
  }

  const closeMinutes = day === 6 ? 20 * 60 : day === 0 ? 18 * 60 : 17 * 60;
  const isOpen = minutes >= 9 * 60 && minutes < closeMinutes;
  const closeHour = String(closeMinutes / 60).padStart(2, "0");

  return {
    isOpen,
    label: isOpen ? "營業中" : "非營業時間",
    hours: `今日 09:00 - ${closeHour}:00`,
  };
}

function createMapMarkerIcon(point: TownPassPoint, selected: boolean, maps: GoogleMapsNamespace) {
  const fill = selected ? "#F36F7F" : "#FFFFFF";
  const stroke = selected ? "#FFFFFF" : "#9AAEC8";
  const size = selected ? 70 : 58;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 10}" viewBox="0 0 72 84">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="#0B0D0E" flood-opacity="0.18"/>
        </filter>
      </defs>
      <path filter="url(#shadow)" d="M18 5h36c8 0 13 5 13 13v35c0 8-5 13-13 13H43L36 78l-7-12H18C10 66 5 61 5 53V18C5 10 10 5 18 5Z" fill="${fill}"/>
      <g fill="none" stroke="${stroke}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
        ${getMarkerIconPath(getMarkerKind(point))}
      </g>
    </svg>
  `;

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new maps.Size(size, size + 10),
    anchor: new maps.Point(size / 2, size + 6),
  };
}

export function TownPassMap() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GoogleMapsMap | null>(null);
  const infoWindowRef = useRef<GoogleMapsInfoWindow | null>(null);
  const markersRef = useRef<MarkerEntry[]>([]);
  const userMarkerRef = useRef<GoogleMapsLegacyMarker | null>(null);

  const [layers, setLayers] = useState<MapLayerState>({
    facilities: true,
    restaurants: false,
  });
  const [statusText, setStatusText] = useState(
    googleMapsApiKey
      ? "地圖初始化中..."
      : "尚未設定 Google Maps API Key，請先填入 web/.env.local。",
  );
  const [query, setQuery] = useState("");
  const [filterPanelOpen, setFilterPanelOpen] = useState(true);
  const [selectedContentType, setSelectedContentType] = useState<MapContentType>("facility");
  const [childHeight, setChildHeight] = useState("");
  const [rideFilters, setRideFilters] = useState<RideFilterState>(defaultRideFilters);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<TownPassPoint | null>(null);
  const [activeCarouselPointId, setActiveCarouselPointId] = useState<string | null>(null);
  const [detailSheetExpanded, setDetailSheetExpanded] = useState(false);
  const [allPoints, setAllPoints] = useState<TownPassPoint[]>([]);
  const [placeDetails, setPlaceDetails] = useState<PlaceDetail[]>([]);
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadPlaceDetails = async () => {
      try {
        const response = await fetch(PLACE_DETAILS_URL, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Failed to load ${PLACE_DETAILS_URL}`);
        }
        const data = (await response.json()) as PlaceDetailsResponse;
        if (!cancelled) {
          setPlaceDetails(data.places ?? []);
        }
      } catch (error) {
        console.error("Failed to load place details", error);
      }
    };

    loadPlaceDetails();

    return () => {
      cancelled = true;
    };
  }, []);
  const [userPosition] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!googleMapsApiKey) {
      return;
    }

    let cancelled = false;

    const initMap = async () => {
      try {
        await loadGoogleMapsScript(googleMapsApiKey);
        const maps = getMapsNamespace();
        if (cancelled || !mapContainerRef.current || !maps) {
          return;
        }

        const mapOptions: Record<string, unknown> = {
          center: parkCenter,
          zoom: 18,
          minZoom: 10,
          maxZoom: 100,
          restriction: {
            latLngBounds: parkBounds,
            strictBounds: true,
          },
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
          zoomControl: false,
        };

        if (googleMapsMapId) {
          mapOptions.mapId = googleMapsMapId;
        }

        const map = new maps.Map(mapContainerRef.current, mapOptions);
        mapRef.current = map;
        infoWindowRef.current = new maps.InfoWindow();

        let loadedPoints: TownPassPoint[] = [];
        try {
          const points = await loadTownPassPoints();
          loadedPoints = points.allPoints;
        } catch (error) {
          console.error("Failed to load map points", error);
        }

        if (cancelled) {
          return;
        }

        setAllPoints(loadedPoints);
        setStatusText(
          `Google Maps 載入完成，共 ${loadedPoints.length} 個點位（設施與餐飲）。`,
        );
      } catch {
        if (!cancelled) {
          setStatusText("Google Maps 載入失敗，請檢查 API Key 或網路。");
        }
      }
    };

    initMap();

    return () => {
      cancelled = true;
      markersRef.current.forEach((entry) => clearMarker(entry.marker));
      markersRef.current = [];
      if (userMarkerRef.current) {
        clearMarker(userMarkerRef.current);
      }
      userMarkerRef.current = null;
      infoWindowRef.current = null;
      mapRef.current = null;
    };
  }, []);

  const placeDetailsByName = useMemo(() => {
    const detailMap = new Map<string, PlaceDetail>();
    placeDetails.forEach((detail) => {
      [detail.name, ...(detail.aliases ?? [])].forEach((name) => {
        detailMap.set(normalizePlaceName(name), detail);
      });
    });
    return detailMap;
  }, [placeDetails]);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          allPoints
            .filter((point) => getPointContentType(point) === selectedContentType)
            .filter((point) => selectedContentType !== "facility" || isRidePoint(point))
            .map((point) => point.category),
        ),
      ).sort(),
    [allPoints, selectedContentType],
  );

  const floors = useMemo(
    () =>
      Array.from(
        new Set(
          allPoints
            .filter((point) => getPointContentType(point) === selectedContentType)
            .filter((point) => selectedContentType !== "facility" || isRidePoint(point))
            .map((point) => point.floor)
            .filter((floor): floor is number => typeof floor === "number"),
        ),
      ).sort((a, b) => a - b),
    [allPoints, selectedContentType],
  );

  const visiblePoints = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const recommendedHeightFilters = getRecommendedHeightFilters(childHeight);

    return allPoints.filter((point) => {
      if (point.pointType === "facility" && !layers.facilities) return false;
      if (point.pointType === "restaurant" && !layers.restaurants) return false;
      if (getPointContentType(point) !== selectedContentType) return false;
      if (selectedContentType === "facility" && !isRidePoint(point)) return false;
      if (selectedCategory && point.category !== selectedCategory) return false;
      if (selectedFloor !== null && point.floor !== selectedFloor) return false;

      if (selectedContentType === "facility") {
        const detail = placeDetailsByName.get(normalizePlaceName(point.name));
        const filters = detail?.filters;
        const combinedSpecial = [
          ...(filters?.special ?? []),
          ...(filters?.environment ?? []),
        ];

        if (!matchesTextFilter(filters?.height, rideFilters.height)) return false;
        if (!matchesTextFilter(filters?.thrill, rideFilters.thrill)) return false;
        if (!matchesListFilter(filters?.environment, rideFilters.environment)) return false;
        if (!matchesTextFilter(filters?.price, rideFilters.price)) return false;
        if (!matchesListFilter(combinedSpecial, rideFilters.special)) return false;
        if (
          recommendedHeightFilters.length > 0 &&
          !recommendedHeightFilters.some((heightFilter) => filters?.height?.includes(heightFilter))
        ) {
          return false;
        }
      }

      return (
        normalizedQuery.length === 0 ||
        point.name.toLowerCase().includes(normalizedQuery) ||
        point.category.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [
    allPoints,
    childHeight,
    layers,
    placeDetailsByName,
    query,
    rideFilters,
    selectedCategory,
    selectedContentType,
    selectedFloor,
  ]);

  const selectedPointId = selectedPoint?.id ?? null;

  const focusPoint = (point: TownPassPoint) => {
    const marker = markersRef.current.find((entry) => entry.pointId === point.id)?.marker;
    if (!mapRef.current || !marker) {
      return;
    }

    setSelectedPoint(point);
    setDetailSheetExpanded(true);
    mapRef.current.panTo({ lat: point.lat, lng: point.lng });
    infoWindowRef.current?.close();
  };

  useEffect(() => {
    const maps = getMapsNamespace();
    if (!mapRef.current || !maps) {
      return;
    }

    markersRef.current.forEach((entry) => clearMarker(entry.marker));
    markersRef.current = [];
    const bounds = new maps.LatLngBounds();

    visiblePoints.forEach((point) => {
      const isSelected = selectedPointId === point.id;
      const marker = new maps.Marker({
        position: { lat: point.lat, lng: point.lng },
        map: mapRef.current,
        title: point.name,
        icon: createMapMarkerIcon(point, isSelected, maps),
        zIndex: isSelected ? 1000 : 1,
      });

      marker.addListener("click", () => {
        mapRef.current?.panTo({ lat: point.lat, lng: point.lng });
        const pointIndex = visiblePoints.findIndex((p) => p.id === point.id);
        if (pointIndex !== -1) {
          const container = document.getElementById("map-carousel-container");
          if (container) {
            container.scrollTo({
              left: pointIndex * container.offsetWidth,
              behavior: "smooth",
            });
          }
        }
        infoWindowRef.current?.close();
      });

      markersRef.current.push({ marker, pointId: point.id });
      bounds.extend({ lat: point.lat, lng: point.lng });
    });

    const focusedPoint = selectedPointId
      ? visiblePoints.find((point) => point.id === selectedPointId)
      : null;

    if (focusedPoint) {
      mapRef.current.panTo({ lat: focusedPoint.lat, lng: focusedPoint.lng });
    } else if (visiblePoints.length > 1) {
      mapRef.current.fitBounds(bounds, 48);
    } else if (!userPosition && visiblePoints.length === 1) {
      mapRef.current.panTo({ lat: visiblePoints[0].lat, lng: visiblePoints[0].lng });
      mapRef.current.setZoom(18);
    }
  }, [selectedPointId, userPosition, visiblePoints]);

  useEffect(() => {
    const maps = getMapsNamespace();
    if (!maps) return;

    const actualActiveId = selectedPointId ?? activeCarouselPointId ?? visiblePoints[0]?.id ?? null;

    markersRef.current.forEach((entry) => {
      const point = visiblePoints.find((p) => p.id === entry.pointId);
      if (point) {
        const isSelected = point.id === actualActiveId;
        entry.marker.setIcon(createMapMarkerIcon(point, isSelected, maps));
        entry.marker.setZIndex(isSelected ? 1000 : 1);
      }
    });
  }, [selectedPointId, activeCarouselPointId, visiblePoints]);

  const hasActiveRideFilters =
    childHeight.trim().length > 0 ||
    Object.values(rideFilters).some((value) => value !== null);

  const hasActiveFilters =
    query.trim().length > 0 ||
    selectedContentType !== "facility" ||
    selectedCategory !== null ||
    selectedFloor !== null ||
    hasActiveRideFilters;

  const selectedPlaceDetail = selectedPoint
    ? placeDetailsByName.get(normalizePlaceName(selectedPoint.name)) ?? null
    : null;

  const selectedFilterTags = selectedPlaceDetail
    ? [
      selectedPlaceDetail.filters?.height,
      selectedPlaceDetail.filters?.thrill,
      ...(selectedPlaceDetail.filters?.environment ?? []),
      selectedPlaceDetail.filters?.price,
      ...(selectedPlaceDetail.filters?.special ?? []),
    ].filter((tag): tag is string => Boolean(tag))
    : [];

  const selectedOperatingStatus = useMemo(
    () => getParkOperatingStatus(currentTime),
    [currentTime],
  );
  const selectedWaitMinutes =
    selectedPoint?.pointType === "facility" ? getFacilityWaitMinutes(selectedPoint) : null;

  const selectContentType = (contentType: MapContentType) => {
    setSelectedContentType(contentType);
    setLayers({
      facilities: contentType === "facility",
      restaurants: contentType !== "facility",
    });
    setSelectedCategory(null);
    setSelectedFloor(null);
    setSelectedPoint(null);

    if (contentType !== "facility") {
      setChildHeight("");
      setRideFilters(defaultRideFilters);
    }
  };

  const setRideFilter = (key: keyof RideFilterState, value: string) => {
    setRideFilters((prev) => ({ ...prev, [key]: value || null }));
  };

  const resetFilters = () => {
    setQuery("");
    setLayers({ facilities: true, restaurants: false });
    setSelectedContentType("facility");
    setChildHeight("");
    setRideFilters(defaultRideFilters);
    setSelectedCategory(null);
    setSelectedFloor(null);
  };

  return (
    <section className="relative h-full overflow-hidden bg-grayscale-50">
      <style>{`
        @keyframes townpassMarkerPulse {
          0% { transform: scale(0.72); opacity: 0.32; }
          70% { transform: scale(1.35); opacity: 0; }
          100% { transform: scale(1.35); opacity: 0; }
        }
      `}</style>
      <div
        ref={mapContainerRef}
        className="h-full w-full bg-grayscale-50"
      />

      <div className="absolute left-0 right-0 top-0 z-20 space-y-2 px-4 py-3">
        <div className="grid grid-cols-3 gap-2 rounded-xl border border-grayscale-100 bg-white p-1 shadow-sm">
          {contentTypeOptions.map(({ value, label, Icon }) => {
            const selected = selectedContentType === value;
            return (
              <button
                key={value}
                onClick={() => selectContentType(value)}
                className={`flex h-10 items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition active:scale-95 ${selected
                    ? "bg-primary text-white"
                    : "text-grayscale-600"
                  }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grayscale-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-11 w-full rounded-xl border border-grayscale-100 bg-white pl-10 pr-4 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="搜尋設施、餐廳或類型"
            />
          </div>
          {selectedContentType === "facility" && (
            <button
              onClick={() => setFilterPanelOpen((open) => !open)}
              className={`flex h-11 w-11 items-center justify-center rounded-xl border shadow-sm transition active:scale-95 ${filterPanelOpen || hasActiveFilters
                  ? "border-primary bg-primary text-white"
                  : "border-grayscale-100 bg-white text-primary"
                }`}
              aria-expanded={filterPanelOpen}
              aria-label="開啟地圖篩選器"
            >
              <SlidersHorizontal className="h-5 w-5" />
            </button>
          )}
        </div>

        {filterPanelOpen && selectedContentType === "facility" && (
          <div className="space-y-2 rounded-xl border border-grayscale-100 bg-white p-3 shadow-sm">
            <div className="space-y-3">
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  <label className="relative shrink-0">
                    <select
                      value={rideFilters.height ?? ""}
                      onChange={(event) => setRideFilter("height", event.target.value)}
                      className={`h-9 appearance-none rounded-full border px-4 pr-8 text-sm font-semibold outline-none ${rideFilters.height
                          ? "border-primary bg-primary text-white"
                          : "border-grayscale-100 bg-white text-grayscale-700"
                        }`}
                    >
                      <option value="">身高限制</option>
                      {heightFilterOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                  </label>

                  <label className="relative shrink-0">
                    <select
                      value={rideFilters.thrill ?? ""}
                      onChange={(event) => setRideFilter("thrill", event.target.value)}
                      className={`h-9 appearance-none rounded-full border px-4 pr-8 text-sm font-semibold outline-none ${rideFilters.thrill
                          ? "border-primary bg-primary text-white"
                          : "border-grayscale-100 bg-white text-grayscale-700"
                        }`}
                    >
                      <option value="">尖叫指數</option>
                      {thrillFilterOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                  </label>

                  <label className="relative shrink-0">
                    <select
                      value={rideFilters.environment ?? ""}
                      onChange={(event) => setRideFilter("environment", event.target.value)}
                      className={`h-9 appearance-none rounded-full border px-4 pr-8 text-sm font-semibold outline-none ${rideFilters.environment
                          ? "border-primary bg-primary text-white"
                          : "border-grayscale-100 bg-white text-grayscale-700"
                        }`}
                    >
                      <option value="">室內外</option>
                      {environmentFilterOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                  </label>

                  <label className="relative shrink-0">
                    <select
                      value={rideFilters.price ?? ""}
                      onChange={(event) => setRideFilter("price", event.target.value)}
                      className={`h-9 appearance-none rounded-full border px-4 pr-8 text-sm font-semibold outline-none ${rideFilters.price
                          ? "border-primary bg-primary text-white"
                          : "border-grayscale-100 bg-white text-grayscale-700"
                        }`}
                    >
                      <option value="">票價／類型</option>
                      {priceFilterOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                  </label>

                  <label className="relative shrink-0">
                    <select
                      value={rideFilters.special ?? ""}
                      onChange={(event) => setRideFilter("special", event.target.value)}
                      className={`h-9 appearance-none rounded-full border px-4 pr-8 text-sm font-semibold outline-none ${rideFilters.special
                          ? "border-primary bg-primary text-white"
                          : "border-grayscale-100 bg-white text-grayscale-700"
                        }`}
                    >
                      <option value="">特殊族群</option>
                      {specialFilterOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                  </label>
                </div>
              </div>

            <div className="flex justify-end">
              <button
                onClick={resetFilters}
                disabled={!hasActiveFilters}
                className="text-xs font-semibold text-primary disabled:text-grayscale-300"
              >
                清除篩選
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-4">
        <div
          className={`rounded-xl border border-grayscale-100 bg-white/95 p-3 shadow-lg backdrop-blur transition-all duration-300 ${detailSheetExpanded ? "max-h-[72vh] overflow-y-auto" : "max-h-56 overflow-hidden"
            }`}
        >
          {selectedPoint && (
            <div className="mb-3 flex justify-end">
              <button
                onClick={() => {
                  setSelectedPoint(null);
                  setDetailSheetExpanded(false);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-grayscale-100 text-grayscale-700"
                aria-label="關閉已選點位"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {selectedPoint ? (
            <div className="space-y-4">
              <button
                onClick={() => setDetailSheetExpanded((expanded) => !expanded)}
                className="mx-auto block h-1.5 w-12 rounded-full bg-grayscale-200"
                aria-label={detailSheetExpanded ? "收合點位詳情" : "展開點位詳情"}
              />

              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => setDetailSheetExpanded((expanded) => !expanded)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-bold text-primary">
                      {getPointLabel(selectedPoint.pointType)}
                    </span>
                    <span className="text-[10px] font-bold text-grayscale-500">
                      {selectedPlaceDetail?.category ?? selectedPoint.category}
                    </span>
                  </div>
                  <h2 className="mt-1 truncate font-display text-lg font-semibold text-grayscale-900">
                    {selectedPoint.name}
                  </h2>
                  <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-grayscale-500">
                    <MapPin className="h-3.5 w-3.5" />
                    {getFloorText(selectedPoint.floor)}
                  </p>
                  {selectedWaitMinutes !== null && (
                    <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-primary">
                      <Clock className="h-3.5 w-3.5" />
                      等待 {selectedWaitMinutes} 分鐘
                    </p>
                  )}
                </button>
              </div>

              {detailSheetExpanded && (
                <div className="space-y-4 border-t border-grayscale-100 pt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-grayscale-50 p-3">
                      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-white text-primary">
                        <Tag className="h-4 w-4" />
                      </div>
                      <p className="text-[10px] font-bold text-grayscale-500">分類</p>
                      <p className="mt-1 text-sm font-semibold text-grayscale-900">
                        {selectedPlaceDetail?.category ?? selectedPoint.category}
                      </p>
                    </div>
                    <div className="rounded-xl bg-grayscale-50 p-3">
                      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-white text-primary">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <p className="text-[10px] font-bold text-grayscale-500">位置</p>
                      <p className="mt-1 text-sm font-semibold text-grayscale-900">
                        {getFloorText(selectedPoint.floor)}
                      </p>
                    </div>
                  </div>

                  {selectedWaitMinutes !== null && (
                    <div className="rounded-xl bg-primary-50 p-4">
                      <div className="flex items-center gap-2 text-primary">
                        <Clock className="h-4 w-4" />
                        <p className="text-sm font-semibold">
                          {selectedOperatingStatus.isOpen ? "目前等待時間" : "營業狀態"}
                        </p>
                      </div>
                      <p className="mt-2 font-display text-2xl font-semibold text-grayscale-900">
                        {selectedOperatingStatus.isOpen
                          ? `${selectedWaitMinutes} 分鐘`
                          : selectedOperatingStatus.label}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-grayscale-500">
                        {selectedOperatingStatus.hours}
                      </p>
                    </div>
                  )}

                  <div className="rounded-xl bg-primary-50 p-4">
                    <div className="flex items-center gap-2 text-primary">
                      <Clock className="h-4 w-4" />
                      <p className="text-sm font-semibold">
                        {selectedPlaceDetail ? "設施介紹" : "即時資訊"}
                      </p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-grayscale-700">
                      {selectedPlaceDetail?.description ??
                        "目前顯示的是園區地圖點位資料，可依類型、樓層與關鍵字搜尋。點選定位按鈕可回到此設施位置。"}
                    </p>
                  </div>

                  {selectedFilterTags.length > 0 && (
                    <div className="rounded-xl border border-grayscale-100 p-4">
                      <p className="text-[10px] font-bold text-grayscale-500">篩選標籤</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedFilterTags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-grayscale-100 px-3 py-1 text-xs font-semibold text-grayscale-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div 
              id="map-carousel-container"
              className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory"
              onScroll={(e) => {
                const container = e.currentTarget;
                const index = Math.round(container.scrollLeft / container.offsetWidth);
                const activePoint = visiblePoints[index];
                if (activePoint && container.dataset.activeIndex !== String(index)) {
                  container.dataset.activeIndex = String(index);
                  if (mapRef.current) {
                    mapRef.current.panTo({ lat: activePoint.lat, lng: activePoint.lng });
                  }
                  setActiveCarouselPointId(activePoint.id);
                }
              }}
            >
              {visiblePoints.map((point) => (
                <button
                  key={point.id}
                  onClick={() => focusPoint(point)}
                  className="w-full min-w-full shrink-0 snap-center rounded-lg border border-grayscale-100 bg-white p-3 text-left active:scale-95"
                >
                  <div className="mb-2 flex items-center gap-1.5">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${point.pointType === "facility" ? "bg-primary" : "bg-red-500"
                        }`}
                    />
                    <span className="text-[11px] font-bold text-grayscale-500">
                      {getPointLabel(point.pointType)}
                    </span>
                  </div>
                  <p className="truncate text-base font-semibold text-grayscale-900">
                    {point.name}
                  </p>
                  <p className="mt-1 truncate text-xs font-medium text-grayscale-500">
                    {point.pointType === "facility"
                      ? `等待 ${getFacilityWaitMinutes(point)} 分鐘`
                      : point.category}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-grayscale-600">{statusText}</p>
    </section>
  );
}
