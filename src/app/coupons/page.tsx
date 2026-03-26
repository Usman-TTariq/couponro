"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { DEFAULT_BLOG_POST_URL } from "@/lib/blog-posts";
import { useSearchParams } from "next/navigation";
import type { Store } from "@/types/store";
import { getShowCodeButtonLabel } from "@/lib/coupon-button-labels";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CouponPopup from "@/components/CouponPopup";

const PER_PAGE = 12;

function getCouponCode(c: Store): string {
  const code = c.couponCode ?? (c as Record<string, unknown>).coupon_code ?? "";
  return String(code).trim();
}

function parseDiscount(text: string): string {
  const match = text.match(/(\d+%|\$\d+|\d+\s*%|%\s*off)/i);
  return match ? match[1].trim() : "";
}

function CouponsPageContent() {
  const [stores, setStores] = useState<Store[]>([]);
  const [coupons, setCoupons] = useState<Store[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [popupCoupon, setPopupCoupon] = useState<Store | null>(null);
  const [storesForPopup, setStoresForPopup] = useState<Store[]>([]);
  const searchParams = useSearchParams();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [sRes, cRes] = await Promise.all([
          fetch("/api/stores", { cache: "no-store" }),
          fetch(`/api/coupons?page=${page}&limit=${PER_PAGE}&status=all&codes_first=1`, { cache: "no-store" }),
        ]);
        if (cancelled) return;
        const sData = await sRes.json();
        const cData = await cRes.json();
        setStores(Array.isArray(sData) ? sData : []);
        if (cData?.coupons && typeof cData?.total === "number") {
          setCoupons(Array.isArray(cData.coupons) ? cData.coupons : []);
          setTotal(cData.total);
        } else {
          setCoupons([]);
          setTotal(0);
        }
      } catch {
        if (!cancelled) setCoupons([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [page]);

  // New tab with ?popup=id: load that coupon and show overlay so site is blurred behind
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
        const coupon: Store = await cRes.json();
        const storesList: Store[] = await sRes.json().then((d) => (Array.isArray(d) ? d : []));
        if (cancelled) return;
        setPopupCoupon(coupon);
        setStoresForPopup(storesList);
      } catch {
        if (!cancelled) setPopupCoupon(null);
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
  const enabledCoupons = coupons.filter((c) => c.status !== "disable");

  return (
    <div className="min-h-screen w-full min-w-0 bg-[#f0f5fa] flex flex-col overflow-x-hidden">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-[#37474f] mb-6">
          Featured Coupon Codes
        </h1>
        <p className="text-[#37474f]/90 mb-6">
          For saving tips and store guides, read our{" "}
          <Link href={DEFAULT_BLOG_POST_URL} className="text-lobster font-medium hover:underline">saving tips guide</Link>.
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-rebecca border-t-transparent" />
            <span className="ml-3 text-rebecca">Loading…</span>
          </div>
        ) : enabledCoupons.length === 0 ? (
          <div className="rounded-xl bg-white border border-slate-200 p-8 text-center shadow-sm">
            <p className="text-slate-600">No coupons at the moment.</p>
            <Link href="/" className="mt-3 inline-block text-lobster font-medium hover:underline">
              ← Back to home
            </Link>
          </div>
        ) : (
          <>
            <ul className="space-y-0 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              {enabledCoupons.map((coupon) => (
                <FeaturedCouponCard
                  key={coupon.id}
                  coupon={coupon}
                  storeLogoUrl={storeByName[(coupon.name ?? "").trim()]?.logoUrl}
                  onOpenPopup={() => {
                const copyId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `c_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
                const storeInfo = storeByName[(coupon.name ?? "").trim()];
                const trackingUrl = (coupon.trackingUrl ?? coupon.storeWebsiteUrl ?? coupon.link ?? storeInfo?.trackingUrl ?? storeInfo?.storeWebsiteUrl ?? "").toString().trim();
                window.open(`/coupons?popup=${encodeURIComponent(coupon.id)}&copy=${encodeURIComponent(copyId)}`, "_blank", "noopener,noreferrer");
                if (trackingUrl && trackingUrl !== "#") window.location.href = trackingUrl;
              }}
                />
              ))}
            </ul>

            {(() => {
              const popupStore = popupCoupon ? storesForPopup.find((s) => (s.name ?? "").trim() === (popupCoupon.name ?? "").trim()) : null;
              return (
                <CouponPopup
                  coupon={popupCoupon}
                  onClose={() => setPopupCoupon(null)}
                  storeLogoUrl={popupStore?.logoUrl ?? (popupCoupon ? storeByName[(popupCoupon.name ?? "").trim()]?.logoUrl : undefined)}
                  fallbackUrl={
                    popupCoupon
                      ? popupStore?.trackingUrl?.trim() || popupStore?.storeWebsiteUrl?.trim() || storeByName[(popupCoupon.name ?? "").trim()]?.trackingUrl || storeByName[(popupCoupon.name ?? "").trim()]?.storeWebsiteUrl || ""
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
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none"
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
                      className={`min-w-[2.25rem] rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        page === p
                          ? "bg-lobster text-white"
                          : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
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
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none"
                  aria-label="Next page"
                >
                  →
                </button>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function CouponsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full min-w-0 bg-[#f0f5fa] flex flex-col overflow-x-hidden">
          <Header />
          <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-8">
            <h1 className="text-2xl md:text-3xl font-bold text-[#37474f] mb-6">
              Featured Coupon Codes
            </h1>
            <div className="flex items-center justify-center py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-rebecca border-t-transparent" />
              <span className="ml-3 text-rebecca">Loading…</span>
            </div>
          </main>
          <Footer />
        </div>
      }
    >
      <CouponsPageContent />
    </Suspense>
  );
}

function FeaturedCouponCard({
  coupon,
  storeLogoUrl,
  onOpenPopup,
}: {
  coupon: Store;
  storeLogoUrl?: string;
  onOpenPopup: () => void;
}) {
  const code = getCouponCode(coupon);
  const hasCode = code.length > 0;
  const codeDisplay = code.toUpperCase();
  const logoUrl = storeLogoUrl || coupon.logoUrl || "";
  const slug = coupon.slug || coupon.name?.toLowerCase().replace(/\s+/g, "-") || "";
  const offerTitle = coupon.couponTitle?.trim() || coupon.badgeLabel?.trim() || `${coupon.name} offer`;
  const description = coupon.description?.trim() || offerTitle;
  const discountStr = parseDiscount(coupon.badgeLabel ?? coupon.couponTitle ?? "");
  const offCodeLabel = discountStr ? `${discountStr} OFF CODE` : "CODE";
  const showCodeLabel = getShowCodeButtonLabel(coupon);

  return (
    <li className="group bg-white border-b border-slate-200 last:border-b transition-colors hover:bg-slate-50/80">
      <div className="flex flex-col sm:flex-row gap-4 p-4 sm:p-5 items-start sm:items-center">
        {/* Left: logo + discount text (black, e.g. "20% OFF CODE") */}
        <div className="flex flex-col items-center sm:items-start gap-2 flex-shrink-0 sm:w-28">
          <Link href={`/stores/${encodeURIComponent(slug)}`} className="block rounded-lg transition-transform hover:opacity-90">
            <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
              {logoUrl ? (
                <img src={logoUrl} alt={coupon.name ?? ""} className="w-full h-full object-contain" />
              ) : (
                <span className="text-xl font-bold text-slate-500">{coupon.name?.charAt(0) ?? "?"}</span>
              )}
            </div>
          </Link>
          <span className="text-sm font-medium text-black">{offCodeLabel}</span>
        </div>

        {/* Middle: bold blue title + black description */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[#1e88e5] text-base leading-snug">
            {coupon.name && `${coupon.name}: `}{offerTitle}
          </p>
          <p className="text-sm text-black mt-1">{description}</p>
        </div>

        {/* Right: fixed width + ml-auto so all cards align on same right edge */}
        <div className="relative flex flex-col items-end gap-2 flex-shrink-0 w-full sm:ml-auto sm:w-52">
          <div className="relative rounded-none overflow-hidden border border-slate-300 shadow-sm w-full sm:w-52 min-w-[8rem] max-w-full h-10">
            {hasCode ? (
              <>
                <div
                  className="absolute inset-0 bg-white border-l-2 border-dashed border-slate-400 font-mono text-sm font-semibold text-black select-none rounded-none uppercase flex items-center justify-end pr-1.5"
                  style={{ borderStyle: "dashed" }}
                >
                  {codeDisplay}
                </div>
                <button
                  type="button"
                  onClick={onOpenPopup}
                  className="absolute left-0 top-0 bottom-0 z-10 w-[calc(100%-3ch)] rounded-none bg-rebecca text-white font-semibold text-xs uppercase tracking-wide px-2 sm:px-3 transition-all duration-200 flex items-center justify-center hover:bg-rebecca/90 hover:-translate-x-3 hover:shadow-md"
                  title={showCodeLabel}
                >
                  {showCodeLabel}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onOpenPopup}
                className="w-full h-full rounded-none bg-rebecca text-white font-semibold text-xs uppercase tracking-wide hover:bg-rebecca/90 transition-colors flex items-center justify-center"
              >
                Get Deal
              </button>
            )}
          </div>
          <Link
            href={`/stores/${encodeURIComponent(slug)}`}
            className="text-sm text-rebecca hover:text-lobster hover:underline transition-colors"
          >
            {coupon.name} Coupons
          </Link>
        </div>
      </div>
    </li>
  );
}
