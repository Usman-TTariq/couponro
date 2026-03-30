"use client";

import HomeContent from "@/components/HomeContent";

/** Home: magazine grid with its own dark top bar + drawer — no global Header/Footer. */
export default function HomePageClient() {
  return (
    <div className="min-h-screen w-full min-w-0 flex flex-col bg-zinc-950">
      <HomeContent />
    </div>
  );
}
