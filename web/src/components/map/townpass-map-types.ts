export type GoogleMapsMap = {
  fitBounds: (bounds: GoogleMapsLatLngBounds, padding?: number) => void;
  panTo: (position: { lat: number; lng: number }) => void;
  setZoom: (zoom: number) => void;
  getZoom?: () => number;
  /** 同時設定中心與縮放，動畫通常比「先 pan 再 zoom」一氣呵成 */
  setOptions?: (options: { zoom?: number; center?: { lat: number; lng: number } }) => void;
};

export type GoogleMapsLegacyMarker = {
  addListener: (eventName: string, callback: () => void) => void;
  setMap: (map: GoogleMapsMap | null) => void;
  getMap?: () => GoogleMapsMap | null | undefined;
  setIcon: (icon: GoogleMapsMarkerIcon) => void;
  setZIndex: (zIndex: number) => void;
};

export type GoogleMapsMarkerIcon = {
  url: string;
  scaledSize: unknown;
  anchor: unknown;
};

export type GoogleMapsInfoWindow = {
  close: () => void;
};

export type GoogleMapsLatLngBounds = {
  extend: (position: { lat: number; lng: number }) => void;
};

export type GoogleMapsGroundOverlay = {
  setMap: (map: GoogleMapsMap | null) => void;
};

export type GoogleMapsNamespace = {
  Map: new (element: HTMLElement, options: Record<string, unknown>) => GoogleMapsMap;
  Marker: new (options: Record<string, unknown>) => GoogleMapsLegacyMarker;
  InfoWindow: new () => GoogleMapsInfoWindow;
  LatLngBounds: new () => GoogleMapsLatLngBounds;
  GroundOverlay: new (
    url: string,
    bounds: Record<string, number>,
    options?: Record<string, unknown>,
  ) => GoogleMapsGroundOverlay;
  Point: new (x: number, y: number) => unknown;
  Size: new (width: number, height: number) => unknown;
};

export type MapLayerState = {
  facilities: boolean;
  restaurants: boolean;
};

export type MapContentType = "facility" | "restaurant" | "shop";

export type MarkerEntry = {
  marker: GoogleMapsLegacyMarker;
  pointId: string;
};

export type MarkerKind = "restaurant" | "shop" | "ferrisWheel";

/** 僅供型別斷言；實際為 MarkerClusterer 建構參數的 map */
export type MarkerClustererMap = object;
