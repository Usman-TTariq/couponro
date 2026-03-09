import { notFound } from "next/navigation";
import Link from "next/link";
import ThemeBlogLayout from "@/components/ThemeBlogLayout";
import { getPostBySlug, getAllSlugs } from "@/lib/blog-posts";
import { getStoreBlogContent } from "@/lib/store-blog-content";
import TouchTunesPost from "../posts/TouchTunesPost";
import StoreBlogPost from "../posts/StoreBlogPost";
import CouponroSavingTipsPost from "../posts/CouponroSavingTipsPost";
import StoresGuidePost from "../posts/StoresGuidePost";
import FreeShippingPost from "../posts/FreeShippingPost";
import DealsGuidePost from "../posts/DealsGuidePost";
import FreshFindsPost from "../posts/FreshFindsPost";
import SeasonalSavingsPost from "../posts/SeasonalSavingsPost";
import KitchenCoffeePost from "../posts/KitchenCoffeePost";
import TravelGetawayPost from "../posts/TravelGetawayPost";
import HomeGardenSavingsPost from "../posts/HomeGardenSavingsPost";
import FashionOutdoorPost from "../posts/FashionOutdoorPost";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Post not found" };
  return {
    title: post.metaTitle,
    description: post.metaDescription,
    openGraph: {
      title: post.metaTitle,
      description: post.metaDescription,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  let content: React.ReactNode;
  if (slug === "stores-coupon-deals-guide-2026") {
    content = <StoresGuidePost />;
  } else if (slug === "couponro-saving-tips-coupon-codes-guide-2026") {
    content = <CouponroSavingTipsPost />;
  } else if (slug === "touchtunes-coupon-codes-deals-discounts-2026") {
    content = <TouchTunesPost />;
  } else if (slug === "free-shipping-deals-guide-2026") {
    content = <FreeShippingPost />;
  } else if (slug === "top-deals-coupons-guide-2026") {
    content = <DealsGuidePost />;
  } else if (slug === "fresh-finds-saving-tips-2026") {
    content = <FreshFindsPost />;
  } else if (slug === "seasonal-savings-guide-2026") {
    content = <SeasonalSavingsPost />;
  } else if (slug === "kitchen-coffee-deals-2026") {
    content = <KitchenCoffeePost />;
  } else if (slug === "travel-getaway-deals-2026") {
    content = <TravelGetawayPost />;
  } else if (slug === "home-garden-savings-2026") {
    content = <HomeGardenSavingsPost />;
  } else if (slug === "fashion-outdoor-deals-2026") {
    content = <FashionOutdoorPost />;
  } else {
    const storeContent = getStoreBlogContent(slug);
    if (storeContent) {
      content = <StoreBlogPost title={post.title} content={storeContent} slug={slug} />;
    } else {
      notFound();
    }
  }

  const formattedDate = new Date(post.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <ThemeBlogLayout>
      {/* Theme-style post banner */}
      <div className="container-fluid">
        <div className="row">
          <div className="col-xs-12">
            <section className="main-banner post">
              <div className="parallax-holder add-banner">
                <div className="parallax-frame">
                  {post.featuredImage ? (
                    <img
                      src={post.featuredImage}
                      alt=""
                      height={660}
                      width={1000}
                      style={{ width: "100%", height: "auto", objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{ height: 280, background: "linear-gradient(135deg, #593C8F 0%, #171738 100%)" }} />
                  )}
                </div>
              </div>
              <div className="post-over">
                <div className="box">
                  <div className="block">
                    <h1><Link href={`/blog/${post.slug}`}>{post.title}</Link></h1>
                    <ul className="add-nav list-inline">
                      <li>by <Link href="/">Couponro</Link></li>
                      <li><time dateTime={post.date}>{formattedDate}</time></li>
                      <li><Link href="/blog">{post.category}</Link></li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Post content - theme post-info section */}
      <section className="post-info">
        <div className="container">
          <div className="row">
            <div className="col-xs-12">
              <article className="main-post">
                <nav className="text-sm mb-6" style={{ opacity: 0.8 }} aria-label="Breadcrumb">
                  <Link href="/" className="hover:underline">Couponro</Link>
                  <span className="mx-2">›</span>
                  <Link href="/blog" className="hover:underline">Blog</Link>
                  <span className="mx-2">›</span>
                  <span>{post.title}</span>
                </nav>
                <div className="post-body">
                  {content}
                </div>
              </article>
              <div className="postbox-prev">
                <Link href="/blog" className="post-prev"><i className="fa fa-angle-left" /></Link>
                <span className="post-txt">BACK TO BLOG</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </ThemeBlogLayout>
  );
}
