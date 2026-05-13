'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { HelpCircle, Info, Calendar, Users, ChevronDown, ArrowRight, Bus, Navigation, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { IMAGES } from '@/src/constants';
import { townPassFaqData } from '@/src/lib/townpass-faq-data';

const homeQuickFaqs = townPassFaqData.filter((item) => item.featured).slice(0, 4);
const PARK_LAT = 25.0974;
const PARK_LNG = 121.5151;
const GOOGLE_MAPS_NAV_URL = `https://www.google.com/maps/dir/?api=1&destination=${PARK_LAT},${PARK_LNG}&travelmode=transit`;
const recentActivities = [
  {
    image: IMAGES.BANNER,
    title: '夏季嘉年華：星光遊行',
    subtitle: '每日 19:00 準時開始',
    tag: '園區主打',
  },
  {
    image: IMAGES.FIREWORKS,
    title: '週末煙火秀',
    subtitle: '每週六、日 20:00 登場',
    tag: '特別演出',
  },
  {
    image: IMAGES.FOOD,
    title: '美食街 85 折優惠',
    subtitle: '會員出示 App 即享折扣',
    tag: '限時優惠',
  },
];

const activityCards = [
  {
    image: IMAGES.FOOD,
    title: '美食街 85 折優惠',
    description: '出示 App 會員即享優惠',
    tag: '限時優惠',
    date: '即日起',
  },
  {
    image: IMAGES.FIREWORKS,
    title: '週末煙火秀',
    description: '每週六、日晚上 8 點',
    tag: '特別表演',
    date: '週末限定',
  },
];

export function HomePage() {
  const [isLocating, setIsLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveBannerIndex((current) => (current + 1) % recentActivities.length);
    }, 4500);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const navigateFromCurrentLocation = () => {
    if (!navigator.geolocation) {
      window.open(GOOGLE_MAPS_NAV_URL, '_blank', 'noopener,noreferrer');
      return;
    }

    setIsLocating(true);
    setLocationMessage(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        window.open(
          `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${PARK_LAT},${PARK_LNG}&travelmode=transit`,
          '_blank',
          'noopener,noreferrer',
        );
        setIsLocating(false);
      },
      () => {
        setLocationMessage('未取得目前位置，已改為開啟園區導航頁。');
        window.open(GOOGLE_MAPS_NAV_URL, '_blank', 'noopener,noreferrer');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="px-4 space-y-6 pb-6">
      {/* Banner */}
      <section className="mt-4">
        <div className="relative w-full h-44 rounded-xl overflow-hidden shadow-sm">
          {recentActivities.map((activity, index) => (
            <Image
              key={activity.title}
              className={`object-cover transition-opacity duration-500 ${
                activeBannerIndex === index ? 'opacity-100' : 'opacity-0'
              }`}
              src={activity.image}
              alt={activity.title}
              fill
              sizes="100vw"
              priority={index === 0}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent flex flex-col justify-end p-4">
            <span className="inline-flex w-fit rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
              {recentActivities[activeBannerIndex].tag}
            </span>
            <h2 className="mt-2 text-white font-display font-semibold text-lg">{recentActivities[activeBannerIndex].title}</h2>
            <p className="text-white/90 text-xs">{recentActivities[activeBannerIndex].subtitle}</p>
          </div>
          <button
            onClick={() =>
              setActiveBannerIndex((current) =>
                current === 0 ? recentActivities.length - 1 : current - 1,
              )
            }
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-1.5 text-white backdrop-blur-sm transition active:scale-95"
            aria-label="上一則活動"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setActiveBannerIndex((current) => (current + 1) % recentActivities.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-1.5 text-white backdrop-blur-sm transition active:scale-95"
            aria-label="下一則活動"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {recentActivities.map((activity, index) => (
              <button
                key={`dot-${activity.title}`}
                onClick={() => setActiveBannerIndex(index)}
                className={`h-1.5 rounded-full transition-all ${
                  activeBannerIndex === index ? 'w-5 bg-white' : 'w-1.5 bg-white/55'
                }`}
                aria-label={`切換到活動 ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Transport */}
      <section className="space-y-3">
        <div className="flex items-center gap-1">
          <h3 className="font-display font-semibold text-lg text-grayscale-900">交通方式</h3>
          <Bus className="h-4 w-4 text-primary" />
        </div>

        <div className="space-y-2 border-y border-grayscale-100 py-3">
          <div className="flex items-start gap-2 text-sm text-grayscale-700">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="font-semibold text-grayscale-900">兒童新樂園</p>
              <p>台北市士林區承德路五段 55 號（近劍潭／士林站）</p>
              <button
                onClick={navigateFromCurrentLocation}
                disabled={isLocating}
                className="mt-2 inline-flex items-center gap-1 border border-primary px-3 py-2 text-xs font-semibold text-primary transition disabled:opacity-60 active:scale-95"
              >
                <Navigation className="h-3.5 w-3.5" />
                {isLocating ? '定位中...' : '從目前位置導航'}
              </button>
            </div>
          </div>
          {locationMessage && <p className="text-xs text-grayscale-500">{locationMessage}</p>}
        </div>
      </section>

      {/* Real-time Info */}
      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1">
            <h3 className="font-display font-semibold text-lg text-grayscale-900">即時資訊</h3>
            <Info className="h-4 w-4 text-primary" />
          </div>
          <span className="font-semibold text-sm text-primary">查看更多</span>
        </div>
        <div className="flex flex-col gap-4">
          <div className="bg-white border border-grayscale-100 p-4 rounded-xl flex items-center justify-between shadow-sm">
            <div>
              <p className="text-grayscale-500 text-xs font-medium mb-1">今日入園狀態</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-display font-semibold text-primary">舒適</p>
                <span className="text-xs font-semibold text-grayscale-500 flex items-center gap-1">預估 3,500 人</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div className="bg-white border border-grayscale-100 rounded-xl overflow-hidden shadow-sm">
            <div className="p-3 bg-primary-50 border-b border-grayscale-100 flex justify-between items-center">
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

      {/* FAQ Preview */}
      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1">
            <h3 className="font-display font-semibold text-lg text-grayscale-900">常見問題</h3>
            <HelpCircle className="h-4 w-4 text-primary" />
          </div>
          <Link href="/faq" className="inline-flex items-center gap-1 text-primary font-semibold text-sm">
            查看完整 FAQ <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="divide-y divide-grayscale-200 border-y border-grayscale-100">
          {homeQuickFaqs.map((faq) => (
            <details
              key={faq.id}
              className="group bg-transparent py-3"
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
                <div>
                  <span className="inline-block border-l-2 border-primary pl-2 text-[10px] font-bold text-primary-700">
                    {faq.category}
                  </span>
                  <h4 className="mt-1 text-sm font-semibold text-grayscale-900">{faq.question}</h4>
                </div>
                <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-grayscale-500 transition group-open:rotate-180" />
              </summary>

              <div className="mt-2 space-y-1 border-t border-grayscale-100 pt-2">
                {faq.answer.slice(0, 2).map((line, idx) => (
                  <p key={`${faq.id}-home-${idx}`} className="text-sm text-grayscale-600 leading-relaxed">
                    {line}
                  </p>
                ))}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* Activities */}
      <section className="space-y-3 pb-8">
        <div className="flex items-center">
          <h3 className="font-display font-semibold text-lg text-grayscale-900">活動訊息</h3>
          <Calendar className="ml-1 h-4 w-4 text-primary" />
        </div>
        <div className="flex overflow-x-auto gap-4 pb-4 pl-1 pr-1 no-scrollbar snap-x snap-mandatory">
          {activityCards.map((activity) => (
            <article
              key={activity.title}
              className="flex-shrink-0 w-[86%] border border-grayscale-100 bg-white snap-start overflow-hidden shadow-sm"
            >
              <div className="relative h-44">
                <Image className="object-cover" src={activity.image} alt={activity.title} fill sizes="320px" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
                <div className="absolute left-3 top-3 inline-flex items-center gap-1 bg-white/90 px-2 py-1 text-[10px] font-semibold text-grayscale-700">
                  <Calendar className="h-3 w-3 text-primary" />
                  {activity.date}
                </div>
                <div className="absolute left-3 right-3 bottom-3">
                  <span className="inline-flex bg-primary/90 px-2 py-0.5 text-[10px] font-semibold text-white">
                    {activity.tag}
                  </span>
                  <h4 className="mt-2 font-display text-2xl font-semibold text-white">{activity.title}</h4>
                </div>
              </div>
              <div className="flex items-center justify-between p-3">
                <p className="text-sm text-grayscale-600">{activity.description}</p>
                <button className="inline-flex shrink-0 items-center gap-1 border border-primary px-2.5 py-1.5 text-xs font-semibold text-primary transition active:scale-95">
                  立即查看
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
