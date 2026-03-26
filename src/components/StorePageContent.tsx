"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import type { Store } from "@/types/store";
import CouponPopup from "@/components/CouponPopup";
import { getShowCodeButtonLabel } from "@/lib/coupon-button-labels";

function getCouponBadge(c: Store): string {
  const text = [c.badgeLabel ?? "", c.couponTitle ?? ""].join(" ").trim();
  const match = text.match(/(\$\d+(?:\.\d{1,2})?|\d+\s*%|%\s*off)/i);
  if (match) return match[1].replace(/\s+/g, "").toUpperCase();
  return (c.couponCode ?? "").toString().trim() ? "CODE" : "DEAL";
}

function hasActualCode(c: Store): boolean {
  return Boolean((c.couponCode ?? (c as Record<string, unknown>).coupon_code ?? "").toString().trim().length > 0);
}

function isCodeCoupon(c: Store): boolean {
  const type = (c.couponType ?? "").toLowerCase();
  if (type === "deal") return false;
  const hasCode = hasActualCode(c);
  return hasCode;
}

function getStoreSlug(s: Store): string {
  return s.slug || s.name?.toLowerCase().replace(/\s+/g, "-") || s.id || "";
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
  /** When set, show a link to this blog post (store page does not redirect). */
  relatedBlogSlug?: string;
}) {
  const [popupCoupon, setPopupCoupon] = useState<Store | null>(null);

  useEffect(() => {
    if (!initialPopupId?.trim()) return;
    const c = storeCoupons.find((x) => (x.id ?? "").trim() === initialPopupId.trim());
    if (c) setPopupCoupon(c);
  }, [initialPopupId, storeCoupons]);

  /* Single list: all coupons, codes first then deals (no tabs/search on inner store page) */
  const filtered = useMemo(() => {
    return [...storeCoupons].sort((a, b) => (hasActualCode(b) ? 1 : 0) - (hasActualCode(a) ? 1 : 0));
  }, [storeCoupons]);

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
    <main className="flex-1 mx-auto w-full max-w-7xl px-3 sm:px-6 py-4 sm:py-8">
      {/* Breadcrumbs */}
      <nav className="text-xs sm:text-sm text-rebecca mb-3 sm:mb-4" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-lobster">Home</Link>
        <span className="mx-2">›</span>
        <Link href="/stores" className="hover:text-lobster">Stores</Link>
        <span className="mx-2">›</span>
        <span className="text-space font-medium">{displayName}</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
        {/* Main content column */}
        <div className="flex-1 min-w-0">
      {/* Title + count only (no View all / tabs / search on inner store page) */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
        <h2 className="text-base sm:text-xl font-bold text-space">
          {pageTitle}
        </h2>
        <span className="text-rebecca font-medium text-sm sm:text-base">
          {storeCoupons.length} Coupon{storeCoupons.length !== 1 ? "s" : ""} &amp; Deal{storeCoupons.length !== 1 ? "s" : ""} available
        </span>
      </div>

      {/* Coupon list (no "Top X Coupons" heading) */}
      <section id="coupon-list" className="mb-8 sm:mb-10">
        {filtered.length === 0 ? (
          <p className="text-rebecca py-6">
            No coupons or deals right now.
          </p>
        ) : (
          <ul className="space-y-4">
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
          </ul>
        )}

        <CouponPopup
          coupon={popupCoupon}
          onClose={() => setPopupCoupon(null)}
          storeLogoUrl={store?.logoUrl}
          fallbackUrl={store?.trackingUrl?.trim() || store?.storeWebsiteUrl?.trim() || ""}
        />
      </section>

      {/* Related blog guide – link only, no redirect */}
      {relatedBlogSlug && (
        <div className="mb-6 sm:mb-8 rounded-2xl border-2 border-rebecca/20 bg-white p-4 sm:p-5 shadow-sm">
          <p className="text-sm text-space mb-2">
            Read our complete savings guide for {displayName}:
          </p>
          <Link
            href={`/blog/${encodeURIComponent(relatedBlogSlug)}`}
            className="font-semibold text-lobster hover:underline"
          >
            {displayName} Coupon Codes, Deals &amp; Discounts (Complete Guide 2026) →
          </Link>
        </div>
      )}

      {/* SEO / Content blocks – from admin Category & Content */}
      <div className="space-y-10 rounded-2xl border-2 border-rebecca/15 bg-white p-6 sm:p-8 shadow-md">
        {aboutText && (
          <section>
            <h3 className="text-lg font-bold text-space mb-3">About {displayName}</h3>
            {aboutText.includes("<") && aboutText.includes(">") ? (
              <div className="text-rebecca leading-relaxed store-content-html" dangerouslySetInnerHTML={{ __html: aboutText }} />
            ) : (
              <p className="text-rebecca leading-relaxed">{aboutText}</p>
            )}
          </section>
        )}

        {shoppingTips && (
          <section>
            <h3 className="text-lg font-bold text-space mb-3">
              How to Use {displayName} Coupon Codes
            </h3>
            <p className="text-rebecca font-medium mb-2">{store?.shoppingTipsTitle}</p>
            <ul className="list-disc list-inside text-rebecca space-y-1">
              {(store?.shoppingTipsBullets ?? []).map((bullet, i) => (
                <li key={i}>{bullet}</li>
              ))}
            </ul>
          </section>
        )}

        {!shoppingTips && storeCoupons.length > 0 && (
          <section>
            <h3 className="text-lg font-bold text-space mb-3">
              How to Use {displayName} Coupon Codes
            </h3>
            <p className="text-rebecca leading-relaxed">
              Copy the code from Couponro and paste it at checkout on {displayName}&apos;s website to get the discount. Some offers are deal links—click &quot;Get Deal&quot; to go to the store and the offer will apply automatically.
            </p>
          </section>
        )}

        <section>
          <h3 className="text-lg font-bold text-space mb-3">
            How to Never Miss a {displayName} Coupon
          </h3>
          <p className="text-rebecca leading-relaxed">
            Bookmark this page and check back often. We update {displayName} coupons and deals regularly. You can also visit Couponro&apos;s homepage to see the latest offers from all your favorite stores.
          </p>
        </section>

        {faqs.length > 0 && (
          <section>
            <h3 className="text-lg font-bold text-space mb-4">FAQs</h3>
            <ul className="space-y-4">
              {faqs.map((faq, i) => (
                <li key={i}>
                  <h4 className="font-semibold text-space">{faq.question}</h4>
                  <p className="text-rebecca text-sm mt-1">{faq.answer}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <p className="mt-10">
        <Link href="/stores" className="text-rebecca hover:text-lobster font-semibold">
          ← All stores
        </Link>
      </p>
        </div>

        {/* Sidebar: store info + deals + admin content */}
        <aside className="lg:w-96 flex-shrink-0">
          <div className="lg:sticky lg:top-6 space-y-5">
            {/* Store logo, title, description */}
            <div className="rounded-2xl border-2 border-rebecca/20 bg-white p-5 shadow-md">
              {store?.logoUrl ? (
                <div className="w-full flex justify-center mb-4">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center bg-almond/50 rounded-xl p-2">
                    <img
                      src={store.logoUrl}
                      alt={displayName}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              ) : (
                <div className="w-full flex justify-center mb-4">
                  <div className="w-24 h-24 rounded-xl bg-almond flex items-center justify-center">
                    <span className="text-4xl font-bold text-rebecca">{displayName?.charAt(0) ?? "?"}</span>
                  </div>
                </div>
              )}
              <h2 className="text-lg font-bold text-space text-center">{displayName}</h2>
              {description && (
                <p className="mt-2 text-rebecca text-sm leading-relaxed text-center">
                  {description}
                </p>
              )}
            </div>

            {/* Top Deals Right Now – always show when there are coupons */}
            {storeCoupons.length > 0 && (
              <div className="rounded-2xl border-2 border-rebecca/20 bg-white p-5 shadow-md">
                <h3 className="text-base font-bold text-space mb-4">
                  Top {displayName} Deals Right Now
                </h3>
                <ul className="space-y-3">
                  {storeCoupons.slice(0, 5).map((c) => {
                    const isCode = isCodeCoupon(c);
                    const title = c.couponTitle?.trim() || c.badgeLabel?.trim() || "Offer";
                    const logoUrl = store?.logoUrl || c.logoUrl || "";
                    return (
                      <li key={c.id} className="flex items-center gap-3 rounded-xl bg-almond/50 p-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-almond flex items-center justify-center overflow-hidden p-0.5">
                          {logoUrl ? (
                            <img src={logoUrl} alt={displayName} className="w-full h-full object-contain" />
                          ) : (
                            <span className="text-lobster font-bold text-xs text-center leading-tight">
                              {getCouponBadge(c)}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-space text-sm line-clamp-2">{title}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                    const copyId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `c_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
                    const base = slug ? `/stores/${encodeURIComponent(slug)}` : "/coupons";
                    const trackingUrl = (c.trackingUrl ?? c.storeWebsiteUrl ?? c.link ?? store?.trackingUrl ?? store?.storeWebsiteUrl ?? "").toString().trim();
                    window.open(`${base}?popup=${encodeURIComponent(c.id)}&copy=${encodeURIComponent(copyId)}`, "_blank", "noopener,noreferrer");
                    if (trackingUrl && trackingUrl !== "#") window.location.href = trackingUrl;
                  }}
                          className="flex-shrink-0 rounded-lg bg-lobster text-white text-xs font-semibold uppercase tracking-wide px-3 py-1.5 hover:bg-lobster/90 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                        >
                          {isCode ? "GET CODE" : "GET DEAL"}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Sidebar HTML from admin */}
            {store?.sidebarContent?.trim() && (
              <div className="rounded-2xl border-2 border-rebecca/20 bg-white p-5 shadow-md">
                <h3 className="text-base font-bold text-space mb-3">
                  {displayName} Codes &amp; Coupons
                </h3>
                <div
                  className="store-sidebar-html text-rebecca text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: store.sidebarContent.trim() }}
                />
              </div>
            )}

            {/* Why Trust Us */}
            {store?.whyTrustUs?.trim() && (
              <div className="rounded-2xl border-2 border-rebecca/20 bg-white p-5 shadow-md">
                <h3 className="text-base font-bold text-space mb-3">Why Trust Us</h3>
                <p className="text-rebecca text-sm leading-relaxed whitespace-pre-line">
                  {store.whyTrustUs.trim()}
                </p>
              </div>
            )}

            {/* More Information */}
            {store?.moreInformation?.trim() && (
              <div className="rounded-2xl border-2 border-rebecca/20 bg-white p-5 shadow-md">
                <h3 className="text-base font-bold text-space mb-3">More Information</h3>
                {store.moreInformation.includes("<") && store.moreInformation.includes(">") ? (
                  <div className="text-rebecca text-sm leading-relaxed store-content-html" dangerouslySetInnerHTML={{ __html: store.moreInformation.trim() }} />
                ) : (
                  <p className="text-rebecca text-sm leading-relaxed whitespace-pre-line">
                    {store.moreInformation.trim()}
                  </p>
                )}
              </div>
            )}

            {/* Related Stores – always in sidebar */}
            {otherStores.length > 0 && (
              <div className="rounded-2xl border-2 border-rebecca/20 bg-white p-5 shadow-md">
                <h3 className="text-base font-bold text-space mb-4">Related Stores</h3>
                <ul className="space-y-2">
                  {otherStores.slice(0, 6).map((s) => (
                    <li key={s.id}>
                      <Link
                        href={`/stores/${encodeURIComponent(getStoreSlug(s))}`}
                        className="flex items-center gap-3 rounded-lg p-2 hover:bg-almond/50 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-almond flex items-center justify-center overflow-hidden flex-shrink-0">
                          {s.logoUrl ? (
                            <img src={s.logoUrl} alt={s.name ?? ""} className="w-full h-full object-contain" />
                          ) : (
                            <span className="font-bold text-rebecca text-sm">{s.name?.charAt(0) ?? "?"}</span>
                          )}
                        </div>
                        <span className="font-medium text-space text-sm">{s.name ?? "–"} Coupons</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Placeholder only when nothing from admin and no coupons/related */}
            {!hasSidebarContent && storeCoupons.length === 0 && otherStores.length === 0 && (
              <div className="rounded-2xl border-2 border-rebecca/15 bg-white p-5 shadow-md">
                <h3 className="text-base font-bold text-space mb-2">About this store</h3>
                <p className="text-rebecca text-sm">
                  Add <strong>Sidebar</strong>, <strong>Why Trust Us</strong>, or <strong>More Information</strong> in the admin store editor to show more content here.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
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
  const showCodeLabel = getShowCodeButtonLabel(coupon);
  const isVerified = coupon.verified !== false;

  return (
    <li className="group rounded-xl border-2 border-rebecca/20 bg-white p-3 sm:p-5 hover:border-rebecca/50 hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
      <div className="flex gap-3 sm:gap-4 flex-1 min-w-0">
        <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-lobster text-white flex flex-col items-center justify-center overflow-hidden shadow-sm">
          <span className={`font-extrabold leading-none tracking-wide ${badge === "DEAL" ? "text-lg sm:text-xl" : "text-sm sm:text-base"}`}>{badge}</span>
          {badge !== "DEAL" ? <span className="text-[9px] font-semibold uppercase mt-1 opacity-95">Coupon</span> : null}
        </div>
        <div className="min-w-0">
          {isVerified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-200 mb-1">
              <span aria-hidden>✓</span> Verified
            </span>
          )}
          <h4 className="font-bold text-space text-sm sm:text-base">{title}</h4>
          {coupon.description?.trim() && (
            <p className="text-xs sm:text-sm text-rebecca mt-0.5 line-clamp-2 sm:line-clamp-none">{coupon.description.trim().slice(0, 120)}</p>
          )}
          {coupon.expiry && (
            <p className="text-xs text-slate-500 mt-1">Expires: {coupon.expiry}</p>
          )}
        </div>
      </div>
      <div className="relative flex flex-col items-start sm:items-end gap-2">
        {/* Button overlaps code box from left; last 2 chars always visible (button max 70% width) */}
        <div className="relative rounded-none overflow-hidden border border-slate-300 shadow-sm w-full min-w-[8rem] sm:min-w-[14rem] sm:w-auto max-w-full h-10 sm:h-11">
          {hasCode ? (
            <>
              <div
                className="absolute inset-0 bg-white border-l-2 border-dashed border-slate-400 font-mono text-xs sm:text-sm font-semibold text-black select-none rounded-none uppercase flex items-center justify-end pr-1.5"
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
        <span className="text-xs text-slate-500">View Terms</span>
      </div>
    </li>
  );
}

