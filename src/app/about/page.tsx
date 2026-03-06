"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function AboutPage() {
  const [stats, setStats] = useState<{ stores: number; coupons: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/stores", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/coupons?page=1&limit=1&status=all", { cache: "no-store" }).then((r) => r.json()),
    ])
      .then(([stores, data]) => {
        if (cancelled) return;
        const storeCount = Array.isArray(stores) ? stores.filter((s: { status?: string }) => (s.status ?? "enable") !== "disable").length : 0;
        const total = typeof data?.total === "number" ? data.total : 0;
        setStats({ stores: storeCount, coupons: total });
      })
      .catch(() => {
        if (!cancelled) setStats({ stores: 0, coupons: 0 });
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-[#f0f5fa] flex flex-col">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 py-8">
        {/* Breadcrumbs */}
        <nav className="text-sm text-slate-600 mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-rebecca">Couponro</Link>
          <span className="mx-2">›</span>
          <span className="text-space font-medium">About Us</span>
        </nav>

        {/* Hero – About Couponro */}
        <section className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="p-6 sm:p-8 lg:p-10 flex flex-col lg:flex-row gap-8 items-center">
            <div className="flex-1">
              <p className="text-rebecca font-semibold text-sm uppercase tracking-wide mb-2">About Couponro</p>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
                Your place for coupon codes and deals
              </h1>
              <p className="text-slate-600 leading-relaxed mb-6">
                Couponro helps you find the best coupon codes, promo codes, and free shipping offers from top stores.
                Browse by category, discover seasonal deals, and use verified offers with confidence. We update our
                list regularly so you can save more every time you shop.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/coupons"
                  className="inline-flex items-center justify-center rounded-xl bg-space text-white font-semibold px-5 py-3 hover:bg-slate-800 transition-colors"
                >
                  View All Deals
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-xl border-2 border-slate-800 text-slate-800 font-semibold px-5 py-3 hover:bg-slate-100 transition-colors"
                >
                  Contact Us
                </Link>
              </div>
            </div>
            <div className="flex-shrink-0 w-full lg:w-80">
              <div className="aspect-square max-w-sm mx-auto rounded-2xl bg-almond flex items-center justify-center overflow-hidden">
                <span className="text-6xl opacity-50" aria-hidden>🛒</span>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
          {[
            { value: stats?.stores ?? "–", label: "Stores", sub: "Brands with deals and coupon codes" },
            { value: stats?.coupons ?? "–", label: "Coupons & Deals", sub: "Verified offers you can use" },
            { value: "–", label: "Blog", sub: "Tips and savings articles" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6 text-center"
            >
              <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">{item.label}</p>
              <p className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">{item.value}</p>
              <p className="text-sm text-slate-600">{item.sub}</p>
            </div>
          ))}
        </section>

        {/* Why use Couponro */}
        <section className="mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6">Why use Couponro</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "Verified Deals",
                text: "We focus on quality over quantity. Our team works to bring you working coupon codes and deals you can use with confidence.",
              },
              {
                title: "Wide Range of Stores",
                text: "From fashion and tech to home and travel, browse deals by category or discover your favorite brands in one place.",
              },
              {
                title: "Always Updated",
                text: "We update our offers and expiry dates regularly so you get the latest coupon codes and promotions when you need them.",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6"
              >
                <h3 className="text-lg font-bold text-slate-900 mb-3">{card.title}</h3>
                <p className="text-slate-600 leading-relaxed text-sm">{card.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Latest from blog */}
        <section className="mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6">Latest from our blog</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { category: "Savings", title: "How to stack coupons and save more", href: "/blog" },
              { category: "Deals", title: "Best time to use promo codes", href: "/blog" },
              { category: "Tips", title: "Shopping smart with discount codes", href: "/blog" },
            ].map((post) => (
              <Link
                key={post.title}
                href={post.href}
                className="block rounded-2xl bg-white shadow-sm border border-slate-200 p-5 hover:border-rebecca/40 hover:shadow-md transition-all"
              >
                <p className="text-slate-500 text-xs uppercase tracking-wide mb-2">{post.category}</p>
                <h3 className="font-bold text-slate-900 mb-2">{post.title}</h3>
                <span className="text-rebecca font-medium text-sm">Read more →</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Get In Touch CTA */}
        <section className="rounded-2xl bg-space text-white p-6 sm:p-8 lg:p-10">
          <p className="text-soft-cyan font-semibold text-sm uppercase tracking-wide mb-2">Get in touch</p>
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Have a deal to share or a question?</h2>
          <p className="text-white/90 mb-6 max-w-xl">
            Use the form to contact us or submit a coupon so we can help more people save.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-xl border-2 border-white text-white font-semibold px-5 py-3 hover:bg-white/10 transition-colors"
            >
              Contact Us
            </Link>
            <Link
              href="/contact?share=1"
              className="inline-flex items-center justify-center rounded-xl bg-lobster text-white font-semibold px-5 py-3 hover:bg-lobster/90 transition-colors"
            >
              Share a Coupon
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
