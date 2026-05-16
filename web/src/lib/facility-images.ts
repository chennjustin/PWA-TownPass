import { IMAGES } from '@/src/constants';

const FACILITY_IMAGES = [
  IMAGES.ROLLERCOASTER,
  IMAGES.CAROUSEL,
  IMAGES.DROP_TOWER,
  IMAGES.RIVER_RAPIDS,
] as const;

/** 依設施 id 穩定對應列表縮圖／詳情主圖 */
export function getFacilityImageUrl(pointId: string) {
  const hash = Array.from(pointId).reduce((total, char) => total + char.charCodeAt(0), 0);
  return FACILITY_IMAGES[hash % FACILITY_IMAGES.length];
}
