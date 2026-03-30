import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCoupons, getStores } from "@/lib/stores";
import type { Store } from "@/types/store";
import {
  getCouponDetailPath,
  getCouponDisplayTitle,
  getCouponPageSlug,
  getStoreSlugSegment,
} from "@/lib/coupon-slug";

type Props = { params: Promise<{ slug: string[] }> };

function getCouponCode(c: Store): string {
  const code = c.couponCode ?? (c as Record<string, unknown>).coupon_code ?? "";
  return String(code).trim();
}

function parseDiscount(text: string): string {
  const m = text.match(/(\$\d+(?:\.\d{1,2})?|\d+\s*%|%\s*off)/i);
  return m ? m[1].replace(/\s+/g, "").toUpperCase() : "";
}

function getDiscountLabel(coupon: Store): string {
  const text = [coupon.badgeLabel ?? "", coupon.couponTitle ?? ""].join(" ").trim();
  const parsed = parseDiscount(text);
  if (parsed) return parsed;
  return getCouponCode(coupon) ? "CODE" : "DEAL";
}

async function resolveCouponPair(storeSlug: string, couponSlug: string): Promise<Store | null> {
  const coupons = await getCoupons();
  const enabled = coupons.filter((c) => (c.status ?? "enable") !== "disable");
  const ss = decodeURIComponent(storeSlug).trim().toLowerCase();
  const cs = decodeURIComponent(couponSlug).trim().toLowerCase();
  return (
    enabled.find((c) => {
      const storeSeg = getStoreSlugSegment(c).toLowerCase();
      const titleSeg = getCouponPageSlug(c).toLowerCase();
      return storeSeg === ss && titleSeg === cs;
    }) ?? null
  );
}

async function resolveLegacySingle(param: string): Promise<Store | null> {
  const coupons = await getCoupons();
  const enabled = coupons.filter((c) => (c.status ?? "enable") !== "disable");
  const raw = decodeURIComponent(param).trim().toLowerCase();
  const byId = enabled.find((c) => (c.id ?? "").trim().toLowerCase() === raw);
  if (byId) return byId;
  return enabled.find((c) => getCouponPageSlug(c).toLowerCase() === raw) ?? null;
}

function toListItems(text: string): string[] {
  return text
    .split(/[.\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!slug?.length) return { title: "Coupon not found" };
  try {
    let coupon: Store | null = null;
    if (slug.length === 2) {
      coupon = await resolveCouponPair(slug[0], slug[1]);
    } else if (slug.length === 1) {
      coupon = await resolveLegacySingle(slug[0]);
    }
    if (!coupon) return { title: "Coupon not found" };
    const title = getCouponDisplayTitle(coupon);
    const description = coupon.description?.trim() || `${coupon.name} coupon details and usage guide.`;
    return { title: `${title} | Coupon Details`, description };
  } catch {
    return {
      title: "Coupon | Couponro",
      description: "Coupon details and usage.",
    };
  }
}

export default async function CouponPage({ params }: Props) {
  const { slug } = await params;
  if (!slug?.length) notFound();

  if (slug.length === 1) {
    const coupon = await resolveLegacySingle(slug[0]);
    if (!coupon) notFound();
    redirect(getCouponDetailPath(coupon));
  }

  if (slug.length !== 2) notFound();

  const coupon = await resolveCouponPair(slug[0], slug[1]);
  if (!coupon) notFound();

  const [stores, allCoupons] = await Promise.all([getStores(), getCoupons()]);
  const sameNameStores = stores
    .filter((s) => (s.status ?? "enable") !== "disable")
    .filter((s) => (s.name ?? "").trim().toLowerCase() === (coupon.name ?? "").trim().toLowerCase())
    .sort((a, b) => ((b.logoUrl ?? "").trim() ? 1 : 0) - ((a.logoUrl ?? "").trim() ? 1 : 0));
  const store = sameNameStores[0] ?? null;
  const storeByNameWithLogo = new Map<string, Store>();
  for (const s of stores.filter((x) => (x.status ?? "enable") !== "disable")) {
    const key = (s.name ?? "").trim().toLowerCase();
    if (!key) continue;
    const current = storeByNameWithLogo.get(key);
    if (!current) {
      storeByNameWithLogo.set(key, s);
      continue;
    }
    const currentHasLogo = (current.logoUrl ?? "").trim().length > 0;
    const nextHasLogo = (s.logoUrl ?? "").trim().length > 0;
    if (!currentHasLogo && nextHasLogo) storeByNameWithLogo.set(key, s);
  }
  const title = getCouponDisplayTitle(coupon);
  const discount = getDiscountLabel(coupon);
  const code = getCouponCode(coupon);
  const hasCode = code.length > 0;
  const link = (coupon.trackingUrl ?? coupon.storeWebsiteUrl ?? coupon.link ?? store?.trackingUrl ?? store?.storeWebsiteUrl ?? "").trim();
  const logoUrl = (store?.logoUrl ?? coupon.logoUrl ?? "").trim();
  const storeSlug = store?.slug || coupon.slug || coupon.name?.toLowerCase().replace(/\s+/g, "-") || "";
  const description = coupon.description?.trim() || `${coupon.name} coupon details and coupon information.`;
  const bulletItems = toListItems(description);
  const related = allCoupons
    .filter((c) => (c.status ?? "enable") !== "disable")
    .filter((c) => (c.id ?? "") !== (coupon.id ?? ""))
    .filter((c) => (c.name ?? "").trim().toLowerCase() === (coupon.name ?? "").trim().toLowerCase())
    .slice(0, 4);
  const otherShops = stores
    .filter((s) => (s.status ?? "enable") !== "disable")
    .filter((s) => (s.name ?? "").trim().toLowerCase() !== (coupon.name ?? "").trim().toLowerCase())
    .filter((s) => (s.logoUrl ?? "").trim().length > 0)
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-[#f1f1f1] flex flex-col">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <article className="lg:col-span-8">
            <nav className="text-xs sm:text-sm text-gray-500 mb-3" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-gray-700">Home</Link>
              <span className="mx-1.5">›</span>
              <Link href="/coupons" className="hover:text-gray-700">Coupons</Link>
              <span className="mx-1.5">›</span>
              <span className="text-gray-700">{title}</span>
            </nav>

            <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide">
                <span className="rounded bg-[#34C759] px-2 py-1 font-semibold text-white">{hasCode ? "Code" : "Deal"}</span>
                {coupon.verified !== false ? <span className="rounded bg-emerald-50 px-2 py-1 font-semibold text-emerald-700 border border-emerald-200">Verified</span> : null}
              </div>

              <div className="mt-3 flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-lobster text-white flex items-center justify-center shrink-0">
                  <span className="text-sm font-extrabold leading-none">{discount}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 leading-tight">{title}</h1>
                  <p className="mt-2 text-sm text-gray-600">{description}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span>by Couponro</span>
                    <span>•</span>
                    <span>Expires: {coupon.expiry || "Dec 31, 2026"}</span>
                  </div>
                </div>
                <div className="sm:ml-auto sm:text-right">
                  <p className="text-xs uppercase tracking-wide text-gray-400">Offer value</p>
                  <p className="text-xl font-bold text-gray-900">{discount}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
                {hasCode ? (
                  <div className="flex-1 rounded border border-dashed border-slate-300 bg-slate-50 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-slate-500">Coupon Code</p>
                    <p className="font-mono text-lg font-bold text-gray-900">{code.toUpperCase()}</p>
                  </div>
                ) : (
                  <div className="flex-1 rounded border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
                    This is a direct deal. No code required.
                  </div>
                )}
                {link ? (
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-11 items-center justify-center rounded bg-[#f9b400] px-5 text-xs sm:text-sm font-bold uppercase tracking-wide text-gray-900 hover:bg-[#e8a700] transition-colors"
                  >
                    {hasCode ? "Buy it now" : "Get deal"}
                  </a>
                ) : null}
              </div>

              <div className="mt-5 border-t border-gray-100 pt-4">
                <h2 className="text-sm font-semibold text-gray-900 mb-2">Product information</h2>
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                  {bulletItems.length > 0 ? bulletItems.map((item) => <li key={item}>{item}</li>) : <li>Latest savings details verified from merchant page.</li>}
                </ul>
              </div>

              <div className="mt-4 rounded border border-emerald-100 bg-emerald-50/50 px-3 py-2 text-xs sm:text-sm text-emerald-800">
                Save this page and check regularly for updated offer terms and fresh discount opportunities.
              </div>

              <div className="mt-4 border-t border-gray-100 pt-4">
                <p className="text-sm font-semibold text-gray-900">Couponro Team</p>
                <p className="text-xs text-gray-500 mt-1">We check merchant pages frequently and refresh expired promotions quickly.</p>
              </div>
            </div>

            {related.length > 0 ? (
              <section className="mt-6 rounded-lg border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">Related deals</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {related.map((item) => {
                    const itemTitle = getCouponDisplayTitle(item);
                    const itemDiscount = getDiscountLabel(item);
                    const itemStore = storeByNameWithLogo.get((item.name ?? "").trim().toLowerCase());
                    const itemLogo = (itemStore?.logoUrl ?? item.logoUrl ?? "").trim();
                    return (
                      <Link
                        key={item.id}
                        href={getCouponDetailPath(item)}
                        className="rounded border border-gray-200 p-2 hover:border-lobster hover:shadow-sm transition-all"
                      >
                        <div className="h-16 rounded bg-gray-50 flex items-center justify-center overflow-hidden">
                          {itemLogo ? (
                            <img src={itemLogo} alt={item.name ?? "Store"} className="h-full w-full object-contain p-2" />
                          ) : (
                            <span className="text-xs font-bold text-lobster">{itemDiscount}</span>
                          )}
                        </div>
                        <p className="mt-2 text-xs text-gray-800 line-clamp-2">{itemTitle}</p>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ) : null}

            <section className="mt-6 rounded-lg border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">Leave a reply</h3>
              <textarea
                className="w-full min-h-32 rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rebecca/30"
                placeholder="Write your comment..."
              />
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input className="rounded border border-gray-300 px-3 py-2 text-sm" placeholder="Name" />
                <input className="rounded border border-gray-300 px-3 py-2 text-sm" placeholder="Email" />
                <input className="rounded border border-gray-300 px-3 py-2 text-sm" placeholder="Website" />
              </div>
              <button type="button" className="mt-3 rounded bg-rebecca px-4 py-2 text-sm font-semibold text-white hover:bg-rebecca/90">
                Submit
              </button>
            </section>
          </article>

          <aside className="lg:col-span-4 space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="w-full flex justify-center mb-3">
                <div className="w-24 h-24 rounded bg-gray-50 flex items-center justify-center overflow-hidden">
                  {logoUrl ? (
                    <img src={logoUrl} alt={coupon.name ?? "Store"} className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-3xl font-bold text-rebecca">{(coupon.name ?? "S").charAt(0)}</span>
                  )}
                </div>
              </div>
              <h2 className="text-lg font-bold text-gray-900 text-center">{coupon.name ?? "Store"}</h2>
              <p className="text-center text-sm text-gray-500 mt-1">View all active coupons and promotions</p>
              <div className="mt-3 text-center">
                <Link href={`/stores/${encodeURIComponent(storeSlug)}`} className="text-sm font-semibold text-lobster hover:underline">
                  View all store coupons
                </Link>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2">Popular offers</h3>
              <ul className="space-y-2 text-sm">
                {related.slice(0, 5).map((r) => {
                  const rStore = storeByNameWithLogo.get((r.name ?? "").trim().toLowerCase());
                  const rLogo = (rStore?.logoUrl ?? r.logoUrl ?? "").trim();
                  return (
                    <li key={r.id}>
                      <Link href={getCouponDetailPath(r)} className="flex items-center gap-2 text-gray-700 hover:text-lobster">
                        <span className="w-7 h-7 rounded bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                          {rLogo ? (
                            <img src={rLogo} alt={r.name ?? "Store"} className="w-full h-full object-contain p-0.5" />
                          ) : (
                            <span className="text-[10px] font-bold text-lobster">{getDiscountLabel(r)}</span>
                          )}
                        </span>
                        <span className="line-clamp-1">{getCouponDisplayTitle(r)}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            {otherShops.length > 0 ? (
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <h3 className="text-[28px] leading-none font-light text-gray-900">Other shops</h3>
                <div className="mt-3 h-0.5 w-20 bg-[#ef4444]" />
                <div className="mt-5 grid grid-cols-3 gap-2">
                  {otherShops.map((shop) => {
                    const shopSlug = (shop.slug ?? shop.name?.toLowerCase().replace(/\s+/g, "-") ?? "").trim();
                    return (
                      <Link
                        key={shop.id}
                        href={`/stores/${encodeURIComponent(shopSlug)}`}
                        className="h-16 rounded border border-gray-200 bg-white hover:border-lobster transition-colors flex items-center justify-center overflow-hidden p-2"
                        title={shop.name}
                      >
                        <img src={shop.logoUrl} alt={shop.name} className="max-h-full w-auto object-contain" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2">Subscribe to our list</h3>
              <input className="w-full rounded border border-gray-300 px-3 py-2 text-sm" placeholder="Your email" />
              <button type="button" className="mt-2 w-full rounded bg-lobster px-3 py-2 text-sm font-semibold text-white hover:bg-lobster/90">
                Subscribe
              </button>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
