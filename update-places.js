const fs = require('fs');
const path = './web/public/place-details.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

const outdoor = [
  "海洋總動員", "飛天神奇號", "尋寶船", "叢林吼吼樹屋", "K1冰雪奇航", "小航海王", "A9歡樂碰碰船", "摩天輪", "銀河號", "宇宙迴旋", "星空小飛碟", "魔法星際飛車", "K2鋼鐵碰碰車", "A8坦克大戰", "A1汽車教練場", "A2戰火金剛", "A3小航海王"
];
// Note: user said 冰雪奇航, 小航海王, 歡樂碰碰船, 鋼鐵碰碰車, 坦克大戰, 汽車教練場. In JSON they are prefixed with K1, A3, A9, K2, A8, A1.

const canopy = [
  "轉轉咖啡杯", "巡弋飛椅", "小飛龍", "幸福碰碰車", "A10迷你卡丁車"
];

data.places.forEach(place => {
  if (place.filters) {
    // Basic Price updates
    if (place.filters.price && place.filters.price.includes("基礎遊具")) {
      place.filters.price = "🎠 基礎遊具（20～30 元）";
    } else if (place.filters.price && place.filters.price.includes("委外精選設施")) {
      place.filters.price = "⭐ 委外精選設施（50～80 元）";
    }

    // Environment updates
    let envSet = new Set(place.filters.environment || []);
    envSet.delete("露天");
    envSet.delete("頂棚區");
    
    const isOutdoor = outdoor.some(n => place.name.includes(n.replace(/^[A-K]\d+/, '')));
    const isCanopy = canopy.some(n => place.name.includes(n.replace(/^[A-K]\d+/, '')));
    
    if (isOutdoor) {
      envSet.add("露天");
    } else if (isCanopy) {
      envSet.add("頂棚區");
    }
    place.filters.environment = Array.from(envSet);

    // Special updates
    let specSet = new Set();
    if (place.name === "海洋總動員") {
      specSet.add("🤰 孕婦可搭乘");
      specSet.add("♿ 無障礙標示");
    } else if (place.name === "摩天輪" || place.name === "銀河號") {
      specSet.add("♿ 無障礙標示");
      specSet.add("❄️ 冷氣開放");
    }
    // Only apply special updates if it's a ride
    if (place.category.includes("設施")) {
      place.filters.special = Array.from(specSet);
    }
  }
});

fs.writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
console.log('Updated place-details.json');
