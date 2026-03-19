"use client";

import Link from "next/link";

const PLACEHOLDER_POST = {
  title: "How to Save More with Coupon Codes",
  excerpt: "Tips and tricks to stack discounts and get the best deals. Coming soon.",
  category: "Saving Tips",
  date: "Mar 4, 2026",
  slug: "#",
  image: null,
};

const SIDEBAR_CATEGORIES = [
  "Saving Tips",
  "Deals Roundup",
  "Store Guides",
  "Free Shipping",
  "How to Use Coupons",
];

function CardPlaceholder({
  title,
  excerpt,
  category,
  size = "default",
}: {
  title: string;
  excerpt: string;
  category: string;
  size?: "featured" | "default" | "small";
}) {
  const isFeatured = size === "featured";
  const isSmall = size === "small";
  return (
    <article className="group rounded-2xl border border-white bg-white shadow-sm hover:shadow-md hover:border-soft-cyan/30 transition-all overflow-hidden">
      <div
        className={`bg-gradient-to-br from-rebecca/10 to-soft-cyan/10 ${isFeatured ? "aspect-[2/1] sm:aspect-[21/9]" : isSmall ? "aspect-video" : "aspect-[4/3]"}`}
      />
      <div className={isFeatured ? "p-6 sm:p-8" : isSmall ? "p-3" : "p-4"}>
        <span className="text-xs font-medium text-lobster uppercase tracking-wide">{category}</span>
        <h3
          className={`font-bold text-space mt-1 group-hover:text-rebecca transition-colors line-clamp-2 ${isFeatured ? "text-xl sm:text-2xl" : isSmall ? "text-sm" : "text-lg"}`}
        >
          {title}
        </h3>
        {!isSmall && (
          <p className="mt-1 text-rebecca/90 text-sm line-clamp-2">{excerpt}</p>
        )}
        <Link
          href="#"
          className={`inline-block font-semibold text-lobster hover:underline mt-2 ${isSmall ? "text-xs" : "text-sm"}`}
        >
          Read more
        </Link>
      </div>
    </article>
  );
}

export default function HomeBlogLayout() {
  return (
    <main className="flex-1 min-h-[50vh] bg-almond">
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 py-6 sm:py-10">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          {/* Left sidebar: categories / section nav (visible on xl) */}
          <aside className="hidden xl:block flex-shrink-0 w-56 order-3 lg:order-1">
            <div className="sticky top-24 space-y-6">
              <div className="rounded-2xl border border-white bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-space uppercase tracking-wider mb-3">
                  Sections
                </h3>
                <nav className="space-y-1">
                  {SIDEBAR_CATEGORIES.map((cat) => (
                    <Link
                      key={cat}
                      href={`/blog?cat=${cat.toLowerCase().replace(/\s+/g, "-")}`}
                      className="block py-2 text-sm text-rebecca hover:text-lobster font-medium transition-colors"
                    >
                      {cat}
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0 order-1 lg:order-2 space-y-10 sm:space-y-14">
            {/* Hero */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rebecca to-space text-white px-6 sm:px-10 py-12 sm:py-16">
              <div className="absolute inset-0 opacity-80" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)", backgroundSize: "24px 24px" }} aria-hidden />
              <div className="relative z-10 max-w-2xl">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                  Couponro Blog
                </h1>
                <p className="mt-4 text-lg text-white/90">
                  Saving tips, deal roundups, and guides to help you shop smarter. Layout ready - content coming soon.
                </p>
                <Link
                  href="/blog"
                  className="mt-6 inline-block rounded-xl bg-lobster px-6 py-3 font-semibold text-white hover:opacity-90 transition-opacity"
                >
                  Browse all posts
                </Link>
              </div>
            </section>

            {/* Featured post */}
            <section>
              <h2 className="text-sm font-bold text-space uppercase tracking-wider mb-4">
                Featured
              </h2>
              <Link href="#" className="block">
                <CardPlaceholder
                  title={PLACEHOLDER_POST.title}
                  excerpt={PLACEHOLDER_POST.excerpt}
                  category={PLACEHOLDER_POST.category}
                  size="featured"
                />
              </Link>
            </section>

            {/* Cross-sectional: Saving Tips */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-space">Saving Tips</h2>
                <Link href="/blog?cat=saving-tips" className="text-sm font-semibold text-lobster hover:underline">
                  View all
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[1, 2, 3].map((i) => (
                  <CardPlaceholder
                    key={i}
                    title={`Saving tip article ${i}`}
                    excerpt="Short description placeholder. Content will go here."
                    category="Saving Tips"
                  />
                ))}
              </div>
            </section>

            {/* Cross-sectional: Deals & Guides */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-space">Deals & Guides</h2>
                <Link href="/blog?cat=deals" className="text-sm font-semibold text-lobster hover:underline">
                  View all
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[1, 2, 3].map((i) => (
                  <CardPlaceholder
                    key={i}
                    title={`Deals roundup or guide ${i}`}
                    excerpt="Deal highlights and store guides. Coming soon."
                    category="Deals"
                  />
                ))}
              </div>
            </section>

            {/* Cross-sectional: How-to (horizontal row of smaller cards) */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-space">How to Use Coupons</h2>
                <Link href="/blog?cat=how-to" className="text-sm font-semibold text-lobster hover:underline">
                  View all
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <CardPlaceholder
                    key={i}
                    title={`How-to post ${i}`}
                    excerpt="Quick guide."
                    category="How-to"
                    size="small"
                  />
                ))}
              </div>
            </section>
          </div>

          {/* Right sidebar */}
          <aside className="flex-shrink-0 w-full lg:w-72 xl:w-80 order-2 lg:order-3 space-y-6">
            <div className="lg:sticky lg:top-24 space-y-6">
              {/* Search */}
              <div className="rounded-2xl border border-white bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-space uppercase tracking-wider mb-3">
                  Search
                </h3>
                <form action="/blog" method="GET" className="flex gap-0">
                  <input
                    type="search"
                    name="q"
                    placeholder="Search blog..."
                    className="flex-1 min-w-0 rounded-l-lg border-2 border-stone-200 bg-stone-50 px-3 py-2 text-sm text-space placeholder:text-stone-400 focus:border-rebecca focus:outline-none focus:ring-2 focus:ring-rebecca/20"
                  />
                  <button
                    type="submit"
                    className="rounded-r-lg bg-rebecca px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                  >
                    Go
                  </button>
                </form>
              </div>

              {/* Categories */}
              <div className="rounded-2xl border border-white bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-space uppercase tracking-wider mb-3">
                  Categories
                </h3>
                <ul className="space-y-2">
                  {SIDEBAR_CATEGORIES.map((cat) => (
                    <li key={cat}>
                      <Link
                        href={`/blog?cat=${cat.toLowerCase().replace(/\s+/g, "-")}`}
                        className="text-sm text-rebecca hover:text-lobster font-medium transition-colors"
                      >
                        {cat}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Newsletter */}
              <div className="rounded-2xl border-2 border-rebecca/20 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-space uppercase tracking-wider mb-2">
                  Newsletter
                </h3>
                <p className="text-sm text-rebecca mb-3">
                  Get saving tips and best deals in your inbox. Coming soon.
                </p>
                <form className="space-y-2">
                  <input
                    type="email"
                    placeholder="Your email"
                    disabled
                    className="w-full rounded-lg border-2 border-stone-200 bg-stone-50 px-3 py-2 text-sm placeholder:text-stone-400 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    disabled
                    className="w-full rounded-lg bg-lobster/80 px-4 py-2 text-sm font-semibold text-white cursor-not-allowed"
                  >
                    Subscribe
                  </button>
                </form>
              </div>

              {/* Popular posts (placeholder) */}
              <div className="rounded-2xl border border-white bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-space uppercase tracking-wider mb-3">
                  Popular
                </h3>
                <ul className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <li key={i}>
                      <Link
                        href="#"
                        className="text-sm font-medium text-space hover:text-lobster transition-colors line-clamp-2"
                      >
                        Popular post title {i}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* About */}
              <div className="rounded-2xl border border-white bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-space uppercase tracking-wider mb-2">
                  About
                </h3>
                <p className="text-sm text-rebecca">
                  Couponro blog brings you the latest saving tips, deal roundups, and store guides. More content soon.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
