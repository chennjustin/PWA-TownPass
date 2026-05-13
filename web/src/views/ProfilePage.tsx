import Image from 'next/image';
import { Star, Ticket, FileText, Tag, Shield, Info, ChevronRight, UserCircle, Building2 } from 'lucide-react';
import { IMAGES } from '@/src/constants';

export function ProfilePage() {
  return (
    <div className="px-4 space-y-6 pb-6">
      {/* User Header */}
      <section className="mt-4 flex items-center gap-4">
        <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-primary-100">
          <Image src={IMAGES.PROFILE_PIC} alt="Profile" className="object-cover" fill sizes="64px" />
        </div>
        <div className="space-y-1">
          <h2 className="font-display font-semibold text-xl text-grayscale-900">趙式隆</h2>
          <div className="inline-flex items-center px-2 py-1 rounded-full bg-secondary-container text-on-secondary-container font-semibold text-[10px]">
            <Star className="w-3 h-3 mr-1 fill-current" />
            金卡會員
          </div>
        </div>
      </section>

      {/* Ticket Section */}
      <section className="space-y-3">
        <div className="flex justify-between items-end">
          <h3 className="font-display font-semibold text-md text-grayscale-900">我的票券</h3>
          <button className="text-primary font-semibold text-sm">全部紀錄</button>
        </div>
        
        <div className="bg-white rounded-xl overflow-hidden border border-grayscale-100 shadow-sm relative">
          <div className="p-4 bg-primary text-white flex justify-between items-start">
            <div>
              <p className="text-[10px] opacity-80 font-bold uppercase tracking-wider">Taipei Amusement Pass</p>
              <h4 className="font-display font-semibold text-lg">臺北兒童新樂園 暢遊票</h4>
            </div>
            <Ticket className="w-6 h-6" />
          </div>
          
          <div className="p-6 flex flex-col items-center space-y-4">
            <div className="bg-white p-3 rounded-lg border border-grayscale-100">
              {/* QR Code Placeholder */}
              <div className="w-32 h-32 bg-grayscale-50 flex items-center justify-center relative overflow-hidden" 
                style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #5AB4C5 1px, transparent 0)', backgroundSize: '10px 10px' }}>
                <div className="bg-white p-2 rounded shadow-sm border border-grayscale-100 flex items-center justify-center">
                  <div className="w-20 h-20 bg-primary/20 rounded flex items-center justify-center">
                    <span className="text-primary text-xs font-bold font-mono">QR CODE</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full text-center border-t border-dashed border-grayscale-200 pt-4">
              <p className="font-semibold text-sm text-grayscale-900">有效日期</p>
              <p className="text-sm text-grayscale-700">2024.12.31 止</p>
            </div>
          </div>
          {/* Ticket decor */}
          <div className="absolute -left-3 top-[72px] w-6 h-6 bg-surface rounded-full shadow-inner" />
          <div className="absolute -right-3 top-[72px] w-6 h-6 bg-surface rounded-full shadow-inner" />
        </div>
      </section>

      {/* Quick Links */}
      <section className="grid grid-cols-2 gap-3">
        <button className="flex flex-col items-center justify-center p-6 bg-white border border-grayscale-100 rounded-xl hover:bg-primary-50 transition-all active:scale-95 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-primary-100 text-primary flex items-center justify-center mb-2">
            <FileText className="w-6 h-6" />
          </div>
          <span className="font-semibold text-sm text-grayscale-900">預約紀錄</span>
        </button>
        <button className="flex flex-col items-center justify-center p-6 bg-white border border-grayscale-100 rounded-xl hover:bg-primary-50 transition-all active:scale-95 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-secondary-container/20 text-secondary flex items-center justify-center mb-2">
            <Tag className="w-6 h-6" />
          </div>
          <span className="font-semibold text-sm text-grayscale-900">優惠券</span>
        </button>
      </section>

      {/* Settings List */}
      <section className="space-y-3">
        <h3 className="font-display font-semibold text-md text-grayscale-900 px-1">更多設定</h3>
        <div className="bg-white border border-grayscale-100 rounded-xl overflow-hidden divide-y divide-grayscale-100">
          {[
            { icon: UserCircle, label: '帳號設定' },
            { icon: Shield, label: '隱私權聲明' },
            { icon: Info, label: '版本資訊', value: 'v1.2.4' },
          ].map((item, idx) => (
            <button key={idx} className="w-full flex items-center justify-between p-4 hover:bg-grayscale-50 transition-colors group">
              <div className="flex items-center gap-3 text-grayscale-800">
                <item.icon className="w-5 h-5 text-grayscale-500 group-hover:text-primary transition-colors" />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {item.label === '版本資訊' && <span className="text-sm text-grayscale-300 font-medium">{item.value}</span>}
                <ChevronRight className="w-5 h-5 text-grayscale-300" />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Footer Branding */}
      <section className="flex flex-col items-center py-8 opacity-20 select-none">
        <Building2 className="w-12 h-12 text-grayscale-300" />
        <p className="text-[10px] text-grayscale-500 mt-2 uppercase tracking-[0.2em] font-bold">Taipei Municipal Government</p>
      </section>
    </div>
  );
}
