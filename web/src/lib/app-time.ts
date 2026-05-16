/** 設為 true 時固定為白天營業時段，方便 demo（見 .env.example） */
export const isDemoDaytime = process.env.NEXT_PUBLIC_DEMO_DAYTIME === "true";

/** 應用程式使用的「現在」；demo 模式下固定為 14:30（週一則改為週二） */
export function getAppNow(): Date {
  if (!isDemoDaytime) {
    return new Date();
  }

  const demo = new Date();
  demo.setHours(14, 30, 0, 0);
  if (demo.getDay() === 1) {
    demo.setDate(demo.getDate() + 1);
  }
  return demo;
}
