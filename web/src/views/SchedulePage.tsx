'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ChevronDown, ChevronUp, Star, Info, MapPin as LocationIcon, Clock, BellRing } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { IMAGES } from '@/src/constants';

export function SchedulePage() {
  const [expandedId, setExpandedId] = useState<number | null>(1);

  const events = [
    {
      id: 0,
      time: '10:00',
      title: '夢幻城堡開門大典',
      location: '夢幻城堡大門',
    },
    {
      id: 1,
      time: '14:00',
      title: '夢幻大遊行',
      location: '中央廣場',
      description: '來自童話世界的經典角色將齊聚一堂，伴隨絢麗花車與動感歌舞，與遊客近距離互動。這是園內最受歡迎的定時活動，建議提早15分鐘佔位。',
      duration: '約 30 分鐘',
      tag: '熱門活動',
      image: IMAGES.PARADE
    },
    {
      id: 2,
      time: '16:30',
      title: '奇幻水舞秀',
      location: '星光湖畔',
    },
    {
      id: 3,
      time: '19:00',
      title: '極光煙火音樂祭',
      location: '全區天空 / 城堡廣場',
    }
  ];

  return (
    <div className="px-4 space-y-6 pb-6 no-scrollbar">
      {/* Date Toggle */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar pt-2">
        {['今日 05/24', '明日 05/25', '週日 05/26', '週一 05/27'].map((date, idx) => (
          <button
            key={idx}
            className={cn(
              "flex-none px-5 py-2 rounded-xl font-semibold text-sm transition-all shadow-sm",
              idx === 0 ? "bg-primary text-white" : "bg-surface-container-low text-grayscale-700 hover:bg-grayscale-100"
            )}
          >
            {date}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <section className="relative pl-6 space-y-4">
        {/* Continuous Line */}
        <div className="absolute left-2.5 top-0 bottom-0 w-0.5 bg-grayscale-100 -z-10" />

        {events.map((event) => (
          <div key={event.id} className="relative">
            {/* Timeline Dot */}
            <div className={cn(
              "absolute -left-[22px] top-3 w-3.5 h-3.5 rounded-full border-2 border-surface z-10",
              expandedId === event.id ? "bg-primary ring-4 ring-primary-100" : "bg-primary"
            )} />

            <div 
              className={cn(
                "bg-white border rounded-xl overflow-hidden transition-all duration-300 shadow-sm cursor-pointer",
                expandedId === event.id ? "border-primary border-2" : "border-grayscale-100 hover:bg-primary-50"
              )}
              onClick={() => setExpandedId(expandedId === event.id ? null : event.id)}
            >
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-primary font-semibold text-sm">{event.time}</span>
                    <h3 className="font-display font-semibold text-md text-on-surface">{event.title}</h3>
                    <div className="flex items-center gap-1 text-grayscale-500 font-semibold text-[10px]">
                      <LocationIcon className="w-3 h-3" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                  {expandedId === event.id ? (
                    <ChevronUp className="w-5 h-5 text-primary" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-grayscale-300" />
                  )}
                </div>

                {expandedId === event.id && event.description && (
                  <div className="mt-4 border-t border-grayscale-100 pt-4 space-y-4">
                    <p className="text-grayscale-700 text-sm leading-relaxed">
                      {event.description}
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="bg-primary-50 text-primary px-2 py-1 rounded-lg flex items-center gap-1 font-bold text-[10px]">
                        <Clock className="w-3 h-3" />
                        <span>{event.duration}</span>
                      </div>
                      <div className="bg-secondary-container/20 text-secondary px-2 py-1 rounded-lg flex items-center gap-1 font-bold text-[10px]">
                        <Star className="w-3 h-3 fill-current" />
                        <span>{event.tag}</span>
                      </div>
                    </div>
                    <button className="w-full py-3 bg-primary text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all">
                      <BellRing className="w-4 h-4" />
                      提醒我
                    </button>
                    {event.image && (
                       <div className="relative h-32 overflow-hidden rounded-lg">
                         <Image src={event.image} alt={event.title} className="object-cover" fill sizes="100vw" />
                       </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Info Banner */}
      <div className="p-4 bg-primary-100 rounded-xl flex items-center gap-4">
        <div className="bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center shrink-0">
          <Info className="w-6 h-6" />
        </div>
        <div>
          <h4 className="font-semibold text-sm text-primary-900">活動提醒</h4>
          <p className="text-sm text-primary-700">演出時間可能因天候狀況調整，請隨時關注 App 最新公告。</p>
        </div>
      </div>
    </div>
  );
}
