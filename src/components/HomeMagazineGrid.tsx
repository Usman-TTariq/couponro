"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  COUPONS_BLOG_POST_URL,
  DEFAULT_BLOG_POST_URL,
  DEALS_BLOG_POST_URL,
  FOOTER_TILE_BLOG_URLS,
  FOOTER_TILE_TITLES,
  FREE_SHIPPING_BLOG_POST_URL,
  STORES_BLOG_POST_URL,
} from "@/lib/blog-posts";
import {
  HOME_COUPONS_TILE,
  HOME_DEALS,
  HOME_FOOTER_TILES,
  HOME_FREE_SHIP,
  HOME_FULLWIDTH,
  HOME_GALLERY_SLIDES,
  HOME_HERO_IMGS,
  HOME_QUOTE,
  HOME_STORES_TILE,
  HOME_TRENDING,
} from "@/lib/home-masonry-assets";

/** Primary drawer links — rendered ALL CAPS like reference. */
const NAV_PRIMARY = [
  { href: "/coupons", label: "Coupons" },
  { href: "/stores", label: "Stores" },
  { href: "/freeshipping", label: "Free Shipping" },
  { href: "/blog", label: "Blogs" },
] as const;

const NAV_SECONDARY = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/categories", label: "Categories" },
] as const;

const DISPLAY_DATE = "Mar 4, 2026";
const DISPLAY_DATE_SIDEBAR = "MAR 4, 2026";

function MetaLine({ parts, className = "" }: { parts: string[]; className?: string }) {
  return (
    <p className={`text-[10px] sm:text-xs uppercase tracking-[0.2em] text-white/85 mt-3 transition-all duration-500 ease-out ${className}`}>
      {parts.join(" • ")}
    </p>
  );
}

function MagazineTile({
  href,
  img,
  title,
  metaParts,
  className = "",
  minH = "min-h-[260px] sm:min-h-[300px] md:min-h-[340px]",
}: {
  href: string;
  img: string;
  title: string;
  metaParts: string[];
  className?: string;
  minH?: string;
}) {
  return (
    <Link
      href={href}
      className={`group relative block overflow-hidden ${minH} ${className} focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/20" />
      <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-6 md:p-8">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight transition-all duration-500 ease-out group-hover:-translate-y-1 group-hover:tracking-[0.01em]">
          {title}
        </h2>
        <hr className="mt-3 w-12 border-t-2 border-white/70 transition-all duration-500 ease-out group-hover:w-20 group-hover:border-white" />
        <MetaLine parts={metaParts} className="group-hover:translate-y-0.5 group-hover:text-white" />
      </div>
    </Link>
  );
}

export default function HomeMagazineGrid() {
  const [navOpen, setNavOpen] = useState(false);
  const [slide, setSlide] = useState(0);
  const slides = HOME_GALLERY_SLIDES;

  useEffect(() => {
    if (navOpen) document.body.classList.add("overflow-hidden");
    else document.body.classList.remove("overflow-hidden");
    return () => document.body.classList.remove("overflow-hidden");
  }, [navOpen]);

  return (
    <div className="relative bg-zinc-950 pt-[56px] sm:pt-[60px] text-white">
      {/* Top bar — logo + menu */}
      <header
        id="header"
        className="fixed left-0 right-0 top-0 z-40 flex items-center justify-between gap-4 bg-zinc-950/45 px-4 py-2.5 backdrop-blur-xl sm:px-6 sm:py-3"
      >
        <Link href="/" className="flex-shrink-0" aria-label="Couponro home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/couponro%20logo%20svg.svg" alt="" className="h-9 w-auto sm:h-10" />
        </Link>
        <button
          type="button"
          className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded border border-white/20 bg-white/5 hover:bg-white/10"
          aria-expanded={navOpen}
          aria-label={navOpen ? "Close menu" : "Open menu"}
          onClick={() => setNavOpen((o) => !o)}
        >
          <span className="block h-0.5 w-5 bg-white" />
          <span className="block h-0.5 w-5 bg-white" />
          <span className="block h-0.5 w-5 bg-white" />
        </button>
      </header>

      {/* Full-screen sidebar — charcoal #111, gold accents, centered nav (reference layout) */}
      <div
        className={`fixed inset-0 z-50 flex items-stretch text-white transition-opacity duration-300 ${
          navOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        role="dialog"
        aria-label="Site menu"
        aria-modal="true"
      >
        <button
          type="button"
          className={`h-full flex-1 bg-black/55 transition-opacity duration-300 ${
            navOpen ? "opacity-100" : "opacity-0"
          }`}
          aria-label="Close menu"
          onClick={() => setNavOpen(false)}
        />
        <aside
          className={`h-full w-[min(44vw,420px)] min-w-[280px] max-w-[420px] overflow-y-auto overscroll-contain bg-[#111111] border-l border-white/10 transform transition-transform duration-300 ease-out ${
            navOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-start justify-between gap-4 px-5 pt-6 pb-2 sm:px-6">
            <form action="/coupons" method="get" className="min-w-0 flex-1 max-w-md" onSubmit={() => setNavOpen(false)}>
              <label htmlFor="sidebar-search" className="sr-only">
                Search store or brand
              </label>
              <div className="relative flex items-end border-b border-white pb-1">
                <input
                  id="sidebar-search"
                  name="q"
                  type="search"
                  placeholder="Search store or brand"
                  autoComplete="off"
                  className="w-full bg-transparent py-2 pr-10 text-sm text-white placeholder:text-white/55 focus:outline-none focus:placeholder:text-white/40"
                />
                <button
                  type="submit"
                  className="absolute right-0 bottom-1 p-1 text-white hover:text-[#FFD700]"
                  aria-label="Search"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </form>
            <button
              type="button"
              className="shrink-0 p-2 text-2xl font-light leading-none text-white hover:text-[#FFD700]"
              aria-label="Close menu"
              onClick={() => setNavOpen(false)}
            >
              ×
            </button>
          </div>

          <nav className="flex flex-1 flex-col items-center px-6 pb-12 pt-8 sm:px-8">
            <ul className="flex w-full max-w-sm flex-col items-center gap-1">
              {NAV_PRIMARY.map(({ href, label }) => (
                <li key={href} className="w-full text-center">
                  <Link
                    href={href}
                    className="block py-4 text-xl font-bold uppercase tracking-[0.12em] text-white hover:text-[#FFD700] transition-colors"
                    onClick={() => setNavOpen(false)}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>

            <ul className="mt-10 flex w-full max-w-sm flex-col items-center gap-1 border-t border-white/10 pt-10">
              {NAV_SECONDARY.map(({ href, label }) => (
                <li key={href} className="w-full text-center">
                  <Link
                    href={href}
                    className="block py-2.5 text-base font-bold text-white hover:text-[#FFD700] transition-colors"
                    onClick={() => setNavOpen(false)}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-12 w-full max-w-sm">
              <p className="text-center text-sm font-bold uppercase tracking-[0.25em] text-[#FFD700]">Popular posts</p>
              <Link
                href={DEFAULT_BLOG_POST_URL}
                onClick={() => setNavOpen(false)}
                className="mt-5 relative mx-auto block h-44 w-full max-w-sm overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111111]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={HOME_HERO_IMGS[2]} alt="" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-y-0 right-0 flex w-[55%] flex-col justify-end bg-black/75 p-4 text-left">
                  <span className="text-lg font-bold text-white">Featured</span>
                  <span className="mt-2 block h-px w-10 bg-white/90" />
                  <p className="mt-3 text-[9px] font-semibold uppercase leading-relaxed tracking-wider text-white/95">
                    By Couponro <span className="mx-1 text-white/50">×</span> {DISPLAY_DATE_SIDEBAR}{" "}
                    <span className="mx-1 text-white/50">×</span> Blog
                  </p>
                </div>
              </Link>
            </div>
          </nav>
        </aside>
      </div>

      {/* Row 1 — three heroes */}
      <div className="grid grid-cols-1 md:grid-cols-3">
        <MagazineTile
          href={DEFAULT_BLOG_POST_URL}
          img={HOME_HERO_IMGS[0]}
          title="Featured"
          metaParts={["By Couponro", DISPLAY_DATE, "Blog"]}
        />
        <MagazineTile
          href={DEFAULT_BLOG_POST_URL}
          img={HOME_HERO_IMGS[1]}
          title="Saving tips"
          metaParts={["By Couponro", DISPLAY_DATE, "Blog"]}
        />
        <MagazineTile
          href={COUPONS_BLOG_POST_URL}
          img={HOME_HERO_IMGS[2]}
          title="Coupon codes"
          metaParts={["By Couponro", DISPLAY_DATE, "Coupons"]}
        />
      </div>

      {/* Row 2 — gallery + trending */}
      <div className="grid grid-cols-1 lg:grid-cols-2">
        <div className="relative min-h-[280px] sm:min-h-[360px] lg:min-h-[420px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slides[slide] ?? slides[0]}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-8">
            <Link href={DEFAULT_BLOG_POST_URL} className="group/t max-w-lg">
              <h2 className="text-2xl sm:text-3xl font-bold text-white transition-all duration-500 ease-out group-hover/t:-translate-y-1 group-hover/t:tracking-[0.01em]">
                Editor&apos;s pick
              </h2>
              <hr className="mt-3 w-12 border-t-2 border-white/70 transition-all duration-500 ease-out group-hover/t:w-20 group-hover/t:border-white" />
              <MetaLine parts={["By Couponro", DISPLAY_DATE, "Blog"]} className="group-hover/t:translate-y-0.5 group-hover/t:text-white" />
            </Link>
            <div className="mt-6 flex items-center gap-2">
              <button
                type="button"
                className="rounded-full border border-white/40 bg-black/40 p-2 hover:bg-black/60"
                aria-label="Previous slide"
                onClick={() => setSlide((i) => (i - 1 + slides.length) % slides.length)}
              >
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                className="rounded-full border border-white/40 bg-black/40 p-2 hover:bg-black/60"
                aria-label="Next slide"
                onClick={() => setSlide((i) => (i + 1) % slides.length)}
              >
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <MagazineTile href="/stores" img={HOME_TRENDING} title="Trending" metaParts={["By Couponro", DISPLAY_DATE, "Stores"]} />
      </div>

      {/* Row 3 — quote + stores + coupons */}
      <div className="grid grid-cols-1 md:grid-cols-3">
        <Link
          href={DEFAULT_BLOG_POST_URL}
          className="group relative flex min-h-[280px] flex-col justify-end overflow-hidden bg-zinc-900 p-6 sm:p-8 md:min-h-[320px] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={HOME_QUOTE} alt="" className="absolute inset-0 h-full w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute inset-0 bg-black/55" />
          <div className="relative">
            <span className="text-5xl font-serif leading-none text-white/40" aria-hidden>
              &ldquo;
            </span>
            <p className="mt-2 text-lg font-semibold text-white sm:text-xl transition-all duration-500 ease-out group-hover:-translate-y-1">
              Saving tips &amp; deals
            </p>
            <p className="mt-2 text-sm text-white/80">— Couponro</p>
            <hr className="mt-4 w-12 border-t-2 border-white/70 transition-all duration-500 ease-out group-hover:w-20 group-hover:border-white" />
            <MetaLine parts={["By Couponro", DISPLAY_DATE, "Quote"]} className="group-hover:translate-y-0.5 group-hover:text-white" />
          </div>
        </Link>
        <MagazineTile href={STORES_BLOG_POST_URL} img={HOME_STORES_TILE} title="Stores" metaParts={["By Couponro", DISPLAY_DATE, "Store Guides"]} />
        <MagazineTile href="/coupons" img={HOME_COUPONS_TILE} title="Coupons" metaParts={["By Couponro", DISPLAY_DATE, "Deals"]} />
      </div>

      {/* Row 4 — full width Blog */}
      <Link
        href="/blog"
        className="relative flex min-h-[min(55vh,480px)] items-center justify-center overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-400"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={HOME_FULLWIDTH} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/50" />
        <span className="relative text-4xl font-bold tracking-tight text-white transition-all duration-500 ease-out group-hover:-translate-y-1 group-hover:tracking-[0.01em] sm:text-5xl md:text-6xl">
          Blog
        </span>
      </Link>

      {/* Row 5 — free shipping + deals */}
      <div className="grid grid-cols-1 md:grid-cols-2">
        <MagazineTile
          href={FREE_SHIPPING_BLOG_POST_URL}
          img={HOME_FREE_SHIP}
          title="Free Shipping"
          metaParts={["By Couponro", DISPLAY_DATE, "Free Shipping"]}
          minH="min-h-[260px] md:min-h-[360px]"
        />
        <MagazineTile
          href={DEALS_BLOG_POST_URL}
          img={HOME_DEALS}
          title="Deals"
          metaParts={["By Couponro", DISPLAY_DATE, "Deals"]}
          minH="min-h-[260px] md:min-h-[360px]"
        />
      </div>

      {/* Magazine footer — light text only (globals main p/h2 skip .home-magazine-main) */}
      <footer className="magazine-footer border-t border-white/10 bg-zinc-900">
        <div
          className="relative overflow-hidden bg-cover bg-center py-12 sm:py-16"
          style={{ backgroundImage: "url(/img32.jpg)" }}
        >
          <div className="absolute inset-0 bg-black/75" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-white">
            <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
              <div className="lg:col-span-4">
                <Link href="/" className="inline-block" aria-label="Couponro home">
                  {/* Same treatment as sticky header — white mono mark on dark */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/couponro%20logo%20svg.svg"
                    alt=""
                    className="h-9 w-auto sm:h-10"
                  />
                </Link>
                <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/90">
                  Couponro rounds up coupon codes and shopping tips so you can save on the brands you love.
                </p>
                <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-white">Follow</p>
                <div className="mt-3 flex gap-3">
                  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-white/80" aria-label="Facebook">
                    <span className="sr-only">Facebook</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                    </svg>
                  </a>
                  <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-white/80" aria-label="X">
                    <span className="sr-only">X</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>
                </div>
              </div>
              <div className="grid gap-8 sm:grid-cols-2 lg:col-span-5">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white">Categories</h3>
                  <ul className="mt-4 space-y-2 text-sm text-white/90">
                    <li><Link href="/coupons" className="text-white/90 hover:text-white">Coupons</Link></li>
                    <li><Link href="/stores" className="text-white/90 hover:text-white">Stores</Link></li>
                    <li><Link href="/freeshipping" className="text-white/90 hover:text-white">Free Shipping</Link></li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white">Tags</h3>
                  <ul className="mt-4 space-y-2 text-sm text-white/90">
                    <li><Link href={DEALS_BLOG_POST_URL} className="text-white/90 hover:text-white">Deals</Link></li>
                    <li><Link href={DEFAULT_BLOG_POST_URL} className="text-white/90 hover:text-white">Saving tips</Link></li>
                  </ul>
                </div>
              </div>
              <div className="lg:col-span-3">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white">Gallery</h3>
                <ul className="mt-4 grid grid-cols-3 gap-2">
                  {HOME_FOOTER_TILES.map((src, i) => (
                    <li key={src}>
                      <Link
                        href={FOOTER_TILE_BLOG_URLS[i] ?? "/blog"}
                        className="group relative block aspect-square overflow-hidden bg-zinc-800"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        <span className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded bg-black/55 text-white" aria-hidden>
                          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                          </svg>
                        </span>
                        <span className="sr-only">{FOOTER_TILE_TITLES[i] ?? "Post"}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-8 text-xs text-white/90 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-white/90" suppressHydrationWarning>
                © {new Date().getFullYear()} Couponro. All rights reserved.
              </p>
              <nav className="flex flex-wrap gap-x-3 gap-y-1 uppercase tracking-wider text-white/90">
                <Link href="/" className="hover:text-white">Home</Link>
                <span aria-hidden>|</span>
                <Link href="/coupons" className="hover:text-white">Coupons</Link>
                <span aria-hidden>|</span>
                <Link href="/stores" className="hover:text-white">Stores</Link>
                <span aria-hidden>|</span>
                <Link href="/blog" className="hover:text-white">Blog</Link>
              </nav>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
