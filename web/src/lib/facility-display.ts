/** 不顯示於頁面的 place-details 分類 */
const HIDDEN_PLACE_CATEGORIES = new Set([
  "基礎遊樂設施",
  "委外遊樂設施",
  "小型委外設施",
]);

/** 移除 K2、A10 等設施代號前綴，僅保留顯示名稱 */
export function stripFacilityNamePrefix(name: string) {
  return name.replace(/^[KA]\d+/i, "").trim();
}

export function getDisplayFacilityName(name: string) {
  const stripped = stripFacilityNamePrefix(name);
  return stripped.length > 0 ? stripped : name;
}

export function getDisplayPlaceCategory(category: string | null | undefined) {
  if (!category || HIDDEN_PLACE_CATEGORIES.has(category)) {
    return null;
  }
  return category;
}

export function shouldHideFacilityFilterTag(tag: string) {
  return /基礎遊具|基礎遊樂|委外精選|委外遊樂|小型委外/.test(tag);
}
