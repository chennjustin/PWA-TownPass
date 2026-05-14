import type { TownPassPoint } from "@/src/lib/townpass-map-data";
import type { GoogleMapsNamespace, MarkerKind } from "./townpass-map-types";
import { getMarkerKind } from "./townpass-map-helpers";

function getMarkerIconPath(kind: MarkerKind) {
  switch (kind) {
    case "restaurant":
      return '<path d="M28 16v38M22 16v14a6 6 0 0 0 12 0V16M44 16v38M44 16c6 3 8 9 6 17-1 4-3 7-6 8"/>';
    case "ferrisWheel":
      return '<circle cx="36" cy="33" r="17"/><circle cx="36" cy="33" r="3"/><path d="M36 36v18M25 56h22M29 54l7-18 7 18M36 16v-6M24 21l-4-4M48 21l4-4M19 33h-6M59 33h-6M24 45l-4 4M48 45l4 4"/><rect x="32" y="9" width="8" height="6" rx="2"/><rect x="16" y="29" width="8" height="6" rx="2"/><rect x="48" y="29" width="8" height="6" rx="2"/><rect x="20" y="45" width="8" height="6" rx="2"/><rect x="44" y="45" width="8" height="6" rx="2"/>';
    case "shop":
      return '<path d="M25 29h22l3 24H22l3-24Z"/><path d="M30 29v-5a6 6 0 0 1 12 0v5"/>';
  }
}

export function createMapMarkerIcon(
  point: TownPassPoint,
  selected: boolean,
  maps: GoogleMapsNamespace,
) {
  const fill = selected ? "#F36F7F" : "#FFFFFF";
  const stroke = selected ? "#FFFFFF" : "#9AAEC8";
  const size = selected ? 56 : 42;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 10}" viewBox="0 0 72 84">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="#0B0D0E" flood-opacity="0.18"/>
        </filter>
      </defs>
      <path filter="url(#shadow)" d="M18 5h36c8 0 13 5 13 13v35c0 8-5 13-13 13H43L36 78l-7-12H18C10 66 5 61 5 53V18C5 10 10 5 18 5Z" fill="${fill}"/>
      <g fill="none" stroke="${stroke}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
        ${getMarkerIconPath(getMarkerKind(point))}
      </g>
    </svg>
  `;

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new maps.Size(size, size + 10),
    anchor: new maps.Point(size / 2, size + 6),
  };
}
