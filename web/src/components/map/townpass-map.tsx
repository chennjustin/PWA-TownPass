"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { loadGoogleMapsScript } from "@/src/lib/google-maps-service";
import {
  loadTownPassPoints,
  parkCenter,
  type TownPassPoint,
} from "@/src/lib/townpass-map-data";

const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

type GoogleMapsMap = {
  fitBounds: (bounds: GoogleMapsLatLngBounds, padding?: number) => void;
  panTo: (position: { lat: number; lng: number }) => void;
  setZoom: (zoom: number) => void;
};

type GoogleMapsMarker = {
  addListener: (eventName: string, callback: () => void) => void;
  setMap: (map: GoogleMapsMap | null) => void;
};

type GoogleMapsInfoWindow = {
  setContent: (content: string) => void;
  open: (options: { map: GoogleMapsMap; anchor: GoogleMapsMarker }) => void;
};

type GoogleMapsLatLngBounds = {
  extend: (position: { lat: number; lng: number }) => void;
};

type GoogleMapsNamespace = {
  Map: new (
    element: HTMLElement,
    options: Record<string, unknown>,
  ) => GoogleMapsMap;
  Marker: new (options: Record<string, unknown>) => GoogleMapsMarker;
  InfoWindow: new () => GoogleMapsInfoWindow;
  LatLngBounds: new () => GoogleMapsLatLngBounds;
  Size: new (width: number, height: number) => unknown;
  SymbolPath: {
    CIRCLE: unknown;
  };
};

type MapLayerState = {
  facilities: boolean;
  restaurants: boolean;
};

type MarkerEntry = {
  marker: GoogleMapsMarker;
};

type LocateResult =
  | { ok: true; coords: { lat: number; lng: number } }
  | {
      ok: false;
      reason: "not_supported" | "permission_denied" | "insecure_context" | "unavailable";
    };

const facilityIconUrl = "https://maps.google.com/mapfiles/ms/icons/blue-dot.png";
const restaurantIconUrl = "https://maps.google.com/mapfiles/ms/icons/red-dot.png";

function locateCurrentPosition(): Promise<LocateResult> {
  if (!navigator.geolocation) {
    return Promise.resolve({ ok: false, reason: "not_supported" });
  }

  if (!window.isSecureContext && window.location.hostname !== "localhost") {
    return Promise.resolve({ ok: false, reason: "insecure_context" });
  }

  const tryLocate = (enableHighAccuracy: boolean, timeout: number) =>
    new Promise<LocateResult>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            ok: true,
            coords: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            },
          });
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            resolve({ ok: false, reason: "permission_denied" });
            return;
          }
          resolve({ ok: false, reason: "unavailable" });
        },
        {
          enableHighAccuracy,
          timeout,
          maximumAge: 0,
        },
      );
    });

  return tryLocate(true, 12000).then((result) => {
    if (result.ok || result.reason === "permission_denied") {
      return result;
    }
    // Retry once with lower accuracy for devices that cannot get GPS fix quickly.
    return tryLocate(false, 15000);
  });
}

function getMapsNamespace(): GoogleMapsNamespace | null {
  const maps = window.google?.maps;
  if (!maps) {
    return null;
  }
  return maps as unknown as GoogleMapsNamespace;
}

export function TownPassMap() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GoogleMapsMap | null>(null);
  const infoWindowRef = useRef<GoogleMapsInfoWindow | null>(null);
  const markersRef = useRef<MarkerEntry[]>([]);
  const userMarkerRef = useRef<GoogleMapsMarker | null>(null);

  const [layers, setLayers] = useState<MapLayerState>({
    facilities: true,
    restaurants: true,
  });
  const [statusText, setStatusText] = useState(
    googleMapsApiKey
      ? "地圖初始化中..."
      : "尚未設定 Google Maps API Key，請先填入 web/.env.local。",
  );
  const [allPoints, setAllPoints] = useState<TownPassPoint[]>([]);
  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(
    null,
  );

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

        const map = new maps.Map(mapContainerRef.current, {
          center: parkCenter,
          zoom: 17,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
        });
        mapRef.current = map;
        infoWindowRef.current = new maps.InfoWindow();

        const { allPoints: loadedPoints } = await loadTownPassPoints();
        if (cancelled) {
          return;
        }

        setAllPoints(loadedPoints);
        const locateResult = await locateCurrentPosition();
        if (cancelled) {
          return;
        }

        if (locateResult.ok) {
          setUserPosition(locateResult.coords);
          setStatusText(
            `定位成功（${locateResult.coords.lat.toFixed(5)}, ${locateResult.coords.lng.toFixed(5)}），園區資料共 ${loadedPoints.length} 個點位。`,
          );
          return;
        }

        if (locateResult.reason === "permission_denied") {
          setStatusText(
            `地圖載入完成，共 ${loadedPoints.length} 個點位。未取得定位權限，請允許瀏覽器位置存取。`,
          );
          return;
        }

        if (locateResult.reason === "not_supported") {
          setStatusText(
            `地圖載入完成，共 ${loadedPoints.length} 個點位。此裝置或瀏覽器不支援定位。`,
          );
          return;
        }

        if (locateResult.reason === "insecure_context") {
          setStatusText(
            `地圖載入完成，共 ${loadedPoints.length} 個點位。定位需在 HTTPS（或 localhost）環境下使用。`,
          );
          return;
        }

        setStatusText(
          `地圖載入完成，共 ${loadedPoints.length} 個點位。定位失敗，已顯示園區預設範圍。`,
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
      markersRef.current.forEach((entry) => entry.marker.setMap(null));
      markersRef.current = [];
      userMarkerRef.current?.setMap(null);
      userMarkerRef.current = null;
      infoWindowRef.current = null;
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const maps = getMapsNamespace();
    if (!mapRef.current || !maps) {
      return;
    }

    markersRef.current.forEach((entry) => entry.marker.setMap(null));
    markersRef.current = [];

    const visiblePoints = allPoints.filter((point) => {
      if (point.pointType === "facility" && !layers.facilities) return false;
      if (point.pointType === "restaurant" && !layers.restaurants) return false;
      return true;
    });

    const bounds = new maps.LatLngBounds();

    visiblePoints.forEach((point) => {
      const marker = new maps.Marker({
        position: { lat: point.lat, lng: point.lng },
        map: mapRef.current,
        title: point.name,
        icon: {
          url: point.pointType === "facility" ? facilityIconUrl : restaurantIconUrl,
          scaledSize: new maps.Size(34, 34),
        },
      });

      marker.addListener("click", () => {
        const floorText =
          typeof point.floor === "number" ? `${point.floor} 樓` : "樓層未標示";
        const label = point.pointType === "facility" ? "設施" : "餐飲";

        infoWindowRef.current?.setContent(`
          <div style="min-width:180px;padding:4px 2px;">
            <div style="font-size:14px;font-weight:700;margin-bottom:4px;">${point.name}</div>
            <div style="font-size:12px;color:#475259;">類型：${label} / ${point.category}</div>
            <div style="font-size:12px;color:#475259;">位置：${floorText}</div>
          </div>
        `);

        if (mapRef.current && infoWindowRef.current) {
          infoWindowRef.current.open({
            map: mapRef.current,
            anchor: marker,
          });
        }
      });

      markersRef.current.push({ marker });
      bounds.extend({ lat: point.lat, lng: point.lng });
    });

    if (!userPosition && visiblePoints.length > 1) {
      mapRef.current.fitBounds(bounds, 48);
    } else if (!userPosition && visiblePoints.length === 1) {
      mapRef.current.panTo({ lat: visiblePoints[0].lat, lng: visiblePoints[0].lng });
      mapRef.current.setZoom(18);
    }
  }, [allPoints, layers, userPosition]);

  useEffect(() => {
    const maps = getMapsNamespace();
    if (!mapRef.current || !maps || !userPosition) {
      return;
    }

    mapRef.current.panTo(userPosition);
    mapRef.current.setZoom(18);

    userMarkerRef.current?.setMap(null);
    userMarkerRef.current = new maps.Marker({
      position: userPosition,
      map: mapRef.current,
      title: "你的位置",
      icon: {
        path: maps.SymbolPath.CIRCLE,
        scale: 9,
        fillColor: "#2563eb",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 3,
      },
      zIndex: 999,
    });
  }, [userPosition]);

  const summaryText = useMemo(() => {
    const facilityCount = allPoints.filter((point) => point.pointType === "facility").length;
    const restaurantCount = allPoints.filter(
      (point) => point.pointType === "restaurant",
    ).length;
    return `設施 ${facilityCount} 筆、餐飲 ${restaurantCount} 筆`;
  }, [allPoints]);

  return (
    <section className="space-y-3">
      <div className="rounded-xl border border-grayscale-100 bg-white p-3 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <button
            onClick={() =>
              setLayers((prev) => ({ ...prev, facilities: !prev.facilities }))
            }
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
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
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              layers.restaurants
                ? "bg-red-500 text-white"
                : "bg-grayscale-100 text-grayscale-700"
            }`}
          >
            餐飲
          </button>
          <span className="ml-auto text-xs text-grayscale-500">{summaryText}</span>
        </div>

        <div
          ref={mapContainerRef}
          className="h-[420px] w-full rounded-lg border border-grayscale-100 bg-grayscale-50"
        />
      </div>

      <p className="text-xs text-grayscale-600">{statusText}</p>
      {userPosition && (
        <p className="text-[11px] text-grayscale-500">
          目前定位座標：{userPosition.lat.toFixed(5)}, {userPosition.lng.toFixed(5)}
        </p>
      )}
    </section>
  );
}
