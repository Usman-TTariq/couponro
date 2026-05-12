"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { Store } from "@/types/store";

const navLinks = [
  { href: "/coupons", label: "Coupons" },
  { href: "/stores", label: "Stores" },
  { href: "/freeshipping", label: "Free Shipping" },
  { href: "/blog", label: "Blogs" },
  { href: "/contact", label: "Contact Us" },
];

function getSlug(store: Store): string {
  return (
    store.slug ||
    store.name?.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") ||
    store.id ||
    "store"
  );
}

const MAX_RESULTS = 8;

function SearchBox({
  id,
  inputClass,
  buttonClass,
  wrapClass,
  onNavigate,
}: {
  id: string;
  inputClass: string;
  buttonClass: string;
  wrapClass: string;
  onNavigate?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [stores, setStores] = useState<Store[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const fetchStores = useCallback(() => {
    if (loaded) return;
    fetch("/api/stores", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setStores(data.filter((s: Store) => s.status !== "disable"));
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [loaded]);

  const q = query.trim().toLowerCase();
  const results = q
    ? stores
        .filter((s) => (s.name ?? "").toLowerCase().startsWith(q))
        .slice(0, MAX_RESULTS)
    : [];

  const showDropdown = open && q.length > 0 && loaded;

  useEffect(() => {
    setActiveIdx(-1);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navigateTo = useCallback(
    (slug: string) => {
      setQuery("");
      setOpen(false);
      onNavigate?.();
      router.push(`/stores/${encodeURIComponent(slug)}`);
    },
    [router, onNavigate]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      navigateTo(getSlug(results[activeIdx]));
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (activeIdx >= 0 && results[activeIdx]) {
      e.preventDefault();
      navigateTo(getSlug(results[activeIdx]));
    }
  };

  return (
    <div ref={wrapRef} className={`relative ${wrapClass}`}>
      <form
        action="/coupons"
        method="GET"
        className="flex w-full"
        onSubmit={handleSubmit}
      >
        <input
          ref={inputRef}
          id={id}
          type="search"
          name="q"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            fetchStores();
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search store or brand"
          autoComplete="off"
          className={inputClass}
          role="combobox"
          aria-expanded={showDropdown && results.length > 0}
          aria-controls={`${id}-list`}
          aria-activedescendant={activeIdx >= 0 ? `${id}-opt-${activeIdx}` : undefined}
        />
        <button
          type="submit"
          aria-label="Search"
          className={buttonClass}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </form>

      {showDropdown && (
        <ul
          id={`${id}-list`}
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[360px] overflow-y-auto rounded-lg border border-white/20 bg-white shadow-xl"
        >
          {results.length === 0 ? (
            <li className="px-4 py-3 text-sm text-slate-500">
              No stores found
            </li>
          ) : (
            results.map((store, i) => {
              const slug = getSlug(store);
              return (
                <li
                  key={store.id}
                  id={`${id}-opt-${i}`}
                  role="option"
                  aria-selected={activeIdx === i}
                  className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                    activeIdx === i
                      ? "bg-rebecca/10"
                      : "hover:bg-slate-50"
                  }`}
                  onMouseEnter={() => setActiveIdx(i)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    navigateTo(slug);
                  }}
                >
                  <div className="w-8 h-8 rounded-md bg-almond flex items-center justify-center overflow-hidden flex-shrink-0">
                    {store.logoUrl ? (
                      <img
                        src={store.logoUrl}
                        alt=""
                        className="w-full h-full object-contain p-0.5"
                      />
                    ) : (
                      <span className="text-xs font-bold text-rebecca">
                        {store.name?.charAt(0) ?? "?"}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-space truncate">
                    {store.name ?? "–"}
                  </span>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (menuOpen) document.body.classList.add("overflow-hidden");
    else document.body.classList.remove("overflow-hidden");
    return () => document.body.classList.remove("overflow-hidden");
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header className="bg-rebecca text-white">
      <div className="mx-auto max-w-screen-2xl px-3 sm:px-6 lg:px-8 py-2 sm:py-0 sm:h-16 flex items-center justify-between md:justify-start gap-2 md:gap-4">
        <Link href="/" className="flex items-center h-12 sm:h-16 py-1 flex-shrink-0" aria-label="Couponro Home">
          <img
            src="/couponro-logo.svg"
            alt="Couponro"
            className="h-10 sm:h-full sm:max-h-16 w-auto object-contain object-left max-w-[180px] sm:max-w-none"
          />
        </Link>

        {/* Desktop/tablet: nav links */}
        <nav className="hidden md:flex flex-1 items-center justify-center gap-6 lg:gap-8 xl:gap-10 min-w-0 shrink">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="relative text-sm font-medium text-white/90 hover:text-white py-2 px-1 transition-all duration-200 after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-0.5 after:w-0 after:bg-soft-cyan after:transition-all after:duration-200 hover:after:w-full whitespace-nowrap"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Desktop/tablet: search bar with live store dropdown */}
        <SearchBox
          id="desktop-search"
          wrapClass="hidden md:block flex-1 max-w-[280px] shrink-0"
          inputClass="w-full rounded-l-lg border border-white/40 bg-white/15 px-4 py-2.5 text-sm text-white placeholder:text-white/80 focus:bg-white/20 focus:border-soft-cyan focus:outline-none focus:ring-2 focus:ring-soft-cyan/50"
          buttonClass="rounded-r-lg bg-lobster px-3 py-2.5 text-white hover:opacity-90 flex-shrink-0"
        />

        {/* Mobile only: hamburger */}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          className="md:hidden flex-shrink-0 p-2 rounded-lg text-white hover:bg-white/10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          aria-hidden="true"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-[280px] bg-rebecca shadow-xl transform transition-transform duration-300 ease-out md:hidden ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-modal="true"
        aria-label="Menu"
      >
        <div className="flex flex-col h-full pt-6 pb-8 px-5">
          <div className="flex items-center justify-between mb-8">
            <span className="text-white font-semibold">Menu</span>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              className="p-2 rounded-lg text-white hover:bg-white/10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="flex flex-col gap-1">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="text-white font-medium py-3 px-3 rounded-lg hover:bg-white/10 hover:text-soft-cyan transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="mt-6 pt-6 border-t border-white/20">
            <SearchBox
              id="mobile-search"
              wrapClass=""
              inputClass="flex-1 min-w-0 rounded-l-lg border border-white/40 bg-white/15 px-4 py-3 text-sm text-white placeholder:text-white/70 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-soft-cyan/50"
              buttonClass="rounded-r-lg bg-lobster px-4 py-3 text-white hover:opacity-90 flex-shrink-0"
              onNavigate={() => setMenuOpen(false)}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
