import Link from 'next/link';
import { ArrowLeft, ArrowRight, Bus, Car, MapPin, Navigation, ParkingCircle } from 'lucide-react';

const metroBusRoutes = [
  '捷運劍潭站出口 3 -> 公車轉乘站 -> 41、紅 30、兒樂 2 號線、529（例假日停駛）、市民小巴 8 -> 兒童新樂園',
  '捷運士林站出口 1 -> 公車轉乘站 -> 255 區、紅 30、兒樂 1 號線（平日停駛）-> 兒童新樂園',
  '捷運芝山站出口 1 -> 公車轉乘站 -> 兒樂 1 號線（平日停駛）-> 兒童新樂園',
  '捷運士林站出口 1 -> 公車轉乘站 -> 紅 12、557 -> 國立科教館站下車，步行至兒童新樂園（約 4 分鐘）',
  '捷運士林站出口 1 -> 公車轉乘站 -> 北環幹線（原 620）-> 士林監理站下車，步行至兒童新樂園（約 3 分鐘）',
];

const bikeRoutes = [
  '捷運劍潭站出口 2 YouBike 租賃站 -> 兒童新樂園大門公車候車亭 YouBike 租賃站',
  '捷運士林站出口 2 YouBike 租賃站 -> 兒童新樂園大門公車候車亭 YouBike 租賃站',
];

const walkingRoutes = [
  '捷運劍潭站出口 1 -> 直行基河路（約 2 公里）-> 兒童新樂園',
  '捷運士林站出口 1 -> 直行中正路，右轉基河路（約 1.5 公里）-> 兒童新樂園',
];

const drivingRoutes = [
  '國道一號：圓山（松江路）交流道 -> 民族東路 -> 民族西路 -> 承德路 -> 文林路 587 巷 -> 兒童新樂園',
  '國道一號：臺北（重慶北路）交流道 -> 百齡橋 -> 承德路 -> 文林路 587 巷 -> 兒童新樂園',
  '國道三號：木柵交流道 -> 國道 3 甲 -> 辛亥路 -> 建國高架道路 -> 國道 1 號（往桃園方向）-> 臺北（重慶北路）交流道 -> 百齡橋 -> 承德路 -> 文林路 587 巷 -> 兒童新樂園',
];

export function TransportPage() {
  return (
    <section className="h-full overflow-y-auto no-scrollbar bg-white pb-24">
      <div className="sticky top-0 z-20 border-b border-grayscale-100 bg-white/95 px-4 pb-3 pt-4 backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-grayscale-700 transition active:scale-95"
            aria-label="回到首頁"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h2 className="text-lg font-semibold text-on-surface">交通資訊</h2>
        </div>
      </div>

      <div className="space-y-5 px-4 pt-4">
        
        <section className="space-y-4 border-b border-grayscale-100 pb-4">
          <div className="flex items-center gap-2">
            <Bus className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-on-surface">一、大眾運輸</h3>
          </div>

          <div className="space-y-2 rounded-lg bg-grayscale-50 p-3">
            <h4 className="text-sm font-semibold text-grayscale-900">捷運轉乘公車</h4>
            <ul className="space-y-1.5 text-sm leading-relaxed text-grayscale-700">
              {metroBusRoutes.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-grayscale-900">捷運轉乘公共自行車（YouBike）</h4>
            <ul className="space-y-1.5 text-sm leading-relaxed text-grayscale-700">
              {bikeRoutes.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-grayscale-900">步行</h4>
            <ul className="space-y-1.5 text-sm leading-relaxed text-grayscale-700">
              {walkingRoutes.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-grayscale-100 p-3">
            <h4 className="text-sm font-semibold text-grayscale-900">高鐵、臺鐵</h4>
            <p className="mt-1 text-sm leading-relaxed text-grayscale-700">
              • 搭乘至臺北車站，轉捷運淡水信義線至劍潭站、士林站或芝山站，再轉乘公車。
            </p>
          </div>
        </section>

        <section className="space-y-3 border-b border-grayscale-100 pb-4">
          <div className="flex items-center gap-2">
            <Car className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-on-surface">二、開車資訊</h3>
          </div>

          <ul className="space-y-1.5 text-sm leading-relaxed text-grayscale-700">
            {drivingRoutes.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>

          <p className="inline-flex items-center gap-1 rounded-full bg-grayscale-100 px-3 py-1 text-sm font-semibold text-grayscale-800">
            <Navigation className="h-4 w-4 text-primary" />
            GPS 座標：東經 121°30&apos;54.5&apos;&apos;、北緯 25°05&apos;48&apos;&apos;
          </p>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <ParkingCircle className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-on-surface">三、停車場資訊</h3>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg border border-grayscale-100 px-2 py-2">
              <p className="text-[11px] text-grayscale-500">汽車車格</p>
              <p className="text-sm font-semibold text-grayscale-900">442</p>
            </div>
            <div className="rounded-lg border border-grayscale-100 px-2 py-2">
              <p className="text-[11px] text-grayscale-500">機車車格</p>
              <p className="text-sm font-semibold text-grayscale-900">393</p>
            </div>
            <div className="rounded-lg border border-grayscale-100 px-2 py-2">
              <p className="text-[11px] text-grayscale-500">限高</p>
              <p className="text-sm font-semibold text-grayscale-900">2.1m</p>
            </div>
          </div>

          <div className="text-sm leading-relaxed text-grayscale-700">
            <p>位置：請由園區北側文林路 587 巷出入口進入。</p>
          </div>

          <div className="space-y-2 text-sm leading-relaxed text-grayscale-700">
            <h4 className="font-semibold text-grayscale-900">收費標準</h4>
            <p>• 汽車：平日 30 元/時、假日 40 元/時（8:00-20:00）；夜間 10 元/時（20:00-翌日 8:00）。</p>
            <p>• 機車：20 元/次，隔日另計。</p>
            <p>• 收費以 30 分鐘為單位，未滿 30 分鐘以 30 分鐘計。</p>
            <p>• 支援悠遊卡與多項多元支付。</p>
            <p>• 身心障礙停車優惠：汽車免費 4 小時，超過後半價；機車依費率半價（請持證件正本至管理室辦理）。</p>
            <p>• 夜間（閉園至翌日 6 時）不開放臨停入場。</p>
          </div>

          <div className="space-y-2 text-sm leading-relaxed text-grayscale-700">
            <h4 className="font-semibold text-grayscale-900">月票資訊</h4>
            <p>• 提供汽車限時夜間月票與機車全時月票；里民優惠依現場公告。</p>
            <p>• 申請請備妥身分與車輛證件正本至汽車管理室辦理。</p>
            <p>• 月票時間：汽車 17:30-翌日 9:00；機車 24 小時。</p>
            <p>• 不提供固定或保留車位，滿位時需排隊。</p>
          </div>

          <div className="rounded-lg bg-grayscale-50 p-3 text-sm text-grayscale-700">
            停車場管理室 / 24 小時客服：<span className="font-semibold">(02) 2834-5378</span>
          </div>
        </section>

        <Link
          href="/map"
          className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-primary"
        >
          查看園區地圖
          <ArrowRight className="h-4 w-4" />
        </Link>

        <p className="pb-2 text-xs text-grayscale-500">
          <MapPin className="mr-1 inline h-3.5 w-3.5" />
          地址：台北市士林區承德路五段 55 號
        </p>
      </div>
    </section>
  );
}

