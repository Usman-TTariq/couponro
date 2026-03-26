"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Store } from "@/types/store";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CouponPopup from "@/components/CouponPopup";

const SITE_NAME = "SeemPromo";
const PER_PAGE = 12;
type SortBy = "newest" | "popularity" | "ending_soon" | "expired";

function getCouponCode(c: Store): string {
  const code = c.couponCode ?? (c as Record<string, unknown>).coupon_code ?? "";
  return String(code).trim();
}

function parseDiscount(text: string): string {
  const match = text.match(/(\d+%|\$\d+|\d+\s*%|%\s*off)/i);
  return match ? match[1].trim() : "";
}

function DealsPageContent() {
  const [stores, setStores] = useState<Store[]>([]);
  const [deals, setDeals] = useState<Store[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [popupDeal, setPopupDeal] = useState<Store | null>(null);
  const [storesForPopup, setStoresForPopup] = useState<Store[]>([]);
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const searchParams = useSearchParams();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [sRes, cRes] = await Promise.all([
          fetch("/api/stores", { cache: "no-store" }),
          fetch(`/api/coupons?page=${page}&limit=${PER_PAGE}&status=all&type=deal&sort=${encodeURIComponent(sortBy)}`, { cache: "no-store" }),
        ]);
        if (cancelled) return;
        const sData = await sRes.json();
        const cData = await cRes.json();
        setStores(Array.isArray(sData) ? sData : []);
        if (cData?.coupons && typeof cData?.total === "number") {
          setDeals(Array.isArray(cData.coupons) ? cData.coupons : []);
          setTotal(cData.total);
        } else {
          setDeals([]);
          setTotal(0);
        }
      } catch {
        if (!cancelled) setDeals([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [page, sortBy]);

  useEffect(() => {
    const popupId = searchParams.get("popup");
    if (!popupId?.trim()) return;
    let cancelled = false;
    (async () => {
      try {
        const [cRes, sRes] = await Promise.all([
          fetch(`/api/coupons/${encodeURIComponent(popupId.trim())}`, { cache: "no-store" }),
          fetch("/api/stores", { cache: "no-store" }),
        ]);
        if (cancelled) return;
        if (!cRes.ok) return;
        const deal: Store = await cRes.json();
        const storesList: Store[] = await sRes.json().then((d) => (Array.isArray(d) ? d : []));
        if (cancelled) return;
        setPopupDeal(deal);
        setStoresForPopup(storesList);
      } catch {
        if (!cancelled) setPopupDeal(null);
      }
    })();
    return () => { cancelled = true; };
  }, [searchParams]);

  const storeByName: Record<string, { logoUrl?: string; trackingUrl?: string; storeWebsiteUrl?: string }> = {};
  stores.forEach((s) => {
    const n = (s.name ?? "").trim();
    if (n) storeByName[n] = { logoUrl: s.logoUrl, trackingUrl: s.trackingUrl, storeWebsiteUrl: s.storeWebsiteUrl };
  });

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const enabledDeals = deals.filter((c) => c.status !== "disable");

  return (
    <div className="min-h-screen w-full min-w-0 bg-white flex flex-col overflow-x-hidden">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
        <nav className="text-sm text-gray-500 mb-1" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-gray-700">{SITE_NAME}</Link>
          <span className="mx-1.5">›</span>
          <Link href="/deals" className="text-gray-700 font-medium">Deals</Link>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          <aside className="lg:w-72 flex-shrink-0 space-y-6 order-2 lg:order-1">
            <div className="rounded-lg border border-gray-200 overflow-hidden bg-white shadow-sm">
              <div className="p-3 flex flex-wrap gap-2 justify-center items-center min-h-[120px] bg-gray-50">
                {["SALE", "SAVE", "20%", "25%", "30%", "40%", "50%", "OFF", "CLEARANCE", "LOWEST PRICE", "70%", "90%"].map((label, i) => (
                  <span
                    key={i}
                    className={`text-xs font-bold px-2 py-1 rounded ${i % 4 === 0 ? "bg-red-500 text-white" : i % 4 === 1 ? "bg-amber-400 text-gray-900" : i % 4 === 2 ? "bg-[#34C759] text-white" : "bg-blue-500 text-white"}`}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 overflow-hidden bg-white shadow-sm">
              <img src="/sss.jpg" alt="Deals and savings" className="w-full h-auto object-cover" />
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-bold text-gray-900 mb-2">About Deals</h2>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex gap-0.5" aria-hidden>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <span key={i} className={i <= 4 ? "text-amber-400" : "text-gray-300"}>
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-sm text-gray-600">4 / 5 ( 2 votes )</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Discover the best deals and limited-time offers from your favorite stores. Click through to the store to activate the offer—no code needed. We update our deal links regularly so you never miss a saving.
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">Filter</h2>
              <p className="text-sm text-gray-700 mb-3">Sort by</p>
              <fieldset className="space-y-2">
                {[
                  { value: "newest" as SortBy, label: "Newest" },
                  { value: "popularity" as SortBy, label: "Popularity" },
                  { value: "ending_soon" as SortBy, label: "Ending Soon" },
                  { value: "expired" as SortBy, label: "Expired" },
                ].map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="sort-deals"
                      checked={sortBy === value}
                      onChange={() => { setSortBy(value); setPage(1); }}
                      className="w-4 h-4 text-[#34C759] border-gray-300 focus:ring-[#34C759]"
                    />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </fieldset>
            </div>
          </aside>

          <div className="flex-1 min-w-0 order-1 lg:order-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
              Deals &amp; Offers
            </h1>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-rebecca border-t-transparent" />
                <span className="ml-3 text-rebecca">Loading…</span>
              </div>
            ) : enabledDeals.length === 0 ? (
              <div className="rounded-xl bg-white border border-slate-200 p-8 text-center shadow-sm">
                <p className="text-slate-600">No deals at the moment.</p>
                <Link href="/" className="mt-3 inline-block text-[#34C759] font-medium hover:underline">
                  ← Back to home
                </Link>
              </div>
            ) : (
              <>
                <ul className="space-y-0 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                  {enabledDeals.map((deal) => (
                    <FeaturedDealCard
                      key={deal.id}
                      deal={deal}
                      storeLogoUrl={storeByName[(deal.name ?? "").trim()]?.logoUrl}
                      onOpenPopup={() => {
                        const copyId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `d_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
                        const storeInfo = storeByName[(deal.name ?? "").trim()];
                        const trackingUrl = (deal.trackingUrl ?? deal.storeWebsiteUrl ?? deal.link ?? storeInfo?.trackingUrl ?? storeInfo?.storeWebsiteUrl ?? "").toString().trim();
                        window.open(`/deals?popup=${encodeURIComponent(deal.id)}&copy=${encodeURIComponent(copyId)}`, "_blank", "noopener,noreferrer");
                        if (trackingUrl && trackingUrl !== "#") window.location.href = trackingUrl;
                      }}
                    />
                  ))}
                </ul>

                {(() => {
                  const popupStore = popupDeal ? storesForPopup.find((s) => (s.name ?? "").trim() === (popupDeal.name ?? "").trim()) : null;
                  return (
                    <CouponPopup
                      coupon={popupDeal}
                      onClose={() => setPopupDeal(null)}
                      storeLogoUrl={popupStore?.logoUrl ?? (popupDeal ? storeByName[(popupDeal.name ?? "").trim()]?.logoUrl : undefined)}
                      fallbackUrl={
                        popupDeal
                          ? popupStore?.trackingUrl?.trim() || popupStore?.storeWebsiteUrl?.trim() || storeByName[(popupDeal.name ?? "").trim()]?.trackingUrl || storeByName[(popupDeal.name ?? "").trim()]?.storeWebsiteUrl || ""
                          : undefined
                      }
                    />
                  );
                })()}

                {totalPages > 1 && (
                  <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 disabled:opacity-50 disabled:pointer-events-none transition-colors shadow-sm"
                      aria-label="Previous page"
                    >
                      ←
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const p = totalPages <= 5 ? i + 1 : Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                      if (p < 1 || p > totalPages) return null;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPage(p)}
                          className={`min-w-[2.5rem] rounded-full px-3 py-2.5 text-sm font-semibold transition-all ${
                            page === p
                              ? "bg-[#34C759] text-white shadow-md border border-[#34C759]"
                              : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400"
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 disabled:opacity-50 disabled:pointer-events-none transition-colors shadow-sm"
                      aria-label="Next page"
                    >
                      →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function DealsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full min-w-0 bg-[#f0f5fa] flex flex-col overflow-x-hidden">
          <Header />
          <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-8">
            <h1 className="text-2xl md:text-3xl font-bold text-[#37474f] mb-6">
              Deals &amp; Offers
            </h1>
            <div className="flex items-center justify-center py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#34C759] border-t-transparent" />
              <span className="ml-3 text-[#34C759]">Loading…</span>
            </div>
          </main>
          <Footer />
        </div>
      }
    >
      <DealsPageContent />
    </Suspense>
  );
}

function FeaturedDealCard({
  deal,
  storeLogoUrl,
  onOpenPopup,
}: {
  deal: Store;
  storeLogoUrl?: string;
  onOpenPopup: () => void;
}) {
  const code = getCouponCode(deal);
  const hasCode = code.length > 0;
  const codeDisplay = code.toUpperCase();
  const logoUrl = storeLogoUrl || deal.logoUrl || "";
  const slug = deal.slug || deal.name?.toLowerCase().replace(/\s+/g, "-") || "";
  const offerTitle = deal.couponTitle?.trim() || deal.badgeLabel?.trim() || `${deal.name} offer`;
  const description = deal.description?.trim() || offerTitle;
  const discountStr = parseDiscount(deal.badgeLabel ?? deal.couponTitle ?? "");
  const dealLabel = discountStr ? `${discountStr} OFF` : "DEAL";

  return (
    <li className="group bg-white border-b border-slate-200 last:border-b transition-colors hover:bg-slate-50/80">
      <div className="flex flex-col sm:flex-row gap-4 p-4 sm:p-5 items-start sm:items-center">
        <div className="flex flex-col items-center sm:items-start gap-2 flex-shrink-0 sm:w-28">
          <Link href={`/stores/${encodeURIComponent(slug)}`} className="block rounded-lg transition-transform hover:opacity-90">
            <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
              {logoUrl ? (
                <img src={logoUrl} alt={deal.name ?? ""} className="w-full h-full object-contain" />
              ) : (
                <span className="text-xl font-bold text-slate-500">{deal.name?.charAt(0) ?? "?"}</span>
              )}
            </div>
          </Link>
          <span className="text-sm font-medium text-black">{dealLabel}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold text-[#1e88e5] text-base leading-snug">
              {deal.name && `${deal.name}: `}{offerTitle}
            </p>
            <span className="inline-flex items-center gap-1.5 text-[#34C759] text-xs font-medium shrink-0" title="Verified">
              <span className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-[#34C759] shrink-0">
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              Verified
            </span>
          </div>
          <p className="text-sm text-black mt-1">{description}</p>
        </div>

        <div className="relative flex flex-col items-end gap-2 flex-shrink-0 w-full sm:ml-auto sm:w-52">
          <div className="relative rounded-none overflow-hidden border border-slate-300 shadow-sm w-full sm:w-52 min-w-[8rem] max-w-full h-10">
            {hasCode ? (
              <>
                <div
                  className="absolute inset-0 bg-white border-2 border-slate-400 font-mono text-sm font-semibold text-black select-none rounded-none uppercase flex items-center justify-end pr-1.5"
                  style={{ borderLeftStyle: "dashed", borderRightStyle: "dotted", borderTopStyle: "dotted", borderBottomStyle: "dotted" }}
                >
                  {codeDisplay}
                </div>
                <button
                  type="button"
                  onClick={onOpenPopup}
                  className="absolute left-0 top-0 bottom-0 z-10 w-[calc(100%-3ch)] rounded-none bg-[#34C759] text-white font-semibold text-xs uppercase tracking-wide pl-3 pr-4 transition-all duration-200 flex items-center justify-center hover:bg-[#2db34d] hover:-translate-x-3 hover:shadow-md"
                  style={{ clipPath: "polygon(0 0, 100% 0, calc(100% - 10px) 100%, 0 100%)" }}
                >
                  Show Coupon Code
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onOpenPopup}
                className="w-full h-full rounded-none bg-[#34C759] text-white font-semibold text-xs uppercase tracking-wide hover:bg-[#2db34d] transition-colors flex items-center justify-center"
              >
                Get Deal
              </button>
            )}
          </div>
          <Link
            href={`/stores/${encodeURIComponent(slug)}`}
            className="text-sm text-[#34C759] hover:text-[#2db34d] hover:underline transition-colors"
          >
            {deal.name} Deals
          </Link>
        </div>
      </div>
    </li>
  );
}
