"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import HeaderPromoStrip from "./HeaderPromoStrip";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/stores", label: "All Stores" },
  { href: "/coupons", label: "Coupons" },
  { href: "/deals", label: "Deals" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (menuOpen) document.body.classList.add("overflow-hidden");
    else document.body.classList.remove("overflow-hidden");
    return () => document.body.classList.remove("overflow-hidden");
  }, [menuOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header id="site-header" className="sticky top-0 z-30 bg-white border-b border-gray-200/80 shadow-sm">
      <HeaderPromoStrip />
      <div
        className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 transition-shadow duration-200 ${
          scrolled ? "shadow-sm" : ""
        }`}
      >
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center flex-shrink-0 gap-2"
            aria-label="SeemPromo Home"
          >
            <img
              src="/seempromo-logo.svg"
              alt="SeemPromo"
              className="h-11 sm:h-12 w-auto object-contain max-w-[200px] sm:max-w-[240px]"
            />
          </Link>

          {/* Desktop nav */}
          <nav
            className="hidden lg:flex flex-1 items-center justify-center gap-1 min-w-0"
            aria-label="Main navigation"
          >
            {navLinks.map(({ href, label }) => {
              const isActive =
                pathname === href ||
                (href !== "/" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? "text-[#34C759] bg-[#34C759]/10"
                      : "text-gray-600 hover:text-[#34C759] hover:bg-gray-50"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop search */}
          <div className="hidden md:flex flex-1 items-center justify-end min-w-0 max-w-xs">
            <form
              action="/stores"
              method="GET"
              className="w-full max-w-[220px] flex rounded-full border border-gray-200 bg-gray-50 focus-within:bg-white focus-within:border-[#34C759] focus-within:ring-2 focus-within:ring-[#34C759]/20 transition-all"
            >
              <input
                type="search"
                name="q"
                placeholder="Search stores..."
                className="flex-1 min-w-0 rounded-l-full bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Search"
                className="rounded-r-full bg-[#34C759] px-4 py-2.5 text-white hover:bg-[#2db34d] transition-colors flex-shrink-0"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </form>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="lg:hidden p-2.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          aria-hidden="true"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-[300px] bg-white shadow-2xl transform transition-transform duration-300 ease-out lg:hidden ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-modal="true"
        aria-label="Menu"
      >
        <div className="flex flex-col h-full pt-6 pb-8 px-5">
          <div className="flex items-center justify-between mb-6">
            <span className="text-gray-800 font-semibold">Menu</span>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              className="p-2.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <nav className="flex flex-col gap-0.5">
            {navLinks.map(({ href, label }) => {
              const isActive =
                pathname === href ||
                (href !== "/" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={`py-3 px-4 rounded-lg font-medium transition-colors ${
                    isActive
                      ? "text-[#34C759] bg-[#34C759]/10"
                      : "text-gray-700 hover:bg-gray-50 hover:text-[#34C759]"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-6 pt-6 border-t border-gray-200">
            <form action="/stores" method="GET" className="flex gap-0">
              <input
                type="search"
                name="q"
                placeholder="Search stores..."
                className="flex-1 min-w-0 rounded-l-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#34C759]/30 focus:border-[#34C759]"
              />
              <button
                type="submit"
                aria-label="Search"
                className="rounded-r-lg bg-[#34C759] px-4 py-3 text-white hover:bg-[#2db34d] transition-colors flex-shrink-0"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}
