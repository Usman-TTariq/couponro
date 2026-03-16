"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { Store } from "@/types/store";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const SITE_NAME = "SeemPromo";
const NUMERIC_LABEL = "0-9";

function getSlug(store: Store): string {
  const slug =
    store.slug ||
    store.name?.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") ||
    store.id ||
    "";
  return slug || String(store.id || "store");
}

function getFirstChar(name: string): string {
  const c = (name || "").trim().charAt(0).toUpperCase();
  if (/[A-Z]/.test(c)) return c;
  if (/[0-9]/.test(c)) return NUMERIC_LABEL;
  return "#";
}

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState<string | null>(null);
  const [navigating, setNavigating] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = (searchParams.get("q") ?? "").trim().toLowerCase();

  useEffect(() => {
    setNavigating(false);
  }, [pathname]);

  const handleStoreClick = useCallback(() => setNavigating(true), []);
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
        setStores(
          Array.isArray(data) ? data.filter((s: Store) => s.status !== "disable") : []
        );
      } catch {
        if (!cancelled) setStores([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Filter by search query (nav search box)
  const filteredStores = useMemo(() => {
    if (!query) return stores;
    return stores.filter((s) => {
      const name = (s.name ?? "").toLowerCase();
      const slug = (s.slug ?? "").toLowerCase();
      const desc = (s.description ?? "").toLowerCase();
      return name.includes(query) || slug.includes(query) || desc.includes(query);
    });
  }, [stores, query]);

  // Group stores by first character (letter or 0-9)
  const byLetter = new Map<string, Store[]>();
  for (const store of filteredStores) {
    const key = getFirstChar(store.name ?? "");
    if (!byLetter.has(key)) byLetter.set(key, []);
    byLetter.get(key)!.push(store);
  }
  // Sort stores within each group by name
  byLetter.forEach((list) =>
    list.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""))
  );

  // Index items: only letters/0-9 that have stores; order: A–Z then 0-9
  const indexKeys = Array.from(byLetter.keys()).filter((k) => k !== "#");
  const indexLetters = indexKeys.filter((k) => k.length === 1).sort();
  const hasNumeric = indexKeys.includes(NUMERIC_LABEL);
  const indexItems = [...indexLetters, ...(hasNumeric ? [NUMERIC_LABEL] : [])];

  // Section order for display
  const sectionOrder = [...indexLetters, ...(hasNumeric ? [NUMERIC_LABEL] : [])];

  const scrollToSection = useCallback((key: string) => {
    setActiveIndex(key);
    const id = `section-${key === NUMERIC_LABEL ? "0-9" : key}`;
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-screen w-full min-w-0 max-w-[100vw] bg-white flex flex-col overflow-x-hidden box-border">
      {navigating && (
        <div
          className="fixed top-0 left-0 right-0 z-[100] h-1 bg-[#34C759] animate-pulse"
          aria-live="polite"
          aria-label="Loading page"
        />
      )}
      <Header />

      <main className="flex-1 w-full min-w-0 max-w-full overflow-x-hidden">
        {/* Breadcrumb + Title – white area */}
        <div className="bg-white border-b border-gray-200 w-full min-w-0">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 w-full min-w-0">
            <nav className="text-sm text-gray-500 mb-1" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-gray-700">
                {SITE_NAME}
              </Link>
              <span className="mx-1.5">›</span>
              <span className="text-gray-700 font-medium">ALL STORES</span>
            </nav>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight">
              {query ? `Stores matching "${searchParams.get("q") ?? ""}"` : "All Stores"}
            </h1>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#34C759] border-t-transparent" />
            <span className="ml-3 text-gray-600">Loading…</span>
          </div>
        ) : (
          <>
            {/* Alphabet index – white bar */}
            <div className="bg-white border-b border-gray-200 py-4 w-full min-w-0">
              <div className="mx-auto max-w-6xl px-4 sm:px-6 w-full min-w-0">
                <div
                  className="flex flex-wrap items-center gap-2 sm:gap-3"
                  role="tablist"
                  aria-label="Jump to stores by letter"
                >
                  {indexItems.map((key) => {
                    const isActive = activeIndex === key;
                    const display = key === NUMERIC_LABEL ? "0-9" : key;
                    return (
                      <button
                        key={key}
                        type="button"
                        role="tab"
                        aria-pressed={isActive}
                        aria-label={`Stores starting with ${display}`}
                        onClick={() => scrollToSection(key)}
                        className={`min-w-[2rem] rounded px-2.5 py-1.5 text-sm font-semibold transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#34C759] focus-visible:ring-offset-2 ${
                          isActive
                            ? "bg-[#34C759] text-white"
                            : "text-gray-700 hover:text-[#34C759]"
                        }`}
                      >
                        {display}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Main content – light gray background */}
            <div className="bg-[#f5f5f5] py-8 sm:py-10 w-full min-w-0">
              <div className="mx-auto max-w-6xl px-4 sm:px-6 w-full min-w-0">
                {sectionOrder.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">
                      {query
                        ? `No stores match "${searchParams.get("q") ?? ""}". Try a different search.`
                        : "No stores found."}
                    </p>
                    {query && (
                      <Link
                        href="/stores"
                        className="mt-3 inline-block text-[#34C759] font-medium hover:underline"
                      >
                        Show all stores
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-8">
                    {sectionOrder.map((letter) => {
                      const list = byLetter.get(letter) ?? [];
                      if (list.length === 0) return null;
                      const sectionId = `section-${letter === NUMERIC_LABEL ? "0-9" : letter}`;
                      const sectionLabel =
                        letter === NUMERIC_LABEL ? "0-9" : letter;

                      return (
                        <section
                          key={letter}
                          id={sectionId}
                          className="scroll-mt-4"
                        >
                          {/* Green section banner */}
                          <h2 className="bg-[#34C759] text-white text-lg font-semibold px-4 py-2.5 rounded-t-lg mb-0">
                            Stores – {sectionLabel}
                          </h2>
                          {/* White card grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4 bg-white rounded-b-lg shadow-sm border border-t-0 border-gray-200 min-w-0 w-full">
                            {list.map((store) => {
                              const slug = getSlug(store);
                              return (
                                <Link
                                  key={store.id}
                                  href={`/stores/${encodeURIComponent(slug)}`}
                                  prefetch={true}
                                  onMouseEnter={() => prefetchStore(slug)}
                                  onClick={handleStoreClick}
                                  className="flex flex-col items-center p-4 rounded-lg bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-[#34C759]/30 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#34C759] focus-visible:ring-offset-2"
                                >
                                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden mb-3 flex-shrink-0">
                                    {store.logoUrl ? (
                                      <img
                                        src={store.logoUrl}
                                        alt=""
                                        className="w-full h-full object-contain p-1"
                                      />
                                    ) : (
                                      <span className="text-2xl font-bold text-gray-400">
                                        {(store.name ?? "?").charAt(0)}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-center font-semibold text-gray-800 text-sm line-clamp-2">
                                    {store.name ?? "–"}
                                  </p>
                                  {store.description && (
                                    <p className="text-center text-gray-500 text-xs line-clamp-2 mt-0.5">
                                      {store.description}
                                    </p>
                                  )}
                                </Link>
                              );
                            })}
                          </div>
                        </section>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
