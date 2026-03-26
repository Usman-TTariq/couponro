"use client";

import HomeMagazineGrid from "@/components/HomeMagazineGrid";

/** Blog-style masonry only — no logo/coupon card grids below the fold. */
export default function HomeContent() {
  return (
    <main className="home-magazine-main flex-1 w-full min-w-0 bg-zinc-950 text-white">
      <HomeMagazineGrid />
    </main>
  );
}
