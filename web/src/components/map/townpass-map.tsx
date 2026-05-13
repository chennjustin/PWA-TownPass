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

type GoogleMapsAdvancedMarker = {
  addListener: (eventName: string, callback: () => void) => void;
  map: GoogleMapsMap | null;
};

type GoogleMapsLegacyMarker = {
  addListener: (eventName: string, callback: () => void) => void;
  setMap: (map: GoogleMapsMap | null) => void;
};

type GoogleMapsMarker = GoogleMapsAdvancedMarker | GoogleMapsLegacyMarker;

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
  Size: new (width: number, height: number) => unknown;
  marker?: {
    AdvancedMarkerElement: new (options: Record<string, unknown>) => GoogleMapsAdvancedMarker;
  };
};

type MapLayerState = {
  facilities: boolean;
  restaurants: boolean;
};

type MarkerEntry = {
  marker: GoogleMapsMarker;
  pointId: string;
};

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

function createMarkerContent(point: TownPassPoint) {
  const marker = document.createElement("div");
  const isFacility = point.pointType === "facility";
  marker.style.width = "34px";
  marker.style.height = "34px";
  marker.style.borderRadius = "9999px";
  marker.style.background = isFacility ? "#006876" : "#ef4444";
  marker.style.border = "2px solid white";
  marker.style.boxShadow = "0 6px 14px rgba(11,13,14,0.22)";
  marker.style.display = "flex";
  marker.style.alignItems = "center";
  marker.style.justifyContent = "center";
  marker.style.color = "white";
  marker.style.fontSize = "12px";
  marker.style.fontWeight = "800";
  marker.textContent = isFacility ? "設" : "餐";
  return marker;
}

function createSelectedMarkerContent(point: TownPassPoint) {
  const wrapper = document.createElement("div");
  const isFacility = point.pointType === "facility";
  const color = isFacility ? "#006876" : "#ef4444";
  wrapper.style.position = "relative";
  wrapper.style.width = "54px";
  wrapper.style.height = "54px";
  wrapper.style.display = "flex";
  wrapper.style.alignItems = "center";
  wrapper.style.justifyContent = "center";

  const pulse = document.createElement("div");
  pulse.style.position = "absolute";
  pulse.style.inset = "0";
  pulse.style.borderRadius = "9999px";
  pulse.style.background = color;
  pulse.style.opacity = "0.18";
  pulse.style.animation = "townpassMarkerPulse 1.25s ease-out infinite";

  const core = document.createElement("div");
  core.style.width = "42px";
  core.style.height = "42px";
  core.style.borderRadius = "9999px";
  core.style.background = color;
  core.style.border = "3px solid white";
  core.style.boxShadow = "0 10px 24px rgba(11,13,14,0.32)";
  core.style.display = "flex";
  core.style.alignItems = "center";
  core.style.justifyContent = "center";
  core.style.color = "white";
  core.style.fontSize = "14px";
  core.style.fontWeight = "900";
  core.style.transform = "scale(1.08)";
  core.textContent = isFacility ? "設" : "餐";

  wrapper.append(pulse, core);
  return wrapper;
}

function clearMarker(marker: GoogleMapsMarker) {
  if ("setMap" in marker) {
    marker.setMap(null);
    return;
  }

  marker.map = null;
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
    const AdvancedMarkerElement = maps.marker?.AdvancedMarkerElement;
    const canUseAdvancedMarker = Boolean(googleMapsMapId && AdvancedMarkerElement);

    const bounds = new maps.LatLngBounds();

    visiblePoints.forEach((point) => {
      const isSelected = selectedPointId === point.id;
      const marker =
        canUseAdvancedMarker && AdvancedMarkerElement
          ? new AdvancedMarkerElement({
            position: { lat: point.lat, lng: point.lng },
            map: mapRef.current,
            title: point.name,
            content: isSelected ? createSelectedMarkerContent(point) : createMarkerContent(point),
          })
          : new maps.Marker({
            position: { lat: point.lat, lng: point.lng },
            map: mapRef.current,
            title: point.name,
            icon: {
              url:
                isSelected
                  ? "https://maps.google.com/mapfiles/ms/icons/green-dot.png"
                  : point.pointType === "facility"
                  ? "https://maps.google.com/mapfiles/ms/icons/blue-dot.png"
                  : "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
              scaledSize: new maps.Size(isSelected ? 46 : 34, isSelected ? 46 : 34),
            },
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

  const summaryText = useMemo(() => {
    const facilityCount = visiblePoints.filter((point) => point.pointType === "facility").length;
    const restaurantCount = visiblePoints.filter(
      (point) => point.pointType === "restaurant",
    ).length;
    return `設施 ${facilityCount} 筆、餐飲 ${restaurantCount} 筆`;
  }, [visiblePoints]);

  const hasActiveFilters =
    query.trim().length > 0 ||
    !layers.facilities ||
    !layers.restaurants ||
    selectedCategory !== null ||
    selectedFloor !== null;

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

            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-grayscale-500">{summaryText}</span>
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
                      {selectedPoint.category}
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
                        {selectedPoint.category}
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
                      <p className="text-sm font-semibold">即時資訊</p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-grayscale-700">
                      目前顯示的是園區地圖點位資料，可依類型、樓層與關鍵字搜尋。點選定位按鈕可回到此設施位置。
                    </p>
                  </div>

                  <div className="rounded-xl border border-grayscale-100 p-4">
                    <p className="text-[10px] font-bold text-grayscale-500">座標</p>
                    <p className="mt-1 font-mono text-xs text-grayscale-700">
                      {selectedPoint.lat.toFixed(6)}, {selectedPoint.lng.toFixed(6)}
                    </p>
                  </div>
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
