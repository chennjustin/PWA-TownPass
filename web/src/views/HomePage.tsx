import Image from 'next/image';
import { HelpCircle, Bus, Info, Calendar, Users } from 'lucide-react';
import { IMAGES } from '@/src/constants';

export function HomePage() {
  return (
    <div className="pt-14 px-4 space-y-6">
      {/* Banner */}
      <section className="mt-4">
        <div className="relative w-full h-44 rounded-xl overflow-hidden shadow-sm">
          <Image className="object-cover" src={IMAGES.BANNER} alt="Summer Carnival" fill sizes="100vw" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
            <h2 className="text-white font-display font-semibold text-lg">夏季嘉年華：星光遊行</h2>
            <p className="text-white/90 text-xs">每日 19:00 準時開始</p>
          </div>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            <div className="w-3 h-1 bg-primary-500 rounded-full" />
            <div className="w-1.5 h-1.5 bg-grayscale-300 rounded-full" />
            <div className="w-1.5 h-1.5 bg-grayscale-300 rounded-full" />
          </div>
        </div>
      </section>

      {/* Service Grid */}
      <section className="grid grid-cols-4 gap-2">
        {[
          { icon: HelpCircle, label: '常見問題' },
          { icon: Bus, label: '交通方式' },
          { icon: Info, label: '遊園資訊' },
          { icon: Calendar, label: '設施預約' },
        ].map((item, idx) => (
          <div key={idx} className="flex flex-col items-center gap-1">
            <div className="w-14 h-14 bg-white border border-grayscale-100 rounded-full flex items-center justify-center shadow-sm">
              <item.icon className="w-6 h-6 text-primary" />
            </div>
            <span className="text-[10px] text-grayscale-700 font-medium">{item.label}</span>
          </div>
        ))}
      </section>

      {/* Real-time Info */}
      <section className="space-y-3">
        <div className="flex justify-between items-end">
          <h3 className="font-display font-semibold text-lg text-grayscale-900">即時資訊</h3>
          <span className="text-primary font-semibold text-sm">查看更多</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1 bg-white border border-grayscale-100 p-4 rounded-xl flex flex-col justify-between h-32">
            <div>
              <p className="text-grayscale-500 text-xs font-medium">今日入園狀態</p>
              <p className="text-2xl font-display font-semibold text-primary mt-1">舒適</p>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-500" />
              <span className="text-sm text-grayscale-700">預估人數：3,500</span>
            </div>
          </div>
          <div className="md:col-span-2 bg-white border border-grayscale-100 rounded-xl overflow-hidden">
            <div className="p-3 bg-primary-50 border-b border-grayscale-100">
              <p className="text-primary font-semibold text-sm">最短排隊設施</p>
            </div>
            <div className="divide-y divide-grayscale-100">
              {[
                { name: '雲霄飛車', time: '10 min' },
                { name: '旋轉木馬', time: '5 min' },
                { name: '激流泛舟', time: '15 min' },
              ].map((attr, idx) => (
                <div key={idx} className="p-3 flex justify-between items-center text-sm">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-primary-500 rounded-full" />
                    <span className="font-semibold text-grayscale-900">{attr.name}</span>
                  </div>
                  <span className="text-primary font-semibold">{attr.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Activities */}
      <section className="space-y-3 pb-8">
        <h3 className="font-display font-semibold text-lg text-grayscale-900">活動訊息</h3>
        <div className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 no-scrollbar snap-x">
          <div className="flex-shrink-0 w-72 bg-white border border-grayscale-100 rounded-xl overflow-hidden snap-start shadow-sm">
            <div className="relative h-40">
              <Image className="object-cover" src={IMAGES.FOOD} alt="Food Discount" fill sizes="288px" />
            </div>
            <div className="p-3 space-y-1">
              <span className="inline-block px-2 py-0.5 bg-orange-500/10 text-orange-500 text-[10px] font-bold rounded-full">限時優惠</span>
              <h4 className="font-display font-semibold text-grayscale-900">美食街 85 折優惠</h4>
              <p className="text-grayscale-500 text-sm">出示 App 會員即享優惠</p>
            </div>
          </div>
          <div className="flex-shrink-0 w-72 bg-white border border-grayscale-100 rounded-xl overflow-hidden snap-start shadow-sm">
            <div className="relative h-40">
              <Image className="object-cover" src={IMAGES.FIREWORKS} alt="Fireworks" fill sizes="288px" />
            </div>
            <div className="p-3 space-y-1">
              <span className="inline-block px-2 py-0.5 bg-primary-100 text-primary-700 text-[10px] font-bold rounded-full">特別表演</span>
              <h4 className="font-display font-semibold text-grayscale-900">週末煙火秀</h4>
              <p className="text-grayscale-500 text-sm">每週六、日晚上 8 點</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
