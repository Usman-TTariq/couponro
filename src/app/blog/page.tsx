import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getPosts, BLOG_CATEGORIES } from "@/lib/blog-posts";

export const metadata = {
  title: "Blog – Saving Tips & Guides",
  description:
    "Read Couponro's blog for saving tips, shopping guides, and the latest deals. Learn how to save more with coupons and promo codes.",
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function BlogPage() {
  const posts = getPosts();
  const featured = posts[0];
  const byCategory = BLOG_CATEGORIES.map((cat) => ({
    category: cat,
    posts: posts.filter((p) => p.category === cat && p.slug !== featured?.slug),
  })).filter((g) => g.posts.length > 0);

  return (
    <div className="min-h-screen bg-almond flex flex-col">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 py-8">
        <h1 className="text-3xl md:text-4xl font-bold text-space mb-2 tracking-tight">
          Couponro Blog
        </h1>
        <p className="text-rebecca/90 mb-8">
          Saving tips, store guides, and the latest deals.
        </p>

        {/* Featured post */}
        {featured && (
          <section className="mb-10">
            <h2 className="text-sm font-semibold text-space uppercase tracking-wider mb-4">
              Featured
            </h2>
            <Link
              href={`/blog/${featured.slug}`}
              className="block rounded-2xl border-2 border-rebecca/15 bg-white shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="aspect-[1200/420] sm:aspect-[3/1] w-full bg-rebecca/10">
                {featured.featuredImage ? (
                  <img
                    src={featured.featuredImage}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="eager"
                    decoding="async"
                  />
                ) : (
                  <div
                    className="w-full h-full"
                    style={{
                      background: "linear-gradient(135deg, #593C8F 0%, #171738 100%)",
                    }}
                  />
                )}
              </div>
              <div className="p-5 sm:p-6">
                <h3 className="text-xl sm:text-2xl font-bold text-space mb-2 line-clamp-2">
                  {featured.title}
                </h3>
                <p className="text-rebecca text-sm mb-3">
                  by <Link href="/" className="hover:underline">Couponro</Link>
                  {" · "}
                  <time dateTime={featured.date}>{formatDate(featured.date)}</time>
                  {" · "}
                  <span>{featured.category}</span>
                </p>
                <p className="text-space/90 text-sm sm:text-base line-clamp-2">
                  {featured.excerpt}
                </p>
              </div>
            </Link>
          </section>
        )}

        {/* Category sections */}
        {byCategory.map(({ category, posts: categoryPosts }) => (
          <section key={category} className="mb-10">
            <h2 className="text-lg font-bold text-space uppercase tracking-wide mb-4">
              {category}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryPosts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="block rounded-xl border-2 border-rebecca/15 bg-white shadow-sm overflow-hidden hover:shadow-md hover:border-rebecca/30 transition-all"
                >
                  <div className="aspect-[4/3] w-full bg-rebecca/10">
                    {post.featuredImage ? (
                      <img
                        src={post.featuredImage}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div
                        className="w-full h-full bg-rebecca/20"
                        style={{ background: "var(--color-rebecca, #593C8F)", opacity: 0.2 }}
                      />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-space text-base line-clamp-2 mb-2">
                      {post.title}
                    </h3>
                    <p className="text-rebecca text-xs">
                      by <Link href="/" className="hover:underline">Couponro</Link>
                      {" · "}
                      <time dateTime={post.date}>{formatDate(post.date)}</time>
                      {" · "}
                      {post.category}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}

        {posts.length === 0 && (
          <div className="rounded-2xl border-2 border-rebecca/15 bg-white p-12 text-center">
            <p className="text-rebecca">No posts yet. Check back soon.</p>
            <Link href="/" className="mt-4 inline-block text-lobster font-medium hover:underline">
              ← Back to home
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
