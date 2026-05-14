import type { TownPassPoint } from "@/src/lib/townpass-map-data";
import type {
  GoogleMapsLegacyMarker,
  GoogleMapsNamespace,
  MapContentType,
  MarkerKind,
} from "./townpass-map-types";

export function normalizePlaceName(name: string) {
  return name.replace(/\s+/g, "").replace(/[()（）]/g, "").toLowerCase();
}

export function getMapsNamespace(): GoogleMapsNamespace | null {
  const maps = window.google?.maps;
  if (!maps) {
    return null;
  }
  return maps as unknown as GoogleMapsNamespace;
}

export function getPointLabel(pointType: TownPassPoint["pointType"]) {
  return pointType === "facility" ? "設施" : "餐飲";
}

export function getFloorText(floor?: number | null) {
  return typeof floor === "number" ? `${floor} 樓` : "樓層未標示";
}

export function clearMarker(marker: GoogleMapsLegacyMarker) {
  marker.setMap(null);
}

export function getMarkerKind(point: TownPassPoint): MarkerKind {
  const text = `${point.name}${point.category}`.toLowerCase();

  if (text.includes("商店") || text.includes("超商") || text.includes("拍貼") || text.includes("化石"))
    return "shop";
  if (point.pointType === "restaurant" || text.includes("餐") || text.includes("食")) return "restaurant";
  return "ferrisWheel";
}

export function getPointContentType(point: TownPassPoint): MapContentType {
  if (point.pointType === "facility") {
    return "facility";
  }

  return getMarkerKind(point) === "shop" ? "shop" : "restaurant";
}

export function isRidePoint(point: TownPassPoint) {
  return (
    point.pointType === "facility" &&
    ["大型遊樂設施", "K系列", "A系列"].includes(point.category)
  );
}

export function getRecommendedHeightFilters(childHeight: string) {
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

export function matchesTextFilter(value: string | null | undefined, filters: string[]) {
  if (filters.length === 0) {
    return true;
  }

  if (!value) {
    return false;
  }

  return filters.some(
    (filter) =>
      value.includes(filter) ||
      (filter.includes("幼童友善") && value.includes("幼童友善")) ||
      (filter.includes("小學門檻") && value.includes("小學門檻")) ||
      (filter.includes("刺激挑戰") && value.includes("刺激挑戰")),
  );
}

export function matchesListFilter(values: string[] | undefined, filters: string[]) {
  if (filters.length === 0) {
    return true;
  }

  return Boolean(values?.some((value) => filters.some((filter) => value.includes(filter))));
}

export function getParkOperatingStatus(date: Date) {
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
