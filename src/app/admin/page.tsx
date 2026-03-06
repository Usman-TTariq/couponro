"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Store } from "@/types/store";

const quickActions = [
  {
    href: "/admin/stores?import=1",
    label: "Import Excel",
    desc: "Bulk import stores & coupons",
    color: "bg-blue-100 border-2 border-blue-400 text-blue-900 hover:bg-blue-200 hover:border-blue-500",
  },
  {
    href: "/admin/stores",
    label: "Manage Stores",
    desc: "View & edit all stores",
    color: "bg-violet-100 border-2 border-violet-400 text-violet-900 hover:bg-violet-200 hover:border-violet-500",
  },
  {
    href: "/admin/coupons",
    label: "Manage Coupons",
    desc: "View & edit all coupons",
    color: "bg-emerald-100 border-2 border-emerald-500 text-emerald-900 hover:bg-emerald-200 hover:border-emerald-600",
  },
  {
    href: "/admin/blog",
    label: "Manage Blog",
    desc: "Edit blog posts",
    color: "bg-amber-100 border-2 border-amber-400 text-amber-900 hover:bg-amber-200 hover:border-amber-500",
  },
  {
    href: "/admin/analytics",
    label: "Click Analytics",
    desc: "Track coupon clicks",
    color: "bg-orange-100 border-2 border-orange-400 text-orange-900 hover:bg-orange-200 hover:border-orange-500",
  },
];

export default function AdminDashboardPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [coupons, setCoupons] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeFilter, setStoreFilter] = useState<string>("all");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [sRes, cRes] = await Promise.all([
          fetch("/api/stores", { cache: "no-store" }),
          fetch("/api/coupons", { cache: "no-store" }),
        ]);
        const sData = await sRes.json();
        const cData = await cRes.json();
        setStores(Array.isArray(sData) ? sData : []);
        setCoupons(Array.isArray(cData) ? cData : []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const activeCoupons = coupons.filter((c) => c.status !== "disable");
  const totalCoupons = coupons.length;
  const recentCoupons =
    storeFilter === "all"
      ? activeCoupons.slice(0, 10)
      : activeCoupons
          .filter((c) => c.name === storeFilter)
          .slice(0, 10);

  const storeNames = Array.from(
    new Set(coupons.map((c) => c.name).filter(Boolean))
  ).sort();

  const totalUses = 0;
  const avgDiscount = "0.00%";

  const statCards = [
    { label: "Total Coupons", value: totalCoupons, color: "text-blue-700", bg: "bg-blue-100 border-2 border-blue-400" },
    { label: "Active Coupons", value: activeCoupons.length, color: "text-emerald-700", bg: "bg-emerald-100 border-2 border-emerald-500" },
    { label: "Total Uses", value: totalUses, color: "text-violet-700", bg: "bg-violet-100 border-2 border-violet-400" },
    { label: "Avg Discount", value: avgDiscount, color: "text-amber-700", bg: "bg-amber-100 border-2 border-amber-400" },
  ];

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Overview of your stores and coupons
        </p>
      </div>

      {/* Quick Actions */}
      <section>
        <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-4">
          Quick Actions
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`group rounded-xl ${action.color} p-5 transition-all duration-200 hover:shadow-md`}
            >
              <span className="block text-xs font-bold uppercase tracking-wide mb-1.5 opacity-90">
                {action.label}
              </span>
              <span className="font-semibold">
                {action.desc}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Search by Store */}
      <section>
        <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
          Search Coupons by Store
        </h2>
        <select
          value={storeFilter}
          onChange={(e) => setStoreFilter(e.target.value)}
          className="rounded-lg border-2 border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 focus:border-slate-500 focus:ring-2 focus:ring-slate-400/30 outline-none min-w-[220px]"
        >
          <option value="all">All Stores</option>
          {storeNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </section>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`rounded-xl border ${card.bg} p-5 shadow-sm`}
          >
            <p className="text-sm font-medium text-slate-500">{card.label}</p>
            <p className={`mt-1.5 text-2xl font-extrabold tabular-nums ${card.color}`}>
              {card.value}
            </p>
          </div>
        ))}
      </section>

      {/* Recent Coupons table */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">
            Recent Coupons
          </h2>
          <Link
            href="/admin/coupons"
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
          >
            View all →
          </Link>
        </div>
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-500" />
            <p className="mt-3 text-sm text-slate-500">Loading…</p>
          </div>
        ) : recentCoupons.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-slate-500">No coupons yet.</p>
            <Link
              href="/admin/coupons"
              className="mt-2 inline-block text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              Add coupons
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100">
                  <th className="px-5 py-3.5 text-left font-bold text-slate-700">
                    Store Name
                  </th>
                  <th className="px-5 py-3.5 text-left font-bold text-slate-700">
                    Code / Deal
                  </th>
                  <th className="px-5 py-3.5 text-left font-bold text-slate-700">
                    Discount
                  </th>
                  <th className="px-5 py-3.5 text-left font-bold text-slate-700">
                    Status
                  </th>
                  <th className="px-5 py-3.5 text-left font-bold text-slate-700">
                    Expiry
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentCoupons.map((c, i) => (
                  <tr
                    key={c.id}
                    className={`border-b border-slate-50 transition-colors hover:bg-slate-50/50 ${
                      i % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                    }`}
                  >
                    <td className="px-5 py-3.5 font-medium text-slate-900">
                      {c.name}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 max-w-xs truncate">
                      {c.couponTitle || c.description || c.couponCode || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {c.badgeLabel || "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          c.status === "disable"
                            ? "bg-slate-200 text-slate-600"
                            : "bg-emerald-500 text-white"
                        }`}
                      >
                        {c.status === "disable" ? "Inactive" : "Active"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {c.expiry || "Dec 31, 2026"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
