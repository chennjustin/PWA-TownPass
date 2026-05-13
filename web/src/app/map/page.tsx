import { TownPassMap } from "@/src/components/map/townpass-map";

export default function Page() {
  return (
    <div className="h-full overflow-y-auto px-4 pb-24 pt-16">
      <div className="mb-4">
        <h1 className="font-display text-xl font-semibold text-grayscale-900">
          園區地圖
        </h1>
        <p className="mt-1 text-sm text-grayscale-600">
          載入 Google Maps，並顯示設施與餐廳點位。
        </p>
      </div>
      <TownPassMap />
    </div>
  );
}
