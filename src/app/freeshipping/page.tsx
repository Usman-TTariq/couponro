"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DEFAULT_BLOG_POST_URL } from "@/lib/blog-posts";
import type { Store } from "@/types/store";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const PER_PAGE = 12;

const FREE_SHIPPING_CATEGORIES = [
  "All",
  "Travel",
  "Shopping",
  "Fashion",
  "Health & Beauty",
  "Home & Garden",
  "Tech & Electronics",
  "Food & Gifts",
  "Other",
];

function getStoreTrackingUrl(store: Store): string {
  const raw = store as Record<string, unknown>;
  const u = store.trackingUrl?.trim() || (typeof raw.tracking_url === "string" ? raw.tracking_url.trim() : "");
  const w = store.storeWebsiteUrl?.trim() || (typeof raw.store_website_url === "string" ? raw.store_website_url.trim() : "");
  return u || w || "#";
}

function getStoreCategory(store: Store): string {
  const cat = store.categories?.[0] ?? store.category ?? "";
  if (!cat) return "Other";
  const c = cat.toLowerCase();
  if (c.includes("travel")) return "Travel";
  if (c.includes("fashion") || c.includes("cloth")) return "Fashion";
  if (c.includes("health") || c.includes("beauty")) return "Health & Beauty";
  if (c.includes("home") || c.includes("garden")) return "Home & Garden";
  if (c.includes("tech") || c.includes("electron")) return "Tech & Electronics";
  if (c.includes("food") || c.includes("gift")) return "Food & Gifts";
  if (c.includes("shop")) return "Shopping";
  return "Other";
}

export default function FreeShippingPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [navigating, setNavigating] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setNavigating(false);
  }, [pathname]);

  const handleStoreClick = useCallback(() => {
    setNavigating(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/stores", { cache: "no-store" });
        if (cancelled) return;
        const data = await res.json();
        setStores(Array.isArray(data) ? data.filter((s: Store) => s.status !== "disable") : []);
      } catch {
        if (!cancelled) setStores([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const filteredStores = stores.filter((s) => {
    if (category !== "All" && getStoreCategory(s) !== category) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return (s.name ?? "").toLowerCase().includes(q);
    }
    return true;
  });

  const totalFiltered = filteredStores.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PER_PAGE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * PER_PAGE;
  const listStores = filteredStores.slice(start, start + PER_PAGE);

  useEffect(() => {
    if (totalPages >= 1 && page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const featured = filteredStores.slice(0, 9);
  const topThree = featured.slice(0, 3);
  const nextSix = featured.slice(3, 9);

  const setCategoryAndResetPage = (cat: string) => {
    setCategory(cat);
    setPage(1);
  };

  return (
    <div className="min-h-screen w-full min-w-0 bg-almond flex flex-col overflow-x-hidden">
      {navigating && (
        <div
          className="fixed top-0 left-0 right-0 z-[100] h-1 bg-rebecca animate-pulse"
          aria-live="polite"
          aria-label="Loading page"
        />
      )}
      <Header />
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 py-8">
        <h1 className="text-3xl md:text-4xl font-bold text-space mb-10 tracking-tight">
          Today&apos;s Top Free Shipping Offers
        </h1>
        <p className="text-space/90 mb-8">
          For saving tips and free-shipping store guides, read our{" "}
          <Link href={DEFAULT_BLOG_POST_URL} className="text-lobster font-medium hover:underline">saving tips guide</Link>.
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-rebecca border-t-transparent" />
            <span className="ml-3 text-rebecca">Loading…</span>
          </div>
        ) : (
          <>
            {/* Featured: 3 larger + 6 smaller cards */}
            <section className="mb-12">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                {topThree.map((store) => (
                  <FreeShippingFeaturedCard key={store.id} store={store} size="large" onStoreClick={handleStoreClick} />
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                {nextSix.map((store) => (
                  <FreeShippingFeaturedCard key={store.id} store={store} size="small" onStoreClick={handleStoreClick} />
                ))}
              </div>
            </section>

            {/* Earn Cashback at X Stores + sidebar + list */}
            <section>
              <h2 className="text-2xl md:text-3xl font-bold text-space mb-6">
                Get Free Shipping at {stores.length}+ Stores
              </h2>
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Left: category filters */}
                <aside className="lg:w-60 flex-shrink-0">
                  <nav className="rounded-2xl border-2 border-rebecca/25 bg-white p-4 shadow-lg">
                    <ul className="space-y-1">
                      {FREE_SHIPPING_CATEGORIES.map((cat) => (
                        <li key={cat}>
                          <button
                            type="button"
                            onClick={() => setCategoryAndResetPage(cat)}
                            className={`w-full text-left px-5 py-3 rounded-xl text-base font-semibold transition-all duration-200 ${
                              category === cat
                                ? "bg-rebecca text-white shadow-md"
                                : "text-space hover:bg-almond hover:text-rebecca"
                            }`}
                          >
                            {cat}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </aside>

                {/* Right: search + list */}
                <div className="flex-1 min-w-0">
                  <div className="relative mb-6">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-rebecca/60">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </span>
                    <input
                      type="search"
                      placeholder="Search for a store"
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                      className="w-full pl-14 pr-5 py-4 text-lg rounded-2xl border-2 border-rebecca/20 bg-white text-space placeholder:text-slate-400 focus:border-rebecca focus:ring-4 focus:ring-rebecca/15 outline-none shadow-sm transition-shadow"
                    />
                  </div>
                  <ul className="space-y-0 rounded-2xl border-2 border-rebecca/15 bg-white overflow-hidden shadow-xl">
                    {listStores.length === 0 ? (
                      <li className="p-12 text-center text-rebecca text-lg">No stores found.</li>
                    ) : (
                      listStores.map((store) => (
                        <FreeShippingRow key={store.id} store={store} onStoreClick={handleStoreClick} />
                      ))
                    )}
                  </ul>

                  {totalPages > 1 && (
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={safePage <= 1}
                        className="rounded-xl border-2 border-rebecca/30 bg-white px-4 py-2.5 text-sm font-semibold text-space hover:bg-almond disabled:opacity-50 disabled:pointer-events-none transition-colors"
                        aria-label="Previous page"
                      >
                        ← Prev
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const p = totalPages <= 5 ? i + 1 : Math.max(1, Math.min(safePage - 2, totalPages - 4)) + i;
                        if (p < 1 || p > totalPages) return null;
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setPage(p)}
                            className={`min-w-[2.5rem] rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                              safePage === p
                                ? "bg-rebecca text-white shadow-md"
                                : "border-2 border-rebecca/25 bg-white text-space hover:bg-almond"
                            }`}
                          >
                            {p}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={safePage >= totalPages}
                        className="rounded-xl border-2 border-rebecca/30 bg-white px-4 py-2.5 text-sm font-semibold text-space hover:bg-almond disabled:opacity-50 disabled:pointer-events-none transition-colors"
                        aria-label="Next page"
                      >
                        Next →
                      </button>
                    </div>
                  )}

                  {totalFiltered > 0 && (
                    <p className="mt-3 text-center text-sm text-rebecca font-medium">
                      Showing {start + 1}–{start + listStores.length} of {totalFiltered} stores
                    </p>
                  )}
                </div>
              </div>
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

function FreeShippingFeaturedCard({ store, size, onStoreClick }: { store: Store; size: "large" | "small"; onStoreClick?: () => void }) {
  const slug = store.slug || store.name?.toLowerCase().replace(/\s+/g, "-") || "";
  const isLarge = size === "large";
  const pct = 3 + (store.name?.length ?? 0) % 6;

  return (
    <Link
      href={`/stores/${encodeURIComponent(slug)}`}
      onClick={onStoreClick}
      className={`block rounded-2xl border-2 border-white bg-white shadow-lg hover:shadow-xl hover:border-soft-cyan/50 hover:-translate-y-0.5 transition-all duration-200 ${
        isLarge ? "p-6" : "p-5"
      }`}
    >
      <span className="inline-block rounded-lg bg-soft-cyan/90 text-space text-xs font-bold px-2.5 py-1 mb-3">
        FREE SHIPPING
      </span>
      <div className={`flex flex-col items-center ${isLarge ? "gap-4" : "gap-3"}`}>
        <div className={`rounded-xl bg-almond overflow-hidden flex items-center justify-center ring-2 ring-white/80 ${isLarge ? "w-24 h-24" : "w-20 h-20"}`}>
          {store.logoUrl ? (
            <img src={store.logoUrl} alt={store.name ?? ""} className="w-full h-full object-contain p-1" />
          ) : (
            <span className={`font-bold text-rebecca ${isLarge ? "text-3xl" : "text-xl"}`}>
              {store.name?.charAt(0) ?? "?"}
            </span>
          )}
        </div>
        <span className={`font-bold text-space text-center ${isLarge ? "text-lg" : "text-base"}`}>
          {store.name ?? "–"}
        </span>
        <span className="rounded-xl bg-lobster/15 text-lobster font-bold px-3 py-1.5 text-sm">
          Up to {pct}% back
        </span>
      </div>
    </Link>
  );
}

function FreeShippingRow({ store, onStoreClick }: { store: Store; onStoreClick?: () => void }) {
  const slug = store.slug || store.name?.toLowerCase().replace(/\s+/g, "-") || "";
  const pct = 3 + (store.name?.length ?? 0) % 6;

  return (
    <li className="flex flex-col sm:flex-row gap-5 items-start sm:items-center p-5 sm:p-6 border-b border-rebecca/10 last:border-b-0 hover:bg-almond/40 transition-colors">
      <Link href={`/stores/${encodeURIComponent(slug)}`} onClick={onStoreClick} className="flex items-center gap-5 flex-1 min-w-0 group">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-almond flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-white shadow-md group-hover:ring-soft-cyan/40 transition-all">
          {store.logoUrl ? (
            <img src={store.logoUrl} alt={store.name ?? ""} className="w-full h-full object-contain p-1" />
          ) : (
            <span className="text-2xl sm:text-3xl font-bold text-rebecca">{store.name?.charAt(0) ?? "?"}</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-space text-lg sm:text-xl truncate">{store.name ?? "–"}</p>
          <p className="text-base text-rebecca font-medium mt-0.5">Get up to {pct}% back</p>
        </div>
      </Link>
      <Link
        href={`/stores/${encodeURIComponent(slug)}`}
        onClick={onStoreClick}
        className="flex-shrink-0 w-full sm:w-auto text-center rounded-xl bg-lobster text-white font-bold text-base uppercase tracking-wider px-8 py-4 hover:bg-lobster/90 hover:shadow-xl hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 border-2 border-transparent hover:border-white/30"
      >
        Shop Now
      </Link>
    </li>
  );
}
