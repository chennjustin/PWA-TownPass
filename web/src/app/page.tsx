export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <section className="rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 p-6 text-white shadow-lg">
        <p className="text-sm font-semibold tracking-wide">TownPass PWA Starter</p>
        <h1 className="mt-2 text-3xl font-bold">兒童新樂園服務骨架</h1>
        <p className="mt-3 max-w-2xl text-sm text-sky-100">
          這是一個可安裝的 PWA 起始專案，適合黑客松快速擴充票券、活動、設施排隊與通知功能。
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">核心頁面</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
            <li>設施列表與即時狀態</li>
            <li>活動行事曆與提醒</li>
            <li>收藏清單與行程規劃</li>
          </ul>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">PWA 能力</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
            <li>可加入手機主畫面</li>
            <li>基礎離線快取</li>
            <li>後續可擴充 Web Push 通知</li>
          </ul>
        </article>
      </section>

      <section className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
        下一步建議：先接上 Supabase，建立 <code>attractions</code>、<code>events</code>、
        <code>favorites</code> 三張表，再做 MVP API。
      </section>
    </main>
  );
}
