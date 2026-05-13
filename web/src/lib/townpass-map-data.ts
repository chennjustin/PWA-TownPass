export type TownPassPointType = "facility" | "restaurant";

export type TownPassPoint = {
  id: string;
  name: string;
  floor?: number | null;
  category: string;
  lat: number;
  lng: number;
  pointType: TownPassPointType;
};

type GeoJsonPointFeature = {
  type: "Feature";
  properties?: {
    id?: string | number | null;
    fid?: string | number | null;
    name?: string | null;
    floor?: number | null;
    type?: string | null;
  };
  geometry?: {
    type?: string;
    coordinates?: [number, number];
  };
};

type GeoJsonCollection = {
  type: "FeatureCollection";
  features?: GeoJsonPointFeature[];
};

const FACILITY_GEOJSON_URL = "/new_map.geojson";
const RESTAURANT_GEOJSON_URL = "/restaurant2.geojson";

export const parkCenter = {
  lat: 25.0974,
  lng: 121.5151,
};

export const parkBounds = {
  north: 25.0990,
  south: 25.0950,
  east: 121.5175,
  west: 121.5130,
};

export async function loadTownPassPoints() {
  const [facilityPoints, restaurantPoints] = await Promise.all([
    fetchPointsFromGeoJson(FACILITY_GEOJSON_URL, "facility"),
    fetchPointsFromGeoJson(RESTAURANT_GEOJSON_URL, "restaurant"),
  ]);

  return {
    facilityPoints,
    restaurantPoints,
    allPoints: [...facilityPoints, ...restaurantPoints],
  };
}

async function fetchPointsFromGeoJson(
  url: string,
  pointType: TownPassPointType,
): Promise<TownPassPoint[]> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load GeoJSON: ${url}`);
  }

  const geoJson = (await response.json()) as GeoJsonCollection;
  const features = geoJson.features ?? [];

  return features
    .filter((feature) => feature.geometry?.type === "Point")
    .map((feature, index) => {
      const coordinates = feature.geometry?.coordinates;
      const [lng, lat] = coordinates ?? [parkCenter.lng, parkCenter.lat];
      const name = feature.properties?.name?.trim() || `${pointType}-${index + 1}`;
      const floor = feature.properties?.floor ?? null;
      const rawCategory = feature.properties?.type?.trim();
      const category =
        rawCategory && rawCategory.length > 0
          ? rawCategory
          : pointType === "facility"
            ? "設施"
            : "餐廳";
      const rawId = feature.properties?.id ?? feature.properties?.fid ?? index + 1;

      return {
        id: `${pointType}-${rawId}`,
        name,
        floor,
        category,
        lat,
        lng,
        pointType,
      };
    });
}

export type RideFilterState = {
  height: string | null;
  thrill: string | null;
  environment: string | null;
  price: string | null;
  special: string | null;
};

export type PlaceDetail = {
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

export type PlaceDetailsResponse = {
  places?: PlaceDetail[];
};

export const PLACE_DETAILS_URL = "/place-details.json";

export const heightFilterOptions = [
  "幼童友善（未滿 90cm）",
  "小學門檻（90cm-110cm）",
  "刺激挑戰（110cm 以上）",
];

export const thrillFilterOptions = ["溫和型", "中度刺激", "高刺激"];
export const environmentFilterOptions = ["露天", "頂棚區"];
export const priceFilterOptions = ["🎠 基礎遊具（20～30 元）", "⭐ 委外精選設施（50～80 元）"];
export const specialFilterOptions = ["🤰 孕婦可搭乘", "♿ 無障礙標示", "❄️ 冷氣開放"];

export const defaultRideFilters: RideFilterState = {
  height: null,
  thrill: null,
  environment: null,
  price: null,
  special: null,
};

const facilityWaitSamples = [15, 25, 35, 45, 5];

export function getFacilityWaitMinutes(point: TownPassPoint | { id: string }) {
  const hash = Array.from(point.id).reduce(
    (total, char) => total + char.charCodeAt(0),
    0,
  );
  return facilityWaitSamples[hash % facilityWaitSamples.length];
}

