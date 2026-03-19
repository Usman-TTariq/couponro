"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import type { Store } from "@/types/store";
import CouponPopup from "@/components/CouponPopup";
import { getShowCodeButtonLabel } from "@/lib/coupon-button-labels";

const SITE_NAME = "SeemPromo";
type SortBy = "newest" | "popularity" | "ending_soon" | "expired";
type FilterCategory = "all" | "code" | "deal";

function getCouponBadge(c: Store): string {
  const label = (c.badgeLabel ?? c.couponTitle ?? "").trim();
  const match = label.match(/(\d+%|\$\d+|FREE|free)/i);
  if (match) return match[1].toUpperCase();
  if (label.length > 0) return label.slice(0, 12);
  return c.couponCode ? "CODE" : "DEAL";
}

function hasActualCode(c: Store): boolean {
  return Boolean((c.couponCode ?? (c as Record<string, unknown>).coupon_code ?? "").toString().trim().length > 0);
}

function isDeal(c: Store): boolean {
  return (c.couponType ?? "").toLowerCase() === "deal";
}

function getStoreSlug(s: Store): string {
  return s.slug || s.name?.toLowerCase().replace(/\s+/g, "-") || s.id || "";
}

function expiryToTime(expiry: string | undefined): number {
  if (!expiry?.trim()) return Number.MAX_SAFE_INTEGER;
  const d = new Date(expiry.trim());
  return isNaN(d.getTime()) ? Number.MAX_SAFE_INTEGER : d.getTime();
}

export default function StorePageContent({
  store,
  storeCoupons,
  displayName,
  otherStores,
  slug = "",
  initialPopupId,
  relatedBlogSlug,
}: {
  store: Store | null;
  storeCoupons: Store[];
  displayName: string;
  otherStores: Store[];
  slug?: string;
  initialPopupId?: string;
  relatedBlogSlug?: string;
}) {
  const [popupCoupon, setPopupCoupon] = useState<Store | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [filterCategory, setFilterCategory] = useState<FilterCategory>("all");

  useEffect(() => {
    if (!initialPopupId?.trim()) return;
    const c = storeCoupons.find((x) => (x.id ?? "").trim() === initialPopupId.trim());
    if (c) setPopupCoupon(c);
  }, [initialPopupId, storeCoupons]);

  const filtered = useMemo(() => {
    let list = storeCoupons;
    if (filterCategory === "code") list = list.filter((c) => hasActualCode(c) && !isDeal(c));
    else if (filterCategory === "deal") list = list.filter(isDeal);
    const now = Date.now();
    if (sortBy === "expired") {
      list = list.filter((c) => expiryToTime(c.expiry) < now);
      return [...list].sort((a, b) => expiryToTime(b.expiry) - expiryToTime(a.expiry));
    }
    if (sortBy === "ending_soon") {
      list = list.filter((c) => expiryToTime(c.expiry) >= now);
      return [...list].sort((a, b) => expiryToTime(a.expiry) - expiryToTime(b.expiry));
    }
    if (sortBy === "popularity") return [...list].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    return [...list].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  }, [storeCoupons, sortBy, filterCategory]);

  const description = store?.description || storeCoupons[0]?.description || "";
  const aboutText = store?.moreAboutStore || store?.description || description;
  const shoppingTips = store?.shoppingTipsTitle && (store.shoppingTipsBullets?.length ?? 0) > 0;
  const faqs = store?.faqs && store.faqs.length > 0 ? store.faqs : [];
  const hasSidebarContent =
    (store?.sidebarContent ?? "").trim().length > 0 ||
    (store?.whyTrustUs ?? "").trim().length > 0 ||
    (store?.moreInformation ?? "").trim().length > 0;

  /** Admin "Store Page Heading (above coupons)" — if set, replaces default title */
  const storePageHeading = (store?.storePageHeading ?? "").trim();
  const defaultPageTitle = `${displayName} Coupons & Promo Codes`;
  const pageTitle = storePageHeading || defaultPageTitle;

  return (
    <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 py-6 sm:py-8 bg-white" style={{ backgroundColor: "white" }}>
      <nav className="text-sm text-gray-500 mb-4" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-gray-700">{SITE_NAME}</Link>
        <span className="mx-1.5">›</span>
        <Link href="/stores" className="hover:text-gray-700">All Stores</Link>
        <span className="mx-1.5">›</span>
        <span className="text-gray-900 font-medium">{displayName}</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
        {/* Left sidebar – WP Coupon Mate style */}
        <aside className="lg:w-72 flex-shrink-0 order-2 lg:order-1">
          <div className="lg:sticky lg:top-24 space-y-6">
            {/* Store logo + rating */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm text-center">
              {store?.logoUrl ? (
                <div className="w-32 h-32 mx-auto mb-3 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center p-2">
                  <img src={store.logoUrl} alt={displayName} className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-32 h-32 mx-auto mb-3 rounded-xl bg-gray-100 flex items-center justify-center">
                  <span className="text-3xl font-bold text-gray-500">{displayName?.charAt(0) ?? "?"}</span>
                </div>
              )}
              <div className="flex items-center justify-center gap-1 text-amber-400" aria-hidden>
                {[1, 2, 3, 4, 5].map((i) => (
                  <span key={i}>★</span>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-1">4.5 / 5 ( 2 votes )</p>
            </div>

            {/* About [Store] */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2">About {displayName}</h2>
              <div className="flex items-center gap-1 text-amber-400 text-sm mb-2" aria-hidden>
                ★★★★★
              </div>
              <p className="text-xs text-gray-600 mb-2">4.5 / 5 ( 2 votes )</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                {aboutText ? aboutText.slice(0, 220) + (aboutText.length > 220 ? "…" : "") : `Find the best ${displayName} promo codes, deals and discounts. Verified offers!`}
              </p>
            </div>

            {/* Filter Store */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">Filter Store</h2>
              <p className="text-xs font-semibold text-gray-700 mb-2">Categories</p>
              <div className="space-y-2 mb-4">
                {[
                  { value: "all" as FilterCategory, label: "All" },
                  { value: "code" as FilterCategory, label: "Coupons" },
                  { value: "deal" as FilterCategory, label: "Deals" },
                ].map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="filter-store"
                      checked={filterCategory === value}
                      onChange={() => setFilterCategory(value)}
                      className="w-4 h-4 text-[#34C759] border-gray-300 focus:ring-[#34C759]"
                    />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs font-semibold text-gray-700 mb-2">Sort by</p>
              <div className="space-y-2">
                {[
                  { value: "newest" as SortBy, label: "Newest" },
                  { value: "popularity" as SortBy, label: "Popularity" },
                  { value: "ending_soon" as SortBy, label: "Ending Soon" },
                  { value: "expired" as SortBy, label: "Expired" },
                ].map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="sort-store"
                      checked={sortBy === value}
                      onChange={() => setSortBy(value)}
                      className="w-4 h-4 text-[#34C759] border-gray-300 focus:ring-[#34C759]"
                    />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Related Stores */}
            {otherStores.length > 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">Related Stores</h3>
                <ul className="space-y-2">
                  {otherStores.slice(0, 6).map((s) => (
                    <li key={s.id}>
                      <Link
                        href={`/stores/${encodeURIComponent(getStoreSlug(s))}`}
                        className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-50 text-gray-700 hover:text-[#34C759] transition-colors"
                      >
                        <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {s.logoUrl ? (
                            <img src={s.logoUrl} alt={s.name ?? ""} className="w-full h-full object-contain" />
                          ) : (
                            <span className="font-bold text-gray-500 text-sm">{s.name?.charAt(0) ?? "?"}</span>
                          )}
                        </div>
                        <span className="text-sm font-medium">{s.name ?? "–"} Coupons</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!hasSidebarContent && storeCoupons.length === 0 && otherStores.length === 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-2">About this store</h3>
                <p className="text-sm text-gray-600">More content can be added from the admin store editor.</p>
              </div>
            )}
          </div>
        </aside>

        {/* Main content – right */}
        <div className="flex-1 min-w-0 order-1 lg:order-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
            {displayName} Promo Codes, Deals and Sales
          </h1>

          {filtered.length === 0 ? (
            <p className="text-gray-600 py-8">No coupons or deals right now.</p>
          ) : (
            <>
              <section className="space-y-4 mb-10">
                {filtered.map((c) => (
                  <StoreCouponCard
                    key={c.id}
                    coupon={c}
                    displayName={displayName}
                    storeLogoUrl={store?.logoUrl}
                    onOpenPopup={() => {
                      const copyId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `c_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
                      const base = slug ? `/stores/${encodeURIComponent(slug)}` : "/coupons";
                      const trackingUrl = (c.trackingUrl ?? c.storeWebsiteUrl ?? c.link ?? store?.trackingUrl ?? store?.storeWebsiteUrl ?? "").toString().trim();
                      window.open(`${base}?popup=${encodeURIComponent(c.id)}&copy=${encodeURIComponent(copyId)}`, "_blank", "noopener,noreferrer");
                      if (trackingUrl && trackingUrl !== "#") window.location.href = trackingUrl;
                    }}
                  />
                ))}
              </section>

              {/* Popular [Store] Promo Codes & Sales – table */}
              <section className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm mb-8">
                <div className="flex items-center gap-2 p-4 border-b border-gray-200">
                  <span className="text-amber-400">★★★★★</span>
                  <span className="text-sm text-gray-600">4.5 / 5 ( 2 votes )</span>
                </div>
                <h2 className="text-lg font-bold text-gray-900 px-4 pt-3 pb-2">Popular {displayName} Promo Codes &amp; Sales</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#166534] text-white">
                        <th className="text-left font-semibold px-4 py-3">Discount</th>
                        <th className="text-left font-semibold px-4 py-3">Description</th>
                        <th className="text-left font-semibold px-4 py-3">Coupon</th>
                        <th className="text-left font-semibold px-4 py-3">Expires</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.slice(0, 10).map((c) => {
                        const badge = getCouponBadge(c);
                        const title = c.couponTitle?.trim() || c.badgeLabel?.trim() || "Offer";
                        const code = (c.couponCode ?? (c as Record<string, unknown>).coupon_code ?? "").toString().trim();
                        return (
                          <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-900 font-medium">{badge}</td>
                            <td className="px-4 py-3 text-gray-700">{title}</td>
                            <td className="px-4 py-3 text-gray-500">{code ? "••••••" : "–"}</td>
                            <td className="px-4 py-3 text-gray-500">{c.expiry?.trim() || "No Expires"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {relatedBlogSlug && (
            <div className="rounded-2xl border border-[#34C759]/20 bg-[#34C759]/5 p-4 sm:p-5 mb-8">
              <p className="text-sm text-gray-700 mb-2">Read our complete savings guide for {displayName}:</p>
              <Link href={`/blog/${encodeURIComponent(relatedBlogSlug)}`} className="font-semibold text-[#34C759] hover:underline">
                {displayName} Coupon Codes, Deals &amp; Discounts (Complete Guide 2026) →
              </Link>
            </div>
          )}

          {/* About / How to use / FAQs – below table */}
          <div className="space-y-8 rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
            {aboutText && (
              <section>
                <h3 className="text-lg font-bold text-gray-900 mb-3">About {displayName}</h3>
                {aboutText.includes("<") && aboutText.includes(">") ? (
                  <div className="text-gray-600 leading-relaxed store-content-html" dangerouslySetInnerHTML={{ __html: aboutText }} />
                ) : (
                  <p className="text-gray-600 leading-relaxed">{aboutText}</p>
                )}
              </section>
            )}
            {(shoppingTips || storeCoupons.length > 0) && (
              <section>
                <h3 className="text-lg font-bold text-gray-900 mb-3">How to Use {displayName} Coupon Codes</h3>
                {shoppingTips ? (
                  <>
                    <p className="text-gray-600 font-medium mb-2">{store?.shoppingTipsTitle}</p>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                      {(store?.shoppingTipsBullets ?? []).map((bullet, i) => (
                        <li key={i}>{bullet}</li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="text-gray-600 leading-relaxed">
                    Copy the code from SeemPromo and paste it at checkout on {displayName}&apos;s website. Some offers are deal links—click &quot;Get Deal&quot; to go to the store.
                  </p>
                )}
              </section>
            )}
            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Never Miss a {displayName} Coupon</h3>
              <p className="text-gray-600 leading-relaxed">
                Bookmark this page and check back often. We update {displayName} coupons and deals regularly.
              </p>
            </section>
            {faqs.length > 0 && (
              <section>
                <h3 className="text-lg font-bold text-gray-900 mb-4">FAQs</h3>
                <ul className="space-y-4">
                  {faqs.map((faq, i) => (
                    <li key={i}>
                      <h4 className="font-semibold text-gray-900">{faq.question}</h4>
                      <p className="text-gray-600 text-sm mt-1">{faq.answer}</p>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <p className="mt-8">
            <Link href="/stores" className="text-[#34C759] font-semibold hover:underline">← All stores</Link>
          </p>
        </div>
      </div>

      <CouponPopup
        coupon={popupCoupon}
        onClose={() => setPopupCoupon(null)}
        storeLogoUrl={store?.logoUrl}
        fallbackUrl={store?.trackingUrl?.trim() || store?.storeWebsiteUrl?.trim() || ""}
      />
    </main>
  );
}

function getCouponCode(c: Store): string {
  const code = c.couponCode ?? (c as Record<string, unknown>).coupon_code ?? "";
  return String(code).trim();
}

function StoreCouponCard({
  coupon,
  displayName,
  storeLogoUrl,
  onOpenPopup,
}: {
  coupon: Store;
  displayName: string;
  storeLogoUrl?: string;
  onOpenPopup: () => void;
}) {
  const badge = getCouponBadge(coupon);
  const code = getCouponCode(coupon);
  const hasCode = code.length > 0;
  const codeDisplay = code.toUpperCase();
  const title = coupon.couponTitle?.trim() || coupon.badgeLabel?.trim() || `${displayName} offer`;
  const logoUrl = storeLogoUrl || coupon.logoUrl || "";
  const isDealType = isDeal(coupon);
  const badgeBg = hasCode ? "bg-[#34C759]" : isDealType ? "bg-blue-500" : "bg-gray-600";
  const showCodeLabel = getShowCodeButtonLabel(coupon);

  return (
    <article className="group w-full rounded-none border border-gray-300 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex gap-4 flex-1 min-w-0">
          <div className="flex-shrink-0 w-20 h-20 rounded-none bg-gray-100 flex items-center justify-center overflow-hidden p-1 border border-gray-200">
            {logoUrl ? (
              <img src={logoUrl} alt={displayName} className="w-full h-full object-contain" />
            ) : (
              <span className="text-gray-500 font-bold text-lg">{displayName?.charAt(0) ?? "?"}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-gray-900 text-base">{title}</h3>
              <span className="inline-flex items-center gap-1.5 text-[#34C759] text-xs font-medium shrink-0" title="Verified">
                <span className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-[#34C759] shrink-0">
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                Verified
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className={`inline-block text-xs font-bold text-white px-2 py-0.5 rounded-none ${badgeBg}`}>
                {hasCode ? "CODE" : isDealType ? "DEAL" : "OFFER"}
              </span>
              <span className="text-xs text-gray-500">{coupon.expiry?.trim() || "No Expires"}</span>
            </div>
            {coupon.description?.trim() && (
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">{coupon.description.trim().slice(0, 140)}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-2 flex-shrink-0">
          <div className="relative w-full sm:w-52 min-w-[11rem] h-10 rounded-none overflow-hidden border border-gray-300 shadow-sm">
            {hasCode ? (
              <>
                <div
                  className="absolute inset-0 bg-white border-2 border-slate-400 font-mono text-xs font-semibold text-black select-none uppercase flex items-center justify-end pr-2"
                  style={{ borderLeftStyle: "dashed", borderRightStyle: "dotted", borderTopStyle: "dotted", borderBottomStyle: "dotted" }}
                >
                  {codeDisplay}
                </div>
                <button
                  type="button"
                  onClick={onOpenPopup}
                  className="absolute left-0 top-0 bottom-0 z-10 w-[calc(100%-3ch)] rounded-none bg-[#34C759] text-white font-semibold text-xs uppercase tracking-wide pl-3 pr-4 flex items-center justify-center hover:bg-[#2db34d] hover:-translate-x-3 hover:shadow-md transition-all duration-200"
                  style={{ clipPath: "polygon(0 0, 100% 0, calc(100% - 10px) 100%, 0 100%)" }}
                  title={showCodeLabel}
                >
                  {showCodeLabel}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onOpenPopup}
                className="w-full h-full rounded-none bg-[#34C759] text-white font-semibold text-xs uppercase tracking-wide hover:bg-[#2db34d] hover:shadow-md transition-all duration-200 flex items-center justify-center"
              >
                Get Deal
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <span aria-hidden>👍</span> 100% Success
          </p>
        </div>
      </div>
    </article>
  );
}
