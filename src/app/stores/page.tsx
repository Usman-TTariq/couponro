"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import type { Store } from "@/types/store";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const TRENDING_COUNT = 6;
const RECENT_COUNT = 12;

function getSlug(store: Store): string {
  const slug = store.slug || store.name?.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || store.id || "";
  return slug || String(store.id || "store");
}

function getFirstChar(name: string): string {
  const c = (name || "").trim().charAt(0).toUpperCase();
  return /[A-Z]/.test(c) ? c : "#";
}

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [letter, setLetter] = useState<string | null>(null);
  const [navigating, setNavigating] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  /* Clear navigating state when route changes (e.g. after store link click) */
  useEffect(() => {
    setNavigating(false);
  }, [pathname]);

  const handleStoreClick = useCallback(() => {
    setNavigating(true);
  }, []);

  const prefetchStore = useCallback(
    (slug: string) => {
      if (!slug) return;
      router.prefetch(`/stores/${encodeURIComponent(slug)}`);
    },
    [router]
  );

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

  const sortedByCreated = [...stores].sort((a, b) =>
    (b.createdAt ?? "").localeCompare(a.createdAt ?? "")
  );
  const trending = [...stores].filter((s) => s.markAsTrending === true);
  const trendingAndRecent = [
    ...trending,
    ...sortedByCreated.filter((s) => !s.markAsTrending),
  ].slice(0, TRENDING_COUNT);
  const recentlyAdded = sortedByCreated.slice(0, RECENT_COUNT);

  const forTopMerchants = letter
    ? stores.filter((s) => getFirstChar(s.name ?? "") === letter)
    : stores;
  const columns = 3;
  const perCol = Math.ceil(forTopMerchants.length / columns);
  const topMerchantsCols = [
    forTopMerchants.slice(0, perCol),
    forTopMerchants.slice(perCol, perCol * 2),
    forTopMerchants.slice(perCol * 2, perCol * 3),
  ];

  const recentPerCol = Math.ceil(recentlyAdded.length / columns);
  const recentCols = [
    recentlyAdded.slice(0, recentPerCol),
    recentlyAdded.slice(recentPerCol, recentPerCol * 2),
    recentlyAdded.slice(recentPerCol * 2, recentPerCol * 3),
  ];

  return (
    <div className="min-h-screen w-full min-w-0 bg-almond flex flex-col overflow-x-hidden">
      {/* Top loading bar when navigating to a store */}
      {navigating && (
        <div
          className="fixed top-0 left-0 right-0 z-[100] h-1 bg-rebecca animate-pulse"
          aria-live="polite"
          aria-label="Loading page"
        />
      )}
      <Header />
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 py-8">
        <h1 className="text-3xl md:text-4xl font-bold text-space mb-10 tracking-tight text-center">
          Stores &amp; Coupons
        </h1>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-rebecca border-t-transparent" />
            <span className="ml-3 text-rebecca">Loading…</span>
          </div>
        ) : (
          <>
            {/* Recently Added & Trending Stores – horizontal cards */}
            <section className="mb-12">
              <h2 className="text-xl md:text-2xl font-bold text-space mb-6 text-center">
                Recently Added &amp; Trending Stores
              </h2>
              <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-thin">
                {trendingAndRecent.length === 0 ? (
                  <p className="text-rebecca text-center w-full py-6">No stores yet.</p>
                ) : (
                  trendingAndRecent.map((store) => {
                    const slug = getSlug(store);
                    return (
                    <Link
                      key={store.id}
                      href={`/stores/${encodeURIComponent(slug)}`}
                      prefetch={true}
                      onMouseEnter={() => prefetchStore(slug)}
                      onClick={handleStoreClick}
                      className="flex-shrink-0 w-36 sm:w-40 rounded-2xl border-2 border-rebecca/15 bg-white p-5 shadow-lg hover:shadow-xl hover:border-soft-cyan/50 transition-all duration-200 cursor-pointer active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-rebecca focus-visible:ring-offset-2"
                    >
                      <div className="w-20 h-20 mx-auto rounded-xl bg-almond flex items-center justify-center overflow-hidden mb-3">
                        {store.logoUrl ? (
                          <img
                            src={store.logoUrl}
                            alt={store.name ?? ""}
                            className="w-full h-full object-contain p-1"
                          />
                        ) : (
                          <span className="text-2xl font-bold text-rebecca">
                            {store.name?.charAt(0) ?? "?"}
                          </span>
                        )}
                      </div>
                      <p className="text-center font-semibold text-space text-sm line-clamp-2">
                        {store.name ?? "–"}
                      </p>
                    </Link>
                    );
                  })
                )}
              </div>
            </section>

            {/* Top Merchants */}
            <section className="mb-12">
              <h2 className="text-xl md:text-2xl font-bold text-space mb-6 text-center">
                Top Merchants
              </h2>
              {/* A–Z navigation – clearly clickable */}
              <div className="flex flex-wrap justify-center gap-1 sm:gap-2 mb-6" role="tablist" aria-label="Filter by letter">
                {ALPHABET.map((c) => (
                  <button
                    key={c}
                    type="button"
                    role="tab"
                    aria-pressed={letter === c}
                    aria-label={`Stores starting with ${c}`}
                    onClick={() => setLetter((prev) => (prev === c ? null : c))}
                    className={`min-w-[2.25rem] rounded-lg px-2 py-1.5 text-sm font-semibold transition-all cursor-pointer touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-rebecca focus-visible:ring-offset-2 active:scale-95 ${
                      letter === c
                        ? "bg-rebecca text-white shadow-md"
                        : "bg-white border border-rebecca/25 text-space hover:bg-rebecca/10 hover:border-rebecca/40"
                    }`}
                  >
                    {c}
                  </button>
                ))}
                <button
                  type="button"
                  role="tab"
                  aria-pressed={letter === "#"}
                  aria-label="Stores starting with number or symbol"
                  onClick={() => setLetter((prev) => (prev === "#" ? null : "#"))}
                  className={`min-w-[2.25rem] rounded-lg px-2 py-1.5 text-sm font-semibold transition-all cursor-pointer touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-rebecca focus-visible:ring-offset-2 active:scale-95 ${
                    letter === "#"
                      ? "bg-rebecca text-white shadow-md"
                      : "bg-white border border-rebecca/25 text-space hover:bg-rebecca/10 hover:border-rebecca/40"
                  }`}
                >
                  #
                </button>
              </div>
              {letter && (
                <p className="text-center text-rebecca font-medium mb-4">
                  Showing stores starting with &quot;{letter}&quot;
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-2 rounded-2xl bg-white border-2 border-rebecca/15 p-6 shadow-lg">
                {forTopMerchants.length === 0 ? (
                  <p className="col-span-full text-rebecca text-center py-4">
                    No stores found.
                  </p>
                ) : (
                  topMerchantsCols.map((col, colIndex) => (
                    <ul key={colIndex} className="space-y-1.5">
                      {col.map((store) => {
                        const slug = getSlug(store);
                        return (
                          <li key={store.id}>
                            <Link
                              href={`/stores/${encodeURIComponent(slug)}`}
                              prefetch={true}
                              onMouseEnter={() => prefetchStore(slug)}
                              onClick={handleStoreClick}
                              className="inline-block text-rebecca hover:text-lobster hover:underline font-medium cursor-pointer py-0.5 pr-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-rebecca focus-visible:ring-offset-1 active:opacity-80 transition-colors"
                            >
                              {store.name ?? "–"} Coupons
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  ))
                )}
              </div>
            </section>

            {/* Recently Added – 3 columns */}
            <section>
              <h2 className="text-xl md:text-2xl font-bold text-space mb-6 text-center">
                Recently Added
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-2 rounded-2xl bg-white border-2 border-rebecca/15 p-6 shadow-lg">
                {recentlyAdded.length === 0 ? (
                  <p className="col-span-full text-rebecca text-center py-4">
                    No stores yet.
                  </p>
                ) : (
                  recentCols.map((col, colIndex) => (
                    <ul key={colIndex} className="space-y-1.5">
                      {col.map((store) => {
                        const slug = getSlug(store);
                        return (
                          <li key={store.id}>
                            <Link
                              href={`/stores/${encodeURIComponent(slug)}`}
                              prefetch={true}
                              onMouseEnter={() => prefetchStore(slug)}
                              onClick={handleStoreClick}
                              className="inline-block text-rebecca hover:text-lobster hover:underline font-medium cursor-pointer py-0.5 pr-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-rebecca focus-visible:ring-offset-1 active:opacity-80 transition-colors"
                            >
                              {store.name ?? "–"} Coupons
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  ))
                )}
              </div>
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
