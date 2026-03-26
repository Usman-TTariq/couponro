"use client";

import HomeContent from "@/components/HomeContent";

/** Home: magazine grid only — no global Footer (other routes still use Footer in their layouts/pages). */
export default function HomePageClient() {
  return (
    <div className="min-h-screen w-full min-w-0 flex flex-col bg-zinc-950">
      <HomeContent />
    </div>
  );
}
