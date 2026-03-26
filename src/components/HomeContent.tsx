"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Store } from "@/types/store";
import CouponCard from "@/components/CouponCard";
import CouponCodesSection from "@/components/CouponCodesSection";

export default function HomeContent() {
  const [stores, setStores] = useState<Store[]>([]);
  const [coupons, setCoupons] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [sRes, cRes] = await Promise.all([
          fetch("/api/stores", { cache: "no-store" }),
          fetch("/api/coupons?page=1&limit=0", { cache: "no-store" }),
        ]);
        if (cancelled) return;
        const sData = await sRes.json();
        const cData = await cRes.json();
        const storeList = Array.isArray(sData) ? sData : [];
        const couponList =
          cData?.coupons && Array.isArray(cData.coupons)
            ? cData.coupons
            : Array.isArray(cData)
              ? cData
              : [];
        setStores(storeList.filter((s: Store) => s.status !== "disable"));
        setCoupons(couponList.filter((c: Store) => c.status !== "disable"));
        setError(null);
      } catch (e) {
        if (!cancelled) {
          setError("Could not load data");
          setStores([]);
          setCoupons([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const couponCountByStore: Record<string, number> = {};
  for (const c of coupons) {
    const name = (c.name ?? "").trim();
    if (name) couponCountByStore[name] = (couponCountByStore[name] ?? 0) + 1;
  }

  const topStores = stores
    .slice(0, 12)
    .map((s) => ({ ...s, couponCount: couponCountByStore[s.name ?? ""] ?? 0 }));

  const storeByName: Record<string, { logoUrl?: string }> = {};
  for (const s of stores) {
    const name = (s.name ?? "").trim();
    if (name) storeByName[name] = { logoUrl: s.logoUrl };
  }

  const featuredCoupons = coupons.slice(0, 3);
  const gridCoupons = coupons.slice(3, 15);

  if (loading) {
    return (
      <main className="flex-1 min-h-[50vh] mx-auto w-full max-w-7xl px-4 sm:px-6 py-8">
        <div className="flex items-center justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-rebecca border-t-transparent" />
          <span className="ml-3 text-rebecca">Loading…</span>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 min-h-[50vh] mx-auto w-full max-w-7xl px-4 sm:px-6 py-8">
        <div className="rounded-xl bg-white p-6 text-center shadow-sm">
          <p className="text-lobster font-medium">{error}</p>
          <p className="mt-1 text-sm text-rebecca">Check .env.local for Supabase and refresh.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-rebecca px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 min-h-[50vh] mx-auto w-full max-w-7xl px-4 sm:px-6 py-8">
      {/* Today's Top Coupons */}
      <section id="coupons" className="mb-12 relative overflow-hidden rounded-3xl bg-[#e0f4f8] px-4 sm:px-6 py-8 md:py-10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
          <div className="absolute -left-4 top-6 w-24 h-12 rounded-full bg-white/60 blur-sm" aria-hidden />
          <div className="absolute left-1/4 top-4 w-16 h-10 rounded-full bg-white/50 blur-sm" aria-hidden />
          <div className="absolute right-8 top-8 w-20 h-11 rounded-full bg-white/55 blur-sm" aria-hidden />
          <div className="absolute right-1/4 top-3 w-14 h-9 rounded-full bg-white/45 blur-sm" aria-hidden />
          <div className="absolute left-1/2 top-12 w-28 h-14 rounded-full bg-white/40 blur-sm" aria-hidden />
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-space mb-6 text-center relative z-10">
          Today&apos;s Top Coupons
        </h2>

        {coupons.length === 0 ? (
          <div className="relative z-10 rounded-2xl bg-white/90 p-8 text-center shadow-sm">
            <p className="text-rebecca">No coupons yet.</p>
            <p className="text-sm text-rebecca/80 mt-1">Add stores and coupons from the admin – they will appear here.</p>
            <Link href="/admin" className="mt-4 inline-block text-lobster font-semibold hover:underline">
              Go to Admin →
            </Link>
          </div>
        ) : (
          <div className="relative z-10 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
              {featuredCoupons.map((c) => (
                <CouponCard
                  key={c.id}
                  coupon={c}
                  variant="featured"
                  storeLogoUrl={storeByName[(c.name ?? "").trim()]?.logoUrl}
                />
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
              {gridCoupons.map((c) => (
                <CouponCard
                  key={c.id}
                  coupon={c}
                  variant="compact"
                  storeLogoUrl={storeByName[(c.name ?? "").trim()]?.logoUrl}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Top Stores & Brands */}
      <section id="stores" className="mb-10">
        <h2 className="text-2xl font-bold text-space mb-4">Top Stores & Brands</h2>
        {topStores.length === 0 ? (
          <p className="text-rebecca text-sm">No stores yet. Add stores and coupons from the admin.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {topStores.slice(0, 8).map((s) => (
              <Link
                key={s.id}
                href={`/stores/${encodeURIComponent(s.slug || s.id)}`}
                className="rounded-xl border-2 border-white bg-white p-4 shadow-sm hover:shadow-md hover:border-soft-cyan/50 transition-all flex flex-col items-center text-center"
              >
                <div className="w-16 h-16 rounded-lg bg-almond flex items-center justify-center overflow-hidden mb-2">
                  {s.logoUrl ? (
                    <img src={s.logoUrl} alt={s.name} className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-xl font-bold text-rebecca">{s.name?.charAt(0) ?? "?"}</span>
                  )}
                </div>
                <span className="font-semibold text-space text-sm">{s.name}</span>
                <span className="text-xs text-rebecca mt-0.5">{s.couponCount ?? 0} Coupons</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Promo card */}
      <section className="mb-10">
        <div className="rounded-xl border-2 border-rebecca/20 bg-white p-6 shadow-sm flex flex-wrap items-center gap-6">
          <div className="flex-1 min-w-[200px]">
            <h3 className="text-lg font-bold text-space">Save on your favorite brands</h3>
            <p className="mt-1 text-sm text-rebecca">
              All coupons and deals are updated from the admin. Add stores and coupon codes to see them here.
            </p>
            <Link
              href="/#coupons"
              className="mt-3 inline-block rounded-lg bg-lobster px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              View Coupons →
            </Link>
          </div>
        </div>
      </section>

      {/* Coupon codes list – right above FAQ */}
      <CouponCodesSection coupons={coupons} storeByName={storeByName} />
    </main>
  );
}
