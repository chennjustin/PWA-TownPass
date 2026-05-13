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
