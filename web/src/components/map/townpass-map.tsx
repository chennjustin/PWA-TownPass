"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Search,
  X,
} from "lucide-react";
import {
  MarkerClusterer,
  SuperClusterAlgorithm,
  type Marker as ClusterMarker,
  type Renderer,
} from "@googlemaps/markerclusterer";
import {
  FacilityPointDetailContent,
  FacilityPointDetailSummary,
} from "@/src/components/FacilityPointDetailContent";
import {
  FacilityFilterToggleButton,
  FacilityRideFilterPanel,
  getActiveRideFilterCount,
} from "@/src/components/FacilityRideFilterPanel";
import { getAppNow, isDemoDaytime } from "@/src/lib/app-time";
import { getFacilityImageUrl } from "@/src/lib/facility-images";
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
  defaultRideFilters,
  getFacilityWaitMinutes,
} from "@/src/lib/townpass-map-data";
import {
  MAP_MIN_ZOOM,
  MAP_MAX_ZOOM,
  MARKER_CLUSTER_MAX_ZOOM,
  MARKER_CLUSTER_RADIUS,
  DETAIL_SHEET_COLLAPSE_MS,
  FACILITY_FOCUS_ZOOM,
  contentTypeOptions,
} from "./townpass-map-constants";
import {
  centerMapOnPoint,
  focusMapOnPoint,
  focusMapOnPointAfterCardClick,
  focusPointMapWithClusterAwareZoom,
  setMapCenterAndZoom,
} from "./townpass-map-camera";
import { getCarouselIndexFromScroll, getCarouselSlideStride } from "./townpass-map-carousel";
import {
  clearMarker,
  getFloorText,
  getMapsNamespace,
  getParkOperatingStatus,
  getPointContentType,
  getPointLabel,
  getPointLabelDotClass,
  getRecommendedHeightFilters,
  isRidePoint,
  matchesListFilter,
  matchesTextFilter,
  normalizePlaceName,
} from "./townpass-map-helpers";
import { createMapMarkerIcon } from "./townpass-map-markers";
import type {
  GoogleMapsInfoWindow,
  GoogleMapsMap,
  MapContentType,
  MapLayerState,
  MarkerClustererMap,
  MarkerEntry,
} from "./townpass-map-types";

const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const googleMapsMapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;

type TownPassMapProps = {
  initialPointId?: string | null;
  /** 僅移動地圖至點位，不展開底部詳情卡片 */
  initialPointFocusOnly?: boolean;
  /** 從設施詳情帶入時，地圖建立即用此中心（避免先顯示園區預設再跳轉） */
  initialCenter?: { lat: number; lng: number } | null;
};

export function TownPassMap({
  initialPointId = null,
  initialPointFocusOnly = false,
  initialCenter = null,
}: TownPassMapProps) {
  const mapBootCenterRef = useRef(initialCenter);
  const mapBootFocusOnlyRef = useRef(initialPointFocusOnly);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapCarouselRef = useRef<HTMLDivElement | null>(null);
  /** 與本次使用者操作對應的點位 id，用於略過 marker effect 內重複的相機更新（避免打斷 pan 動畫） */
  const pendingMapFocusPointIdRef = useRef<string | null>(null);
  const mapRef = useRef<GoogleMapsMap | null>(null);
  const infoWindowRef = useRef<GoogleMapsInfoWindow | null>(null);
  const markersRef = useRef<MarkerEntry[]>([]);
  const userMarkerRef = useRef<MarkerEntry["marker"] | null>(null);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  /** 點數字叢集後略過一次「無輪播焦點時 fitBounds」，避免抵銷 zoom，也不要讓地圖誤以為焦點是第一筆 visible */
  const skipNextFitBoundsAfterClusterRef = useRef(false);

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
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
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
  const [currentTime, setCurrentTime] = useState(() => getAppNow());
  const initialPointHandledRef = useRef<string | null>(null);
  const instantDeepLinkFocusPointIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (isDemoDaytime) {
      return;
    }
    const timer = window.setInterval(() => setCurrentTime(getAppNow()), 60_000);
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

        const bootCenter = mapBootCenterRef.current ?? parkCenter;
        const bootZoom =
          mapBootFocusOnlyRef.current && mapBootCenterRef.current
            ? FACILITY_FOCUS_ZOOM
            : 18;

        const mapOptions: Record<string, unknown> = {
          center: bootCenter,
          zoom: bootZoom,
          minZoom: MAP_MIN_ZOOM,
          maxZoom: MAP_MAX_ZOOM,
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

        if (isDemoDaytime) {
          mapOptions.colorScheme = "LIGHT";
        }

        const map = new maps.Map(mapContainerRef.current, mapOptions);
        mapRef.current = map;
        infoWindowRef.current = new maps.InfoWindow();

        // 疊加自訂的園區地圖圖片
        const imageBounds = {
          north: 25.0983576,
          south: 25.0962398,
          east: 121.5166168,
          west: 121.5135708,
        };
        const overlay = new maps.GroundOverlay("/map-overlay.png", imageBounds, {
          opacity: 1, // 您可以自行調整透明度，例如 0.8
        });
        overlay.setMap(map);

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
        setStatusText(`Google Maps 載入完成，共 ${loadedPoints.length} 個點位（設施與餐飲）。`);
      } catch {
        if (!cancelled) {
          setStatusText("Google Maps 載入失敗，請檢查 API Key 或網路。");
        }
      }
    };

    initMap();

    return () => {
      cancelled = true;
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
      }
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
        const combinedSpecial = [...(filters?.special ?? []), ...(filters?.environment ?? [])];

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
    if (!mapRef.current) {
      return;
    }

    pendingMapFocusPointIdRef.current = point.id;
    setActiveCarouselPointId(point.id);
    const pointIndex = visiblePoints.findIndex((p) => p.id === point.id);
    if (pointIndex !== -1) {
      const container = mapCarouselRef.current;
      if (container) {
        const stride = getCarouselSlideStride(container);
        container.scrollTo({
          left: pointIndex * stride,
          behavior: "smooth",
        });
      }
    }

    setSelectedPoint(point);
    setDetailSheetExpanded(true);
    focusMapOnPointAfterCardClick(mapRef.current, point);
    infoWindowRef.current?.close();
  };

  useEffect(() => {
    if (!initialPointId || allPoints.length === 0) {
      return;
    }

    if (initialPointHandledRef.current === initialPointId) {
      return;
    }

    const point = allPoints.find((item) => item.id === initialPointId);
    if (!point || !isRidePoint(point)) {
      return;
    }

    initialPointHandledRef.current = initialPointId;
    setSelectedContentType("facility");
    setLayers({ facilities: true, restaurants: false });
    setQuery("");
    setRideFilters(defaultRideFilters);
    setSelectedCategory(null);
    setSelectedFloor(null);
    setChildHeight("");
    setFilterPanelOpen(false);

    if (initialPointFocusOnly) {
      instantDeepLinkFocusPointIdRef.current = initialPointId;
      setActiveCarouselPointId(initialPointId);
      setSelectedPoint(null);
      setDetailSheetExpanded(false);

      if (mapRef.current) {
        setMapCenterAndZoom(
          mapRef.current,
          { lat: point.lat, lng: point.lng },
          FACILITY_FOCUS_ZOOM,
        );
      }
      return;
    }

    if (!mapRef.current) {
      return;
    }

    const timer = window.setTimeout(() => {
      focusPoint(point);
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [allPoints, initialPointFocusOnly, initialPointId]);

  const closeSelectedPointToCarousel = () => {
    const point = selectedPoint;
    if (!point || !mapRef.current) {
      return;
    }

    pendingMapFocusPointIdRef.current = point.id;
    setDetailSheetExpanded(false);
    setActiveCarouselPointId(point.id);

    const pointIndex = visiblePoints.findIndex((p) => p.id === point.id);
    if (pointIndex !== -1) {
      const container = mapCarouselRef.current;
      if (container) {
        window.requestAnimationFrame(() => {
          const stride = getCarouselSlideStride(container);
          container.scrollTo({
            left: pointIndex * stride,
            behavior: "smooth",
          });
        });
      }
    }

    const markerEntry = markersRef.current.find((e) => e.pointId === point.id);
    focusPointMapWithClusterAwareZoom(mapRef.current, point, markerEntry?.marker);

    window.setTimeout(() => {
      setSelectedPoint(null);
    }, DETAIL_SHEET_COLLAPSE_MS);
  };

  const carouselIndex = useMemo(() => {
    if (!activeCarouselPointId) {
      return 0;
    }
    const index = visiblePoints.findIndex((p) => p.id === activeCarouselPointId);
    return index === -1 ? 0 : index;
  }, [activeCarouselPointId, visiblePoints]);

  const scrollCarouselBy = (delta: number) => {
    const container = mapCarouselRef.current;
    if (!container || visiblePoints.length === 0) {
      return;
    }
    const slideCount = visiblePoints.length;
    const current = getCarouselIndexFromScroll(container, slideCount);
    const next = Math.max(0, Math.min(slideCount - 1, current + delta));
    const nextPoint = visiblePoints[next];
    const stride = getCarouselSlideStride(container);
    pendingMapFocusPointIdRef.current = nextPoint.id;
    setActiveCarouselPointId(nextPoint.id);
    if (mapRef.current) {
      const markerEntry = markersRef.current.find((e) => e.pointId === nextPoint.id);
      focusPointMapWithClusterAwareZoom(mapRef.current, nextPoint, markerEntry?.marker);
    }
    container.scrollTo({ left: next * stride, behavior: "smooth" });
  };

  useEffect(() => {
    const maps = getMapsNamespace();
    if (!mapRef.current || !maps) {
      return;
    }

    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
    }
    markersRef.current.forEach((entry) => clearMarker(entry.marker));
    markersRef.current = [];
    const bounds = new maps.LatLngBounds();

    visiblePoints.forEach((point) => {
      const isSelected = selectedPointId === point.id;
      const marker = new maps.Marker({
        position: { lat: point.lat, lng: point.lng },
        map: null, // 交由 MarkerClusterer 管理顯示
        title: point.name,
        icon: createMapMarkerIcon(point, isSelected, maps),
        zIndex: isSelected ? 1000 : 1,
      });

      marker.addListener("click", () => {
        setSelectedPoint(null); // 確保回到簡短資訊 (carousel)
        setActiveCarouselPointId(point.id);
        if (mapRef.current) {
          pendingMapFocusPointIdRef.current = point.id;
          centerMapOnPoint(mapRef.current, point);
        }
        const pointIndex = visiblePoints.findIndex((p) => p.id === point.id);
        if (pointIndex !== -1) {
          const container = mapCarouselRef.current;
          if (container) {
            const stride = getCarouselSlideStride(container);
            container.scrollTo({
              left: pointIndex * stride,
              behavior: "auto", // 使用 auto 取代 smooth，即可瞬間跳轉，不會有經過其他設施的動畫
            });
          }
        }
        infoWindowRef.current?.close();
      });

      markersRef.current.push({ marker, pointId: point.id });
      bounds.extend({ lat: point.lat, lng: point.lng });
    });

    if (!clustererRef.current) {
      const renderer: Renderer = {
        render: ({ count, position }) => {
          return new maps.Marker({
            position,
            icon: {
              url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="18" fill="#00afb8" stroke="#ffffff" stroke-width="3" />
                  <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="#ffffff" font-size="16" font-weight="bold" font-family="sans-serif">${count}</text>
                </svg>
              `)}`,
              scaledSize: new maps.Size(40, 40),
              anchor: new maps.Point(20, 20),
            },
            zIndex: 1000,
          }) as unknown as ClusterMarker;
        },
      };
      clustererRef.current = new MarkerClusterer({
        map: mapRef.current as unknown as MarkerClustererMap,
        renderer,
        onClusterClick: (_event, cluster, map) => {
          skipNextFitBoundsAfterClusterRef.current = true;
          setSelectedPoint(null);
          setActiveCarouselPointId(null);

          const currentZoom = map.getZoom() ?? MARKER_CLUSTER_MAX_ZOOM;
          /** 至少拉過演算法 maxZoom，才能把數字叢集拆成單一標記 */
          const targetZoom = Math.min(
            Math.max(currentZoom + 2, MARKER_CLUSTER_MAX_ZOOM + 1),
            MAP_MAX_ZOOM,
          );

          const pos = cluster.position as {
            lat?: number | (() => number);
            lng?: number | (() => number);
          };
          const lat = typeof pos.lat === "function" ? pos.lat() : Number(pos.lat);
          const lng = typeof pos.lng === "function" ? pos.lng() : Number(pos.lng);
          setMapCenterAndZoom(map as unknown as GoogleMapsMap, { lat, lng }, targetZoom);
        },
        algorithm: new SuperClusterAlgorithm({
          maxZoom: MARKER_CLUSTER_MAX_ZOOM,
          radius: MARKER_CLUSTER_RADIUS,
        }),
      });
    }

    clustererRef.current.addMarkers(
      markersRef.current.map(({ marker }) => marker as unknown as ClusterMarker),
    );

    const deepLinkFocusId = instantDeepLinkFocusPointIdRef.current;
    if (deepLinkFocusId) {
      const deepLinkPoint = visiblePoints.find((point) => point.id === deepLinkFocusId);
      if (deepLinkPoint) {
        instantDeepLinkFocusPointIdRef.current = null;
        pendingMapFocusPointIdRef.current = deepLinkPoint.id;
        skipNextFitBoundsAfterClusterRef.current = true;
        setMapCenterAndZoom(
          mapRef.current,
          { lat: deepLinkPoint.lat, lng: deepLinkPoint.lng },
          FACILITY_FOCUS_ZOOM,
        );
        const pointIndex = visiblePoints.findIndex((point) => point.id === deepLinkPoint.id);
        if (pointIndex !== -1) {
          const container = mapCarouselRef.current;
          if (container) {
            const stride = getCarouselSlideStride(container);
            container.scrollTo({ left: pointIndex * stride, behavior: "auto" });
          }
        }
      }
    }

    const focusedPoint = selectedPointId
      ? visiblePoints.find((point) => point.id === selectedPointId)
      : null;

    if (!deepLinkFocusId && focusedPoint) {
      if (pendingMapFocusPointIdRef.current === focusedPoint.id) {
        pendingMapFocusPointIdRef.current = null;
      } else {
        focusMapOnPoint(mapRef.current, focusedPoint);
      }
    } else if (!deepLinkFocusId && visiblePoints.length > 1) {
      const carouselPoint = activeCarouselPointId
        ? visiblePoints.find((p) => p.id === activeCarouselPointId)
        : null;
      if (carouselPoint) {
        if (pendingMapFocusPointIdRef.current === carouselPoint.id) {
          pendingMapFocusPointIdRef.current = null;
        } else {
          const markerEntry = markersRef.current.find((e) => e.pointId === carouselPoint.id);
          focusPointMapWithClusterAwareZoom(mapRef.current, carouselPoint, markerEntry?.marker);
        }
      } else {
        if (skipNextFitBoundsAfterClusterRef.current) {
          skipNextFitBoundsAfterClusterRef.current = false;
        } else {
          mapRef.current.fitBounds(bounds, 48);
        }
      }
    } else if (!deepLinkFocusId && !userPosition && visiblePoints.length === 1) {
      setMapCenterAndZoom(
        mapRef.current,
        {
          lat: visiblePoints[0].lat,
          lng: visiblePoints[0].lng,
        },
        18,
      );
    }
  }, [activeCarouselPointId, selectedPointId, userPosition, visiblePoints]);

  useEffect(() => {
    const maps = getMapsNamespace();
    if (!maps) return;

    /** 不要用 visiblePoints[0] 當預設焦點：點數字叢集時會清空輪播 id，否則會誤亮清單第一筆（例如 K2） */
    const mapHighlightPointId = selectedPointId ?? activeCarouselPointId ?? null;

    markersRef.current.forEach((entry) => {
      const point = visiblePoints.find((p) => p.id === entry.pointId);
      if (point) {
        const isSelected = point.id === mapHighlightPointId;
        entry.marker.setIcon(createMapMarkerIcon(point, isSelected, maps));
        entry.marker.setZIndex(isSelected ? 1000 : 1);
      }
    });
  }, [selectedPointId, activeCarouselPointId, visiblePoints]);

  const hasActiveRideFilters =
    childHeight.trim().length > 0 ||
    Object.values(rideFilters).some((values) => values.length > 0);
  const activeRideFilterCount =
    (childHeight.trim().length > 0 ? 1 : 0) + getActiveRideFilterCount(rideFilters);

  const hasActiveFilters =
    query.trim().length > 0 ||
    selectedContentType !== "facility" ||
    selectedCategory !== null ||
    selectedFloor !== null ||
    hasActiveRideFilters;

  const selectedPlaceDetail = selectedPoint
    ? placeDetailsByName.get(normalizePlaceName(selectedPoint.name)) ?? null
    : null;

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
    setFilterPanelOpen(false);

    if (contentType !== "facility") {
      setChildHeight("");
      setRideFilters(defaultRideFilters);
    }
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
      <div ref={mapContainerRef} className="h-full w-full bg-grayscale-50" />

      <div className="absolute left-0 right-0 top-0 z-20 space-y-2 px-4 py-3">
        <div className="grid grid-cols-3 gap-2 rounded-xl border border-grayscale-100 bg-white p-1 shadow-sm">
          {contentTypeOptions.map(({ value, label, Icon }) => {
            const selected = selectedContentType === value;
            return (
              <button
                key={value}
                onClick={() => selectContentType(value)}
                className={`flex h-10 items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition active:scale-95 ${
                  selected ? "bg-primary text-white" : "text-grayscale-600"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </div>

        <div className="relative">
          <div className={`relative ${selectedContentType === "facility" ? "pr-[4.25rem]" : ""}`}>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grayscale-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="tp-search-field shadow-sm"
              placeholder="搜尋設施、餐飲或類型"
            />
          </div>
          {selectedContentType === "facility" && (
            <FacilityFilterToggleButton
              className="absolute right-0 top-0"
              open={filterPanelOpen}
              activeCount={activeRideFilterCount}
              highlighted={filterPanelOpen || hasActiveRideFilters}
              onClick={() => setFilterPanelOpen((open) => !open)}
              ariaLabel="開啟地圖篩選器"
            />
          )}
        </div>

        {filterPanelOpen && selectedContentType === "facility" && (
          <FacilityRideFilterPanel
            rideFilters={rideFilters}
            onRideFiltersChange={setRideFilters}
            onReset={resetFilters}
            resetDisabled={!hasActiveFilters}
          />
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-4">
        <div
          className={`rounded-xl border border-grayscale-100 bg-white/95 p-3 shadow-lg backdrop-blur transition-all duration-300 ${
            detailSheetExpanded ? "max-h-[72vh] overflow-y-auto" : "max-h-56 overflow-hidden"
          }`}
        >
          {selectedPoint ? (
            <div className="space-y-4 pt-1">
              <div className="relative flex items-center justify-center">
                <button
                  onClick={() => setDetailSheetExpanded((expanded) => !expanded)}
                  className="block h-1.5 w-12 rounded-full bg-grayscale-200"
                  aria-label={detailSheetExpanded ? "收合點位詳情" : "展開點位詳情"}
                />
                <button
                  onClick={closeSelectedPointToCarousel}
                  className="absolute right-0 flex h-7 w-7 items-center justify-center rounded-full bg-grayscale-100 text-grayscale-500 transition-transform active:scale-95"
                  aria-label="關閉已選點位"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setDetailSheetExpanded((expanded) => !expanded)}
                className="w-full text-left"
                aria-expanded={detailSheetExpanded}
              >
                {detailSheetExpanded ? (
                  <FacilityPointDetailContent
                    point={selectedPoint}
                    placeDetail={selectedPlaceDetail}
                    operatingStatus={selectedOperatingStatus}
                    waitMinutes={selectedWaitMinutes}
                    imageUrl={getFacilityImageUrl(selectedPoint.id)}
                    imageSize="sheet"
                  />
                ) : (
                  <FacilityPointDetailSummary
                    point={selectedPoint}
                    placeDetail={selectedPlaceDetail}
                    operatingStatus={selectedOperatingStatus}
                    waitMinutes={selectedWaitMinutes}
                  />
                )}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => scrollCarouselBy(-1)}
                disabled={visiblePoints.length <= 1 || carouselIndex <= 0}
                className="relative z-10 flex h-12 w-7 shrink-0 touch-manipulation items-center justify-center rounded-full border-0 bg-transparent text-grayscale-400 transition hover:text-grayscale-500 active:scale-95 disabled:pointer-events-none disabled:opacity-25"
                aria-label="上一個點位"
              >
                <ChevronLeft className="h-5 w-5" strokeWidth={1.5} aria-hidden />
              </button>
              <div
                ref={mapCarouselRef}
                id="map-carousel-container"
                className="flex min-w-0 flex-1 gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory"
                onScroll={(e) => {
                  const container = e.currentTarget;
                  if (visiblePoints.length === 0) {
                    return;
                  }
                  const index = getCarouselIndexFromScroll(container, visiblePoints.length);
                  const activePoint = visiblePoints[index];
                  if (activePoint && container.dataset.activeIndex !== String(index)) {
                    container.dataset.activeIndex = String(index);
                    if (mapRef.current) {
                      pendingMapFocusPointIdRef.current = activePoint.id;
                      const markerEntry = markersRef.current.find((e) => e.pointId === activePoint.id);
                      focusPointMapWithClusterAwareZoom(
                        mapRef.current,
                        activePoint,
                        markerEntry?.marker,
                      );
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
                      <span className={`h-2.5 w-2.5 rounded-full ${getPointLabelDotClass(point)}`} />
                      <span className="text-[11px] font-bold text-grayscale-500">
                        {getPointLabel(point)}
                      </span>
                    </div>
                    <p className="truncate text-base font-semibold text-grayscale-900">{point.name}</p>
                    <p className="mt-1 truncate text-xs font-medium text-grayscale-500">
                      {point.pointType === "facility"
                        ? `等待 ${getFacilityWaitMinutes(point)} 分鐘`
                        : point.category}
                    </p>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => scrollCarouselBy(1)}
                disabled={visiblePoints.length <= 1 || carouselIndex >= visiblePoints.length - 1}
                className="relative z-10 flex h-12 w-7 shrink-0 touch-manipulation items-center justify-center rounded-full border-0 bg-transparent text-grayscale-400 transition hover:text-grayscale-500 active:scale-95 disabled:pointer-events-none disabled:opacity-25"
                aria-label="下一個點位"
              >
                <ChevronRight className="h-5 w-5" strokeWidth={1.5} aria-hidden />
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-grayscale-600">{statusText}</p>
    </section>
  );
}
