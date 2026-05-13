"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Clock, MapPin, Navigation, Search, SlidersHorizontal, Tag, X } from "lucide-react";
import { loadGoogleMapsScript } from "@/src/lib/google-maps-service";
import {
  loadTownPassPoints,
  parkBounds,
  parkCenter,
  type TownPassPoint,
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

type MarkerEntry = {
  marker: GoogleMapsLegacyMarker;
  pointId: string;
};

type MarkerKind =
  | "firstAid"
  | "restaurant"
  | "store"
  | "info"
  | "carousel"
  | "shop"
  | "restroom"
  | "ferrisWheel"
  | "coaster";

type PlaceDetail = {
  name: string;
  aliases?: string[];
  category: string;
  description: string;
  filters?: {
    height?: string | null;
    thrill?: string | null;
    environment?: string[];
    price?: string | null;
    special?: string[];
  };
};

type PlaceDetailsResponse = {
  places?: PlaceDetail[];
};

const PLACE_DETAILS_URL = "/place-details.json";

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

  if (point.pointType === "restaurant" || text.includes("餐") || text.includes("食")) return "restaurant";
  if (text.includes("廁") || text.includes("洗手間")) return "restroom";
  if (text.includes("醫") || text.includes("急救")) return "firstAid";
  if (text.includes("摩天輪")) return "ferrisWheel";
  if (text.includes("飛車") || text.includes("小飛龍") || text.includes("雲霄")) return "coaster";
  if (text.includes("旋轉木馬") || text.includes("海洋總動員")) return "carousel";
  if (text.includes("商店") || text.includes("超商") || text.includes("拍貼") || text.includes("化石")) return "shop";
  if (text.includes("服務") || text.includes("資訊") || text.includes("普通設施")) return "info";
  return point.pointType === "facility" ? "store" : "restaurant";
}

function getMarkerIconPath(kind: MarkerKind) {
  switch (kind) {
    case "firstAid":
      return '<path d="M25 25h22a4 4 0 0 1 4 4v21a4 4 0 0 1-4 4H25a4 4 0 0 1-4-4V29a4 4 0 0 1 4-4Z"/><path d="M30 25v-5a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v5"/><path d="M36 32v15M28.5 39.5h15"/>';
    case "restaurant":
      return '<path d="M28 16v38M22 16v14a6 6 0 0 0 12 0V16M44 16v38M44 16c6 3 8 9 6 17-1 4-3 7-6 8"/>';
    case "store":
      return '<path d="M21 30h30l-3-10H24l-3 10Z"/><path d="M24 30v22h24V30"/><path d="M21 30c1 5 6 5 8 0 2 5 7 5 9 0 2 5 7 5 9 0 2 5 7 5 8 0"/><path d="M34 52V41h8v11"/>';
    case "info":
      return '<circle cx="36" cy="36" r="19"/><path d="M36 33v15"/><path d="M36 25h.01"/>';
    case "carousel":
      return '<path d="M24 24h24"/><path d="M36 16v38"/><path d="M27 32c4-5 13-5 18 1l-3 10H30l-3-11Z"/><path d="M30 43l-4 7M42 43l4 7"/><path d="M43 31l5 3"/>';
    case "shop":
      return '<path d="M25 29h22l3 24H22l3-24Z"/><path d="M30 29v-5a6 6 0 0 1 12 0v5"/>';
    case "restroom":
      return '<circle cx="27" cy="21" r="4"/><circle cx="45" cy="21" r="4"/><path d="M27 29v23M21 36h12M45 29l8 23H37l8-23Z"/><path d="M36 18v38"/>';
    case "ferrisWheel":
      return '<circle cx="36" cy="31" r="15"/><circle cx="36" cy="31" r="3"/><path d="M36 31 25 53M36 31l11 22M26 53h20M36 16v30M21 31h30M25 20l22 22M47 20 25 42"/><rect x="33" y="12" width="6" height="5" rx="1"/><rect x="49" y="28" width="6" height="5" rx="1"/><rect x="33" y="45" width="6" height="5" rx="1"/><rect x="17" y="28" width="6" height="5" rx="1"/>';
    case "coaster":
      return '<path d="M18 51c10-24 22-24 36-3"/><path d="M18 51h36M22 51V37M34 51V30M46 51V39"/><path d="M23 29c8 5 16 5 26 0"/><circle cx="27" cy="25" r="2"/><circle cx="35" cy="24" r="2"/><circle cx="43" cy="25" r="2"/>';
  }
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

  const [layers, setLayers] = useState<MapLayerState>({
    facilities: true,
    restaurants: true,
  });
  const [query, setQuery] = useState("");
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<TownPassPoint | null>(null);
  const [detailSheetExpanded, setDetailSheetExpanded] = useState(false);
  const [allPoints, setAllPoints] = useState<TownPassPoint[]>([]);
  const [placeDetails, setPlaceDetails] = useState<PlaceDetail[]>([]);

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
          minZoom: 16,
          maxZoom: 21,
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
      } catch (error) {
        console.error("Failed to initialize Google Maps", error);
      }
    };

    initMap();

    return () => {
      cancelled = true;
      markersRef.current.forEach((entry) => clearMarker(entry.marker));
      markersRef.current = [];
      infoWindowRef.current = null;
      mapRef.current = null;
    };
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(allPoints.map((point) => point.category))).sort(),
    [allPoints],
  );

  const floors = useMemo(
    () =>
      Array.from(
        new Set(
          allPoints
            .map((point) => point.floor)
            .filter((floor): floor is number => typeof floor === "number"),
        ),
      ).sort((a, b) => a - b),
    [allPoints],
  );

  const visiblePoints = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return allPoints.filter((point) => {
      if (point.pointType === "facility" && !layers.facilities) return false;
      if (point.pointType === "restaurant" && !layers.restaurants) return false;
      if (selectedCategory && point.category !== selectedCategory) return false;
      if (selectedFloor !== null && point.floor !== selectedFloor) return false;

      return (
        normalizedQuery.length === 0 ||
        point.name.toLowerCase().includes(normalizedQuery) ||
        point.category.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [allPoints, layers, query, selectedCategory, selectedFloor]);

  const selectedPointId = selectedPoint?.id ?? null;

  const placeDetailsByName = useMemo(() => {
    const detailMap = new Map<string, PlaceDetail>();
    placeDetails.forEach((detail) => {
      [detail.name, ...(detail.aliases ?? [])].forEach((name) => {
        detailMap.set(normalizePlaceName(name), detail);
      });
    });
    return detailMap;
  }, [placeDetails]);

  const focusPoint = (point: TownPassPoint) => {
    const marker = markersRef.current.find((entry) => entry.pointId === point.id)?.marker;
    if (!mapRef.current || !marker) {
      return;
    }

    setSelectedPoint(point);
    setDetailSheetExpanded(false);
    mapRef.current.panTo({ lat: point.lat, lng: point.lng });
    mapRef.current.setZoom(18);
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
        setSelectedPoint(point);
        setDetailSheetExpanded(false);
        mapRef.current?.panTo({ lat: point.lat, lng: point.lng });
        mapRef.current?.setZoom(18);
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
      mapRef.current.setZoom(18);
    } else if (visiblePoints.length > 1) {
      mapRef.current.fitBounds(bounds, 48);
    } else if (visiblePoints.length === 1) {
      mapRef.current.panTo({ lat: visiblePoints[0].lat, lng: visiblePoints[0].lng });
      mapRef.current.setZoom(18);
    }
  }, [selectedPointId, visiblePoints]);

  const hasActiveFilters =
    query.trim().length > 0 ||
    !layers.facilities ||
    !layers.restaurants ||
    selectedCategory !== null ||
    selectedFloor !== null;

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

  const resetFilters = () => {
    setQuery("");
    setLayers({ facilities: true, restaurants: true });
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
          <button
            onClick={() => setFilterPanelOpen((open) => !open)}
            className={`flex h-11 w-11 items-center justify-center rounded-xl border shadow-sm transition active:scale-95 ${
              filterPanelOpen || hasActiveFilters
                ? "border-primary bg-primary text-white"
                : "border-grayscale-100 bg-white text-primary"
            }`}
            aria-expanded={filterPanelOpen}
            aria-label="開啟地圖篩選器"
          >
            <SlidersHorizontal className="h-5 w-5" />
          </button>
        </div>

        {filterPanelOpen && (
          <div className="space-y-2 rounded-xl border border-grayscale-100 bg-white p-3 shadow-sm">
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              <button
                onClick={() =>
                  setLayers((prev) => ({ ...prev, facilities: !prev.facilities }))
                }
                className={`h-9 shrink-0 rounded-full px-4 text-sm font-semibold transition ${
                  layers.facilities
                    ? "bg-primary text-white"
                    : "bg-grayscale-100 text-grayscale-700"
                }`}
              >
                設施
              </button>
              <button
                onClick={() =>
                  setLayers((prev) => ({ ...prev, restaurants: !prev.restaurants }))
                }
                className={`h-9 shrink-0 rounded-full px-4 text-sm font-semibold transition ${
                  layers.restaurants
                    ? "bg-red-500 text-white"
                    : "bg-grayscale-100 text-grayscale-700"
                }`}
              >
                餐飲
              </button>

              <label className="relative shrink-0">
                <select
                  value={selectedCategory ?? ""}
                  onChange={(event) => setSelectedCategory(event.target.value || null)}
                  className={`h-9 appearance-none rounded-full border px-4 pr-8 text-sm font-semibold outline-none ${
                    selectedCategory
                      ? "border-primary bg-primary text-white"
                      : "border-grayscale-100 bg-white text-grayscale-700"
                  }`}
                >
                  <option value="">類型</option>
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
                  value={selectedFloor ?? ""}
                  onChange={(event) =>
                    setSelectedFloor(event.target.value ? Number(event.target.value) : null)
                  }
                  className={`h-9 appearance-none rounded-full border px-4 pr-8 text-sm font-semibold outline-none ${
                    selectedFloor !== null
                      ? "border-primary bg-primary text-white"
                      : "border-grayscale-100 bg-white text-grayscale-700"
                  }`}
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
          className={`rounded-xl border border-grayscale-100 bg-white/95 p-3 shadow-lg backdrop-blur transition-all duration-300 ${
            detailSheetExpanded ? "max-h-[72vh] overflow-y-auto" : "max-h-56 overflow-hidden"
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
                </button>
                <button
                  onClick={() => focusPoint(selectedPoint)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white active:scale-95"
                  aria-label="定位到已選點位"
                >
                  <Navigation className="h-5 w-5" />
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
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {visiblePoints.slice(0, 12).map((point) => (
                <button
                  key={point.id}
                  onClick={() => focusPoint(point)}
                  className="min-w-[160px] rounded-lg border border-grayscale-100 bg-white p-2 text-left active:scale-95"
                >
                  <div className="mb-1 flex items-center gap-1">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        point.pointType === "facility" ? "bg-primary" : "bg-red-500"
                      }`}
                    />
                    <span className="text-[10px] font-bold text-grayscale-500">
                      {getPointLabel(point.pointType)}
                    </span>
                  </div>
                  <p className="truncate text-sm font-semibold text-grayscale-900">
                    {point.name}
                  </p>
                  <p className="mt-1 truncate text-[10px] font-medium text-grayscale-500">
                    {point.category} / {getFloorText(point.floor)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
