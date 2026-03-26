"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import HeaderPromoStrip from "./HeaderPromoStrip";

const navLinks = [
  { href: "/coupons", label: "Coupons" },
  { href: "/stores", label: "Stores" },
  { href: "/freeshipping", label: "Free Shipping" },
  { href: "/blog", label: "Blogs" },
  { href: "/contact", label: "Contact Us" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (menuOpen) document.body.classList.add("overflow-hidden");
    else document.body.classList.remove("overflow-hidden");
    return () => document.body.classList.remove("overflow-hidden");
  }, [menuOpen]);

  /* Close mobile menu when navigating to another page so content doesn’t stay behind menu */
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header className="bg-rebecca text-white">
      <HeaderPromoStrip />
      <div className="mx-auto max-w-screen-2xl px-3 sm:px-6 lg:px-8 py-2 sm:py-0 sm:h-16 flex items-center justify-between md:justify-start border-t border-white/10 gap-2 md:gap-4">
        <Link href="/" className="flex items-center h-12 sm:h-16 py-1 flex-shrink-0" aria-label="Couponro Home">
          <img
            src="/couponro-logo.svg"
            alt="Couponro"
            className="h-10 sm:h-full sm:max-h-16 w-auto object-contain object-left max-w-[180px] sm:max-w-none"
          />
        </Link>

        {/* Desktop/tablet: nav links – always visible from md up */}
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
        {/* Desktop/tablet: search bar – always visible from md up */}
        <div className="hidden md:flex flex-1 items-center justify-end min-w-0 max-w-[280px] shrink-0">
          <form action="/coupons" method="GET" className="flex w-full max-w-[260px]">
            <input
              type="search"
              name="q"
              placeholder="Search store or brand"
              className="flex-1 min-w-0 rounded-l-lg border border-white/40 bg-white/15 px-4 py-2.5 text-sm text-white placeholder:text-white/80 focus:bg-white/20 focus:border-soft-cyan focus:outline-none focus:ring-2 focus:ring-soft-cyan/50"
            />
            <button
              type="submit"
              aria-label="Search"
              className="rounded-r-lg bg-lobster px-3 py-2.5 text-white hover:opacity-90 flex-shrink-0"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>
        </div>

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
            <form action="/" method="GET" className="flex" onSubmit={() => setMenuOpen(false)}>
              <input
                type="search"
                name="q"
                placeholder="Search store or brand"
                className="flex-1 min-w-0 rounded-l-lg border border-white/40 bg-white/15 px-4 py-3 text-sm text-white placeholder:text-white/70 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-soft-cyan/50"
              />
              <button
                type="submit"
                aria-label="Search"
                className="rounded-r-lg bg-lobster px-4 py-3 text-white hover:opacity-90 flex-shrink-0"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}
