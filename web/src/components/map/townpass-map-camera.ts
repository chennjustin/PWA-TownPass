import type { GoogleMapsLegacyMarker, GoogleMapsMap } from "./townpass-map-types";
import { FACILITY_FOCUS_ZOOM, MAP_MAX_ZOOM } from "./townpass-map-constants";

export function scheduleMapIdleCallback(map: object, callback: () => void) {
  type MapsEvent = { addListenerOnce?: (target: object, eventName: string, handler: () => void) => void };
  const mapsBundle = window.google?.maps as { event?: MapsEvent } | undefined;
  const eventApi = mapsBundle?.event;
  if (eventApi?.addListenerOnce) {
    eventApi.addListenerOnce(map, "idle", callback);
  } else {
    window.setTimeout(callback, 150);
  }
}

/** 僅平移到點位（不改變縮放） */
export function centerMapOnPoint(map: GoogleMapsMap, point: { lat: number; lng: number }) {
  map.panTo({ lat: point.lat, lng: point.lng });
}

/** 同時移動中心與縮放，優先使用 setOptions 單次更新相機（動畫較順） */
export function setMapCenterAndZoom(
  map: GoogleMapsMap,
  center: { lat: number; lng: number },
  zoom: number,
) {
  if (typeof map.setOptions === "function") {
    map.setOptions({ center, zoom });
    return;
  }
  map.panTo(center);
  map.setZoom(zoom);
}

/** 以平移為主；需改變縮放時與 center 一併套用，避免先移再拉的兩段感 */
export function focusMapOnPoint(map: GoogleMapsMap, point: { lat: number; lng: number }) {
  const targetZoom = Math.min(FACILITY_FOCUS_ZOOM, MAP_MAX_ZOOM);
  const center = { lat: point.lat, lng: point.lng };

  const currentZoom = typeof map.getZoom === "function" ? map.getZoom() : undefined;
  if (typeof currentZoom === "number" && Math.abs(currentZoom - targetZoom) <= 0.4) {
    map.panTo(center);
    return;
  }

  setMapCenterAndZoom(map, center, targetZoom);
}

/** 點底部卡片開詳情：先 setZoom，idle 後再 panTo 對準該點 */
export function focusMapOnPointAfterCardClick(map: GoogleMapsMap, point: { lat: number; lng: number }) {
  const targetZoom = Math.min(FACILITY_FOCUS_ZOOM, MAP_MAX_ZOOM);
  const center = { lat: point.lat, lng: point.lng };

  const currentZoom = typeof map.getZoom === "function" ? map.getZoom() : undefined;
  if (typeof currentZoom === "number" && Math.abs(currentZoom - targetZoom) <= 0.4) {
    map.panTo(center);
    return;
  }

  map.setZoom(targetZoom);
  scheduleMapIdleCallback(map as object, () => {
    map.panTo(center);
  });
}

/**
 * 輪播／箭頭／地圖上的單一標記：先平移；若該標記仍被 MarkerClusterer 收進數字裡（getMap 為空），再 zoom 拆叢集。
 * 點底部卡片開詳情請用 focusMapOnPointAfterCardClick（先 zoom 再 pan）。
 */
export function focusPointMapWithClusterAwareZoom(
  map: GoogleMapsMap,
  point: { lat: number; lng: number },
  marker?: GoogleMapsLegacyMarker | null,
) {
  centerMapOnPoint(map, point);
  if (marker == null) {
    return;
  }
  scheduleMapIdleCallback(map as object, () => {
    const attached = marker.getMap?.();
    if (attached == null) {
      focusMapOnPoint(map, point);
    }
  });
}
