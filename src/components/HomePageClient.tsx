"use client";

import ClientOnly from "./ClientOnly";
import HomeNirvanaContent from "./HomeNirvanaContent";

function HomeLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0f5fa]">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-rebecca border-t-transparent" />
      <p className="mt-4 text-slate-600">Loading…</p>
    </div>
  );
}

export default function HomePageClient() {
  return (
    <ClientOnly fallback={<HomeLoading />}>
      <div className="min-h-screen flex flex-col">
        <HomeNirvanaContent />
      </div>
    </ClientOnly>
  );
}
