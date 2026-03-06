"use client";

import { useEffect, useState } from "react";

export default function AboutStats() {
  const [stats, setStats] = useState<{ stores: number; coupons: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/stores", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/coupons?page=1&limit=1&status=all", { cache: "no-store" }).then((r) => r.json()),
    ])
      .then(([stores, data]) => {
        if (cancelled) return;
        const storeCount = Array.isArray(stores)
          ? stores.filter((s: { status?: string }) => (s.status ?? "enable") !== "disable").length
          : 0;
        const total = typeof data?.total === "number" ? data.total : 0;
        setStats({ stores: storeCount, coupons: total });
      })
      .catch(() => {
        if (!cancelled) setStats({ stores: 0, coupons: 0 });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const items = [
    { value: stats?.stores ?? "–", label: "Stores", sub: "Brands with deals and coupon codes" },
    { value: stats?.coupons ?? "–", label: "Coupons & Deals", sub: "Verified offers you can use" },
    { value: "–", label: "Blog", sub: "Tips and savings articles" },
  ];

  return (
    <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8" aria-label="Stats">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6 text-center"
        >
          <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">{item.label}</p>
          <p className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">{item.value}</p>
          <p className="text-sm text-slate-600">{item.sub}</p>
        </div>
      ))}
    </section>
  );
}
