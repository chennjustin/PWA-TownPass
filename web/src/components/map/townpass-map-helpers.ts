import type { PlaceDetail, RideFilterState, TownPassPoint } from "@/src/lib/townpass-map-data";
import type {
  GoogleMapsLegacyMarker,
  GoogleMapsNamespace,
  MapContentType,
  MarkerKind,
} from "./townpass-map-types";

import {
  getDisplayFacilityName,
  getDisplayPlaceCategory,
  shouldHideFacilityFilterTag,
} from "@/src/lib/facility-display";

export {
  getDisplayFacilityName,
  getDisplayPlaceCategory,
  stripFacilityNamePrefix,
} from "@/src/lib/facility-display";

export function normalizePlaceName(name: string) {
  return getDisplayFacilityName(name)
    .replace(/\s+/g, "")
    .replace(/[()（）]/g, "")
    .toLowerCase();
}

export function getMapsNamespace(): GoogleMapsNamespace | null {
  const maps = window.google?.maps;
  if (!maps) {
    return null;
  }
  return maps as unknown as GoogleMapsNamespace;
}

export function getPointLabel(point: TownPassPoint) {
  if (point.pointType === "facility") {
    return "設施";
  }
  return getMarkerKind(point) === "shop" ? "商店" : "餐飲";
}

export function getPointLabelDotClass(point: TownPassPoint) {
  if (point.pointType === "facility") {
    return "bg-primary";
  }
  return getMarkerKind(point) === "shop" ? "bg-secondary-500" : "bg-red-500";
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

export function buildPlaceDetailsMap(places: PlaceDetail[]) {
  const map = new Map<string, PlaceDetail>();

  for (const place of places) {
    map.set(normalizePlaceName(place.name), place);
    for (const alias of place.aliases ?? []) {
      map.set(normalizePlaceName(alias), place);
    }
  }

  return map;
}

/** 回傳此設施符合的使用者已選篩選條件（用於列表卡片標籤） */
export function getMatchingActiveFilterLabels(
  filters: PlaceDetail["filters"] | undefined,
  rideFilters: RideFilterState,
) {
  const labels: string[] = [];
  const combinedSpecial = [...(filters?.special ?? []), ...(filters?.environment ?? [])];

  for (const value of rideFilters.height) {
    if (matchesTextFilter(filters?.height, [value])) {
      labels.push(value);
    }
  }
  for (const value of rideFilters.thrill) {
    if (matchesTextFilter(filters?.thrill, [value])) {
      labels.push(value);
    }
  }
  for (const value of rideFilters.environment) {
    if (matchesListFilter(filters?.environment, [value])) {
      labels.push(value);
    }
  }
  for (const value of rideFilters.price) {
    if (matchesTextFilter(filters?.price, [value])) {
      labels.push(value);
    }
  }
  for (const value of rideFilters.special) {
    if (matchesListFilter(combinedSpecial, [value])) {
      labels.push(value);
    }
  }

  return labels;
}

export function getPlaceDetailFilterTags(detail: PlaceDetail | null | undefined) {
  if (!detail?.filters) {
    return [];
  }

  return [
    detail.filters.height,
    detail.filters.thrill,
    ...(detail.filters.environment ?? []),
    detail.filters.price,
    ...(detail.filters.special ?? []),
  ].filter(
    (tag): tag is string => typeof tag === "string" && tag.length > 0 && !shouldHideFacilityFilterTag(tag),
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

export type ParkOperatingStatus = ReturnType<typeof getParkOperatingStatus>;

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
