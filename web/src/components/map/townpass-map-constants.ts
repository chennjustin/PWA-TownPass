import { FerrisWheel, ShoppingBag, Utensils } from "lucide-react";
import type { MapContentType } from "./townpass-map-types";

export const MAP_MIN_ZOOM = 10;
export const MAP_MAX_ZOOM = 22;
export const MARKER_CLUSTER_MAX_ZOOM = 18;
export const MARKER_CLUSTER_RADIUS = 64;
/** 點選設施／輪播焦點時拉近到此倍率，讓單一設施清楚可見 */
export const FACILITY_FOCUS_ZOOM = 20;
export const DETAIL_SHEET_COLLAPSE_MS = 320;

export const contentTypeOptions: Array<{
  value: MapContentType;
  label: string;
  Icon: typeof FerrisWheel;
}> = [
  { value: "facility", label: "遊樂設施", Icon: FerrisWheel },
  { value: "restaurant", label: "餐廳", Icon: Utensils },
  { value: "shop", label: "商店", Icon: ShoppingBag },
];
